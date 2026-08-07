import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputService } from '../../services/input.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './inputs.component.html',
  styleUrl: './inputs.component.css'
})
export class InputsComponent implements OnInit {
  private inputService = inject(InputService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);
  private fb = inject(FormBuilder);

  // State Signals
  activeTab = signal<'catalog' | 'requests'>('catalog');
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Data Signals
  catalogs = signal<any[]>([]);
  requests = signal<any[]>([]);
  farmerProfiles = signal<any[]>([]);

  // Selection Signals
  selectedCatalogItem = signal<any | null>(null);
  selectedRequest = signal<any | null>(null);

  // Sort State
  catalogSortField = signal<string>('');
  catalogSortDir = signal<'asc' | 'desc' | ''>('');
  requestSortDir = signal<'asc' | 'desc' | ''>('');

  // Sorted Computed Lists
  sortedCatalogs = computed(() => {
    const field = this.catalogSortField();
    const dir = this.catalogSortDir();
    const list = [...this.catalogs()];
    if (!field || !dir) return list;
    return list.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  });

  sortedRequests = computed(() => {
    const dir = this.requestSortDir();
    const list = [...this.requests()];
    if (!dir) return list;
    const order = ['PE', 'AP', 'DL', 'RE'];
    return list.sort((a, b) => {
      const ai = order.indexOf(a.status);
      const bi = order.indexOf(b.status);
      return dir === 'asc' ? ai - bi : bi - ai;
    });
  });

  filteredSortedRequests = computed(() => {
    const sorted = this.sortedRequests();
    if (!this.isFarmer()) return sorted;
    const myFarmerId = this.farmerProfiles()[0]?.farmerId;
    if (!myFarmerId) return [];
    return sorted.filter(r => r.farmerId == myFarmerId);
  });

  // Pagination — Catalog
  catalogPage = signal<number>(0);
  catalogPageSize = signal<number>(5);

  // Pagination — Requests
  requestPage = signal<number>(0);
  requestPageSize = signal<number>(5);

  // Paginated slices
  pagedCatalogs = computed(() => {
    const start = this.catalogPage() * this.catalogPageSize();
    return this.sortedCatalogs().slice(start, start + this.catalogPageSize());
  });

  pagedRequests = computed(() => {
    const start = this.requestPage() * this.requestPageSize();
    return this.filteredSortedRequests().slice(start, start + this.requestPageSize());
  });

  // Calculated Values
  calculatedTotalPrice = signal<number>(0);

  // Modal Visibility
  showCatalogModal = signal<boolean>(false);
  showRequestModal = signal<boolean>(false);
  showDeleteCatalogConfirm = signal<boolean>(false);
  showDeleteRequestConfirm = signal<boolean>(false);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Form Groups
  catalogForm!: FormGroup;
  requestForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadAllData();
  }

  isFarmer(): boolean {
    return this.authService.hasRole(['Farmer']);
  }

  // Approving / rejecting farmer requests.
  isAdminOrOfficer(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer']);
  }

  // Catalog CRUD, which the Extension Officer is not entitled to
  // (mirrors input-service SecurityConfig for POST/PUT/DELETE /catalogs).
  isCatalogManager(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ProcurementOfficer']);
  }

  setTab(tab: 'catalog' | 'requests') {
    this.activeTab.set(tab);
  }

  onCatalogPageChange(page: number) { this.catalogPage.set(page); }
  onCatalogPageSizeChange(size: number) { this.catalogPageSize.set(size); this.catalogPage.set(0); }

  onRequestPageChange(page: number) { this.requestPage.set(page); }
  onRequestPageSizeChange(size: number) { this.requestPageSize.set(size); this.requestPage.set(0); }

  private initForms() {
    this.catalogForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      unit: ['', Validators.required],
      pricePerUnit: [1.0, [Validators.required, Validators.min(0.01)]],
      subsidisedPrice: [0.5, [Validators.required, Validators.min(0.01)]],
      availableStock: [100, [Validators.required, Validators.min(0)]]
    });

    this.requestForm = this.fb.group({
      farmerId: ['', Validators.required],
      quantityRequested: [1, [Validators.required, Validators.min(1)]],
      assignedCentreId: [101, [Validators.required, Validators.min(1)]]
    });
  }

  private loadAllData() {
    this.isLoading.set(true);

    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (profiles) => this.farmerProfiles.set(profiles),
      error: () => this.farmerProfiles.set([])
    });

    this.inputService.getAllInputCatalogs().subscribe({
      next: (cats) => {
        this.catalogs.set(cats);
        this.inputService.getAllInputRequests().subscribe({
          next: (reqs) => {
            this.requests.set(reqs);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => {
        this.toast.error('Failed to load supply catalog.');
        this.isLoading.set(false);
      }
    });
  }

  getInputName(inputId: number): string {
    const item = this.catalogs().find(c => c.inputId == inputId);
    return item ? item.name : `Supply ID: ${inputId}`;
  }

  getRequestStatusLabel(status: string): string {
    switch (status) {
      case 'PE': return 'Pending';
      case 'AP': return 'Approved';
      case 'RE': return 'Rejected';
      case 'DL': return 'Delivered';
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

  viewCatalogDetails(item: any) {
    this.detailTitle.set(`Supply Item #${item.inputId}`);
    this.detailRows.set([
      { label: 'Supply ID', value: item.inputId },
      { label: 'Name', value: item.name },
      { label: 'Category', value: item.category },
      { label: 'Unit', value: item.unit },
      { label: 'Standard Price', value: this.fmtMoney(item.pricePerUnit) },
      { label: 'Subsidised Price', value: this.fmtMoney(item.subsidisedPrice) },
      { label: 'Available Stock', value: item.availableStock + ' ' + item.unit + 's' },
      { label: 'Status', value: item.status === 'AC' ? 'Active' : 'Inactive' }
    ]);
    this.showDetailModal.set(true);
  }

  getFarmerName(farmerId: number): string {
    const profile = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return profile ? profile.name : '';
  }

  viewRequestDetails(req: any) {
    const farmerName = this.getFarmerName(req.farmerId);
    this.detailTitle.set(`Input Request #${req.requestId}`);
    this.detailRows.set([
      { label: 'Req ID', value: req.requestId },
      { label: 'Farmer', value: farmerName ? `${farmerName} (#${req.farmerId})` : '#' + req.farmerId },
      { label: 'Input Item', value: this.getInputName(req.inputId) },
      { label: 'Qty Requested', value: req.quantityRequested },
      { label: 'Total Price', value: this.fmtMoney(req.actualPrice) },
      { label: 'Request Date', value: this.fmtDate(req.requestDate) },
      { label: 'Assigned Centre', value: 'Centre #' + req.assignedCentreId },
      { label: 'Status', value: this.getRequestStatusLabel(req.status) }
    ]);
    this.showDetailModal.set(true);
  }

  // ================= CATALOG CRUD =================
  openCatalogModal(item?: any) {
    if (item) {
      this.isEditMode.set(true);
      this.selectedCatalogItem.set(item);
      this.catalogForm.patchValue(item);
    } else {
      this.isEditMode.set(false);
      this.selectedCatalogItem.set(null);
      this.catalogForm.reset({
        pricePerUnit: 1.0,
        subsidisedPrice: 0.5,
        availableStock: 100
      });
    }
    this.showCatalogModal.set(true);
  }

  closeCatalogModal() {
    this.showCatalogModal.set(false);
  }

  submitCatalogForm() {
    if (this.catalogForm.invalid) return;

    if (this.isEditMode()) {
      const id = this.selectedCatalogItem().inputId;
      const body = { ...this.catalogForm.value, status: this.selectedCatalogItem().status };
      this.inputService.updateInputCatalog(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Supply catalog updated');
          this.closeCatalogModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating catalog item')
      });
    } else {
      const body = { ...this.catalogForm.value, status: 'AC' };
      this.inputService.createInputCatalog(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Supply item added successfully');
          this.closeCatalogModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error adding catalog item')
      });
    }
  }

  toggleCatalogStatus(item: any) {
    const newStatus = item.status === 'AC' ? 'IN' : 'AC';
    const body = { ...item, status: newStatus };
    this.inputService.updateInputCatalog(item.inputId, body).subscribe({
      next: (res) => {
        this.toast.success(res.message || `Item marked as ${newStatus === 'AC' ? 'Active' : 'Inactive'}`);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to update status')
    });
  }

  confirmDeleteCatalog(item: any) {
    this.selectedCatalogItem.set(item);
    this.showDeleteCatalogConfirm.set(true);
  }

  executeDeleteCatalog() {
    const id = this.selectedCatalogItem().inputId;
    this.inputService.deleteInputCatalog(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Supply item deleted');
        this.showDeleteCatalogConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Failed to delete catalog item')
    });
  }

  // ================= FARMER REQUESTS =================
  openRequestModal(item: any) {
    if (this.isFarmer() && this.farmerProfiles().length === 0) {
      this.toast.error('No farmer profile found. Please complete your profile registration first.');
      return;
    }
    this.selectedCatalogItem.set(item);
    const autoFarmerId = this.isFarmer() && this.farmerProfiles().length > 0
      ? String(this.farmerProfiles()[0].farmerId)
      : '';
    this.requestForm.reset({
      quantityRequested: 1,
      assignedCentreId: 101,
      farmerId: autoFarmerId
    });
    this.calculatedTotalPrice.set(item.subsidisedPrice);
    this.showRequestModal.set(true);
  }

  closeRequestModal() {
    this.showRequestModal.set(false);
  }

  calculateTotalPrice() {
    const qty = this.requestForm.get('quantityRequested')?.value || 0;
    const price = this.selectedCatalogItem()?.subsidisedPrice || 0;
    this.calculatedTotalPrice.set(qty * price);
  }

  submitRequestForm() {
    if (this.requestForm.invalid) return;
    const item = this.selectedCatalogItem();
    const qty = this.requestForm.get('quantityRequested')?.value;

    if (qty > item.availableStock) {
      this.toast.error(`Requested quantity exceeds available stock (${item.availableStock})`);
      return;
    }

    const body = {
      ...this.requestForm.value,
      inputId: item.inputId,
      actualPrice: this.calculatedTotalPrice(),
      requestDate: new Date().toISOString().split('T')[0],
      status: 'PE'
    };

    this.inputService.createInputRequest(body).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Input supply request recorded');
        this.closeRequestModal();
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to place request')
    });
  }

  // ================= SORT =================
  toggleCatalogSort(field: string) {
    if (this.catalogSortField() !== field) {
      this.catalogSortField.set(field);
      this.catalogSortDir.set('asc');
    } else {
      const next = this.catalogSortDir() === 'asc' ? 'desc' : this.catalogSortDir() === 'desc' ? '' : 'asc';
      this.catalogSortDir.set(next as any);
      if (!next) this.catalogSortField.set('');
    }
  }

  getCatalogSortIcon(field: string): string {
    if (this.catalogSortField() !== field || !this.catalogSortDir()) return 'unfold_more';
    return this.catalogSortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  toggleRequestSort() {
    const next = this.requestSortDir() === 'asc' ? 'desc' : this.requestSortDir() === 'desc' ? '' : 'asc';
    this.requestSortDir.set(next as any);
  }

  getRequestSortIcon(): string {
    if (!this.requestSortDir()) return 'unfold_more';
    return this.requestSortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // ================= EXPORT =================
  exportCatalog(format: 'excel' | 'pdf') {
    const columns = ['Supply ID', 'Name', 'Category', 'Unit', 'Standard Price', 'Subsidised Price', 'Available Stock', 'Status'];
    const rows = this.sortedCatalogs().map(c => [
      c.inputId, c.name, c.category, c.unit,
      '₹' + Number(c.pricePerUnit).toFixed(2),
      '₹' + Number(c.subsidisedPrice).toFixed(2),
      c.availableStock + ' ' + c.unit + 's',
      c.status === 'AC' ? 'Active' : 'Inactive'
    ]);
    if (format === 'excel') {
      this.exportService.exportToExcel(columns, rows, 'input-catalog', 'Input Catalog');
      this.toast.success(`Exported ${rows.length} record(s) to Excel.`);
    } else {
      const opened = this.exportService.exportToPdf(columns, rows, 'input-catalog', 'Input Catalog');
      if (!opened) this.toast.error('Popup blocked. Allow popups to export PDF.');
    }
  }

  exportRequests(format: 'excel' | 'pdf') {
    const columns = ['Request ID', 'Farmer ID', 'Input Item', 'Qty Requested', 'Total Price', 'Request Date', 'Assigned Centre', 'Status'];
    const rows = this.sortedRequests().map(r => [
      r.requestId, '#' + r.farmerId, this.getInputName(r.inputId),
      r.quantityRequested, '₹' + Number(r.actualPrice).toFixed(2),
      this.fmtDate(r.requestDate), 'Centre #' + r.assignedCentreId,
      this.getRequestStatusLabel(r.status)
    ]);
    if (format === 'excel') {
      this.exportService.exportToExcel(columns, rows, 'input-requests', 'Farmer Input Requests');
      this.toast.success(`Exported ${rows.length} record(s) to Excel.`);
    } else {
      const opened = this.exportService.exportToPdf(columns, rows, 'input-requests', 'Farmer Input Requests');
      if (!opened) this.toast.error('Popup blocked. Allow popups to export PDF.');
    }
  }

  updateStatus(req: any, status: 'AP' | 'RE' | 'DL') {
    const body = { ...req, status };
    this.inputService.updateInputRequest(req.requestId, body).subscribe({
      next: (res) => {
        this.toast.success(res.message || `Request status changed to ${status}`);
        // Approving deducts the quantity from catalog stock server-side, so the
        // catalog has to be re-read along with the requests.
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error updating status')
    });
  }

  confirmDeleteRequest(req: any) {
    this.selectedRequest.set(req);
    this.showDeleteRequestConfirm.set(true);
  }

  executeDeleteRequest() {
    const id = this.selectedRequest().requestId;
    this.inputService.deleteInputRequest(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Request cancelled');
        this.showDeleteRequestConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Failed to cancel request')
    });
  }
}
