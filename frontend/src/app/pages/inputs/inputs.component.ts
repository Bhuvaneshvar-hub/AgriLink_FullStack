import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputService } from '../../services/input.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

@Component({
  selector: 'app-inputs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="inputs-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Input Operations & Supplies</h1>
          <p class="text-secondary">Distribute seeds, fertilizers, and logistics equipment. Catalog stocks and review request items.</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'catalog'" (click)="setTab('catalog')">
          <i class="material-icons-round">fact_check</i>
          <span>Inputs Catalog</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'requests'" (click)="setTab('requests')">
          <i class="material-icons-round">shopping_bag</i>
          <span>Farmer Requests</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading input resources...</p>
        </div>
      } @else {
        <!-- TABS CONTENT -->

        <!-- 1. INPUT CATALOG TAB -->
        @if (activeTab() === 'catalog') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Available Supplies & Stocks</h3>
              @if (isAdminOrOfficer()) {
                <button class="btn btn-primary" (click)="openCatalogModal()">
                  <i class="material-icons-round">add_circle</i>
                  <span>Add </span>
                </button>
              }
            </div>

            @if (catalogs().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">category</i>
                <h3>No Supplies Listed</h3>
                <p>Register seeds or fertilizers in the catalog first.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Supply ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Unit</th>
                        <th>Standard Price</th>
                        <th>Subsidised Price</th>
                        <th>Available Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of catalogs(); track item.inputId) {
                        <tr>
                          <td>{{ item.inputId }}</td>
                          <td><strong>{{ item.name }}</strong></td>
                          <td>{{ item.category }}</td>
                          <td>{{ item.unit }}</td>
                          <td>{{ item.pricePerUnit | currency:'INR':'symbol-narrow' }}</td>
                          <td><strong class="text-success">{{ item.subsidisedPrice | currency:'INR':'symbol-narrow' }}</strong></td>
                          <td>{{ item.availableStock }} {{ item.unit }}s</td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewCatalogDetails(item)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isFarmer() && item.status === 'AC' && item.availableStock > 0) {
                                <button class="menu-item" (click)="openRequestModal(item)">
                                  <i class="material-icons-round">add_shopping_cart</i> Request
                                </button>
                              }
                              @if (isAdminOrOfficer()) {
                                <button class="menu-item" (click)="openCatalogModal(item)">
                                  <i class="material-icons-round">edit</i> Edit
                                </button>
                                <button class="menu-item danger" (click)="confirmDeleteCatalog(item)">
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
              </div>
            }
          </div>
        }

        <!-- 2. FARMER REQUESTS TAB -->
        @if (activeTab() === 'requests') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Requested Supply Allocations</h3>
            </div>

            @if (requests().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">local_shipping</i>
                <h3>No Input Requests Found</h3>
                <p>No agricultural input requests recorded yet.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Input Item</th>
                        <th>Qty Requested</th>
                        <th>Total Price</th>
                        <th>Request Date</th>
                        <th>Assigned Centre</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (req of requests(); track req.requestId) {
                        <tr>
                          <td>{{ getFarmerName(req.farmerId) }}</td>
                          <td>{{ getInputName(req.inputId) }}</td>
                          <td>{{ req.quantityRequested }}</td>
                          <td><strong>{{ req.actualPrice | currency:'INR':'symbol-narrow' }}</strong></td>
                          <td>{{ req.requestDate | date:'mediumDate' }}</td>
                          <td>Centre #{{ req.assignedCentreId }}</td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-warning': req.status === 'PE',
                              'badge-info': req.status === 'AP',
                              'badge-success': req.status === 'DL',
                              'badge-danger': req.status === 'RE'
                            }">
                              {{ getRequestStatusLabel(req.status) }}
                            </span>
                          </td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewRequestDetails(req)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isAdminOrOfficer()) {
                                @if (req.status === 'PE') {
                                  <button class="menu-item" (click)="updateStatus(req, 'AP')">
                                    <i class="material-icons-round">check_circle</i> Approve
                                  </button>
                                  <button class="menu-item danger" (click)="updateStatus(req, 'RE')">
                                    <i class="material-icons-round">cancel</i> Reject
                                  </button>
                                } @else if (req.status === 'AP') {
                                  <button class="menu-item" (click)="updateStatus(req, 'DL')">
                                    <i class="material-icons-round">local_shipping</i> Mark Delivered
                                  </button>
                                }
                              }
                              @if (isFarmer() && req.status === 'PE') {
                                <button class="menu-item danger" (click)="confirmDeleteRequest(req)">
                                  <i class="material-icons-round">delete</i> Cancel Request
                                </button>
                              }
                            </app-action-menu>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- MODALS SECTION -->

      <!-- 1. Catalog Create/Edit Modal -->
      @if (showCatalogModal()) {
        <div class="modal-overlay" (click)="closeCatalogModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Supply Catalog Details' : 'Add Supply Item to Catalog' }}</h3>
              <button class="close-btn" (click)="closeCatalogModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="catalogForm" (ngSubmit)="submitCatalogForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="catName">Supply Item Name</label>
                  <input type="text" id="catName" formControlName="name" placeholder="e.g. Organic Urea Fertilizer" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="catCategory">Category</label>
                    <input type="text" id="catCategory" formControlName="category" placeholder="e.g. Seed, Fertilizer, Tool" />
                  </div>
                  <div class="form-group">
                    <label for="catUnit">Distribution Unit</label>
                    <input type="text" id="catUnit" formControlName="unit" placeholder="e.g. Kg, Packet, Piece" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="catPrice">Standard Price Per Unit (₹)</label>
                    <input type="number" step="0.01" id="catPrice" formControlName="pricePerUnit" />
                  </div>
                  <div class="form-group">
                    <label for="catSub">Subsidised Price (₹)</label>
                    <input type="number" step="0.01" id="catSub" formControlName="subsidisedPrice" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="catStock">Initial Available Stock</label>
                    <input type="number" id="catStock" formControlName="availableStock" />
                  </div>
                  <div class="form-group">
                    <label for="catStatus">Status</label>
                    <select id="catStatus" formControlName="status">
                      <option value="" disabled>Select Status</option>
                      <option value="AC">Active</option>
                      <option value="IN">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="catalogForm.invalid">Save</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 2. Request Input Modal -->
      @if (showRequestModal()) {
        <div class="modal-overlay" (click)="closeRequestModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Supply Request</h3>
              <button class="close-btn" (click)="closeRequestModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="requestForm" (ngSubmit)="submitRequestForm()">
              <div class="modal-body">
                <p>Requesting supply item: <strong>{{ selectedCatalogItem()?.name }}</strong>.</p>
                <p class="text-secondary">Subsidised Price: <strong>{{ selectedCatalogItem()?.subsidisedPrice | currency:'INR':'symbol-narrow' }}</strong> per {{ selectedCatalogItem()?.unit }}. Available Stock: {{ selectedCatalogItem()?.availableStock }} {{ selectedCatalogItem()?.unit }}s.</p>
                
                <div class="form-group mt-3">
                  <label for="reqFarmer">Assign to Profile</label>
                  <select id="reqFarmer" formControlName="farmerId">
                    <option value="">Select Profile</option>
                    @for (prof of farmerProfiles(); track prof.farmerId) {
                      <option [value]="prof.farmerId">{{ prof.name }}(#{{ prof.farmerId }})</option>
                    }
                  </select>
                </div>

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="reqQty">Quantity Requested ({{ selectedCatalogItem()?.unit }}s)</label>
                    <input type="number" id="reqQty" formControlName="quantityRequested" (input)="calculateTotalPrice()" />
                  </div>
                  <div class="form-group">
                    <label for="reqCentre">Assigned Supply Center ID</label>
                    <input type="number" id="reqCentre" formControlName="assignedCentreId" placeholder="e.g. 101" />
                  </div>
                </div>

                <div class="form-group mt-3">
                  <label>Total Calculated Price (₹)</label>
                  <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-hover);">
                    {{ calculatedTotalPrice() | currency:'INR':'symbol-narrow' }}
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="requestForm.invalid">Place Request</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Confirmation Modals -->
      @if (showDeleteCatalogConfirm()) {
        <app-confirmation-modal
          title="Delete Catalog Item"
          [message]="'Are you sure you want to delete ' + selectedCatalogItem()?.name + ' from the catalog?'"
          (confirm)="executeDeleteCatalog()"
          (cancel)="showDeleteCatalogConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showDeleteRequestConfirm()) {
        <app-confirmation-modal
          title="Cancel Supply Request"
          message="Are you sure you want to cancel this input supply request?"
          (confirm)="executeDeleteRequest()"
          (cancel)="showDeleteRequestConfirm.set(false)">
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
    .inputs-page {
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
      margin-right: 0.25rem;
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
export class InputsComponent implements OnInit {
  private inputService = inject(InputService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
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

  // Calculated Values
  calculatedTotalPrice = signal<number>(0);

  // Modals Displays
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

  isAdminOrOfficer(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer']);
  }

  setTab(tab: 'catalog' | 'requests') {
    this.activeTab.set(tab);
  }

  private initForms() {
    this.catalogForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      unit: ['', Validators.required],
      pricePerUnit: [1.0, [Validators.required, Validators.min(0.01)]],
      subsidisedPrice: [0.5, [Validators.required, Validators.min(0.01)]],
      availableStock: [100, [Validators.required, Validators.min(0)]],
      status: ['', Validators.required]
    });

    this.requestForm = this.fb.group({
      farmerId: ['', Validators.required],
      quantityRequested: [1, [Validators.required, Validators.min(1)]],
      assignedCentreId: [101, [Validators.required, Validators.min(1)]]
    });
  }

  private loadAllData() {
    this.isLoading.set(true);
    // Load catalogs
    this.inputService.getAllInputCatalogs().subscribe({
      next: (cats) => {
        this.catalogs.set(cats);

        // Load farmer profiles
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (profiles) => {
            this.farmerProfiles.set(profiles);
          }
        });

        // Load requests
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
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof && prof.name ? `${prof.name}(#${farmerId})` : `Farmer #${farmerId}`;
  }

  viewRequestDetails(req: any) {
    this.detailTitle.set(`Input Request #${req.requestId}`);
    this.detailRows.set([
      { label: 'Req ID', value: req.requestId },
      { label: 'Farmer', value: this.getFarmerName(req.farmerId) },
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
        status: '',
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
    const body = this.catalogForm.value;

    if (this.isEditMode()) {
      const id = this.selectedCatalogItem().inputId;
      this.inputService.updateInputCatalog(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Supply catalog updated');
          this.closeCatalogModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating catalog item')
      });
    } else {
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
    this.selectedCatalogItem.set(item);
    this.requestForm.reset({
      quantityRequested: 1,
      assignedCentreId: 101,
      farmerId: this.farmerProfiles().length > 0 ? this.farmerProfiles()[0].farmerId : ''
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

  updateStatus(req: any, status: 'AP' | 'RE' | 'DL') {
    const body = {
      ...req,
      status: status
    };
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
