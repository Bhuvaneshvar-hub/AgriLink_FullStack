import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmerService } from '../../services/farmer.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { notFutureDate, NAME_PATTERN, GMAIL_PATTERN } from '../../utils/validators';
import { INDIAN_STATES } from '../../utils/indian-states';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="farmers-page">
      <div class="page-header mb-3">
        <h1>Farmer &amp; Land Registration</h1>
        <p class="text-secondary">Register and manage farmer identity profiles and their associated land holdings.</p>
      </div>

      <!-- Tabs -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'profiles'" (click)="setTab('profiles')">
          <i class="material-icons-round">badge</i>
          <span>Farmer Profiles</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'holdings'" (click)="setTab('holdings')">
          <i class="material-icons-round">terrain</i>
          <span>Land Holdings</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading registration records...</p>
        </div>
      } @else {

        <!-- ============ FARMER PROFILES TAB ============ -->
        @if (activeTab() === 'profiles') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Registered Farmers</h3>
              <button class="btn btn-primary" (click)="openProfileModal()">
                <i class="material-icons-round">person_add</i>
                <span>Register </span>
              </button>
            </div>

            <div class="card filters-card">
              <div class="form-row">
                <div class="form-group">
                  <label for="pSearch">Search</label>
                  <div class="search-field">
                    <input type="text" id="pSearch" [(ngModel)]="profileSearch"
                      (ngModelChange)="applyProfileFilters()"
                      placeholder="Name, village, district, national ID or phone..." />
                    <i class="material-icons-round search-icon">search</i>
                  </div>
                </div>
              </div>
            </div>

            @if (filteredProfiles().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">person_off</i>
                <h3>No Farmers Registered</h3>
                <p>Use "Register Farmer" to add the first farmer profile.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>National ID</th>
                        <th>Village</th>
                        <th>District</th>
                        <th>Phone</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (prof of paginatedProfiles(); track prof.farmerId) {
                        <tr>
                          <td><strong>{{ prof.name }}</strong></td>
                          <td>{{ prof.gender }}</td>
                          <td>{{ prof.dateOfBirth | date:'mediumDate' }}</td>
                          <td>{{ prof.nationalIdNumber }}</td>
                          <td>{{ prof.village }}</td>
                          <td>{{ prof.district }}, {{ prof.state }}</td>
                          <td>{{ prof.phone }}</td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewProfileDetails(prof)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              <button class="menu-item" (click)="openProfileModal(prof)">
                                <i class="material-icons-round">edit</i> Edit
                              </button>
                              <button class="menu-item danger" (click)="confirmDeleteProfile(prof)">
                                <i class="material-icons-round">delete</i> Delete
                              </button>
                            </app-action-menu>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <app-pagination
                  [currentPage]="profilePage"
                  [pageSize]="profilePageSize"
                  [totalElements]="filteredProfiles().length"
                  (pageChange)="onProfilePageChange($event)"
                  (pageSizeChange)="onProfilePageSizeChange($event)">
                </app-pagination>
              </div>
            }
          </div>
        }

        <!-- ============ LAND HOLDINGS TAB ============ -->
        @if (activeTab() === 'holdings') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Registered Land Holdings</h3>
              <button class="btn btn-primary" (click)="openHoldingModal()">
                <i class="material-icons-round">add_location_alt</i>
                <span>Register </span>
              </button>
            </div>

            <div class="card filters-card">
              <div class="form-row">
                <div class="form-group">
                  <label for="hSearch">Search</label>
                  <div class="search-field">
                    <input type="text" id="hSearch" [(ngModel)]="holdingSearch"
                      (ngModelChange)="applyHoldingFilters()"
                      placeholder="Survey number, soil type or ownership..." />
                    <i class="material-icons-round search-icon">search</i>
                  </div>
                </div>
              </div>
            </div>

            @if (filteredHoldings().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">landscape</i>
                <h3>No Land Holdings Registered</h3>
                <p>Use "Register Land Holding" to link land to a farmer profile.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Survey Number</th>
                        <th>Area (in Acres)</th>
                        <th>Soil Type</th>
                        <th>Irrigation</th>
                        <th>Ownership</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (land of paginatedHoldings(); track land.holdingId) {
                        <tr>
                          <td>{{ getFarmerNameOnly(land.farmerId) }}</td>
                          <td>{{ land.surveyNumber }}</td>
                          <td>{{ land.areaAcres }}</td>
                          <td>{{ land.soilType }}</td>
                          <td>{{ land.irrigationSource }}</td>
                          <td>{{ land.ownershipType }}</td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-success': land.status === 'AC',
                              'badge-warning': land.status === 'PE',
                              'badge-danger': land.status === 'DP',
                              'badge-secondary': land.status === 'IN'
                            }">{{ getHoldingStatusLabel(land.status) }}</span>
                          </td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewHoldingDetails(land)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (land.status === 'PE') {
                                <button class="menu-item" (click)="approveHolding(land)">
                                  <i class="material-icons-round">check_circle</i> Approve
                                </button>
                                <button class="menu-item danger" (click)="rejectHolding(land)">
                                  <i class="material-icons-round">cancel</i> Reject (Dispute)
                                </button>
                              }
                              <button class="menu-item" (click)="openHoldingModal(land)">
                                <i class="material-icons-round">edit</i> Edit
                              </button>
                              <button class="menu-item danger" (click)="confirmDeleteHolding(land)">
                                <i class="material-icons-round">delete</i> Delete
                              </button>
                            </app-action-menu>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <app-pagination
                  [currentPage]="holdingPage"
                  [pageSize]="holdingPageSize"
                  [totalElements]="filteredHoldings().length"
                  (pageChange)="onHoldingPageChange($event)"
                  (pageSizeChange)="onHoldingPageSizeChange($event)">
                </app-pagination>
              </div>
            }
          </div>
        }
      }

      <!-- ============ FARMER PROFILE MODAL ============ -->
      @if (showProfileModal()) {
        <div class="modal-overlay" (click)="closeProfileModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Farmer Identity Details' : 'Register Farmer Identity Profile' }}</h3>
              <button class="close-btn" (click)="closeProfileModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="submitProfileForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="fName">Full Name</label>
                  <input type="text" id="fName" formControlName="name" />
                  @if (pInvalid('name')) {
                    <span class="field-error">
                      {{ profileForm.get('name')?.errors?.['pattern'] ? 'Name must be letters only (2–50 characters)' : 'Full name is required' }}
                    </span>
                  }
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fDob">Date of Birth</label>
                    <input type="date" id="fDob" formControlName="dateOfBirth" />
                    @if (pInvalid('dateOfBirth')) {
                      <span class="field-error">
                        {{ profileForm.get('dateOfBirth')?.errors?.['futureDate'] ? 'Date of birth cannot be in the future' : 'Date of birth is required' }}
                      </span>
                    }
                  </div>
                  <div class="form-group">
                    <label for="fGender">Gender</label>
                    <select id="fGender" formControlName="gender">
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fNationalId">National ID / Aadhar Number</label>
                    <input type="text" id="fNationalId" formControlName="nationalIdNumber" placeholder="Unique ID string" />
                    @if (pInvalid('nationalIdNumber')) { <span class="field-error">Enter a valid ID (6–20 letters/digits)</span> }
                  </div>
                  <div class="form-group">
                    <label for="fPhone">Phone Number</label>
                    <input type="text" id="fPhone" formControlName="phone" placeholder="10 digits" />
                    @if (pInvalid('phone')) { <span class="field-error">Phone must be exactly 10 digits</span> }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fVillage">Village</label>
                    <input type="text" id="fVillage" formControlName="village" />
                    @if (pInvalid('village')) { <span class="field-error">Village is required</span> }
                  </div>
                  <div class="form-group">
                    <label for="fDistrict">District</label>
                    <input type="text" id="fDistrict" formControlName="district" />
                    @if (pInvalid('district')) { <span class="field-error">District is required</span> }
                  </div>
                  <div class="form-group">
                    <label for="fState">State</label>
                    <select id="fState" formControlName="state">
                      <option value="">Select State</option>
                      @for (st of indianStates; track st) {
                        <option [value]="st">{{ st }}</option>
                      }
                    </select>
                    @if (pInvalid('state')) { <span class="field-error">State is required</span> }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fBank">Bank Account Number</label>
                    <input type="text" id="fBank" formControlName="bankAccountNumber" placeholder="6–20 digits" />
                    @if (pInvalid('bankAccountNumber')) { <span class="field-error">Enter a valid account number (6–20 digits)</span> }
                  </div>
                  <div class="form-group">
                    <label for="fStatus">Status</label>
                    <select id="fStatus" formControlName="status">
                      <option value="" disabled>Select Status</option>
                      <option value="AC">Active (AC)</option>
                      <option value="IN">Inactive (IN)</option>
                    </select>
                  </div>
                </div>

                @if (!isEditMode()) {
                  <div class="form-row">
                    <div class="form-group">
                      <label for="fEmail">Login Email</label>
                      <input type="email" id="fEmail" formControlName="email" placeholder="farmer@gmail.com" />
                      @if (pInvalid('email')) { <span class="field-error">Enter a valid Gmail address (must end with &#64;gmail.com)</span> }
                      @else { <small class="text-secondary">A login account is created for the farmer with this email.</small> }
                    </div>
                    <div class="form-group">
                      <label for="fPassword">Login Password</label>
                      <input type="password" id="fPassword" formControlName="password" placeholder="Min 8 characters" />
                      @if (pInvalid('password')) { <span class="field-error">Password must be at least 8 characters</span> }
                    </div>
                    <div class="form-group">
                      <label for="fRegionId">Region ID</label>
                      <input type="number" id="fRegionId" formControlName="regionId" min="1" placeholder="e.g. 1" />
                    </div>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ============ LAND HOLDING MODAL ============ -->
      @if (showHoldingModal()) {
        <div class="modal-overlay" (click)="closeHoldingModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Land Details' : 'Register Land Holding' }}</h3>
              <button class="close-btn" (click)="closeHoldingModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="holdingForm" (ngSubmit)="submitHoldingForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="lFarmer">Assign to Farmer Profile</label>
                  <select id="lFarmer" formControlName="farmerId">
                    <option value="">Select Profile</option>
                    @for (prof of farmerProfiles(); track prof.farmerId) {
                      <option [value]="prof.farmerId">{{ prof.name }} (#{{ prof.farmerId }})</option>
                    }
                  </select>
                  @if (hInvalid('farmerId')) { <span class="field-error">Select a farmer profile</span> }
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lSurvey">Survey Number (Unique)</label>
                    <input type="text" id="lSurvey" formControlName="surveyNumber" placeholder="e.g. SVY-4012" />
                    @if (hInvalid('surveyNumber')) { <span class="field-error">Survey number is required</span> }
                  </div>
                  <div class="form-group">
                    <label for="lArea">Area (in Acres)</label>
                    <input type="number" step="0.01" id="lArea" formControlName="areaAcres" />
                    @if (hInvalid('areaAcres')) { <span class="field-error">Enter a valid area (&gt; 0)</span> }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lSoil">Soil Type</label>
                    <select id="lSoil" formControlName="soilType">
                      <option value="">Select</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loam">Loam</option>
                      <option value="Black">Black</option>
                    </select>
                    @if (hInvalid('soilType')) { <span class="field-error">Soil type is required</span> }
                  </div>
                  <div class="form-group">
                    <label for="lIrrigation">Irrigation Source</label>
                    <select id="lIrrigation" formControlName="irrigationSource">
                      <option value="">Select</option>
                      <option value="Rain">Rain</option>
                      <option value="Canal">Canal</option>
                      <option value="Borewell">Borewell</option>
                      <option value="None">None</option>
                    </select>
                    @if (hInvalid('irrigationSource')) { <span class="field-error">Irrigation source is required</span> }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lOwnership">Ownership Type</label>
                    <select id="lOwnership" formControlName="ownershipType">
                      <option value="">Select</option>
                      <option value="Owned">Owned</option>
                      <option value="Leased">Leased</option>
                      <option value="SharedCropping">Shared Cropping</option>
                    </select>
                    @if (hInvalid('ownershipType')) { <span class="field-error">Ownership type is required</span> }
                  </div>
                  <div class="form-group">
                    <label for="lStatus">Status</label>
                    <select id="lStatus" formControlName="status">
                      <option value="" disabled>Select Status</option>
                      <option value="AC">Active (AC)</option>
                      <option value="IN">Inactive (IN)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ============ DELETE CONFIRMATIONS ============ -->
      @if (showDeleteProfileConfirm()) {
        <app-confirmation-modal
          title="Delete Farmer Profile"
          [message]="'Are you sure you want to delete farmer ' + selectedItem()?.name + ' (#' + selectedItem()?.farmerId + ')?'"
          (confirm)="executeDeleteProfile()"
          (cancel)="showDeleteProfileConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showDeleteHoldingConfirm()) {
        <app-confirmation-modal
          title="Delete Land Holding"
          [message]="'Are you sure you want to delete land holding ' + selectedItem()?.surveyNumber + '?'"
          (confirm)="executeDeleteHolding()"
          (cancel)="showDeleteHoldingConfirm.set(false)">
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
    .field-error {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: var(--danger);
    }
    .farmers-page {
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
    .tab-btn i { font-size: 20px; }
    .tab-btn:hover { color: var(--primary-hover); }
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .tab-content { animation: fadeIn var(--transition-normal); }
    .spinner-large {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s infinite linear;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FarmersComponent implements OnInit {
  private farmerService = inject(FarmerService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  activeTab = signal<'profiles' | 'holdings'>('profiles');
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  submittedProfile = signal<boolean>(false);
  submittedHolding = signal<boolean>(false);
  readonly indianStates = INDIAN_STATES;

  // Data
  farmerProfiles = signal<any[]>([]);
  landHoldings = signal<any[]>([]);
  filteredProfiles = signal<any[]>([]);
  filteredHoldings = signal<any[]>([]);

  // Selected entity for edit/delete
  selectedItem = signal<any | null>(null);

  // Modal states
  showProfileModal = signal<boolean>(false);
  showHoldingModal = signal<boolean>(false);
  showDeleteProfileConfirm = signal<boolean>(false);
  showDeleteHoldingConfirm = signal<boolean>(false);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Search + pagination
  profileSearch = '';
  holdingSearch = '';
  profilePage = 0;
  profilePageSize = 10;
  holdingPage = 0;
  holdingPageSize = 10;

  // Forms
  profileForm!: FormGroup;
  holdingForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadAllData();
  }

  private initForms() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['', Validators.required],
      nationalIdNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{6,20}$/)]],
      village: ['', Validators.required],
      district: ['', Validators.required],
      state: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      bankAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]],
      userId: [null],
      // Login-account fields — only used when registering a NEW farmer; a login
      // account (IAM user) is created and linked to this profile via userId.
      email: [''],
      password: [''],
      regionId: [1],
      status: ['', Validators.required]
    });

    this.holdingForm = this.fb.group({
      farmerId: ['', Validators.required],
      surveyNumber: ['', Validators.required],
      areaAcres: [1.0, [Validators.required, Validators.min(0.01)]],
      soilType: ['', Validators.required],
      irrigationSource: ['', Validators.required],
      ownershipType: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  private loadAllData() {
    this.isLoading.set(true);
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (profiles) => {
        this.farmerProfiles.set(profiles || []);
        this.applyProfileFilters();

        this.farmerService.getAllLandHoldings().subscribe({
          next: (holdings) => {
            this.landHoldings.set(holdings || []);
            this.applyHoldingFilters();
            this.isLoading.set(false);
          },
          error: () => {
            this.toast.error('Failed to load land holdings.');
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.toast.error('Failed to load farmer registration records.');
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'profiles' | 'holdings') {
    this.activeTab.set(tab);
  }

  // Helpers
  getFarmerName(farmerId: number): string {
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof ? `${prof.name} (#${farmerId})` : `Farmer #${farmerId}`;
  }

  // Name without the id, for table cells where ids are hidden.
  getFarmerNameOnly(farmerId: number): string {
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof ? prof.name : `Farmer #${farmerId}`;
  }

  getStatusLabel(status: string): string {
    return status === 'AC' ? 'Active' : status === 'IN' ? 'Inactive' : status;
  }

  getHoldingStatusLabel(status: string): string {
    switch (status) {
      case 'AC': return 'Active';
      case 'PE': return 'Pending';
      case 'DP': return 'Disputed';
      case 'IN': return 'Inactive';
      default: return status;
    }
  }

  approveHolding(land: any) {
    this.farmerService.approveLandHolding(land.holdingId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Land holding approved'); this.loadAllData(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to approve')
    });
  }

  rejectHolding(land: any) {
    this.farmerService.rejectLandHolding(land.holdingId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Land holding marked disputed'); this.loadAllData(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to reject')
    });
  }

  private fmtDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  viewProfileDetails(prof: any) {
    this.detailTitle.set(`Farmer Profile #${prof.farmerId}`);
    this.detailRows.set([
      { label: 'Farmer ID', value: '#' + prof.farmerId },
      { label: 'Name', value: prof.name },
      { label: 'Gender', value: prof.gender },
      { label: 'Date of Birth', value: this.fmtDate(prof.dateOfBirth) },
      { label: 'National ID', value: prof.nationalIdNumber },
      { label: 'Village', value: prof.village },
      { label: 'District', value: prof.district + ', ' + prof.state },
      { label: 'Phone', value: prof.phone },
      { label: 'Status', value: this.getStatusLabel(prof.status) }
    ]);
    this.showDetailModal.set(true);
  }

  viewHoldingDetails(land: any) {
    this.detailTitle.set(`Land Holding #${land.holdingId}`);
    this.detailRows.set([
      { label: 'Holding ID', value: '#' + land.holdingId },
      { label: 'Farmer', value: this.getFarmerName(land.farmerId) },
      { label: 'Survey Number', value: land.surveyNumber },
      { label: 'Area (in Acres)', value: land.areaAcres },
      { label: 'Soil Type', value: land.soilType },
      { label: 'Irrigation', value: land.irrigationSource },
      { label: 'Ownership', value: land.ownershipType },
      { label: 'Status', value: this.getStatusLabel(land.status) }
    ]);
    this.showDetailModal.set(true);
  }

  // ===== Filtering & pagination =====
  applyProfileFilters() {
    const q = this.profileSearch.trim().toLowerCase();
    let list = this.farmerProfiles();
    if (q) {
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.village || '').toLowerCase().includes(q) ||
        (p.district || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q) ||
        (p.nationalIdNumber || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q)
      );
    }
    // Newest registered first (higher auto-increment id = added more recently).
    list = [...list].sort((a, b) => (b.farmerId || 0) - (a.farmerId || 0));
    this.filteredProfiles.set(list);
    this.profilePage = 0;
  }

  paginatedProfiles(): any[] {
    const start = this.profilePage * this.profilePageSize;
    return this.filteredProfiles().slice(start, start + this.profilePageSize);
  }

  onProfilePageChange(page: number) { this.profilePage = page; }
  onProfilePageSizeChange(size: number) { this.profilePageSize = size; this.profilePage = 0; }

  applyHoldingFilters() {
    const q = this.holdingSearch.trim().toLowerCase();
    let list = this.landHoldings();
    if (q) {
      list = list.filter(h =>
        (h.surveyNumber || '').toLowerCase().includes(q) ||
        (h.soilType || '').toLowerCase().includes(q) ||
        (h.irrigationSource || '').toLowerCase().includes(q) ||
        (h.ownershipType || '').toLowerCase().includes(q)
      );
    }
    // Newest registered first (higher auto-increment id = added more recently).
    list = [...list].sort((a, b) => (b.holdingId || 0) - (a.holdingId || 0));
    this.filteredHoldings.set(list);
    this.holdingPage = 0;
  }

  paginatedHoldings(): any[] {
    const start = this.holdingPage * this.holdingPageSize;
    return this.filteredHoldings().slice(start, start + this.holdingPageSize);
  }

  onHoldingPageChange(page: number) { this.holdingPage = page; }
  onHoldingPageSizeChange(size: number) { this.holdingPageSize = size; this.holdingPage = 0; }

  // ===== Farmer Profile CRUD =====
  openProfileModal(profile?: any) {
    this.submittedProfile.set(false);
    const emailCtrl = this.profileForm.get('email');
    const pwdCtrl = this.profileForm.get('password');
    if (profile) {
      this.isEditMode.set(true);
      this.selectedItem.set(profile);
      // Editing an existing profile does not touch the login account.
      emailCtrl?.clearValidators();
      pwdCtrl?.clearValidators();
      this.profileForm.patchValue({
        ...profile,
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).split('T')[0] : ''
      });
    } else {
      this.isEditMode.set(false);
      this.selectedItem.set(null);
      this.profileForm.reset({ gender: '', status: '', userId: null });
      // Registering a new farmer requires login credentials to create their IAM user.
      emailCtrl?.setValidators([Validators.required, Validators.pattern(GMAIL_PATTERN)]);
      pwdCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    emailCtrl?.updateValueAndValidity();
    pwdCtrl?.updateValueAndValidity();
    this.showProfileModal.set(true);
  }

  closeProfileModal() { this.showProfileModal.set(false); this.submittedProfile.set(false); }

  // Shows a field's error once the user has interacted with it or tried to submit.
  pInvalid(field: string): boolean {
    const c = this.profileForm.get(field);
    return !!(c && c.invalid && (c.touched || this.submittedProfile()));
  }

  hInvalid(field: string): boolean {
    const c = this.holdingForm.get(field);
    return !!(c && c.invalid && (c.touched || this.submittedHolding()));
  }

  submitProfileForm() {
    this.submittedProfile.set(true);
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;
    const v: any = { ...this.profileForm.value };

    // The farmer profile itself never carries login credentials — those live on
    // the IAM user. Build a clean profile payload without email/password.
    const profilePayload: any = {
      name: v.name,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      nationalIdNumber: v.nationalIdNumber,
      village: v.village,
      district: v.district,
      state: v.state,
      phone: v.phone,
      bankAccountNumber: v.bankAccountNumber,
      status: v.status
    };

    if (this.isEditMode()) {
      const id = this.selectedItem().farmerId;
      // Preserve the existing linked userId on update.
      profilePayload.userId = this.selectedItem().userId ?? undefined;
      this.farmerService.updateFarmerProfile(id, profilePayload).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Profile updated successfully');
          this.closeProfileModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating profile')
      });
    } else {
      // Register a login account (IAM user) first, then link the new userId to the profile.
      const userPayload = {
        roleName: 'Farmer',
        name: v.name,
        email: v.email,
        password: v.password,
        phone: v.phone,
        regionId: v.regionId
      };
      this.userService.createUser(userPayload).subscribe({
        next: (userRes) => {
          profilePayload.userId = userRes.userId;
          this.farmerService.createFarmerProfile(profilePayload).subscribe({
            next: (res) => {
              this.toast.success(res.message || 'Farmer registered with login account');
              this.closeProfileModal();
              this.loadAllData();
            },
            error: (err) => this.toast.error(
              'Login account created, but saving the profile failed: ' +
              (err.error?.message || 'unknown error'))
          });
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating farmer login account')
      });
    }
  }

  confirmDeleteProfile(profile: any) {
    this.selectedItem.set(profile);
    this.showDeleteProfileConfirm.set(true);
  }

  executeDeleteProfile() {
    const id = this.selectedItem().farmerId;
    this.farmerService.deleteFarmerProfile(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Farmer profile deleted');
        this.showDeleteProfileConfirm.set(false);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not delete farmer profile')
    });
  }

  // ===== Land Holding CRUD =====
  openHoldingModal(holding?: any) {
    this.submittedHolding.set(false);
    if (holding) {
      this.isEditMode.set(true);
      this.selectedItem.set(holding);
      this.holdingForm.patchValue(holding);
    } else {
      this.isEditMode.set(false);
      this.selectedItem.set(null);
      this.holdingForm.reset({
        farmerId: this.farmerProfiles().length > 0 ? this.farmerProfiles()[0].farmerId : '',
        areaAcres: 1.0,
        status: ''
      });
    }
    this.showHoldingModal.set(true);
  }

  closeHoldingModal() { this.showHoldingModal.set(false); this.submittedHolding.set(false); }

  submitHoldingForm() {
    this.submittedHolding.set(true);
    this.holdingForm.markAllAsTouched();
    if (this.holdingForm.invalid) return;
    const body = { ...this.holdingForm.value };

    if (this.isEditMode()) {
      const id = this.selectedItem().holdingId;
      this.farmerService.updateLandHolding(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Land holding updated');
          this.closeHoldingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating land holding')
      });
    } else {
      this.farmerService.createLandHolding(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Land holding registered');
          this.closeHoldingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error registering land holding')
      });
    }
  }

  confirmDeleteHolding(holding: any) {
    this.selectedItem.set(holding);
    this.showDeleteHoldingConfirm.set(true);
  }

  executeDeleteHolding() {
    const id = this.selectedItem().holdingId;
    this.farmerService.deleteLandHolding(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Land holding deleted');
        this.showDeleteHoldingConfirm.set(false);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not delete land holding')
    });
  }
}
