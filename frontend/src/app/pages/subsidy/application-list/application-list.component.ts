import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { SubsidyService } from '../../../services/subsidy.service';
import { FarmerService } from '../../../services/farmer.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { exportTableToExcel } from '../../../utils/export-excel.util';

/**
 * Rejects a date that falls after today. Used for Application Date and
 * Disbursement Date, which can never be in the future.
 */
function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const picked = new Date(control.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return picked.getTime() > today.getTime() ? { futureDate: true } : null;
}

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.css']
})
export class ApplicationListComponent implements OnInit {
  private subsidyService = inject(SubsidyService);
  private farmerService = inject(FarmerService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  applications = signal<any[]>([]);
  filteredApplications = signal<any[]>([]);
  schemes = signal<any[]>([]);
  activeSchemes = signal<any[]>([]);
  farmerProfiles = signal<any[]>([]);
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

  // Sorting on the Application Date column: 'desc' (newest first) by default.
  dateSortDir: 'asc' | 'desc' = 'desc';

  // Pagination — remember the chosen page size across navigation.
  currentPage = 0;
  pageSize = Number(localStorage.getItem('agrilink.tablePageSize')) || 10;

  // Forms
  appForm!: FormGroup;
  reviewForm!: FormGroup;
  disburseForm!: FormGroup;

  ngOnInit(): void {
    // All roles (including Farmer) can read the scheme catalog - the backend permits
    // GET fetchSchemes/fetchSchemeById for Farmer, who needs it to populate the scheme
    // dropdown when filing a new application.
    this.loadSchemes();
    this.loadFarmers();
    this.loadApplications();
  }

  loadFarmers(): void {
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (data) => this.farmerProfiles.set(data),
      error: () => this.toastService.error('Failed to load farmer profiles.')
    });
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
    return this.authService.hasRole(['Farmer', 'ExtensionOfficer', 'SubsidyAdmin', 'AgriLinkAdmin']);
  }

  canReview(): boolean {
    return this.authService.hasRole(['SubsidyAdmin', 'AgriLinkAdmin']);
  }

  canDelete(app: any): boolean {
    // Only pending applications can be deleted/withdrawn.
    if (app.status !== 'PE') return false;

    // Farmer can delete own; SubsidyAdmin and AgriLinkAdmin can delete any
    if (this.authService.hasRole(['SubsidyAdmin', 'AgriLinkAdmin'])) return true;
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

    // Sort by application date in the chosen direction (copy first so we
    // never mutate the source signal's array).
    list = [...list].sort((a, b) => {
      const diff = new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime();
      return this.dateSortDir === 'asc' ? diff : -diff;
    });

    this.filteredApplications.set(list);
    this.currentPage = 0;
  }

  toggleDateSort(): void {
    this.dateSortDir = this.dateSortDir === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
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
    localStorage.setItem('agrilink.tablePageSize', String(size));
  }

  getSchemeName(schemeId: number): string {
    const scheme = this.schemes().find(s => s.schemeId === schemeId);
    return scheme ? scheme.schemeName : `Scheme #${schemeId}`;
  }

  getFarmerName(farmerId: number): string {
    // Applications filed through the app store the farmer's userId in the farmerId
    // field, while seeded applications use the profile's own farmerId. Match on
    // farmerId first, then fall back to userId, so the real name resolves in both cases.
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId)
      ?? this.farmerProfiles().find(p => p.userId == farmerId);
    return prof && prof.name ? `${prof.name}(#${farmerId})` : `Farmer #${farmerId}`;
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

  onExportExcel(): void {
    const headers = ['Farmer', 'Scheme', 'Application Date', 'Eligibility Score (%)', 'Disbursed Amount', 'Disbursed Date', 'Status'];
    const rows = this.filteredApplications().map(a => [
      this.getFarmerName(a.farmerId),
      this.getSchemeName(a.schemeId),
      this.fmtDate(a.applicationDate),
      a.eligibilityScore ?? '',
      a.disbursedAmount ? this.fmtMoney(a.disbursedAmount) : '-',
      a.disbursedDate ? this.fmtDate(a.disbursedDate) : '-',
      this.getStatusLabel(a.status)
    ]);
    exportTableToExcel(headers, rows, 'subsidy-applications');
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
      { label: 'Farmer Name', value: this.getFarmerName(app.farmerId) },
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
    // A Farmer's own farmerId is their farmer_profile.farmerId (NOT their userId — those
    // are different id spaces). getAllFarmerProfiles() is scoped server-side to the caller's
    // own profile(s) for a Farmer, so the first entry is always their own.
    const ownFarmerId = this.isFarmer() ? this.farmerProfiles()[0]?.farmerId : '';
    this.appForm = this.fb.group({
      schemeId: [null, [Validators.required]],
      farmerId: [this.isFarmer() ? this.authService.currentUserValue?.userId : '', this.isFarmer() ? [] : [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      // Farmers do not self-assess: the score is left null and assigned by the reviewer during review.
      eligibilityScore: [this.isFarmer() ? null : 80.0, this.isFarmer() ? [] : [Validators.required, Validators.min(0), Validators.max(100)]],
      applicationDate: [today, [Validators.required, notFutureDateValidator]]
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
      // For officers: farmerId in the form is the real farmer_profile.farmerId, but the
      // owning user's userId is a different id — resolve it from the loaded profiles
      // rather than reusing farmerId (they are not interchangeable).
      const profile = this.farmerProfiles().find(p => p.farmerId == val.farmerId);
      val.userId = profile?.userId ?? null;
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
      status: ['', [Validators.required]],
      // Optional on review (label says so): only range-checked when a value is entered.
      eligibilityScore: [app.eligibilityScore, [Validators.min(0), Validators.max(100)]]
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
      disbursedAmount: [maxAmt, [Validators.required, Validators.min(1), Validators.max(maxAmt)]],
      disbursedDate: [today, [Validators.required, notFutureDateValidator]]
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
