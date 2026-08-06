import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduceService } from '../../services/produce.service';
import { CropService } from '../../services/crop.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';
import { toggleSort, sortIcon, applySort } from '../../utils/table-sort.util';

@Component({
  selector: 'app-produce',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="produce-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Produce Market & Sales Log</h1>
          <p class="text-secondary">Register harvested yield for sale, inspect listed produce, and record transactions.</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'listings'" (click)="setTab('listings')">
          <i class="material-icons-round">storefront</i>
          <span>Produce Listings</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'sales'" (click)="setTab('sales')">
          <i class="material-icons-round">receipt_long</i>
          <span>Sales & Transactions</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Fetching marketplace records...</p>
        </div>
      } @else {
        <!-- TABS CONTENT -->

        <!-- 1. PRODUCE LISTINGS TAB -->
        @if (activeTab() === 'listings') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Available Marketplace Produce</h3>
              @if (canManageListing()) {
                <button class="btn btn-primary" (click)="openListingModal()">
                  <i class="material-icons-round">add_circle</i>
                  <span>New</span>
                </button>
              }
            </div>

            @if (listings().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">shopping_basket</i>
                <h3>No Listings Listed</h3>
                <p>There are no listings for sale currently.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th class="sortable" (click)="sortListingsBy('cropName')"
                            title="Sort by crop type (click again to reverse)">
                          <span>Crop Type</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="listingSortField() === 'cropName'">{{ sortIcon(listingSortField() === 'cropName', listingSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortListingsBy('harvestDate')"
                            title="Sort by harvest date (click again to reverse)">
                          <span>Harvest Date</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="listingSortField() === 'harvestDate'">{{ sortIcon(listingSortField() === 'harvestDate', listingSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortListingsBy('quantityKg')"
                            title="Sort by quantity (click again to reverse)">
                          <span>Quantity (Kg)</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="listingSortField() === 'quantityKg'">{{ sortIcon(listingSortField() === 'quantityKg', listingSortAsc()) }}</i>
                        </th>
                        <th>Quality Grade</th>
                        <th class="sortable" (click)="sortListingsBy('askingPricePerKg')"
                            title="Sort by price per Kg (click again to reverse)">
                          <span>Price/Kg (₹)</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="listingSortField() === 'askingPricePerKg'">{{ sortIcon(listingSortField() === 'askingPricePerKg', listingSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortListingsBy('status')"
                            title="Sort by status (click again to reverse)">
                          <span>Status</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="listingSortField() === 'status'">{{ sortIcon(listingSortField() === 'status', listingSortAsc()) }}</i>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of paginatedListings(); track item.listingId) {
                        <tr>
                          <td>{{ getCropName(item.cropId) }}</td>
                          <td>{{ item.harvestDate | date:'mediumDate' }}</td>
                          <td>{{ item.quantityKg }} Kg</td>
                          <td>
                            <span class="badge badge-info">{{ item.qualityGrade }}</span>
                          </td>
                          <td>{{ item.askingPricePerKg | currency:'INR':'symbol-narrow' }}</td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-success': item.status === 'AV',
                              'badge-info': item.status === 'PB',
                              'badge-secondary': item.status === 'WD',
                              'badge-warning': item.status === 'SO'
                            }">
                              {{ getListingStatusLabel(item.status) }}
                            </span>
                          </td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewListingDetails(item)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (canManageListing()) {
                                <button class="menu-item" (click)="openListingModal(item)">
                                  <i class="material-icons-round">edit</i> Edit
                                </button>
                                <button class="menu-item danger" (click)="confirmDeleteListing(item)">
                                  <i class="material-icons-round">delete</i> Withdraw Listing
                                </button>
                              }
                              @if (isProcurement() && (item.status === 'AV' || item.status === 'PB')) {
                                <button class="menu-item" (click)="openBuyModal(item)">
                                  <i class="material-icons-round">shopping_cart</i> Buy
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
                  [currentPage]="listingPage"
                  [pageSize]="listingPageSize"
                  [totalElements]="listings().length"
                  (pageChange)="onListingPageChange($event)"
                  (pageSizeChange)="onListingPageSizeChange($event)">
                </app-pagination>
              </div>
            }
          </div>
        }

        <!-- 2. PRODUCE SALES TAB -->
        @if (activeTab() === 'sales') {
          <div class="tab-content">
            <h3>Recorded Sales Log</h3>
            <p class="text-secondary mb-3">Audit transactions, recorded buyer details, and payment settlements.</p>

            @if (sales().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">payment</i>
                <h3>No Transactions Found</h3>
                <p>No purchases have been recorded yet.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th class="sortable" (click)="sortSalesBy('quantitySoldKg')"
                            title="Sort by quantity sold (click again to reverse)">
                          <span>Quantity Sold</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="saleSortField() === 'quantitySoldKg'">{{ sortIcon(saleSortField() === 'quantitySoldKg', saleSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortSalesBy('agreedPricePerKg')"
                            title="Sort by agreed price (click again to reverse)">
                          <span>Agreed Price/Kg</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="saleSortField() === 'agreedPricePerKg'">{{ sortIcon(saleSortField() === 'agreedPricePerKg', saleSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortSalesBy('totalAmount')"
                            title="Sort by total amount (click again to reverse)">
                          <span>Total Amount</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="saleSortField() === 'totalAmount'">{{ sortIcon(saleSortField() === 'totalAmount', saleSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortSalesBy('saleDate')"
                            title="Sort by sale date (click again to reverse)">
                          <span>Sale Date</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="saleSortField() === 'saleDate'">{{ sortIcon(saleSortField() === 'saleDate', saleSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortSalesBy('paymentStatus')"
                            title="Sort by payment status (click again to reverse)">
                          <span>Payment Status</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="saleSortField() === 'paymentStatus'">{{ sortIcon(saleSortField() === 'paymentStatus', saleSortAsc()) }}</i>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sale of paginatedSales(); track sale.saleId) {
                        <tr>
                          <td>{{ sale.quantitySoldKg }} Kg</td>
                          <td>{{ sale.agreedPricePerKg | currency:'INR':'symbol-narrow' }}</td>
                          <td><strong>{{ sale.totalAmount | currency:'INR':'symbol-narrow' }}</strong></td>
                          <td>{{ sale.saleDate | date:'mediumDate' }}</td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-success': sale.paymentStatus === 'PD',
                              'badge-warning': sale.paymentStatus === 'PE',
                              'badge-danger': sale.paymentStatus === 'OV'
                            }">
                              {{ getPaymentStatusLabel(sale.paymentStatus) }}
                            </span>
                          </td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewSaleDetails(sale)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isProcurementOrAdmin()) {
                                <button class="menu-item danger" (click)="confirmDeleteSale(sale)">
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
                  [currentPage]="salePage"
                  [pageSize]="salePageSize"
                  [totalElements]="sales().length"
                  (pageChange)="onSalePageChange($event)"
                  (pageSizeChange)="onSalePageSizeChange($event)">
                </app-pagination>
              </div>
            }
          </div>
        }
      }

      <!-- MODALS SECTION -->

      <!-- 1. Listing Create/Edit Modal -->
      @if (showListingModal()) {
        <div class="modal-overlay" (click)="closeListingModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Produce Listing' : 'List Harvested Produce for Sale' }}</h3>
              <button class="close-btn" (click)="closeListingModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="listingForm" (ngSubmit)="submitListingForm()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="lFarmer">Farmer Profile</label>
                    <select id="lFarmer" formControlName="farmerId">
                      <option value="">Select Profile</option>
                      @for (prof of farmerProfiles(); track prof.farmerId) {
                        <option [value]="prof.farmerId">{{ prof.name }}(#{{ prof.farmerId }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="lCrop">Crop Catalog</label>
                    <select id="lCrop" formControlName="cropId">
                      <option value="">Select Crop</option>
                      @for (crop of cropCatalogs(); track crop.cropId) {
                        <option [value]="crop.cropId">{{ crop.cropName }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="lDate">Harvest Date</label>
                    <input type="date" id="lDate" formControlName="harvestDate" />
                  </div>
                  <div class="form-group">
                    <label for="lGrade">Quality Grade</label>
                    <select id="lGrade" formControlName="qualityGrade">
                      <option value="" disabled>Select Grade</option>
                      <option value="A">Grade A (Premium)</option>
                      <option value="B">Grade B (Standard)</option>
                      <option value="C">Grade C (Substandard)</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="lQty">Quantity (Kg)</label>
                    <input type="number" id="lQty" formControlName="quantityKg" />
                  </div>
                  <div class="form-group">
                    <label for="lPrice">Asking Price (₹/Kg)</label>
                    <input type="number" step="0.01" id="lPrice" formControlName="askingPricePerKg" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="lStatus">Status</label>
                  <select id="lStatus" formControlName="status">
                    <option value="" disabled>Select Status</option>
                    <option value="AV">AV (Available)</option>
                    <option value="PB">PB (PartiallyBooked)</option>
                    <option value="SO">SO (Sold)</option>
                    <option value="WD">WD (Withdrawn)</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="listingForm.invalid" title="Save" aria-label="Save">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 2. Purchase (Sale) Record Modal -->
      @if (showBuyModal()) {
        <div class="modal-overlay" (click)="closeBuyModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Record Transaction</h3>
              <button class="close-btn" (click)="closeBuyModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="saleForm" (ngSubmit)="submitSaleForm()">
              <div class="modal-body">
                <p>Buying produce from Listing <strong>#{{ selectedListing()?.listingId }}</strong> ({{ getCropName(selectedListing()?.cropId) }}).</p>
                <p class="text-secondary">Available Stock: <strong>{{ selectedListing()?.quantityKg }} Kg</strong>. Asking Price: <strong>{{ selectedListing()?.askingPricePerKg | currency:'INR':'symbol-narrow' }}/Kg</strong>.</p>
                
                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="sQty">Quantity Sold (Kg)</label>
                    <input 
                      type="number" 
                      id="sQty" 
                      formControlName="quantitySoldKg" 
                      (input)="calculateTotal()" />
                  </div>
                  <div class="form-group">
                    <label for="sPrice">Agreed Price (₹/Kg)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      id="sPrice" 
                      formControlName="agreedPricePerKg"
                      (input)="calculateTotal()" />
                  </div>
                </div>

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label>Total Transaction Value (₹)</label>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-hover);">
                      {{ totalCalculatedAmount() | currency:'INR':'symbol-narrow' }}
                    </div>
                  </div>
                  <div class="form-group">
                    <label for="sStatus">Payment Settlement Status</label>
                    <select id="sStatus" formControlName="paymentStatus">
                      <option value="" disabled>Select Payment Status</option>
                      <option value="PE">PE (Pending)</option>
                      <option value="PD">PD (Paid)</option>
                      <option value="OV">OV (Overdue)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="saleForm.invalid">Record Sale</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modals -->
      @if (showDeleteListingConfirm()) {
        <app-confirmation-modal
          title="Withdraw Produce Listing"
          message="Are you sure you want to withdraw this listed produce from the marketplace?"
          (confirm)="executeDeleteListing()"
          (cancel)="showDeleteListingConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showDeleteSaleConfirm()) {
        <app-confirmation-modal
          title="Cancel Transaction Record"
          message="Are you sure you want to delete this recorded produce sale from auditing logs?"
          (confirm)="executeDeleteSale()"
          (cancel)="showDeleteSaleConfirm.set(false)">
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
    .produce-page {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 0.25rem;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      outline: none;
    }
    .tab-btn i {
      font-size: 20px;
    }
    .tab-btn:hover {
      color: var(--primary-hover);
    }
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .tab-content {
      animation: fadeIn var(--transition-normal);
    }
    .btn-small {
      padding: 0.4rem 0.8rem !important;
      font-size: 0.8rem !important;
    }
    .table-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .action-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: background var(--transition-fast);
    }
    .action-btn:hover {
      background-color: var(--primary-light);
    }
    .action-btn i {
      font-size: 18px;
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
    }
    .close-btn:hover {
      color: var(--text-primary);
    }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s infinite linear;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProduceComponent implements OnInit {
  private produceService = inject(ProduceService);
  private cropService = inject(CropService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
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

  // Column sorting state for the listings and sales tables (null = default order).
  listingSortField = signal<string | null>(null);
  listingSortAsc = signal<boolean>(true);
  saleSortField = signal<string | null>(null);
  saleSortAsc = signal<boolean>(true);

  // Exposed for the template.
  readonly sortIcon = sortIcon;

  // Selection
  selectedListing = signal<any | null>(null);
  selectedSale = signal<any | null>(null);

  // Modal Display States
  showListingModal = signal<boolean>(false);
  showBuyModal = signal<boolean>(false);
  showDeleteListingConfirm = signal<boolean>(false);
  showDeleteSaleConfirm = signal<boolean>(false);

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

  paginatedListings(): any[] {
    // Crop name isn't a direct field on the listing — attach it so sorting by
    // "Crop Type" reflects what's actually displayed in the column.
    const withCropName = this.listings().map(l => ({ ...l, cropName: this.getCropName(l.cropId) }));
    const sorted = applySort(withCropName, this.listingSortField(), this.listingSortAsc());
    return this.page(sorted, this.listingPage, this.listingPageSize);
  }
  onListingPageChange(p: number) { this.listingPage = p; }
  onListingPageSizeChange(s: number) { this.listingPageSize = s; this.listingPage = 0; }
  sortListingsBy(field: string) { toggleSort(this.listingSortField, this.listingSortAsc, field); this.listingPage = 0; }

  paginatedSales(): any[] {
    const sorted = applySort(this.sales(), this.saleSortField(), this.saleSortAsc());
    return this.page(sorted, this.salePage, this.salePageSize);
  }
  onSalePageChange(p: number) { this.salePage = p; }
  onSalePageSizeChange(s: number) { this.salePageSize = s; this.salePage = 0; }
  sortSalesBy(field: string) { toggleSort(this.saleSortField, this.saleSortAsc, field); this.salePage = 0; }

  private initForms() {
    this.listingForm = this.fb.group({
      farmerId: ['', Validators.required],
      cropId: ['', Validators.required],
      harvestDate: ['', Validators.required],
      quantityKg: [50, [Validators.required, Validators.min(0.1)]],
      qualityGrade: ['', Validators.required],
      askingPricePerKg: [1.5, [Validators.required, Validators.min(0.01)]],
      status: ['', Validators.required]
    });

    this.saleForm = this.fb.group({
      quantitySoldKg: [0, [Validators.required, Validators.min(0.1)]],
      agreedPricePerKg: [0, [Validators.required, Validators.min(0.01)]],
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
            // Show most recently harvested produce first.
            const sorted = [...(list || [])].sort((a, b) =>
              new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime());
            this.listings.set(sorted);
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
      { label: 'Quantity (Kg)', value: item.quantityKg + ' Kg' },
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
      { label: 'Payment Status', value: this.getPaymentStatusLabel(sale.paymentStatus) }
    ]);
    this.showDetailModal.set(true);
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

  // ================= PRODUCE LISTINGS CRUD =================
  openListingModal(item?: any) {
    if (item) {
      this.isEditMode.set(true);
      this.selectedListing.set(item);
      this.listingForm.patchValue({
        ...item,
        harvestDate: item.harvestDate ? item.harvestDate.split('T')[0] : ''
      });
    } else {
      this.isEditMode.set(false);
      this.selectedListing.set(null);
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
    const body = this.listingForm.value;

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
    this.saleForm.reset({
      quantitySoldKg: item.quantityKg,
      agreedPricePerKg: item.askingPricePerKg,
      paymentStatus: ''
    });
    this.totalCalculatedAmount.set(item.quantityKg * item.askingPricePerKg);
    this.showBuyModal.set(true);
  }

  closeBuyModal() {
    this.showBuyModal.set(false);
  }

  calculateTotal() {
    const qty = this.saleForm.get('quantitySoldKg')?.value || 0;
    const price = this.saleForm.get('agreedPricePerKg')?.value || 0;
    this.totalCalculatedAmount.set(qty * price);
  }

  submitSaleForm() {
    if (this.saleForm.invalid) return;
    const session = this.authService.currentUserValue;
    const qty = this.saleForm.get('quantitySoldKg')?.value;
    const listing = this.selectedListing();

    if (qty > listing.quantityKg) {
      this.toast.error(`Quantity sold cannot exceed listed quantity (${listing.quantityKg} Kg)`);
      return;
    }

    const body = {
      ...this.saleForm.value,
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
