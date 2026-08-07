import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { notFutureDate, NAME_PATTERN } from '../../utils/validators';
import { INDIAN_STATES } from '../../utils/indian-states';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';
import { toggleSort, sortIcon, applySort } from '../../utils/table-sort.util';

@Component({
  selector: 'app-my-land-holdings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="land-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>My Land Holdings</h1>
          <p class="text-secondary">Register your land holdings. New entries are sent to an administrator for approval.</p>
        </div>
        @if (!isLoading() && !myProfile()) {
          <button class="btn btn-primary" (click)="openProfileModal()">
            <i class="material-icons-round">person_add</i><span>Complete My Profile</span>
          </button>
        } @else {
          <button class="btn btn-primary" (click)="openModal()" [disabled]="!myProfile()">
            <i class="material-icons-round">add_circle</i><span>Register Land</span>
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="empty-state"><span class="spinner-large"></span><p class="mt-3">Loading your land holdings...</p></div>
      } @else if (!myProfile()) {
        <div class="empty-state card">
          <i class="material-icons-round">person_off</i>
          <h3>No Farmer Profile</h3>
          <p>Your farmer profile isn't set up yet. Complete it below to start registering your land holdings.</p>
          <button class="btn btn-primary mt-2" (click)="openProfileModal()">
            <i class="material-icons-round">person_add</i><span>Complete My Profile</span>
          </button>
        </div>
      } @else if (holdings().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">terrain</i>
          <h3>No Land Holdings</h3>
          <p>You haven't registered any land yet. Click "Register Land" to add one.</p>
        </div>
      } @else {
        <div class="table-container">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Survey Number</th>
                  <th class="sortable" (click)="sortBy('areaAcres')" title="Sort by area">
                    <span>Area (Acres)</span>
                    <i class="material-icons-round sort-icon" [class.active]="sortField() === 'areaAcres'">{{ sortIcon(sortField() === 'areaAcres', sortAsc()) }}</i>
                  </th>
                  <th>Soil Type</th>
                  <th>Irrigation</th>
                  <th>Ownership</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (land of paginated(); track land.holdingId) {
                  <tr>
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
                      }">{{ statusLabel(land.status) }}</span>
                    </td>
                    <td>
                      <app-action-menu>
                        <button class="menu-item" (click)="viewDetails(land)">
                          <i class="material-icons-round">visibility</i> View
                        </button>
                        <button class="menu-item" (click)="openModal(land)">
                          <i class="material-icons-round">edit</i> Edit
                        </button>
                        <button class="menu-item danger" (click)="confirmDelete(land)">
                          <i class="material-icons-round">delete</i> Delete
                        </button>
                      </app-action-menu>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [currentPage]="page" [pageSize]="pageSize" [totalElements]="holdings().length"
            (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"></app-pagination>
        </div>
      }

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Land Holding' : 'Register Land Holding' }}</h3>
              <button class="close-btn" (click)="closeModal()"><i class="material-icons-round">close</i></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="lSurvey">Survey Number</label>
                  <input type="text" id="lSurvey" formControlName="surveyNumber" placeholder="e.g. 123/4A" />
                  <span class="error-text" [class.visible]="invalid('surveyNumber')">Survey number is required</span>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lArea">Area (Acres)</label>
                    <input type="number" id="lArea" step="0.01" formControlName="areaAcres" />
                    <span class="error-text" [class.visible]="invalid('areaAcres')">Enter a valid area (&gt; 0)</span>
                  </div>
                  <div class="form-group">
                    <label for="lSoil">Soil Type</label>
                    <select id="lSoil" formControlName="soilType">
                      <option value="">Select</option>
                      <option value="Clay">Clay</option>
                      <option value="Sandy">Sandy</option>
                      <option value="Loam">Loam</option>
                      <option value="Black">Black</option>
                    </select>
                    <span class="error-text" [class.visible]="invalid('soilType')">Soil type is required</span>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lIrr">Irrigation Source</label>
                    <select id="lIrr" formControlName="irrigationSource">
                      <option value="">Select</option>
                      <option value="Rain">Rain</option>
                      <option value="Canal">Canal</option>
                      <option value="Borewell">Borewell</option>
                      <option value="None">None</option>
                    </select>
                    <span class="error-text" [class.visible]="invalid('irrigationSource')">Irrigation source is required</span>
                  </div>
                  <div class="form-group">
                    <label for="lOwn">Ownership Type</label>
                    <select id="lOwn" formControlName="ownershipType">
                      <option value="">Select</option>
                      <option value="Owned">Owned</option>
                      <option value="Leased">Leased</option>
                      <option value="SharedCropping">Shared Cropping</option>
                    </select>
                    <span class="error-text" [class.visible]="invalid('ownershipType')">Ownership type is required</span>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid" [title]="isEditMode() ? 'Save Changes' : 'Submit for Approval'"><i class="material-icons-round">save</i><span>{{ isEditMode() ? 'Save Changes' : 'Submit for Approval' }}</span></button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showProfileModal()) {
        <div class="modal-overlay" (click)="closeProfileModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Complete Your Farmer Profile</h3>
              <button class="close-btn" (click)="closeProfileModal()"><i class="material-icons-round">close</i></button>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="pName">Full Name</label>
                  <input type="text" id="pName" formControlName="name" />
                  <span class="error-text" [class.visible]="pInvalid('name')">Name must be letters only (2–50 characters)</span>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="pDob">Date of Birth</label>
                    <input type="date" id="pDob" formControlName="dateOfBirth" />
                    <span class="error-text" [class.visible]="pInvalid('dateOfBirth')">A valid past date is required</span>
                  </div>
                  <div class="form-group">
                    <label for="pGender">Gender</label>
                    <select id="pGender" formControlName="gender">
                      <option value="" disabled>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <span class="error-text" [class.visible]="pInvalid('gender')">Gender is required</span>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="pNid">National ID / Aadhar Number</label>
                    <input type="text" id="pNid" formControlName="nationalIdNumber" placeholder="6–20 letters/digits" />
                    <span class="error-text" [class.visible]="pInvalid('nationalIdNumber')">Enter a valid ID (6–20 letters/digits)</span>
                  </div>
                  <div class="form-group">
                    <label for="pPhone">Phone Number</label>
                    <input type="text" id="pPhone" formControlName="phone" placeholder="10 digits" />
                    <span class="error-text" [class.visible]="pInvalid('phone')">Phone must be exactly 10 digits</span>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="pVillage">Village</label>
                    <input type="text" id="pVillage" formControlName="village" />
                    <span class="error-text" [class.visible]="pInvalid('village')">Village is required</span>
                  </div>
                  <div class="form-group">
                    <label for="pDistrict">District</label>
                    <input type="text" id="pDistrict" formControlName="district" />
                    <span class="error-text" [class.visible]="pInvalid('district')">District is required</span>
                  </div>
                  <div class="form-group">
                    <label for="pState">State</label>
                    <select id="pState" formControlName="state">
                      <option value="">Select State</option>
                      @for (st of indianStates; track st) { <option [value]="st">{{ st }}</option> }
                    </select>
                    <span class="error-text" [class.visible]="pInvalid('state')">State is required</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="pBank">Bank Account Number</label>
                  <input type="text" id="pBank" formControlName="bankAccountNumber" placeholder="6–20 digits" />
                  <span class="error-text" [class.visible]="pInvalid('bankAccountNumber')">Enter a valid account number (6–20 digits)</span>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid" title="Save Profile"><i class="material-icons-round">save</i><span>Save Profile</span></button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showDetailModal()) {
        <app-detail-modal
          [title]="detailTitle()"
          [rows]="detailRows()"
          (close)="showDetailModal.set(false)">
        </app-detail-modal>
      }

      @if (showDeleteConfirm()) {
        <app-confirmation-modal title="Delete Land Holding"
          [message]="'Delete survey number ' + selected()?.surveyNumber + '?'"
          confirmText="Delete" (confirm)="executeDelete()" (cancel)="showDeleteConfirm.set(false)">
        </app-confirmation-modal>
      }
    </div>
  `,
  styles: [`
    .land-page { padding: 0.5rem; }
    .error-text { display:block; min-height:1rem; font-size:0.75rem; color:var(--danger); opacity:0; visibility:hidden; }
    .error-text.visible { opacity:1; visibility:visible; }
  `]
})
export class MyLandHoldingsComponent implements OnInit {
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly indianStates = INDIAN_STATES;

  isLoading = signal(false);
  submitted = signal(false);
  submittedProfile = signal(false);
  myProfile = signal<any | null>(null);
  holdings = signal<any[]>([]);
  selected = signal<any | null>(null);
  showModal = signal(false);
  showProfileModal = signal(false);
  showDeleteConfirm = signal(false);
  showDetailModal = signal(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);
  isEditMode = signal(false);
  sortField = signal<string | null>(null);
  sortAsc = signal(true);

  readonly sortIcon = sortIcon;

  page = 0;
  pageSize = 10;

  form!: FormGroup;
  profileForm!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      surveyNumber: ['', Validators.required],
      areaAcres: [1.0, [Validators.required, Validators.min(0.01)]],
      soilType: ['', Validators.required],
      irrigationSource: ['', Validators.required],
      ownershipType: ['', Validators.required]
    });
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['', Validators.required],
      nationalIdNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{6,20}$/)]],
      village: ['', Validators.required],
      district: ['', Validators.required],
      state: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      bankAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]]
    });
    this.load();
  }

  private load() {
    this.isLoading.set(true);
    // getAllFarmerProfiles is scoped to the caller's own profile(s) for a Farmer.
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (profiles) => {
        this.myProfile.set(profiles && profiles.length ? profiles[0] : null);
        this.farmerService.getAllLandHoldings().subscribe({
          next: (list) => { this.holdings.set(list || []); this.page = 0; this.isLoading.set(false); },
          error: () => { this.holdings.set([]); this.isLoading.set(false); }
        });
      },
      error: () => { this.toast.error('Failed to load your profile.'); this.isLoading.set(false); }
    });
  }

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.touched || this.submitted()));
  }

  paginated(): any[] {
    const sorted = applySort(this.holdings(), this.sortField(), this.sortAsc());
    const start = this.page * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }
  onPageChange(p: number) { this.page = p; }
  onPageSizeChange(s: number) { this.pageSize = s; this.page = 0; }

  sortBy(field: string) { toggleSort(this.sortField, this.sortAsc, field); this.page = 0; }

  statusLabel(s: string): string {
    switch (s) { case 'AC': return 'Active'; case 'PE': return 'Pending'; case 'DP': return 'Disputed'; case 'IN': return 'Inactive'; default: return s; }
  }

  openModal(land?: any) {
    this.submitted.set(false);
    if (land) {
      this.isEditMode.set(true);
      this.selected.set(land);
      this.form.reset({
        surveyNumber: land.surveyNumber,
        areaAcres: land.areaAcres,
        soilType: land.soilType,
        irrigationSource: land.irrigationSource,
        ownershipType: land.ownershipType
      });
    } else {
      this.isEditMode.set(false);
      this.selected.set(null);
      this.form.reset({ areaAcres: 1.0, soilType: '', irrigationSource: '', ownershipType: '', surveyNumber: '' });
    }
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); this.isEditMode.set(false); }

  // ── Self-service farmer profile setup ─────────────────────────────────
  pInvalid(field: string): boolean {
    const c = this.profileForm.get(field);
    return !!(c && c.invalid && (c.touched || this.submittedProfile()));
  }

  openProfileModal() {
    this.submittedProfile.set(false);
    const session = this.authService.currentUserValue;
    // Pre-fill the name/phone we already know from the login session.
    this.profileForm.reset({
      name: session?.name || '',
      dateOfBirth: '',
      gender: '',
      nationalIdNumber: '',
      village: '',
      district: '',
      state: '',
      phone: '',
      bankAccountNumber: ''
    });
    this.showProfileModal.set(true);
  }

  closeProfileModal() { this.showProfileModal.set(false); this.submittedProfile.set(false); }

  submitProfile() {
    this.submittedProfile.set(true);
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) return;
    // The backend forces userId to the authenticated farmer, so we only send profile fields.
    this.farmerService.createFarmerProfile({ ...this.profileForm.value, status: 'AC' }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Profile created. You can now register your land.');
        this.closeProfileModal();
        this.load();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to create your farmer profile')
    });
  }

  submit() {
    this.submitted.set(true);
    if (this.form.invalid || !this.myProfile()) return;
    const farmerId = this.myProfile().farmerId;

    if (this.isEditMode() && this.selected()) {
      // Farmer edit — the backend preserves the approval status for a farmer's own holding.
      const body = { ...this.form.value, farmerId };
      this.farmerService.updateLandHolding(this.selected().holdingId, body).subscribe({
        next: (res) => { this.toast.success(res.message || 'Land holding updated'); this.closeModal(); this.load(); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to update land holding')
      });
      return;
    }

    const body = { ...this.form.value, farmerId, status: 'PE' };
    this.farmerService.createLandHolding(body).subscribe({
      next: (res) => { this.toast.success(res.message || 'Submitted for approval'); this.closeModal(); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to submit land holding')
    });
  }

  viewDetails(land: any) {
    this.detailTitle.set(`Land Holding — ${land.surveyNumber}`);
    this.detailRows.set([
      { label: 'Survey Number', value: land.surveyNumber },
      { label: 'Area (Acres)', value: land.areaAcres },
      { label: 'Soil Type', value: land.soilType },
      { label: 'Irrigation Source', value: land.irrigationSource },
      { label: 'Ownership Type', value: land.ownershipType },
      { label: 'Status', value: this.statusLabel(land.status) }
    ]);
    this.showDetailModal.set(true);
  }

  confirmDelete(land: any) { this.selected.set(land); this.showDeleteConfirm.set(true); }
  executeDelete() {
    this.farmerService.deleteLandHolding(this.selected().holdingId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Land holding deleted'); this.showDeleteConfirm.set(false); this.load(); },
      error: () => this.toast.error('Failed to delete land holding')
    });
  }
}
