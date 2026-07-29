import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubsidyService } from '../../../services/subsidy.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';

@Component({
  selector: 'app-scheme-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="scheme-list-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Subsidy & Scheme Catalog</h1>
          <p class="text-secondary">Browse available agricultural relief funds, machinery grants, and seed subsidies.</p>
        </div>
        @if (canEdit()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="material-icons-round">add_circle</i>
            <span>Create </span>
          </button>
        }
      </div>

      <!-- Filters & Search -->
      <div class="card filters-card">
        <div class="form-row">
          <div class="form-group">
            <label for="search">Search Scheme Name</label>
            <div class="search-field">
              <input
                type="text"
                id="search"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="e.g. fertilizer, seed..." />
              <i class="material-icons-round search-icon">search</i>
            </div>
          </div>
          <div class="form-group">
            <label for="category">Category</label>
            <input 
              type="text" 
              id="category" 
              [(ngModel)]="categoryFilter" 
              (ngModelChange)="applyFilters()" 
              placeholder="e.g. Crop, Machinery..." />
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="AC">Active (AC)</option>
              <option value="IN">Inactive (IN)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading schemes...</p>
        </div>
      } @else if (filteredSchemes().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">inventory_2</i>
          <h3>No Schemes Found</h3>
          <p>No schemes match your filter choices.</p>
        </div>
      } @else {
        <div class="table-container">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Scheme Name</th>
                  <th>Category</th>
                  <th>Benefit Amount</th>
                  <th>Funding Source</th>
                  <th>Eligibility Criteria</th>
                  <th>Validity Period</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (scheme of paginatedSchemes(); track scheme.schemeId) {
                  <tr>
                    <td>{{ scheme.schemeId }}</td>
                    <td><strong>{{ scheme.schemeName }}</strong></td>
                    <td>{{ scheme.category }}</td>
                    <td>{{ scheme.benefitAmount | currency:'INR':'symbol-narrow' }}</td>
                    <td>{{ scheme.fundingSource }}</td>
                    <td class="criteria-cell" [title]="scheme.eligibilityCriteria">{{ scheme.eligibilityCriteria }}</td>
                    <td>{{ scheme.startDate | date:'shortDate' }} - {{ scheme.endDate | date:'shortDate' }}</td>
                    <td>
                      <app-action-menu>
                        <button class="menu-item" (click)="viewSchemeDetails(scheme)">
                          <i class="material-icons-round">visibility</i> View
                        </button>
                        @if (canEdit()) {
                          <button class="menu-item" (click)="openEditModal(scheme)">
                            <i class="material-icons-round">edit</i> Edit
                          </button>
                          <button class="menu-item" (click)="toggleStatus(scheme)">
                            <i class="material-icons-round">
                              {{ scheme.status === 'AC' ? 'pause_circle' : 'play_circle' }}
                            </i>
                            {{ scheme.status === 'AC' ? 'Set Inactive' : 'Set Active' }}
                          </button>
                          <button class="menu-item danger" (click)="confirmDelete(scheme)">
                            <i class="material-icons-round">delete</i> Delete
                          </button>
                        }
                      </app-action-menu>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalElements]="filteredSchemes().length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay" (click)="closeFormModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Scheme Details' : 'Create New Subsidy Scheme' }}</h3>
              <button class="close-btn" (click)="closeFormModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="schemeForm" (ngSubmit)="onFormSubmit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="name">Scheme Name</label>
                  <input type="text" id="name" formControlName="schemeName" placeholder="e.g. Fertilizer Subsidy Phase 2" />
                  @if (isFieldInvalid('schemeName')) {
                    <span class="error-text">Scheme Name is required</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="categoryVal">Category</label>
                    <input type="text" id="categoryVal" formControlName="category" placeholder="e.g. Crop, Seed, Irrigation" />
                    @if (isFieldInvalid('category')) {
                      <span class="error-text">Category is required</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="benefit">Benefit Amount (₹)</label>
                    <input type="number" id="benefit" formControlName="benefitAmount" placeholder="e.g. 500" />
                    @if (isFieldInvalid('benefitAmount')) {
                      <span class="error-text">Benefit Amount must be a positive number</span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="funding">Funding Source</label>
                  <input type="text" id="funding" formControlName="fundingSource" placeholder="e.g. Federal Govt" />
                  @if (isFieldInvalid('fundingSource')) {
                    <span class="error-text">Funding Source is required</span>
                  }
                </div>

                <div class="form-group">
                  <label for="criteria">Eligibility Criteria</label>
                  <textarea id="criteria" formControlName="eligibilityCriteria" placeholder="e.g. Minimum landholding of 2 hectares..." rows="3"></textarea>
                  @if (isFieldInvalid('eligibilityCriteria')) {
                    <span class="error-text">Eligibility Criteria is required</span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="startDate">Start Date</label>
                    <input type="date" id="startDate" formControlName="startDate" />
                    @if (isFieldInvalid('startDate')) {
                      <span class="error-text">Start Date is required</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="endDate">End Date</label>
                    <input type="date" id="endDate" formControlName="endDate" />
                    @if (isFieldInvalid('endDate')) {
                      <span class="error-text">End Date is required</span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="formStatus">Status</label>
                  <select id="formStatus" formControlName="status">
                    <option value="AC">Active (AC)</option>
                    <option value="IN">Inactive (IN)</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="schemeForm.invalid">
                  {{ isEditMode() ? 'Save Changes' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteConfirm()) {
        <app-confirmation-modal
          title="Delete Scheme Catalog Entry"
          [message]="'Are you sure you want to permanently delete scheme: ' + selectedScheme()?.schemeName + '? This operation cannot be undone.'"
          confirmText="Delete"
          cancelText="Cancel"
          (confirm)="onDelete()"
          (cancel)="closeDeleteConfirm()">
        </app-confirmation-modal>
      }

      @if (showDetailModal()) {
        <app-detail-modal
          [title]="detailTitle()"
          [rows]="detailRows()"
          (close)="showDetailModal.set(false)">
        </app-detail-modal>
      }
    </div>
  `,
  styles: [`
    .filters-card {
      padding: 1rem 1.5rem 0.5rem;
      margin-bottom: 1.5rem;
    }
    .criteria-cell {
      max-width: 240px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .action-btn:hover {
      background-color: var(--border-color);
    }
    .action-btn i {
      font-size: 20px;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SchemeListComponent implements OnInit {
  private subsidyService = inject(SubsidyService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  schemes = signal<any[]>([]);
  filteredSchemes = signal<any[]>([]);
  isLoading = signal(true);

  // Modal/Confirmation states
  showFormModal = signal(false);
  showDeleteConfirm = signal(false);
  
  isEditMode = signal(false);
  selectedScheme = signal<any | null>(null);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Filters
  searchQuery = '';
  categoryFilter = '';
  statusFilter = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Form
  schemeForm!: FormGroup;

  ngOnInit(): void {
    this.loadSchemes();
  }

  loadSchemes(): void {
    this.isLoading.set(true);
    this.subsidyService.getAllSchemes().subscribe({
      next: (data) => {
        this.schemes.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Failed to load schemes from catalog.');
      }
    });
  }

  canEdit(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'SubsidyAdmin']);
  }

  private fmtDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private fmtMoney(v: any): string {
    const n = Number(v);
    return isNaN(n) ? String(v) : '₹' + n.toFixed(2);
  }

  viewSchemeDetails(scheme: any): void {
    this.detailTitle.set(`Scheme #${scheme.schemeId}`);
    this.detailRows.set([
      { label: 'ID', value: scheme.schemeId },
      { label: 'Scheme Name', value: scheme.schemeName },
      { label: 'Category', value: scheme.category },
      { label: 'Benefit Amount', value: this.fmtMoney(scheme.benefitAmount) },
      { label: 'Funding Source', value: scheme.fundingSource },
      { label: 'Eligibility Criteria', value: scheme.eligibilityCriteria },
      { label: 'Validity Period', value: this.fmtDate(scheme.startDate) + ' - ' + this.fmtDate(scheme.endDate) },
      { label: 'Status', value: scheme.status === 'AC' ? 'Active' : 'Inactive' }
    ]);
    this.showDetailModal.set(true);
  }

  applyFilters(): void {
    let list = this.schemes();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s => s.schemeName.toLowerCase().includes(q));
    }

    if (this.categoryFilter.trim()) {
      const c = this.categoryFilter.toLowerCase();
      list = list.filter(s => s.category?.toLowerCase().includes(c));
    }

    if (this.statusFilter) {
      list = list.filter(s => s.status === this.statusFilter);
    }

    this.filteredSchemes.set(list);
    this.currentPage = 0;
  }

  paginatedSchemes(): any[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSchemes().slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.schemeForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedScheme.set(null);
    this.schemeForm = this.fb.group({
      schemeName: ['', [Validators.required]],
      category: ['', [Validators.required]],
      eligibilityCriteria: ['', [Validators.required]],
      benefitAmount: [0, [Validators.required, Validators.min(1)]],
      fundingSource: ['', [Validators.required]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      status: ['AC', [Validators.required]]
    });
    this.showFormModal.set(true);
  }

  openEditModal(scheme: any): void {
    this.isEditMode.set(true);
    this.selectedScheme.set(scheme);
    
    this.schemeForm = this.fb.group({
      schemeName: [scheme.schemeName, [Validators.required]],
      category: [scheme.category, [Validators.required]],
      eligibilityCriteria: [scheme.eligibilityCriteria, [Validators.required]],
      benefitAmount: [scheme.benefitAmount, [Validators.required, Validators.min(1)]],
      fundingSource: [scheme.fundingSource, [Validators.required]],
      startDate: [scheme.startDate ? scheme.startDate.substring(0, 10) : '', [Validators.required]],
      endDate: [scheme.endDate ? scheme.endDate.substring(0, 10) : '', [Validators.required]],
      status: [scheme.status, [Validators.required]]
    });
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  onFormSubmit(): void {
    if (this.schemeForm.invalid) return;

    const val = this.schemeForm.value;
    if (this.isEditMode()) {
      const id = this.selectedScheme().schemeId;
      this.subsidyService.updateScheme(id, val).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'Scheme updated successfully.');
          this.closeFormModal();
          this.loadSchemes();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to update scheme.');
        }
      });
    } else {
      this.subsidyService.createScheme(val).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'Scheme created successfully.');
          this.closeFormModal();
          this.loadSchemes();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to create scheme.');
        }
      });
    }
  }

  toggleStatus(scheme: any): void {
    const nextStatus = scheme.status === 'AC' ? 'IN' : 'AC';
    this.subsidyService.updateSchemeStatus(scheme.schemeId, nextStatus).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Status updated successfully.');
        this.loadSchemes();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to update scheme status.');
      }
    });
  }

  confirmDelete(scheme: any): void {
    this.selectedScheme.set(scheme);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  onDelete(): void {
    const id = this.selectedScheme().schemeId;
    this.subsidyService.deleteScheme(id).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Scheme deleted successfully.');
        this.closeDeleteConfirm();
        this.loadSchemes();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to delete scheme catalog entry.');
      }
    });
  }
}
