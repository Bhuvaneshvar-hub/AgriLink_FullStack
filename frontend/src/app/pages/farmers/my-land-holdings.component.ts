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
  templateUrl: './my-land-holdings.component.html',
  styleUrls: ['./my-land-holdings.component.css']
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
