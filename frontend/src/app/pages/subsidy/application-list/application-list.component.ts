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
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="application-list-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Subsidy Applications</h1>
          <p class="text-secondary">
            @if (isFarmer()) {
              Manage and track your active subsidy requests and disbursement status.
            } @else {
              Review, approve, and disburse agricultural relief requests submitted by farmers.
            }
          </p>
        </div>
        <!-- Farmers and Extension Officers can file applications -->
        @if (canCreate()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="material-icons-round">post_add</i>
            <span>New Application</span>
          </button>
        }
      </div>

      <!-- Filters & Search -->
      <div class="card filters-card">
        <div class="form-row">
          <div class="form-group">
            <label for="farmerSearch">Farmer ID</label>
            <input 
              type="number" 
              id="farmerSearch" 
              [(ngModel)]="farmerIdFilter" 
              (ngModelChange)="applyFilters()" 
              placeholder="e.g. 102" />
          </div>
          <div class="form-group">
            <label for="schemeFilter">Scheme</label>
            <select id="schemeFilter" [(ngModel)]="schemeFilter" (ngModelChange)="applyFilters()">
              <option value="">All Schemes</option>
              @for (scheme of schemes(); track scheme.schemeId) {
                <option [value]="scheme.schemeId">{{ scheme.schemeName }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="PE">Pending (PE)</option>
              <option value="AP">Approved (AP)</option>
              <option value="RE">Rejected (RE)</option>
              <option value="DB">Disbursed (DB)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading applications...</p>
        </div>
      } @else if (filteredApplications().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">assignment_late</i>
          <h3>No Applications Found</h3>
          <p>No subsidy requests were found matching your criteria.</p>
        </div>
      } @else {
        <div class="table-container">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Farmer ID</th>
                  <th>Scheme Name</th>
                  <th>Application Date</th>
                  <th>Eligibility Score</th>
                  <th>Disbursed Amt</th>
                  <th>Disbursed Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (app of paginatedApplications(); track app.applicationId) {
                  <tr>
                    <td><strong>Farmer #{{ app.farmerId }}</strong></td>
                    <td>{{ getSchemeName(app.schemeId) }}</td>
                    <td>{{ app.applicationDate | date:'mediumDate' }}</td>
                    <td>
                      <span class="eligibility-score" [ngClass]="app.eligibilityScore >= 70 ? 'text-success' : 'text-warning'">
                        {{ app.eligibilityScore | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>{{ app.disbursedAmount ? (app.disbursedAmount | currency:'INR':'symbol-narrow') : '-' }}</td>
                    <td>{{ app.disbursedDate ? (app.disbursedDate | date:'mediumDate') : '-' }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-warning': app.status === 'PE',
                        'badge-info': app.status === 'AP',
                        'badge-danger': app.status === 'RE',
                        'badge-success': app.status === 'DB'
                      }">
                        {{ getStatusLabel(app.status) }}
                      </span>
                    </td>
                    <td>
                      <app-action-menu>
                        <button class="menu-item" (click)="viewApplicationDetails(app)">
                          <i class="material-icons-round">visibility</i> View
                        </button>
                        @if (canReview() && app.status === 'PE') {
                          <button class="menu-item" (click)="openReviewModal(app)">
                            <i class="material-icons-round">rate_review</i> Review
                          </button>
                        } @else if (canReview() && app.status === 'AP') {
                          <button class="menu-item" (click)="openDisburseModal(app)">
                            <i class="material-icons-round">paid</i> Disburse
                          </button>
                        }
                        <!-- Farmers/Admins can delete pending application -->
                        @if (canDelete(app)) {
                          <button class="menu-item danger" (click)="confirmDelete(app)">
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
            [totalElements]="filteredApplications().length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }

      <!-- Create Application Modal -->
      @if (showCreateModal()) {
        <div class="modal-overlay" (click)="closeCreateModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>File New Subsidy Application</h3>
              <button class="close-btn" (click)="closeCreateModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="appForm" (ngSubmit)="onCreateSubmit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="formScheme">Select Subsidy Scheme</label>
                  <select id="formScheme" formControlName="schemeId">
                    <option [value]="null" disabled>Select scheme catalog entry...</option>
                    @for (scheme of activeSchemes(); track scheme.schemeId) {
                      <option [value]="scheme.schemeId">{{ scheme.schemeName }} (Category: {{ scheme.category }})</option>
                    }
                  </select>
                  @if (isFieldInvalid('schemeId')) {
                    <span class="error-text">Scheme selection is required</span>
                  }
                </div>

                @if (!isFarmer()) {
                  <div class="form-group">
                    <label for="formFarmer">Farmer User ID</label>
                    <input type="number" id="formFarmer" formControlName="farmerId" placeholder="e.g. 102" />
                    @if (isFieldInvalid('farmerId')) {
                      <span class="error-text">Farmer User ID must be a positive integer</span>
                    }
                  </div>
                }

                <div class="form-row">
                  <div class="form-group">
                    <label for="formScore">Eligibility Score (%)</label>
                    <input type="number" id="formScore" formControlName="eligibilityScore" placeholder="85.5" />
                    @if (isFieldInvalid('eligibilityScore')) {
                      <span class="error-text">Eligibility Score must be between 0 and 100</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="formDate">Application Date</label>
                    <input type="date" id="formDate" formControlName="applicationDate" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="appForm.invalid">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Review Application Modal -->
      @if (showReviewModal()) {
        <div class="modal-overlay" (click)="closeReviewModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Review Subsidy Application</h3>
              <button class="close-btn" (click)="closeReviewModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="reviewForm" (ngSubmit)="onReviewSubmit()">
              <div class="modal-body">
                <div class="card mb-3" style="background-color: var(--bg-dark); padding: 1rem;">
                  <h4 style="font-size: 0.95rem;">Application Details</h4>
                  <p class="text-secondary mt-2" style="font-size: 0.85rem;">
                    Farmer: <strong>Farmer #{{ selectedApp()?.farmerId }}</strong><br/>
                    Scheme: <strong>{{ getSchemeName(selectedApp()?.schemeId) }}</strong><br/>
                    Eligibility Score: <strong>{{ selectedApp()?.eligibilityScore }}%</strong>
                  </p>
                </div>

                <div class="form-group">
                  <label for="reviewStatus">Outcome Status</label>
                  <select id="reviewStatus" formControlName="status">
                    <option value="AP">Approved (AP)</option>
                    <option value="RE">Rejected (RE)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="reviewScore">Updated Eligibility Score (%) (Optional)</label>
                  <input type="number" id="reviewScore" formControlName="eligibilityScore" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Save Outcome</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Disburse Modal -->
      @if (showDisburseModal()) {
        <div class="modal-overlay" (click)="closeDisburseModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Record Fund Disbursement</h3>
              <button class="close-btn" (click)="closeDisburseModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="disburseForm" (ngSubmit)="onDisburseSubmit()">
              <div class="modal-body">
                <div class="card mb-3" style="background-color: var(--bg-dark); padding: 1rem;">
                  <h4 style="font-size: 0.95rem;">Application Details</h4>
                  <p class="text-secondary mt-2" style="font-size: 0.85rem;">
                    Farmer: <strong>Farmer #{{ selectedApp()?.farmerId }}</strong><br/>
                    Scheme: <strong>{{ getSchemeName(selectedApp()?.schemeId) }}</strong>
                  </p>
                </div>

                <div class="form-group">
                  <label for="disburseAmt">Disbursed Amount (₹)</label>
                  <input type="number" id="disburseAmt" formControlName="disbursedAmount" placeholder="e.g. 500" />
                  @if (disburseForm.get('disbursedAmount')?.invalid && (disburseForm.get('disbursedAmount')?.dirty || disburseForm.get('disbursedAmount')?.touched)) {
                    <span class="error-text">Disbursed amount must be a positive number</span>
                  }
                </div>

                <div class="form-group">
                  <label for="disburseDate">Disbursement Date</label>
                  <input type="date" id="disburseDate" formControlName="disbursedDate" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="disburseForm.invalid">Record Disbursement</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation -->
      @if (showDeleteConfirm()) {
        <app-confirmation-modal
          title="Withdraw Application"
          [message]="'Are you sure you want to withdraw and delete application #' + selectedApp()?.applicationId + '?'"
          confirmText="Withdraw"
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
    .eligibility-score {
      font-weight: 700;
    }
    .table-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .review-btn-inline {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.8rem !important;
      border-radius: 0.25rem !important;
    }
    .review-btn-inline i {
      font-size: 14px;
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
      font-size: 18px;
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
export class ApplicationListComponent implements OnInit {
  private subsidyService = inject(SubsidyService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  applications = signal<any[]>([]);
  filteredApplications = signal<any[]>([]);
  schemes = signal<any[]>([]);
  activeSchemes = signal<any[]>([]);
  isLoading = signal(true);

  // Modals state
  showCreateModal = signal(false);
  showReviewModal = signal(false);
  showDisburseModal = signal(false);
  showDeleteConfirm = signal(false);
  
  selectedApp = signal<any | null>(null);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Filters
  farmerIdFilter: number | null = null;
  schemeFilter = '';
  statusFilter = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Forms
  appForm!: FormGroup;
  reviewForm!: FormGroup;
  disburseForm!: FormGroup;

  ngOnInit(): void {
    this.loadSchemes();
    this.loadApplications();
  }

  loadSchemes(): void {
    this.subsidyService.getAllSchemes().subscribe({
      next: (data) => {
        this.schemes.set(data);
        this.activeSchemes.set(data.filter(s => s.status === 'AC'));
      },
      error: () => this.toastService.error('Failed to load scheme catalog.')
    });
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.subsidyService.getAllApplications().subscribe({
      next: (data) => {
        // Sort by application date, latest first (fall back to newest ID on ties)
        this.applications.set(data.sort((a, b) => {
          const dateDiff = new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
          return dateDiff !== 0 ? dateDiff : b.applicationId - a.applicationId;
        }));
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Failed to load subsidy applications.');
      }
    });
  }

  isFarmer(): boolean {
    return this.authService.hasRole(['Farmer']);
  }

  canCreate(): boolean {
    return this.authService.hasRole(['Farmer', 'ExtensionOfficer', 'AgriLinkAdmin']);
  }

  canReview(): boolean {
    return this.authService.hasRole(['SubsidyAdmin', 'AgriLinkAdmin']);
  }

  canDelete(app: any): boolean {
    // Only pending applications can be deleted/withdrawn.
    if (app.status !== 'PE') return false;
    
    // Farmer can delete own, admin can delete any
    if (this.authService.hasRole(['AgriLinkAdmin'])) return true;
    return this.isFarmer() && app.userId === this.authService.currentUserValue?.userId;
  }

  applyFilters(): void {
    let list = this.applications();

    if (this.farmerIdFilter !== null && this.farmerIdFilter !== undefined && this.farmerIdFilter.toString().trim() !== '') {
      list = list.filter(a => a.farmerId === this.farmerIdFilter);
    }

    if (this.schemeFilter) {
      list = list.filter(a => a.schemeId === parseInt(this.schemeFilter, 10));
    }

    if (this.statusFilter) {
      list = list.filter(a => a.status === this.statusFilter);
    }

    this.filteredApplications.set(list);
    this.currentPage = 0;
  }

  paginatedApplications(): any[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredApplications().slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
  }

  getSchemeName(schemeId: number): string {
    const scheme = this.schemes().find(s => s.schemeId === schemeId);
    return scheme ? scheme.schemeName : `Scheme #${schemeId}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PE': return 'Pending';
      case 'AP': return 'Approved';
      case 'RE': return 'Rejected';
      case 'DB': return 'Disbursed';
      default: return status;
    }
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

  viewApplicationDetails(app: any): void {
    this.detailTitle.set(`Application #${app.applicationId}`);
    this.detailRows.set([
      { label: 'App ID', value: app.applicationId },
      { label: 'Farmer ID', value: 'Farmer #' + app.farmerId },
      { label: 'Scheme Name', value: this.getSchemeName(app.schemeId) },
      { label: 'Application Date', value: this.fmtDate(app.applicationDate) },
      { label: 'Eligibility Score', value: (app.eligibilityScore ?? '—') + '%' },
      { label: 'Disbursed Amt', value: app.disbursedAmount ? this.fmtMoney(app.disbursedAmount) : '-' },
      { label: 'Disbursed Date', value: app.disbursedDate ? this.fmtDate(app.disbursedDate) : '-' },
      { label: 'Status', value: this.getStatusLabel(app.status) }
    ]);
    this.showDetailModal.set(true);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.appForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openCreateModal(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.appForm = this.fb.group({
      schemeId: [null, [Validators.required]],
      farmerId: [this.isFarmer() ? this.authService.currentUserValue?.userId : '', this.isFarmer() ? [] : [Validators.required, Validators.min(1)]],
      eligibilityScore: [80.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      applicationDate: [today, [Validators.required]]
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateSubmit(): void {
    if (this.appForm.invalid) return;
    const val = this.appForm.value;
    
    // Add default user details for farmer submission
    if (this.isFarmer()) {
      val.userId = this.authService.currentUserValue?.userId;
    } else {
      // For officers, set userId matching farmerId
      val.userId = val.farmerId;
    }

    this.subsidyService.createApplication(val).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Subsidy Application filed successfully.');
        this.closeCreateModal();
        this.loadApplications();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to submit application. Farmers cannot file duplicate applications for the same scheme.');
      }
    });
  }

  openReviewModal(app: any): void {
    this.selectedApp.set(app);
    this.reviewForm = this.fb.group({
      status: ['AP', [Validators.required]],
      eligibilityScore: [app.eligibilityScore, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
  }

  onReviewSubmit(): void {
    if (this.reviewForm.invalid) return;
    const id = this.selectedApp().applicationId;
    const val = this.reviewForm.value;
    
    // Build DTO
    const dto = {
      ...this.selectedApp(),
      status: val.status,
      eligibilityScore: val.eligibilityScore,
      reviewedBy: this.authService.currentUserValue?.userId
    };

    this.subsidyService.reviewApplication(id, dto).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Application reviewed successfully.');
        this.closeReviewModal();
        this.loadApplications();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to submit application review.');
      }
    });
  }

  openDisburseModal(app: any): void {
    this.selectedApp.set(app);
    const today = new Date().toISOString().substring(0, 10);
    // Find scheme benefit amount
    const schemeObj = this.schemes().find(s => s.schemeId === app.schemeId);
    const maxAmt = schemeObj ? schemeObj.benefitAmount : 1000;
    
    this.disburseForm = this.fb.group({
      disbursedAmount: [maxAmt, [Validators.required, Validators.min(1)]],
      disbursedDate: [today, [Validators.required]]
    });
    this.showDisburseModal.set(true);
  }

  closeDisburseModal(): void {
    this.showDisburseModal.set(false);
  }

  onDisburseSubmit(): void {
    if (this.disburseForm.invalid) return;
    const id = this.selectedApp().applicationId;
    const val = this.disburseForm.value;
    
    const dto = {
      ...this.selectedApp(),
      status: 'DB',
      disbursedAmount: val.disbursedAmount,
      disbursedDate: val.disbursedDate,
      reviewedBy: this.authService.currentUserValue?.userId
    };

    // Update status to DB
    this.subsidyService.updateApplicationStatus(id, dto).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Disbursement registered successfully.');
        this.closeDisburseModal();
        this.loadApplications();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to register disbursement.');
      }
    });
  }

  confirmDelete(app: any): void {
    this.selectedApp.set(app);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
  }

  onDelete(): void {
    const id = this.selectedApp().applicationId;
    this.subsidyService.deleteApplication(id).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Application withdrawn successfully.');
        this.closeDeleteConfirm();
        this.loadApplications();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to withdraw application.');
      }
    });
  }
}
