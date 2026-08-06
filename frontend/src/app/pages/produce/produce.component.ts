import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduceService } from '../../services/produce.service';
import { CropService } from '../../services/crop.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

// ---- Produce listing input bounds ----------------------------------------------
/** Harvest weight offered for sale, in Kg. Upper bound catches stray digits. */
const MIN_QUANTITY_KG = 1;
const MAX_QUANTITY_KG = 100000;
/** Asking price per Kg, in rupees. */
const MIN_PRICE_PER_KG = 1;
const MAX_PRICE_PER_KG = 10000;

@Component({
  selector: 'app-produce',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './produce.component.html',
  styleUrls: ['./produce.component.css']
})
export class ProduceComponent implements OnInit {
  private produceService = inject(ProduceService);
  private cropService = inject(CropService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);
  private fb = inject(FormBuilder);

  // States
  activeTab = signal<'listings' | 'sales'>('listings');
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Data signals
  listings = signal<any[]>([]);
  sales = signal<any[]>([]);
  cropCatalogs = signal<any[]>([]);
  farmerProfiles = signal<any[]>([]);

  // Pagination state
  listingPage = 0;   listingPageSize = 5;
  salePage = 0;      salePageSize = 5;

  // Selection
  selectedListing = signal<any | null>(null);
  selectedSale = signal<any | null>(null);

  // Modal Display States
  showListingModal = signal<boolean>(false);
  showBuyModal = signal<boolean>(false);
  showDeleteListingConfirm = signal<boolean>(false);
  showDeleteSaleConfirm = signal<boolean>(false);
  showMarkPaidConfirm = signal<boolean>(false);
  showReceiptConfirm = signal<boolean>(false);

  /**
   * Floor a buyer's offer may not go below, as a percentage of the farmer's asking
   * price. Mirrors ProduceSaleService.MIN_OFFER_PERCENT_OF_ASKING, which rejects
   * anything lower server-side.
   */
  readonly minOfferPercent = 90;

  // Listing input bounds, exposed so the inputs carry native min/max too.
  readonly MIN_QUANTITY_KG = MIN_QUANTITY_KG;
  readonly MAX_QUANTITY_KG = MAX_QUANTITY_KG;
  readonly MIN_PRICE_PER_KG = MIN_PRICE_PER_KG;
  readonly MAX_PRICE_PER_KG = MAX_PRICE_PER_KG;

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Calculated Sale Total
  totalCalculatedAmount = signal<number>(0);

  // Form Groups
  listingForm!: FormGroup;
  saleForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadAllData();
  }

  isFarmer(): boolean {
    return this.authService.hasRole(['Farmer']);
  }

  isProcurementOrAdmin(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ProcurementOfficer']);
  }

  // The marketplace and sales ledger export to Excel for the admin and the
  // procurement officer, who both need the figures offline for price discovery.
  canExport(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ProcurementOfficer']);
  }

  // Only the Procurement Officer buys produce (records sales); the admin does not.
  isProcurement(): boolean {
    return this.authService.hasRole(['ProcurementOfficer']);
  }

  // Only Farmers and AgriLinkAdmin may create/edit/withdraw produce listings
  // (mirrors produce-service SecurityConfig for POST/PUT/DELETE /produce-listings).
  canManageListing(): boolean {
    return this.authService.hasRole(['Farmer', 'AgriLinkAdmin']);
  }

  setTab(tab: 'listings' | 'sales') {
    this.activeTab.set(tab);
  }

  // ================= PAGINATION =================
  private page(list: any[], pageIndex: number, size: number): any[] {
    const start = pageIndex * size;
    return (list || []).slice(start, start + size);
  }

  paginatedListings(): any[] { return this.page(this.sortedListings(), this.listingPage, this.listingPageSize); }
  onListingPageChange(p: number) { this.listingPage = p; }
  onListingPageSizeChange(s: number) { this.listingPageSize = s; this.listingPage = 0; }

  paginatedSales(): any[] { return this.page(this.sortedSales(), this.salePage, this.salePageSize); }
  onSalePageChange(p: number) { this.salePage = p; }
  onSalePageSizeChange(s: number) { this.salePageSize = s; this.salePage = 0; }

  // ================= LISTINGS SEARCH =================
  listingSearch = '';
  // Reset to the first page whenever the query changes, so the matches are visible
  // instead of stranded on a page number that no longer exists.
  onListingSearchChange() { this.listingPage = 0; }

  /** Listings narrowed by the search box. */
  filteredListings(): any[] {
    const list = this.listings();
    const q = this.listingSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(item => this.listingSearchText(item).includes(q));
  }

  /**
   * Everything about a listing a user could plausibly search by, flattened into one
   * lowercase string — id, farmer, crop, harvest date, both quantities, grade, price
   * and the status label — so "tomato", "grade a", "sold" and "1500" all match.
   */
  private listingSearchText(item: any): string {
    return [
      item.listingId, '#' + item.listingId,
      this.getFarmerName(item.farmerId),
      this.getCropName(item.cropId),
      this.fmtDate(item.harvestDate),
      this.availableQty(item), item.quantityKg,
      item.qualityGrade, 'grade ' + item.qualityGrade,
      item.askingPricePerKg, this.fmtMoney(item.askingPricePerKg),
      item.status, this.getListingStatusLabel(item.status)
    ].join(' ').toLowerCase();
  }

  // ================= SALES SEARCH =================
  saleSearch = '';
  onSaleSearchChange() { this.salePage = 0; }

  /** Sales narrowed by the search box. */
  filteredSales(): any[] {
    const list = this.sales();
    const q = this.saleSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(sale => this.saleSearchText(sale).includes(q));
  }

  /**
   * Everything about a sale that a user could plausibly search by, flattened into
   * one lowercase string. A farmer confirming a payment rarely knows the sale id —
   * they know it was "10 Kg of tomato" or "the one still awaiting confirmation" —
   * so ids, crop, farmer, buyer, amounts, date and both status labels all match.
   */
  private saleSearchText(sale: any): string {
    const listing = this.listings().find(l => l.listingId == sale.listingId);
    return [
      sale.saleId, '#' + sale.saleId,
      sale.listingId, '#' + sale.listingId,
      this.getCropNameForListing(sale.listingId),
      listing ? this.getFarmerName(listing.farmerId) : '',
      sale.buyerId, '#' + sale.buyerId,
      sale.quantitySoldKg, sale.agreedPricePerKg, sale.totalAmount,
      this.fmtDate(sale.saleDate),
      sale.paymentStatus, this.getPaymentStatusLabel(sale.paymentStatus),
      this.getFarmerConfirmationLabel(sale)
    ].join(' ').toLowerCase();
  }

  // ================= COLUMN SORTING =================
  // Newest/highest first by default: listings on harvest date, sales on sale date.
  // Clicking a sortable header re-sorts descending; clicking it again flips to
  // ascending.
  listingSortField = signal<string>('harvestDate');
  listingSortAsc = signal<boolean>(false);
  saleSortField = signal<string>('saleDate');
  saleSortAsc = signal<boolean>(false);

  sortListingsBy(field: string) {
    this.toggleSort(this.listingSortField, this.listingSortAsc, field);
    this.listingPage = 0;
  }

  sortSalesBy(field: string) {
    this.toggleSort(this.saleSortField, this.saleSortAsc, field);
    this.salePage = 0;
  }

  private toggleSort(fieldSig: WritableSignal<string>,
                     ascSig: WritableSignal<boolean>, field: string) {
    if (fieldSig() === field) {
      ascSig.set(!ascSig());
    } else {
      fieldSig.set(field);
      ascSig.set(false);
    }
  }

  /** Header arrow: neutral when the column isn't the one being sorted on. */
  sortIcon(isActive: boolean, asc: boolean): string {
    if (!isActive) return 'unfold_more';
    return asc ? 'arrow_upward' : 'arrow_downward';
  }

  /** Listings after the search box and the active column sort. */
  sortedListings(): any[] {
    return this.applySort(this.filteredListings(), this.listingSortField(), this.listingSortAsc());
  }

  /** Sales after the search box and the active column sort. */
  sortedSales(): any[] {
    return this.applySort(this.filteredSales(), this.saleSortField(), this.saleSortAsc());
  }

  /**
   * Sorts by a field, comparing dates chronologically and numbers numerically.
   * Available quantity is derived rather than a plain property, so it resolves
   * through {@link availableQty}.
   */
  private applySort(list: any[], field: string | null, asc: boolean): any[] {
    if (!field) return list;
    const direction = asc ? 1 : -1;
    const valueOf = (row: any) =>
      field === 'availableQuantityKg' ? this.availableQty(row) : row[field];
    return [...list].sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      // Blanks always sink to the bottom, whichever direction is active.
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (field.toLowerCase().includes('date')) {
        return (new Date(va).getTime() - new Date(vb).getTime()) * direction;
      }
      const na = Number(va);
      const nb = Number(vb);
      if (!isNaN(na) && !isNaN(nb)) {
        return (na - nb) * direction;
      }
      return String(va).localeCompare(String(vb)) * direction;
    });
  }

  private initForms() {
    this.listingForm = this.fb.group({
      farmerId: ['', Validators.required],
      cropId: ['', Validators.required],
      harvestDate: ['', Validators.required],
      quantityKg: [50, [Validators.required, Validators.min(MIN_QUANTITY_KG),
                        Validators.max(MAX_QUANTITY_KG)]],
      qualityGrade: ['', Validators.required],
      askingPricePerKg: [1.5, [Validators.required, Validators.min(MIN_PRICE_PER_KG),
                               Validators.max(MAX_PRICE_PER_KG)]],
      status: ['', Validators.required]
    });

    // The buyer negotiates a percentage of the asking price rather than an arbitrary
    // rupee figure; the agreed price per Kg is derived from it.
    this.saleForm = this.fb.group({
      quantitySoldKg: [0, [Validators.required, Validators.min(0.1)]],
      offerPercent: [100, [Validators.required, Validators.min(this.minOfferPercent)]],
      paymentStatus: ['', Validators.required]
    });
  }

  private loadAllData() {
    this.isLoading.set(true);
    // Load catalogs
    this.cropService.getAllCropCatalogs().subscribe({
      next: (catalogs) => {
        this.cropCatalogs.set(catalogs);

        // Load profiles
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (profiles) => {
            this.farmerProfiles.set(profiles);
          }
        });

        // Load listings
        this.produceService.getAllProduceListings().subscribe({
          next: (list) => {
            // Display order is owned by the column sort (harvest date, newest first).
            this.listings.set(list || []);
            this.listingPage = 0;
          }
        });

        // Load sales
        this.produceService.getAllProduceSales().subscribe({
          next: (sls) => {
            this.sales.set(sls);
            this.salePage = 0;
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => {
        this.toast.error('Failed to load produce market data.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Kg still open for purchase on a listing. produce-service supplies this as
   * `availableQuantityKg` (listed quantity minus everything already sold); the
   * subtraction is repeated from the loaded sales only as a fallback.
   */
  availableQty(item: any): number {
    if (!item) return 0;
    if (item.availableQuantityKg !== null && item.availableQuantityKg !== undefined) {
      return item.availableQuantityKg;
    }
    const sold = this.sales()
      .filter(s => s.listingId == item.listingId)
      .reduce((sum, s) => sum + (Number(s.quantitySoldKg) || 0), 0);
    return Math.max(0, (Number(item.quantityKg) || 0) - sold);
  }

  getCropName(cropId: number): string {
    const crop = this.cropCatalogs().find(c => c.cropId == cropId);
    return crop ? crop.cropName : `Crop ID: ${cropId}`;
  }

  getFarmerName(farmerId: number): string {
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof && prof.name ? `${prof.name}(#${farmerId})` : `Farmer #${farmerId}`;
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

  viewListingDetails(item: any) {
    this.detailTitle.set(`Produce Listing #${item.listingId}`);
    this.detailRows.set([
      { label: 'Listing ID', value: item.listingId },
      { label: 'Farmer', value: this.getFarmerName(item.farmerId) },
      { label: 'Crop Type', value: this.getCropName(item.cropId) },
      { label: 'Harvest Date', value: this.fmtDate(item.harvestDate) },
      { label: 'Available Quantity (Kg)', value: this.availableQty(item) + ' Kg' },
      { label: 'Listed Quantity (Kg)', value: item.quantityKg + ' Kg' },
      { label: 'Quality Grade', value: item.qualityGrade },
      { label: 'Price/Kg', value: this.fmtMoney(item.askingPricePerKg) },
      { label: 'Status', value: this.getListingStatusLabel(item.status) }
    ]);
    this.showDetailModal.set(true);
  }

  viewSaleDetails(sale: any) {
    this.detailTitle.set(`Sale Transaction #${sale.saleId}`);
    this.detailRows.set([
      { label: 'Sale ID', value: sale.saleId },
      { label: 'Listing', value: '#' + sale.listingId + ' (' + this.getCropNameForListing(sale.listingId) + ')' },
      { label: 'Buyer ID', value: '#' + sale.buyerId },
      { label: 'Quantity Sold', value: sale.quantitySoldKg + ' Kg' },
      { label: 'Agreed Price/Kg', value: this.fmtMoney(sale.agreedPricePerKg) },
      { label: 'Total Amount', value: this.fmtMoney(sale.totalAmount) },
      { label: 'Sale Date', value: this.fmtDate(sale.saleDate) },
      { label: 'Payment Status', value: this.getPaymentStatusLabel(sale.paymentStatus) },
      { label: 'Farmer Confirmed Receipt', value: this.getFarmerConfirmationLabel(sale) },
      { label: 'Confirmed On', value: sale.farmerConfirmedDate ? this.fmtDate(sale.farmerConfirmedDate) : '—' }
    ]);
    this.showDetailModal.set(true);
  }

  /**
   * Human-readable state of the farmer's secondary payment check, matching the
   * three badges in the table: awaiting payment -> awaiting farmer -> received.
   */
  getFarmerConfirmationLabel(sale: any): string {
    if (sale?.paymentStatus !== 'PD') return 'Awaiting Payment (not settled yet)';
    return this.isFarmerConfirmed(sale) ? 'Received' : 'Awaiting Farmer';
  }

  getCropNameForListing(listingId: number): string {
    const list = this.listings().find(l => l.listingId == listingId);
    if (!list) return 'Unknown Produce';
    return this.getCropName(list.cropId);
  }

  getListingStatusLabel(status: string): string {
    switch (status) {
      case 'AV': return 'Available';
      case 'PB': return 'PartiallyBooked';
      case 'SO': return 'Sold';
      case 'WD': return 'Withdrawn';
      default: return status;
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PE': return 'Pending';
      case 'PD': return 'Paid';
      case 'OV': return 'Overdue';
      default: return status;
    }
  }

  // ================= EXPORTS =================
  // Exports cover every record the search is currently showing, not just the
  // page on screen.
  exportListings() {
    if (!this.canExport()) return;
    const items = this.sortedListings();
    if (items.length === 0) {
      this.toast.error('No produce listings to export.');
      return;
    }
    const columns = ['Listing ID', 'Farmer', 'Crop Type', 'Harvest Date', 'Listed Qty (Kg)',
      'Available Qty (Kg)', 'Quality Grade', 'Price/Kg', 'Status'];
    const rows = items.map(item => [
      item.listingId,
      this.getFarmerName(item.farmerId),
      this.getCropName(item.cropId),
      this.fmtDate(item.harvestDate),
      item.quantityKg,
      this.availableQty(item),
      item.qualityGrade,
      this.fmtMoney(item.askingPricePerKg),
      this.getListingStatusLabel(item.status)
    ]);
    this.doExport(columns, rows, 'produce-listings', 'Available Marketplace Produce');
  }

  exportSales() {
    if (!this.canExport()) return;
    // Export what the search box is currently showing, matching the crops module.
    const items = this.sortedSales();
    if (items.length === 0) {
      this.toast.error('No sales transactions to export.');
      return;
    }
    const columns = ['Sale ID', 'Listing', 'Buyer ID', 'Quantity Sold (Kg)', 'Agreed Price/Kg',
      'Total Amount', 'Sale Date', 'Payment Status', 'Farmer Confirmation'];
    const rows = items.map(sale => [
      sale.saleId,
      '#' + sale.listingId + ' — ' + this.getCropNameForListing(sale.listingId),
      '#' + sale.buyerId,
      sale.quantitySoldKg,
      this.fmtMoney(sale.agreedPricePerKg),
      this.fmtMoney(sale.totalAmount),
      this.fmtDate(sale.saleDate),
      this.getPaymentStatusLabel(sale.paymentStatus),
      this.getFarmerConfirmationLabel(sale)
    ]);
    this.doExport(columns, rows, 'produce-sales', 'Produce Sales & Transactions Log');
  }

  private doExport(columns: string[], rows: (string | number)[][], fileName: string, title: string) {
    this.exportService.exportToExcel(columns, rows, fileName, title);
    this.toast.success(`Exported ${rows.length} record(s) to Excel.`);
  }

  // ================= FORM VALIDATION FEEDBACK =================
  /** True once the user has interacted with a control that is now invalid. */
  showError(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  quantityError(): string {
    const errors = this.listingForm.get('quantityKg')?.errors || {};
    if (errors['required']) return 'Total quantity is required.';
    return `Enter a quantity between ${MIN_QUANTITY_KG} and ${MAX_QUANTITY_KG} Kg.`;
  }

  askingPriceError(): string {
    const errors = this.listingForm.get('askingPricePerKg')?.errors || {};
    if (errors['required']) return 'Asking price is required.';
    return `Enter a price between ₹${MIN_PRICE_PER_KG} and ₹${MAX_PRICE_PER_KG} per Kg.`;
  }

  // ================= PRODUCE LISTINGS CRUD =================
  openListingModal(item?: any) {
    const statusControl = this.listingForm.get('status');
    if (item) {
      this.isEditMode.set(true);
      this.selectedListing.set(item);
      statusControl?.setValidators([Validators.required]);
      statusControl?.updateValueAndValidity({ emitEvent: false });
      this.listingForm.patchValue({
        ...item,
        harvestDate: item.harvestDate ? item.harvestDate.split('T')[0] : ''
      });
    } else {
      this.isEditMode.set(false);
      this.selectedListing.set(null);
      // A new listing has no status to choose: produce-service opens it as Available
      // and maintains it from there as sales are recorded.
      statusControl?.clearValidators();
      statusControl?.updateValueAndValidity({ emitEvent: false });
      this.listingForm.reset({
        status: '',
        qualityGrade: '',
        quantityKg: 50,
        askingPricePerKg: 1.5,
        farmerId: this.farmerProfiles().length > 0 ? this.farmerProfiles()[0].farmerId : ''
      });
    }
    this.showListingModal.set(true);
  }

  closeListingModal() {
    this.showListingModal.set(false);
  }

  submitListingForm() {
    if (this.listingForm.invalid) return;
    const body: any = { ...this.listingForm.value };

    if (this.isEditMode()) {
      const id = this.selectedListing().listingId;
      this.produceService.updateProduceListing(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Listing updated');
          this.closeListingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating listing')
      });
    } else {
      // Send no status at all rather than a blank one: produce-service falls back to
      // Available, and a blank would fail to deserialize into the status enum.
      delete body.status;
      this.produceService.createProduceListing(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Produce listed for sale');
          this.closeListingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating listing')
      });
    }
  }

  confirmDeleteListing(item: any) {
    this.selectedListing.set(item);
    this.showDeleteListingConfirm.set(true);
  }

  executeDeleteListing() {
    const id = this.selectedListing().listingId;
    this.produceService.deleteProduceListing(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Listing withdrawn');
        this.showDeleteListingConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Failed to withdraw listing')
    });
  }

  // ================= PURCHASING / SALES RECORD =================
  openBuyModal(item: any) {
    this.selectedListing.set(item);
    const available = this.availableQty(item);

    // Cap the purchase at what is still unsold on this listing.
    const qtyControl = this.saleForm.get('quantitySoldKg');
    qtyControl?.setValidators([Validators.required, Validators.min(0.1), Validators.max(available)]);
    qtyControl?.updateValueAndValidity({ emitEvent: false });

    this.saleForm.reset({
      quantitySoldKg: available,
      offerPercent: 100,
      paymentStatus: ''
    });
    this.calculateTotal();
    this.showBuyModal.set(true);
  }

  closeBuyModal() {
    this.showBuyModal.set(false);
  }

  /** Lowest price per Kg the buyer may agree to on the selected listing. */
  minAgreedPrice(): number {
    const asking = Number(this.selectedListing()?.askingPricePerKg) || 0;
    return asking * this.minOfferPercent / 100;
  }

  /** Agreed price per Kg derived from the offered percentage of the asking price. */
  agreedPricePerKg(): number {
    const asking = Number(this.selectedListing()?.askingPricePerKg) || 0;
    const percent = Number(this.saleForm.get('offerPercent')?.value) || 0;
    return Math.round(asking * percent) / 100;
  }

  calculateTotal() {
    const qty = Number(this.saleForm.get('quantitySoldKg')?.value) || 0;
    this.totalCalculatedAmount.set(qty * this.agreedPricePerKg());
  }

  submitSaleForm() {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }
    const session = this.authService.currentUserValue;
    const qty = Number(this.saleForm.get('quantitySoldKg')?.value);
    const listing = this.selectedListing();
    const available = this.availableQty(listing);

    if (qty > available) {
      this.toast.error(`Quantity cannot exceed the available quantity (${available} Kg)`);
      return;
    }

    const agreedPricePerKg = this.agreedPricePerKg();
    if (agreedPricePerKg < this.minAgreedPrice()) {
      this.toast.error(`Agreed price must be at least ${this.minOfferPercent}% of the asking price`);
      return;
    }

    const body = {
      quantitySoldKg: qty,
      paymentStatus: this.saleForm.get('paymentStatus')?.value,
      agreedPricePerKg,
      listingId: listing.listingId,
      buyerId: session ? session.userId : 1,
      totalAmount: this.totalCalculatedAmount(),
      saleDate: new Date().toISOString().split('T')[0]
    };

    this.produceService.createProduceSale(body).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Sale recorded successfully');
        this.closeBuyModal();
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error recording sale')
    });
  }

  // ================= PAYMENT SETTLEMENT & FARMER CONFIRMATION =================

  /** True once the selling farmer has acknowledged receiving the money. */
  isFarmerConfirmed(sale: any): boolean {
    return sale?.farmerPaymentConfirmed === true;
  }

  /** A Farmer may acknowledge receipt only on their own settled, unconfirmed sales. */
  canConfirmReceipt(sale: any): boolean {
    return this.isFarmer() && sale?.paymentStatus === 'PD' && !this.isFarmerConfirmed(sale);
  }

  confirmMarkPaid(sale: any) {
    this.selectedSale.set(sale);
    this.showMarkPaidConfirm.set(true);
  }

  executeMarkPaid() {
    const sale = this.selectedSale();
    // Re-send the whole record: the API replaces the sale on update.
    const body = { ...sale, paymentStatus: 'PD' };
    this.produceService.updateProduceSale(sale.saleId, body).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Payment marked as paid. Awaiting farmer confirmation.');
        this.showMarkPaidConfirm.set(false);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to update payment status')
    });
  }

  confirmPaymentReceived(sale: any) {
    this.selectedSale.set(sale);
    this.showReceiptConfirm.set(true);
  }

  executeConfirmReceipt() {
    const id = this.selectedSale().saleId;
    this.produceService.confirmFarmerPayment(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Payment receipt confirmed');
        this.showReceiptConfirm.set(false);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to confirm payment receipt')
    });
  }

  confirmDeleteSale(sale: any) {
    this.selectedSale.set(sale);
    this.showDeleteSaleConfirm.set(true);
  }

  executeDeleteSale() {
    const id = this.selectedSale().saleId;
    this.produceService.deleteProduceSale(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Transaction deleted');
        this.showDeleteSaleConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Failed to delete transaction log')
    });
  }
}
