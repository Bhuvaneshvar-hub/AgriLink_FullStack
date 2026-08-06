import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SubsidyService } from '../../../services/subsidy.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { exportTableToExcel } from '../../../utils/export-excel.util';

/**
 * Cross-field validator: the scheme's End Date must be strictly after its
 * Start Date. Applied at the form-group level and surfaced under the End Date.
 */
function endAfterStartValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (start && end && new Date(end).getTime() <= new Date(start).getTime()) {
    return { dateRange: true };
  }
  return null;
}

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
        <div class="header-actions">
          @if (!authService.hasRole(['Farmer'])) {
            <button class="btn btn-secondary" (click)="onExportExcel()" [disabled]="filteredSchemes().length === 0" title="Export schemes to Excel">
              <i class="material-icons-round text-success">table_view</i>
              <span>Export XLS</span>
            </button>
          }
          @if (canEdit()) {
            <button class="btn btn-primary" (click)="openCreateModal()" title="Create Scheme">
              <i class="material-icons-round">add_circle</i>
              <span>Scheme</span>
            </button>
          }
        </div>
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
                    <td><strong>{{ scheme.schemeName }}</strong></td>
                    <td>{{ scheme.category }}</td>
                    <td>{{ scheme.benefitAmount | currency:'INR':'symbol-narrow' }}</td>
                    <td>{{ scheme.fundingSource }}</td>
                    <td class="criteria-cell" [title]="scheme.eligibilityCriteria">{{ scheme.eligibilityCriteria }}</td>
                    <td>{{ scheme.startDate | date:'shortDate' }} - {{ scheme.endDate | date:'shortDate' }}</td>
                    <td>
                      <app-action-menu>
                        <button class="menu-item" (click)="viewSchemeDetails(scheme)" title="View scheme details">
                          <i class="material-icons-round">visibility</i> View
                        </button>
                        @if (canEdit()) {
                          <button class="menu-item" (click)="openEditModal(scheme)" title="Edit scheme">
                            <i class="material-icons-round">edit</i> Edit
                          </button>
                          <button class="menu-item" (click)="toggleStatus(scheme)" [title]="scheme.status === 'AC' ? 'Set scheme inactive' : 'Set scheme active'">
                            <i class="material-icons-round">
                              {{ scheme.status === 'AC' ? 'pause_circle' : 'play_circle' }}
                            </i>
                            {{ scheme.status === 'AC' ? 'Set Inactive' : 'Set Active' }}
                          </button>
                          <button class="menu-item danger" (click)="confirmDelete(scheme)" title="Delete scheme">
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
              <button class="close-btn" (click)="closeFormModal()" title="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="schemeForm" (ngSubmit)="onFormSubmit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="name">Scheme Name</label>
                  <input type="text" id="name" formControlName="schemeName" placeholder="e.g. Fertilizer Subsidy Phase 2" />
                  @if (isFieldInvalid('schemeName')) {
                    <span class="error-text">
                      @if (schemeForm.get('schemeName')?.errors?.['required']) { Scheme Name is required. }
                      @else if (schemeForm.get('schemeName')?.errors?.['minlength']) { Scheme Name must be at least 3 characters. }
                      @else if (schemeForm.get('schemeName')?.errors?.['maxlength']) { Scheme Name cannot exceed 100 characters. }
                      @else if (schemeForm.get('schemeName')?.errors?.['pattern']) { Only letters, numbers, spaces and - & ( ) , . are allowed. }
                    </span>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="categoryVal">Category</label>
                    <input type="text" id="categoryVal" formControlName="category" placeholder="e.g. Crop, Seed, Irrigation" />
                    @if (isFieldInvalid('category')) {
                      <span class="error-text">
                        @if (schemeForm.get('category')?.errors?.['required']) { Category is required. }
                        @else if (schemeForm.get('category')?.errors?.['minlength']) { Category must be at least 2 characters. }
                        @else if (schemeForm.get('category')?.errors?.['maxlength']) { Category cannot exceed 50 characters. }
                        @else if (schemeForm.get('category')?.errors?.['pattern']) { Category must be text (letters only, e.g. Crop, Seed). }
                      </span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="benefit">Benefit Amount (₹)</label>
                    <input type="number" id="benefit" formControlName="benefitAmount" placeholder="e.g. 500" min="1" step="0.01" />
                    @if (isFieldInvalid('benefitAmount')) {
                      <span class="error-text">
                        @if (schemeForm.get('benefitAmount')?.errors?.['required']) { Benefit Amount is required. }
                        @else if (schemeForm.get('benefitAmount')?.errors?.['min']) { Benefit Amount must be at least ₹1. }
                        @else if (schemeForm.get('benefitAmount')?.errors?.['max']) { Benefit Amount cannot exceed ₹1,00,00,000. }
                      </span>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="funding">Funding Source</label>
                  <input type="text" id="funding" formControlName="fundingSource" placeholder="e.g. Federal Govt" />
                  @if (isFieldInvalid('fundingSource')) {
                    <span class="error-text">
                      @if (schemeForm.get('fundingSource')?.errors?.['required']) { Funding Source is required. }
                      @else if (schemeForm.get('fundingSource')?.errors?.['minlength']) { Funding Source must be at least 2 characters. }
                      @else if (schemeForm.get('fundingSource')?.errors?.['maxlength']) { Funding Source cannot exceed 80 characters. }
                      @else if (schemeForm.get('fundingSource')?.errors?.['pattern']) { Funding Source must be text (e.g. Federal Govt). }
                    </span>
                  }
                </div>

                <div class="form-group">
                  <label for="criteria">Eligibility Criteria</label>
                  <textarea id="criteria" formControlName="eligibilityCriteria" placeholder="e.g. Minimum landholding of 2 hectares..." rows="3"></textarea>
                  @if (isFieldInvalid('eligibilityCriteria')) {
                    <span class="error-text">
                      @if (schemeForm.get('eligibilityCriteria')?.errors?.['required']) { Eligibility Criteria is required. }
                      @else if (schemeForm.get('eligibilityCriteria')?.errors?.['minlength']) { Please describe the criteria in at least 10 characters. }
                      @else if (schemeForm.get('eligibilityCriteria')?.errors?.['maxlength']) { Eligibility Criteria cannot exceed 500 characters. }
                    </span>
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
                      <span class="error-text">End Date is required.</span>
                    } @else if (schemeForm.errors?.['dateRange'] && schemeForm.get('endDate')?.value && (schemeForm.get('endDate')?.touched || schemeForm.get('endDate')?.dirty)) {
                      <span class="error-text">End Date must be after the Start Date.</span>
                    }
                  </div>
                </div>

              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="schemeForm.invalid"
                        [title]="isEditMode() ? 'Save Changes' : 'Create'"
                        [attr.aria-label]="isEditMode() ? 'Save Changes' : 'Create'">
                  <i class="material-icons-round">save</i>
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
    /* Wider, scroll-free Create/Edit Scheme modal (scoped to this component only) */
    .modal-content {
      max-width: 760px;
    }
    .modal-body {
      max-height: none;
      overflow-y: visible;
    }
    /* Keep the form a constant height: validation messages overlay a reserved
       slot below each field instead of pushing the layout taller. */
    form .form-group {
      position: relative;
      margin-bottom: 1.75rem;
    }
    form .error-text {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.15rem;
      line-height: 1.15;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
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

  // Pagination — remember the chosen page size across navigation.
  currentPage = 0;
  pageSize = Number(localStorage.getItem('agrilink.tablePageSize')) || 10;

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

  onExportExcel(): void {
    const headers = ['ID', 'Scheme Name', 'Category', 'Benefit Amount', 'Funding Source', 'Eligibility Criteria', 'Start Date', 'End Date', 'Status'];
    const rows = this.filteredSchemes().map(s => [
      s.schemeId,
      s.schemeName,
      s.category,
      this.fmtMoney(s.benefitAmount),
      s.fundingSource,
      s.eligibilityCriteria,
      this.fmtDate(s.startDate),
      this.fmtDate(s.endDate),
      s.status === 'AC' ? 'Active' : 'Inactive'
    ]);
    exportTableToExcel(headers, rows, 'subsidy-schemes');
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
    localStorage.setItem('agrilink.tablePageSize', String(size));
  }

  isFieldInvalid(field: string): boolean {
    const control = this.schemeForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedScheme.set(null);
    this.schemeForm = this.fb.group({
      schemeName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9\s\-&(),.]*$/)]],
      category: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[A-Za-z][A-Za-z\s,&/-]*$/)]],
      eligibilityCriteria: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      benefitAmount: [null, [Validators.required, Validators.min(1), Validators.max(10000000)]],
      fundingSource: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80), Validators.pattern(/^[A-Za-z][A-Za-z\s.,&()/-]*$/)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      // Status is no longer shown in the form; new schemes default to Active.
      // It can be changed later from the table's Set Active/Inactive action.
      status: ['AC', [Validators.required]]
    }, { validators: endAfterStartValidator });
    this.showFormModal.set(true);
  }

  openEditModal(scheme: any): void {
    this.isEditMode.set(true);
    this.selectedScheme.set(scheme);
    
    this.schemeForm = this.fb.group({
      schemeName: [scheme.schemeName, [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9\s\-&(),.]*$/)]],
      category: [scheme.category, [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[A-Za-z][A-Za-z\s,&/-]*$/)]],
      eligibilityCriteria: [scheme.eligibilityCriteria, [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      benefitAmount: [scheme.benefitAmount, [Validators.required, Validators.min(1), Validators.max(10000000)]],
      fundingSource: [scheme.fundingSource, [Validators.required, Validators.minLength(2), Validators.maxLength(80), Validators.pattern(/^[A-Za-z][A-Za-z\s.,&()/-]*$/)]],
      startDate: [scheme.startDate ? scheme.startDate.substring(0, 10) : '', [Validators.required]],
      endDate: [scheme.endDate ? scheme.endDate.substring(0, 10) : '', [Validators.required]],
      status: [scheme.status, [Validators.required]]
    }, { validators: endAfterStartValidator });
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
