import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmerService } from '../../services/farmer.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { notFutureDate, NAME_PATTERN, GMAIL_PATTERN } from '../../utils/validators';
import { INDIAN_STATES } from '../../utils/indian-states';
import { toggleSort, sortIcon, applySort } from '../../utils/table-sort.util';
import { exportTableToExcel } from '../../utils/export-excel.util';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

@Component({
  selector: 'app-farmers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './farmers.component.html',
  styleUrls: ['./farmers.component.css']
})
export class FarmersComponent implements OnInit {
  private farmerService = inject(FarmerService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  activeTab = signal<'profiles' | 'holdings' | 'history'>('profiles');
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  submittedProfile = signal<boolean>(false);
  submittedHolding = signal<boolean>(false);
  readonly indianStates = INDIAN_STATES;

  // Data
  farmerProfiles = signal<any[]>([]);
  landHoldings = signal<any[]>([]);
  cropHistories = signal<any[]>([]);
  filteredProfiles = signal<any[]>([]);
  filteredHoldings = signal<any[]>([]);
  filteredHistories = signal<any[]>([]);

  // Selected entity for edit/delete
  selectedItem = signal<any | null>(null);

  // Modal states
  showProfileModal = signal<boolean>(false);
  currentProfileStep = signal<1 | 2>(1);
  submittedProfileStep1 = signal<boolean>(false);
  private readonly PROFILE_STEP1_FIELDS = ['name', 'email', 'password', 'phone', 'regionId'];
  showHoldingModal = signal<boolean>(false);
  showHistoryModal = signal<boolean>(false);
  showDeleteProfileConfirm = signal<boolean>(false);
  showDeleteHoldingConfirm = signal<boolean>(false);
  showDeleteHistoryConfirm = signal<boolean>(false);
  submittedHistory = signal<boolean>(false);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Search + pagination
  profileSearch = '';
  holdingSearch = '';
  historySearch = '';
  profilePage = 0;
  profilePageSize = 10;
  holdingPage = 0;
  holdingPageSize = 10;
  historyPage = 0;
  historyPageSize = 10;

  // Column sorting state for each table (null = default order).
  profilesSortField = signal<string | null>(null);
  profilesSortAsc = signal<boolean>(true);
  holdingsSortField = signal<string | null>(null);
  holdingsSortAsc = signal<boolean>(true);
  historySortField = signal<string | null>(null);
  historySortAsc = signal<boolean>(true);

  // Exposed so the template can call it directly on sortable header icons.
  readonly sortIcon = sortIcon;

  // Forms
  profileForm!: FormGroup;
  holdingForm!: FormGroup;
  historyForm!: FormGroup;

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

    this.historyForm = this.fb.group({
      farmerId: ['', Validators.required],
      holdingId: ['', Validators.required],
      cropName: ['', Validators.required],
      season: ['', Validators.required],
      cropYear: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
      areaAcres: [1.0, [Validators.required, Validators.min(0.01)]],
      yieldQuintals: [0, [Validators.required, Validators.min(0)]],
      remarks: ['']
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

            this.farmerService.getAllCropHistories().subscribe({
              next: (histories) => {
                this.cropHistories.set(histories || []);
                this.applyHistoryFilters();
                this.isLoading.set(false);
              },
              error: () => {
                this.toast.error('Failed to load crop history.');
                this.isLoading.set(false);
              }
            });
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

  setTab(tab: 'profiles' | 'holdings' | 'history') {
    this.activeTab.set(tab);
  }

  // Only Extension Officers and Admins may verify / (de)activate farmer profiles.
  canVerify(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer']);
  }

  // Helpers
  getFarmerName(farmerId: number): string {
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof ? `${prof.name}(#${farmerId})` : `Farmer #${farmerId}`;
  }

  // Name without the id, for table cells where ids are hidden.
  getFarmerNameOnly(farmerId: number): string {
    const prof = this.farmerProfiles().find(p => p.farmerId == farmerId);
    return prof ? prof.name : `Farmer #${farmerId}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'AC': return 'Active';
      case 'IN': return 'Inactive';
      case 'VE': return 'Verified';
      default: return status;
    }
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

  exportProfiles(): void {
    const headers = ['Name', 'Gender', 'Date of Birth', 'National ID', 'Village', 'District', 'State', 'Phone', 'Status'];
    const rows = this.filteredProfiles().map(p => [
      p.name,
      p.gender,
      p.dateOfBirth,
      p.nationalIdNumber,
      p.village,
      p.district,
      p.state,
      p.phone,
      this.getStatusLabel(p.status)
    ]);
    exportTableToExcel(headers, rows, `farmer-profiles-${Date.now()}`);
  }

  exportHoldings(): void {
    const headers = ['Farmer', 'Survey Number', 'Area (Acres)', 'Soil Type', 'Irrigation', 'Ownership', 'Status'];
    const rows = this.filteredHoldings().map(l => [
      this.getFarmerNameOnly(l.farmerId),
      l.surveyNumber,
      l.areaAcres,
      l.soilType,
      l.irrigationSource,
      l.ownershipType,
      this.getHoldingStatusLabel(l.status)
    ]);
    exportTableToExcel(headers, rows, `land-holdings-${Date.now()}`);
  }

  exportHistories(): void {
    const headers = ['Farmer', 'Survey No.', 'Crop', 'Season', 'Year', 'Area (Acres)', 'Yield (Qtl)'];
    const rows = this.filteredHistories().map(r => [
      this.getFarmerNameOnly(r.farmerId),
      this.getSurveyNumber(r.holdingId),
      r.cropName,
      r.season,
      r.cropYear,
      r.areaAcres,
      r.yieldQuintals
    ]);
    exportTableToExcel(headers, rows, `crop-history-${Date.now()}`);
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

  // ===== Farmer profile lifecycle (Officer/Admin) =====
  activateProfile(prof: any) {
    this.farmerService.activateFarmerProfile(prof.farmerId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Farmer profile activated'); this.loadAllData(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to activate profile')
    });
  }

  deactivateProfile(prof: any) {
    this.farmerService.deactivateFarmerProfile(prof.farmerId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Farmer profile deactivated'); this.loadAllData(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to deactivate profile')
    });
  }

  // ===== Crop history helpers =====
  getSurveyNumber(holdingId: number): string {
    const land = this.landHoldings().find(h => h.holdingId == holdingId);
    return land ? land.surveyNumber : `Holding #${holdingId}`;
  }

  // Land holdings belonging to the farmer currently selected in the crop-history form.
  holdingsForSelectedFarmer(): any[] {
    const farmerId = this.historyForm?.get('farmerId')?.value;
    if (!farmerId) return [];
    return this.landHoldings().filter(h => h.farmerId == farmerId);
  }

  onHistoryFarmerChange() {
    // Reset the holding selection when the farmer changes so it can't point at another farmer's land.
    this.historyForm.patchValue({ holdingId: '' });
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

  viewHistoryDetails(rec: any) {
    this.detailTitle.set(`Crop History #${rec.historyId}`);
    this.detailRows.set([
      { label: 'Record ID', value: '#' + rec.historyId },
      { label: 'Farmer', value: this.getFarmerName(rec.farmerId) },
      { label: 'Land Holding', value: this.getSurveyNumber(rec.holdingId) },
      { label: 'Crop', value: rec.cropName },
      { label: 'Season', value: rec.season },
      { label: 'Year', value: rec.cropYear },
      { label: 'Area Planted (Acres)', value: rec.areaAcres },
      { label: 'Yield (Quintals)', value: rec.yieldQuintals },
      { label: 'Remarks', value: rec.remarks || '—' }
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
    const sorted = applySort(this.filteredProfiles(), this.profilesSortField(), this.profilesSortAsc());
    const start = this.profilePage * this.profilePageSize;
    return sorted.slice(start, start + this.profilePageSize);
  }

  onProfilePageChange(page: number) { this.profilePage = page; }
  onProfilePageSizeChange(size: number) { this.profilePageSize = size; this.profilePage = 0; }

  sortProfilesBy(field: string) {
    toggleSort(this.profilesSortField, this.profilesSortAsc, field);
    this.profilePage = 0;
  }

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
    const sorted = applySort(this.filteredHoldings(), this.holdingsSortField(), this.holdingsSortAsc());
    const start = this.holdingPage * this.holdingPageSize;
    return sorted.slice(start, start + this.holdingPageSize);
  }

  onHoldingPageChange(page: number) { this.holdingPage = page; }
  onHoldingPageSizeChange(size: number) { this.holdingPageSize = size; this.holdingPage = 0; }

  sortHoldingsBy(field: string) {
    toggleSort(this.holdingsSortField, this.holdingsSortAsc, field);
    this.holdingPage = 0;
  }

  applyHistoryFilters() {
    const q = this.historySearch.trim().toLowerCase();
    let list = this.cropHistories();
    if (q) {
      list = list.filter(h =>
        (h.cropName || '').toLowerCase().includes(q) ||
        (h.season || '').toLowerCase().includes(q) ||
        String(h.cropYear || '').includes(q)
      );
    }
    // Most recent seasons first, then newest record.
    list = [...list].sort((a, b) =>
      (b.cropYear || 0) - (a.cropYear || 0) || (b.historyId || 0) - (a.historyId || 0));
    this.filteredHistories.set(list);
    this.historyPage = 0;
  }

  paginatedHistories(): any[] {
    const sorted = applySort(this.filteredHistories(), this.historySortField(), this.historySortAsc());
    const start = this.historyPage * this.historyPageSize;
    return sorted.slice(start, start + this.historyPageSize);
  }

  onHistoryPageChange(page: number) { this.historyPage = page; }
  onHistoryPageSizeChange(size: number) { this.historyPageSize = size; this.historyPage = 0; }

  sortHistoryBy(field: string) {
    toggleSort(this.historySortField, this.historySortAsc, field);
    this.historyPage = 0;
  }

  // ===== Farmer Profile CRUD =====
  openProfileModal(profile?: any) {
    this.submittedProfile.set(false);
    this.submittedProfileStep1.set(false);
    this.currentProfileStep.set(1);
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
      this.profileForm.reset({ gender: '', status: 'AC', userId: null });
      // Registering a new farmer requires login credentials to create their IAM user.
      emailCtrl?.setValidators([Validators.required, Validators.pattern(GMAIL_PATTERN)]);
      pwdCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    emailCtrl?.updateValueAndValidity();
    pwdCtrl?.updateValueAndValidity();
    this.showProfileModal.set(true);
  }

  closeProfileModal() { this.showProfileModal.set(false); this.submittedProfile.set(false); }

  // Whether a given wizard step's fields should render. Editing shows both steps at
  // once (no account fields to gate behind a step); registering steps through them.
  showProfileStep(step: 1 | 2): boolean {
    return this.isEditMode() || this.currentProfileStep() === step;
  }

  profileGoNext(): void {
    this.submittedProfileStep1.set(true);
    const invalid = this.PROFILE_STEP1_FIELDS.some(f => this.profileForm.get(f)?.invalid);
    if (invalid) return;
    this.currentProfileStep.set(2);
  }

  profileGoBack(): void {
    this.currentProfileStep.set(1);
  }

  // Shows a field's error once the user has interacted with it or tried to submit
  // that field's step (step 1 fields gate on submittedProfileStep1, others on the
  // final submittedProfile — editing shows everything at once, so it always uses submittedProfile).
  pInvalid(field: string): boolean {
    const c = this.profileForm.get(field);
    if (!c) return false;
    const submitted = (!this.isEditMode() && this.PROFILE_STEP1_FIELDS.includes(field))
      ? this.submittedProfileStep1()
      : this.submittedProfile();
    return c.invalid && (c.touched || submitted);
  }

  /** Strips any non-digit characters as the user types (phone, bank account). */
  restrictToDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    if (digitsOnly !== input.value) {
      input.value = digitsOnly;
      input.dispatchEvent(new Event('input'));
    }
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
      regionId: v.regionId,
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

  // ===== Crop History CRUD =====
  chInvalid(field: string): boolean {
    const c = this.historyForm.get(field);
    return !!(c && c.invalid && (c.touched || this.submittedHistory()));
  }

  openHistoryModal(record?: any) {
    this.submittedHistory.set(false);
    if (record) {
      this.isEditMode.set(true);
      this.selectedItem.set(record);
      this.historyForm.patchValue(record);
    } else {
      this.isEditMode.set(false);
      this.selectedItem.set(null);
      this.historyForm.reset({
        farmerId: '',
        holdingId: '',
        cropName: '',
        season: '',
        cropYear: new Date().getFullYear(),
        areaAcres: 1.0,
        yieldQuintals: 0,
        remarks: ''
      });
    }
    this.showHistoryModal.set(true);
  }

  closeHistoryModal() { this.showHistoryModal.set(false); this.submittedHistory.set(false); }

  submitHistoryForm() {
    this.submittedHistory.set(true);
    this.historyForm.markAllAsTouched();
    if (this.historyForm.invalid) return;
    const body = { ...this.historyForm.value };

    if (this.isEditMode()) {
      const id = this.selectedItem().historyId;
      this.farmerService.updateCropHistory(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Crop history updated');
          this.closeHistoryModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating crop history')
      });
    } else {
      this.farmerService.createCropHistory(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Crop history recorded');
          this.closeHistoryModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error recording crop history')
      });
    }
  }

  confirmDeleteHistory(record: any) {
    this.selectedItem.set(record);
    this.showDeleteHistoryConfirm.set(true);
  }

  executeDeleteHistory() {
    const id = this.selectedItem().historyId;
    this.farmerService.deleteCropHistory(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Crop history deleted');
        this.showDeleteHistoryConfirm.set(false);
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not delete crop history')
    });
  }
}
