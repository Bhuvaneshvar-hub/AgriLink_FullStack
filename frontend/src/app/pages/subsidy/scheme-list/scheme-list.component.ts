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
import { toggleSort, sortIcon as sortIconFn, applySort } from '../../../utils/table-sort.util';

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
  templateUrl: './scheme-list.component.html',
  styleUrls: ['./scheme-list.component.css']
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

  // Sorting
  sortField = signal<string | null>(null);
  sortAsc = signal(true);
  readonly sortIcon = sortIconFn;

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

  sortBy(field: string): void {
    toggleSort(this.sortField, this.sortAsc, field);
    this.currentPage = 0;
  }

  paginatedSchemes(): any[] {
    const sorted = applySort(this.filteredSchemes(), this.sortField(), this.sortAsc());
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return sorted.slice(start, end);
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
