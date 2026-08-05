import { Component, OnInit, inject, signal } from '@angular/core';
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
              <div class="header-actions">
                @if (isAdmin() && listings().length > 0) {
                  <button class="btn btn-export" (click)="exportListings('excel')">
                    <i class="material-icons-round icon-xls">grid_on</i>
                    <span>Export XLS</span>
                  </button>
                  <button class="btn btn-export" (click)="exportListings('pdf')">
                    <i class="material-icons-round icon-pdf">picture_as_pdf</i>
                    <span>Export PDF</span>
                  </button>
                }
                @if (canManageListing()) {
                  <button class="btn btn-primary" (click)="openListingModal()">
                    <i class="material-icons-round">add_circle</i>
                    <span>Create Listing</span>
                  </button>
                }
              </div>
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
                        <th>Crop Type</th>
                        <th>Harvest Date</th>
                        <th>Available Quantity (Kg)</th>
                        <th>Quality Grade</th>
                        <th>Price/Kg (₹)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of paginatedListings(); track item.listingId) {
                        <tr>
                          <td>{{ getCropName(item.cropId) }}</td>
                          <td>{{ item.harvestDate | date:'mediumDate' }}</td>
                          <td>
                            {{ availableQty(item) }} Kg
                            @if (availableQty(item) !== item.quantityKg) {
                              <span class="text-secondary qty-listed">of {{ item.quantityKg }} listed</span>
                            }
                          </td>
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
            <div class="d-flex justify-content-between align-items-center">
              <h3>Recorded Sales Log</h3>
              @if (isAdmin() && sales().length > 0) {
                <div class="header-actions">
                  <button class="btn btn-export" (click)="exportSales('excel')">
                    <i class="material-icons-round icon-xls">grid_on</i>
                    <span>Export XLS</span>
                  </button>
                  <button class="btn btn-export" (click)="exportSales('pdf')">
                    <i class="material-icons-round icon-pdf">picture_as_pdf</i>
                    <span>Export PDF</span>
                  </button>
                </div>
              }
            </div>
            <p class="text-secondary mb-3">Audit transactions, recorded buyer details, and payment settlements.</p>

            @if (sales().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">payment</i>
                <h3>No Transactions Found</h3>
                <p>No purchases have been recorded yet.</p>
              </div>
            } @else {
              <div class="card filters-card mb-3">
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="saleSearch">Search</label>
                  <div class="search-field">
                    <input type="text" id="saleSearch" [(ngModel)]="saleSearch"
                      (ngModelChange)="onSaleSearchChange()"
                      placeholder="Search by sale ID, listing ID, crop, farmer, buyer, amount, date or status..." />
                    <i class="material-icons-round search-icon">search</i>
                  </div>
                  @if (isFarmer()) {
                    <small class="field-hint">
                      Tip: type <strong>awaiting</strong> to see only the payments still waiting on your confirmation.
                    </small>
                  }
                </div>
              </div>

              @if (filteredSales().length === 0) {
                <div class="empty-state card">
                  <i class="material-icons-round">search_off</i>
                  <h3>No Matching Transactions</h3>
                  <p>No sales match "{{ saleSearch }}".</p>
                </div>
              } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Quantity Sold</th>
                        <th>Agreed Price/Kg</th>
                        <th>Total Amount</th>
                        <th>Sale Date</th>
                        <th>Payment Status</th>
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
                              @if (isProcurementOrAdmin() && sale.paymentStatus !== 'PD') {
                                <button class="menu-item" (click)="confirmMarkPaid(sale)">
                                  <i class="material-icons-round">price_check</i> Mark Payment Paid
                                </button>
                              }
                              @if (canConfirmReceipt(sale)) {
                                <button class="menu-item" (click)="confirmPaymentReceived(sale)">
                                  <i class="material-icons-round">task_alt</i> I Received This Payment
                                </button>
                              }
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
                  [totalElements]="filteredSales().length"
                  (pageChange)="onSalePageChange($event)"
                  (pageSizeChange)="onSalePageSizeChange($event)">
                </app-pagination>
              </div>
              }
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
                    <label for="lQty">Total Quantity (Kg)</label>
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
                <p class="text-secondary">Available Stock: <strong>{{ availableQty(selectedListing()) }} Kg</strong>. Asking Price: <strong>{{ selectedListing()?.askingPricePerKg | currency:'INR':'symbol-narrow' }}/Kg</strong>.</p>

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="sQty">Available Quantity (Kg)</label>
                    <input
                      type="number"
                      id="sQty"
                      formControlName="quantitySoldKg"
                      [max]="availableQty(selectedListing())"
                      (input)="calculateTotal()" />
                    <small class="field-hint">Up to {{ availableQty(selectedListing()) }} Kg still available on this listing.</small>
                    @if (saleForm.get('quantitySoldKg')?.touched && saleForm.get('quantitySoldKg')?.invalid) {
                      <small class="field-error">Enter between 0.1 and {{ availableQty(selectedListing()) }} Kg.</small>
                    }
                  </div>
                  <div class="form-group">
                    <label for="sPricePct">Agreed Price (% of Asking Price)</label>
                    <input
                      type="number"
                      step="0.5"
                      id="sPricePct"
                      formControlName="offerPercent"
                      [min]="minOfferPercent"
                      (input)="calculateTotal()" />
                    <small class="field-hint">
                      Minimum {{ minOfferPercent }}% of the asking price
                      ({{ minAgreedPrice() | currency:'INR':'symbol-narrow' }}/Kg).
                    </small>
                    @if (saleForm.get('offerPercent')?.touched && saleForm.get('offerPercent')?.invalid) {
                      <small class="field-error">Offer cannot go below {{ minOfferPercent }}% of the asking price.</small>
                    }
                  </div>
                </div>

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label>Agreed Price (₹/Kg)</label>
                    <div class="derived-value">{{ agreedPricePerKg() | currency:'INR':'symbol-narrow' }}</div>
                  </div>
                  <div class="form-group">
                    <label>Total Transaction Value (₹)</label>
                    <div class="derived-value derived-total">
                      {{ totalCalculatedAmount() | currency:'INR':'symbol-narrow' }}
                    </div>
                  </div>
                </div>

                <div class="form-group mt-3">
                  <label for="sStatus">Payment Settlement Status</label>
                  <select id="sStatus" formControlName="paymentStatus">
                    <option value="" disabled>Select Payment Status</option>
                    <option value="PE">PE (Pending)</option>
                    <option value="PD">PD (Paid)</option>
                  </select>
                  <small class="field-hint">Marking a payment Paid asks the farmer to confirm they received it.</small>
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

      @if (showMarkPaidConfirm()) {
        <app-confirmation-modal
          title="Mark Payment as Paid"
          message="Mark this settlement as Paid? The selling farmer will be asked to confirm they received the money."
          (confirm)="executeMarkPaid()"
          (cancel)="showMarkPaidConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showReceiptConfirm()) {
        <app-confirmation-modal
          title="Confirm Payment Received"
          message="Confirm that you have received this payment in full? This is recorded as your own acknowledgement of the settlement."
          (confirm)="executeConfirmReceipt()"
          (cancel)="showReceiptConfirm.set(false)">
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
    .qty-listed {
      display: block;
      font-size: 0.75rem;
    }
    .field-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .field-error {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--danger-color, #c62828);
    }
    .derived-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .derived-total {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary-hover);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    /* Export buttons: light card style with colored file-type icons */
    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface, #ffffff);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .btn-export:hover {
      background: var(--bg-dark);
      border-color: var(--primary-color);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    .btn-export .material-icons-round { font-size: 20px; }
    .icon-xls { color: #16a34a; }
    .icon-pdf { color: #ef4444; }
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

  // Exporting the marketplace and sales ledger is an AgriLinkAdmin-only capability.
  isAdmin(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin']);
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

  paginatedListings(): any[] { return this.page(this.listings(), this.listingPage, this.listingPageSize); }
  onListingPageChange(p: number) { this.listingPage = p; }
  onListingPageSizeChange(s: number) { this.listingPageSize = s; this.listingPage = 0; }

  paginatedSales(): any[] { return this.page(this.filteredSales(), this.salePage, this.salePageSize); }
  onSalePageChange(p: number) { this.salePage = p; }
  onSalePageSizeChange(s: number) { this.salePageSize = s; this.salePage = 0; }

  // ================= SALES SEARCH =================
  saleSearch = '';
  // Reset to the first page whenever the query changes, so the matches are visible
  // instead of stranded on a page number that no longer exists.
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

  /** Human-readable state of the farmer's secondary payment check. */
  getFarmerConfirmationLabel(sale: any): string {
    if (sale?.paymentStatus !== 'PD') return 'Not applicable (payment not settled)';
    return this.isFarmerConfirmed(sale) ? 'Yes' : 'No (awaiting farmer confirmation)';
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

  // ================= EXPORTS (AgriLinkAdmin) =================
  // Exports cover the whole record set, not just the page currently on screen.
  exportListings(format: 'excel' | 'pdf') {
    if (!this.isAdmin()) return;
    const items = this.listings();
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
    this.doExport(format, columns, rows, 'produce-listings', 'Available Marketplace Produce');
  }

  exportSales(format: 'excel' | 'pdf') {
    if (!this.isAdmin()) return;
    // Export what the search box is currently showing, matching the crops module.
    const items = this.filteredSales();
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
    this.doExport(format, columns, rows, 'produce-sales', 'Produce Sales & Transactions Log');
  }

  private doExport(format: 'excel' | 'pdf', columns: string[], rows: (string | number)[][], fileName: string, title: string) {
    if (format === 'excel') {
      this.exportService.exportToExcel(columns, rows, fileName, title);
      this.toast.success(`Exported ${rows.length} record(s) to Excel.`);
    } else {
      const opened = this.exportService.exportToPdf(columns, rows, fileName, title);
      if (opened) {
        this.toast.success('Opened PDF print view. Choose "Save as PDF" to download.');
      } else {
        this.toast.error('Please allow pop-ups to export as PDF.');
      }
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
