import { Component, OnInit, HostListener, inject, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators,
         AbstractControl, ValidationErrors } from '@angular/forms';
import { CropService } from '../../services/crop.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';
import { SEASONS, SEASON_SOWING_WINDOWS, isMonthInWindow } from '../../utils/seasons';
import { notFutureDate, NAME_PATTERN } from '../../utils/validators';
import { INDIAN_STATES } from '../../utils/indian-states';

/** Width of the inline plan-status menu; must match .status-menu's min-width. */
const STATUS_MENU_WIDTH = 160;

// ---- Crop catalog input bounds -------------------------------------------------
/** A crop name: starts with a letter, then letters, spaces, hyphen or apostrophe. */
const CROP_NAME_PATTERN = /^[A-Za-z][A-Za-z '-]{1,29}$/;
const MAX_CROP_NAME_LENGTH = 30;
/** A growing cycle is at least a week and at most one year. */
const MIN_DURATION_DAYS = 7;
const MAX_DURATION_DAYS = 365;
/** Yield per acre in tons — generous upper bound, catches stray digits. */
const MIN_YIELD_TONS = 0.1;
const MAX_YIELD_TONS = 100;
/** Area planted in acres. */
const MIN_AREA_ACRES = 0.01;
const MAX_AREA_ACRES = 10000;

/** Rejects fractional values for fields that are only meaningful as integers. */
function wholeNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '' || value === undefined) return null;
  return Number.isInteger(Number(value)) ? null : { wholeNumber: true };
}

@Component({
  selector: 'app-crops',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './crops.component.html',
  styleUrls: ['./crops.component.css']
})
export class CropsComponent implements OnInit {
  private cropService = inject(CropService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);
  private fb = inject(FormBuilder);

  // Season options (shared source of truth, matches backend Season enum)
  readonly seasons = SEASONS;

  // Upper bound for a plan's year (this year + 1) — plans can be scheduled for
  // the current or next growing year but not arbitrarily far into the future.
  readonly maxPlanYear = new Date().getFullYear() + 1;

  // Input bounds, exposed so the template can set min/max and quote them in
  // the error messages (single source of truth with the validators).
  readonly MAX_CROP_NAME_LENGTH = MAX_CROP_NAME_LENGTH;
  readonly MIN_DURATION_DAYS = MIN_DURATION_DAYS;
  readonly MAX_DURATION_DAYS = MAX_DURATION_DAYS;
  readonly MIN_YIELD_TONS = MIN_YIELD_TONS;
  readonly MAX_YIELD_TONS = MAX_YIELD_TONS;
  readonly MIN_AREA_ACRES = MIN_AREA_ACRES;
  readonly MAX_AREA_ACRES = MAX_AREA_ACRES;

  // Column sorting state for the catalog, plan and observation tables.
  // All three default to their auto-increment id descending, so the most recently
  // added crop / plan / logged observation is always the first row. Clicking any
  // sortable header takes over from there.
  catalogSortField = signal<string | null>('cropId');
  catalogSortAsc = signal<boolean>(false);
  planSortField = signal<string | null>('planId');
  planSortAsc = signal<boolean>(false);
  obsSortField = signal<string | null>('observationId');
  obsSortAsc = signal<boolean>(false);

  // Crop plan lifecycle statuses, used by the inline status editor.
  readonly planStatuses = ['PLANNED', 'SOWING', 'GROWING', 'HARVESTED', 'FAILED'];

  // Inline status editor state: which plan's status menu is open, and which
  // plan is currently being saved (shows a spinner and blocks re-clicks).
  openStatusPlanId = signal<number | null>(null);
  statusSaving = signal<number | null>(null);

  // Viewport coordinates of the open status menu (it is fixed-positioned).
  statusMenuTop = signal<number>(0);
  statusMenuLeft = signal<number>(0);

  // States
  activeTab = signal<'catalog' | 'plans' | 'observations' | 'profiles'>('catalog');
  isLoading = signal<boolean>(false);
  readonly indianStates = INDIAN_STATES;
  isEditMode = signal<boolean>(false);

  // Data signals (kept sorted most-recent-first)
  cropCatalogs = signal<any[]>([]);
  cropPlans = signal<any[]>([]);
  growthObservations = signal<any[]>([]);
  farmerProfiles = signal<any[]>([]);
  landHoldings = signal<any[]>([]);

  // Pagination state (page index is 0-based)
  catalogPage = 0;   catalogPageSize = 5;
  // Crop plans and growth observations have taller rows, so they open on 3.
  planPage = 0;      planPageSize = 3;
  obsPage = 0;       obsPageSize = 3;
  profilePage = 0;   profilePageSize = 5;
  holdingPage = 0;   holdingPageSize = 5;

  // Selected entities for actions
  selectedCatalogItem = signal<any | null>(null);
  selectedPlan = signal<any | null>(null);
  selectedObservation = signal<any | null>(null);

  // Modal display states
  showCatalogModal = signal<boolean>(false);
  showPlanModal = signal<boolean>(false);
  showObservationModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  showHoldingModal = signal<boolean>(false);

  // Delete confirmations
  showDeleteCatalogConfirm = signal<boolean>(false);
  showDeletePlanConfirm = signal<boolean>(false);
  showDeleteObservationConfirm = signal<boolean>(false);

  // Detail (view) modal
  showDetailModal = signal<boolean>(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Form Groups
  catalogForm!: FormGroup;
  planForm!: FormGroup;
  observationForm!: FormGroup;
  profileForm!: FormGroup;
  holdingForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadAllData();
  }

  // Check roles
  isFarmer(): boolean {
    return this.authService.hasRole(['Farmer']);
  }

  isAdminOrOfficer(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer']);
  }

  // Crop catalog is a reference template — only AgriLinkAdmin may create/edit/delete
  // (backend restricts catalog writes to AgriLinkAdmin).
  isAdmin(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin']);
  }

  // Growth observations: a Farmer may read the inspection remarks logged against
  // their own crop plans (crop-service scopes the response to their plans); the
  // officers and admin may also read. Only officers/admin may log or delete one.
  canViewObservations(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin',
                                     'ComplianceAnalyst', 'Farmer']);
  }

  setTab(tab: 'catalog' | 'plans' | 'observations' | 'profiles') {
    this.activeTab.set(tab);
  }

  private initForms() {
    this.catalogForm = this.fb.group({
      cropName: ['', [Validators.required, Validators.pattern(CROP_NAME_PATTERN),
                      Validators.maxLength(MAX_CROP_NAME_LENGTH)]],
      category: ['', Validators.required],
      season: ['', Validators.required],
      typicalDurationDays: [90, [Validators.required, Validators.min(MIN_DURATION_DAYS),
                                 Validators.max(MAX_DURATION_DAYS), wholeNumber]],
      expectedYieldPerAcre: [1.0, [Validators.required, Validators.min(MIN_YIELD_TONS),
                                   Validators.max(MAX_YIELD_TONS)]],
      // Not shown in the form — every catalogued crop is created Active.
      status: ['AC', Validators.required]
    });

    this.planForm = this.fb.group({
      farmerId: ['', Validators.required],
      holdingId: ['', Validators.required],
      cropId: ['', Validators.required],
      season: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear() + 1)]],
      sowingDate: ['', Validators.required],
      expectedHarvestDate: ['', Validators.required],
      areaPlanted: [0.5, [Validators.required, Validators.min(MIN_AREA_ACRES),
                          Validators.max(MAX_AREA_ACRES)]],
      // Not shown in the form — a new plan always starts Planned, and the status
      // is advanced afterwards from the badge in the Crop Plans table. On edit,
      // patchValue keeps the plan's real status so it isn't reset.
      status: ['PLANNED', Validators.required]
    });

    // The Year field is not shown — the backend still requires it, so keep it in
    // step with the sowing date the user picks.
    this.planForm.get('sowingDate')!.valueChanges.subscribe(date => {
      if (!date) return;
      const year = new Date(date).getFullYear();
      if (!isNaN(year)) {
        this.planForm.get('year')!.setValue(year, { emitEvent: false });
      }
    });

    // Two-way sync between Season and Crop Type on the plan form.
    // Picking a crop fills the season from its catalog entry; changing the
    // season clears a crop that no longer belongs to that season.
    this.planForm.get('cropId')!.valueChanges.subscribe(cropId => {
      if (!cropId) return;
      const crop = this.cropCatalogs().find(c => c.cropId == cropId);
      if (crop && crop.season) {
        this.planForm.get('season')!.setValue(crop.season, { emitEvent: false });
        // Fix the season chip to the chosen crop's season.
        this.selectedSeasons.set([crop.season]);
      }
      // Suggest an expected harvest date from the crop's typical duration.
      this.autoFillHarvestDate();
    });
    this.planForm.get('season')!.valueChanges.subscribe(season => {
      if (!season) return;
      const cropId = this.planForm.get('cropId')!.value;
      if (!cropId) return;
      const crop = this.cropCatalogs().find(c => c.cropId == cropId);
      if (crop && crop.season !== season) {
        this.planForm.get('cropId')!.setValue('', { emitEvent: false });
      }
    });

    // When the sowing date changes, refresh the suggested harvest date.
    this.planForm.get('sowingDate')!.valueChanges.subscribe(() => this.autoFillHarvestDate());

    // A land holding belongs to one farmer. If the farmer changes and the
    // currently-selected holding is no longer theirs, clear it.
    this.planForm.get('farmerId')!.valueChanges.subscribe(farmerId => {
      const holdingId = this.planForm.get('holdingId')!.value;
      if (!holdingId) return;
      const holding = this.landHoldings().find(h => h.holdingId == holdingId);
      if (holding && holding.farmerId != farmerId) {
        this.planForm.get('holdingId')!.setValue('', { emitEvent: false });
      }
    });

    this.observationForm = this.fb.group({
      farmerId: ['', Validators.required],
      planId: ['', Validators.required],
      observationDate: [new Date().toISOString().split('T')[0], Validators.required],
      stage: ['', Validators.required],
      pestOrDiseaseFlag: [false],
      remarks: ['', Validators.required]
    });

    // Cascade: when the chosen farmer changes, clear the plan selection so the
    // user picks a plan that actually belongs to the newly selected farmer.
    this.observationForm.get('farmerId')!.valueChanges.subscribe(() => {
      this.observationForm.get('planId')!.setValue('', { emitEvent: false });
    });

    // Each plan is at its own point in the growth flow, so a stage picked for the
    // previous plan may already be completed on the new one. Clear it on switch.
    this.observationForm.get('planId')!.valueChanges.subscribe(() => {
      this.observationForm.get('stage')!.setValue('', { emitEvent: false });
    });

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['', Validators.required],
      nationalIdNumber: ['', Validators.required],
      village: ['', Validators.required],
      district: ['', Validators.required],
      state: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      bankAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{6,20}$/)]]
    });

    this.holdingForm = this.fb.group({
      farmerId: ['', Validators.required],
      surveyNumber: ['', Validators.required],
      areaAcres: [1.0, [Validators.required, Validators.min(0.01)]],
      soilType: ['', Validators.required],
      irrigationSource: ['', Validators.required],
      ownershipType: ['', Validators.required]
    });
  }

  private loadAllData() {
    this.isLoading.set(true);
    // Load Catalogs first
    this.cropService.getAllCropCatalogs().subscribe({
      next: (catalogs) => {
        this.cropCatalogs.set(this.sortByIdDesc(catalogs, 'cropId'));
        this.catalogPage = 0;

        // Load plans (most recently created first)
        this.cropService.getAllCropPlans().subscribe({
          next: (plans) => {
            this.cropPlans.set(this.sortByIdDesc(plans, 'planId'));
            this.planPage = 0;
          }
        });

        // Load growth logs (most recently logged first) — only for roles
        // the backend permits; Farmer/Procurement would get a 403 otherwise.
        if (this.canViewObservations()) {
          this.cropService.getAllGrowthObservations().subscribe({
            next: (observations) => {
              this.growthObservations.set(this.sortByIdDesc(observations, 'observationId'));
              this.obsPage = 0;
            }
          });
        }

        // Load Profiles & Holdings (newest registered first)
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (profiles) => {
            this.farmerProfiles.set(this.sortByIdDesc(profiles, 'farmerId'));
            this.profilePage = 0;
          }
        });

        this.farmerService.getAllLandHoldings().subscribe({
          next: (holdings) => {
            this.landHoldings.set(this.sortByIdDesc(holdings, 'holdingId'));
            this.holdingPage = 0;
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => {
        this.toast.error('Failed to load operations database.');
        this.isLoading.set(false);
      }
    });
  }

  // ================= SORTING & PAGINATION =================
  // Newest-added first. No createdAt column exists, so we fall back to the
  // auto-increment id (higher id = added more recently).
  private sortByIdDesc(list: any[], idField: string): any[] {
    return [...(list || [])].sort((a, b) => (b[idField] || 0) - (a[idField] || 0));
  }

  private page(list: any[], pageIndex: number, size: number): any[] {
    const start = pageIndex * size;
    return list.slice(start, start + size);
  }

  paginatedCatalog(): any[] {
    const sorted = this.applySort(this.cropCatalogs(), this.catalogSortField(), this.catalogSortAsc());
    return this.page(sorted, this.catalogPage, this.catalogPageSize);
  }
  onCatalogPageChange(p: number) { this.catalogPage = p; }
  onCatalogPageSizeChange(s: number) { this.catalogPageSize = s; this.catalogPage = 0; }

  planSearch = '';
  onPlanSearchChange() { this.planPage = 0; }

  // Season filter chips inside the plan modal (multi-select). They narrow the
  // Crop Type list to the chosen season(s); empty = show crops of all seasons.
  selectedSeasons = signal<string[]>([]);

  isSeasonSelected(season: string): boolean {
    return this.selectedSeasons().includes(season);
  }

  toggleSeasonChip(season: string) {
    const current = this.selectedSeasons();
    this.selectedSeasons.set(
      current.includes(season) ? current.filter(s => s !== season) : [...current, season]);
    // If the crop currently chosen no longer matches the active chips, clear it.
    const cropId = this.planForm?.get('cropId')?.value;
    if (cropId) {
      const crop = this.cropCatalogs().find(c => c.cropId == cropId);
      const active = this.selectedSeasons();
      if (crop && active.length && !active.includes(crop.season)) {
        this.planForm.get('cropId')!.setValue('', { emitEvent: false });
        this.planForm.get('season')!.setValue('', { emitEvent: false });
      }
    }
  }

  clearSeasonChips() {
    this.selectedSeasons.set([]);
  }


  // Plans a Farmer may see are limited to their own; Admin/Officer see all.
  // Then filtered by the search box (farmer name or crop name).
  filteredPlans(): any[] {
    let list = this.cropPlans();
    const owned = this.myOwnedFarmerIds();
    if (owned !== null) {
      list = list.filter(p => owned.includes(p.farmerId));
    }
    const q = this.planSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      this.getFarmerName(p.farmerId).toLowerCase().includes(q) ||
      this.getCropName(p.cropId).toLowerCase().includes(q) ||
      this.getPlanStatusLabel(p.status).toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q) ||
      (p.season || '').toLowerCase().includes(q)
    );
  }

  paginatedPlans(): any[] {
    const sorted = this.applySort(this.filteredPlans(), this.planSortField(), this.planSortAsc());
    return this.page(sorted, this.planPage, this.planPageSize);
  }

  // Crop Type options for the plan form: Active catalog crops, narrowed by the
  // season chips when any are selected (the currently-selected crop is always
  // kept so editing a plan never loses its value). Picking a crop then fixes the
  // plan's season to that crop's season (see the cropId subscription).
  cropsForPlanSeason(): any[] {
    const active = this.cropCatalogs().filter(c => c.status === 'AC');
    const seasons = this.selectedSeasons();
    if (!seasons.length) return active;
    const currentId = this.planForm?.get('cropId')?.value;
    return active.filter(c => seasons.includes(c.season) || c.cropId == currentId);
  }
  onPlanPageChange(p: number) { this.planPage = p; }
  onPlanPageSizeChange(s: number) { this.planPageSize = s; this.planPage = 0; }

  // Soft, non-blocking hint shown under the Sowing Date field when the chosen
  // date falls outside the typical sowing window for the selected season.
  // Returns null when there's nothing to warn about (no season/date, a
  // year-round season, or a date already inside the window). Regional practice
  // varies, so the plan can still be saved regardless.
  sowingWindowWarning(): string | null {
    const season = this.planForm?.get('season')?.value;
    const sowing = this.planForm?.get('sowingDate')?.value;
    if (!season || !sowing) return null;

    const window = SEASON_SOWING_WINDOWS[season];
    if (!window) return null; // Perennial / unknown — no window

    const date = new Date(sowing);
    if (isNaN(date.getTime())) return null;

    const month = date.getMonth() + 1; // getMonth() is 0-based
    if (isMonthInWindow(month, window)) return null;

    // Kept to one line: the message sits in a fixed-height slot under the field.
    return `${season} is usually sown ${window.label}.`;
  }

  obsSearch = '';
  onObsSearchChange() { this.obsPage = 0; }

  // Observations filtered by the search box: matches farmer name, crop, growth
  // stage, remarks and the pest/disease flag wording.
  filteredObservations(): any[] {
    const list = this.growthObservations();
    const q = this.obsSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(o => {
      // Searchable synonyms so both the new label and the underlying meaning match.
      const flagText = o.pestOrDiseaseFlag
        ? 'failed danger disease pest'
        : 'passed healthy clear';
      return this.getFarmerNameForPlan(o.planId).toLowerCase().includes(q) ||
        this.getCropNameForPlan(o.planId).toLowerCase().includes(q) ||
        this.getStageLabel(o.stage).toLowerCase().includes(q) ||
        (o.stage || '').toLowerCase().includes(q) ||
        (o.remarks || '').toLowerCase().includes(q) ||
        flagText.includes(q);
    });
  }

  paginatedObservations(): any[] {
    const sorted = this.applySort(this.filteredObservations(), this.obsSortField(), this.obsSortAsc());
    return this.page(sorted, this.obsPage, this.obsPageSize);
  }
  onObsPageChange(p: number) { this.obsPage = p; }
  onObsPageSizeChange(s: number) { this.obsPageSize = s; this.obsPage = 0; }

  paginatedProfiles(): any[] { return this.page(this.farmerProfiles(), this.profilePage, this.profilePageSize); }
  onProfilePageChange(p: number) { this.profilePage = p; }
  onProfilePageSizeChange(s: number) { this.profilePageSize = s; this.profilePage = 0; }

  paginatedHoldings(): any[] { return this.page(this.landHoldings(), this.holdingPage, this.holdingPageSize); }
  onHoldingPageChange(p: number) { this.holdingPage = p; }
  onHoldingPageSizeChange(s: number) { this.holdingPageSize = s; this.holdingPage = 0; }

  // Helpers
  getCropName(cropId: number): string {
    const crop = this.cropCatalogs().find(c => c.cropId == cropId);
    return crop ? crop.cropName : `Crop ID: ${cropId}`;
  }

  // Resolve the owning farmer's name (falls back to a label if not loaded).
  getFarmerName(farmerId: number): string {
    const prof = this.farmerProfiles().find(f => f.farmerId == farmerId);
    return prof ? `${prof.name}(#${farmerId})` : `Farmer #${farmerId}`;
  }

  // ================= FORM VALIDATION FEEDBACK =================
  /** True once the user has interacted with a control that is now invalid. */
  showError(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  cropNameError(): string {
    const errors = this.catalogForm.get('cropName')?.errors || {};
    if (errors['required']) return 'Crop name is required.';
    if (errors['maxlength']) return `Use ${MAX_CROP_NAME_LENGTH} characters or fewer.`;
    return `Use 2-${MAX_CROP_NAME_LENGTH} letters only — no digits or special characters.`;
  }

  durationError(): string {
    const errors = this.catalogForm.get('typicalDurationDays')?.errors || {};
    if (errors['required']) return 'Typical duration is required.';
    if (errors['wholeNumber']) return 'Enter a whole number of days.';
    return `Enter a duration between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days.`;
  }

  yieldError(): string {
    const errors = this.catalogForm.get('expectedYieldPerAcre')?.errors || {};
    if (errors['required']) return 'Expected yield is required.';
    return `Enter a yield between ${MIN_YIELD_TONS} and ${MAX_YIELD_TONS} tons per acre.`;
  }

  areaError(): string {
    const errors = this.planForm.get('areaPlanted')?.errors || {};
    if (errors['required']) return 'Area planted is required.';
    return `Enter an area between ${MIN_AREA_ACRES} and ${MAX_AREA_ACRES} acres.`;
  }

  // ================= COLUMN SORTING =================
  // Click a sortable header to sort ascending; click again for descending.
  sortCatalogBy(field: string) {
    this.toggleSort(this.catalogSortField, this.catalogSortAsc, field);
    this.catalogPage = 0;
  }

  sortPlansBy(field: string) {
    this.toggleSort(this.planSortField, this.planSortAsc, field);
    this.planPage = 0;
  }

  sortObsBy(field: string) {
    this.toggleSort(this.obsSortField, this.obsSortAsc, field);
    this.obsPage = 0;
  }

  private toggleSort(fieldSig: WritableSignal<string | null>,
                     ascSig: WritableSignal<boolean>, field: string) {
    if (fieldSig() === field) {
      ascSig.set(!ascSig());
    } else {
      fieldSig.set(field);
      ascSig.set(true);
    }
  }

  /** Header arrow: neutral when the column isn't the one being sorted on. */
  sortIcon(isActive: boolean, asc: boolean): string {
    if (!isActive) return 'unfold_more';
    return asc ? 'arrow_upward' : 'arrow_downward';
  }

  /** Sorts by a field, comparing dates chronologically and numbers numerically. */
  private applySort(list: any[], field: string | null, asc: boolean): any[] {
    if (!field) return list;
    const direction = asc ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      // Blanks always sink to the bottom, whichever direction is active.
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (field.toLowerCase().includes('date')) {
        return (new Date(va).getTime() - new Date(vb).getTime()) * direction;
      }
      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * direction;
      }
      return String(va).localeCompare(String(vb)) * direction;
    });
  }

  // Farmer-profile ids owned by the logged-in user.
  // Returns null for non-farmers (Admin/Officer) => they see everything.
  private myOwnedFarmerIds(): number[] | null {
    if (!this.isFarmer()) return null;
    const uid = this.authService.currentUserValue?.userId;
    return this.farmerProfiles().filter(p => p.userId == uid).map(p => p.farmerId);
  }

  // Farmer profiles the current user may plan against (own profiles only, for a Farmer).
  plannableFarmerProfiles(): any[] {
    const owned = this.myOwnedFarmerIds();
    if (owned === null) return this.farmerProfiles();
    return this.farmerProfiles().filter(p => owned.includes(p.farmerId));
  }

  // Land holdings the current user may plan against. Scoped to the user's own
  // holdings (for a Farmer) and further narrowed to the farmer selected in the
  // plan form, since a holding belongs to exactly one farmer.
  plannableLandHoldings(): any[] {
    const owned = this.myOwnedFarmerIds();
    let list = owned === null ? this.landHoldings() : this.landHoldings().filter(h => owned.includes(h.farmerId));
    const selectedFarmer = this.planForm?.get('farmerId')?.value;
    if (selectedFarmer) {
      list = list.filter(h => h.farmerId == selectedFarmer);
    }
    return list;
  }

  // The land holding currently selected in the plan form (or null).
  private selectedHolding(): any | null {
    const holdingId = this.planForm?.get('holdingId')?.value;
    if (!holdingId) return null;
    return this.landHoldings().find(h => h.holdingId == holdingId) || null;
  }

  // Size (acres) of the selected holding, for display in the area warning.
  selectedHoldingArea(): number | null {
    return this.selectedHolding()?.areaAcres ?? null;
  }

  // True when the planted area is larger than the selected holding's total area.
  areaExceedsHolding(): boolean {
    const holding = this.selectedHolding();
    const area = Number(this.planForm?.get('areaPlanted')?.value);
    if (!holding || !area || isNaN(area)) return false;
    return area > Number(holding.areaAcres);
  }

  // True when both dates are set and harvest is not strictly after sowing.
  harvestBeforeSowing(): boolean {
    const sowing = this.planForm?.get('sowingDate')?.value;
    const harvest = this.planForm?.get('expectedHarvestDate')?.value;
    if (!sowing || !harvest) return false;
    return new Date(harvest).getTime() <= new Date(sowing).getTime();
  }

  // Suggest an expected harvest date = sowing date + the crop's typical
  // duration, but only when a harvest date hasn't already been entered so a
  // manual value is never overwritten.
  private autoFillHarvestDate(): void {
    const sowing = this.planForm?.get('sowingDate')?.value;
    const cropId = this.planForm?.get('cropId')?.value;
    const existingHarvest = this.planForm?.get('expectedHarvestDate')?.value;
    if (!sowing || !cropId || existingHarvest) return;
    const crop = this.cropCatalogs().find(c => c.cropId == cropId);
    if (!crop?.typicalDurationDays) return;
    const harvest = new Date(sowing);
    harvest.setDate(harvest.getDate() + Number(crop.typicalDurationDays));
    this.planForm.get('expectedHarvestDate')!.setValue(
      harvest.toISOString().split('T')[0], { emitEvent: false });
  }

  getCropNameForPlan(planId: number): string {
    const plan = this.cropPlans().find(p => p.planId == planId);
    if (!plan) return 'Unknown Plan';
    return this.getCropName(plan.cropId);
  }

  // Resolve the owning farmer's name for an observation's plan.
  getFarmerNameForPlan(planId: number): string {
    const plan = this.cropPlans().find(p => p.planId == planId);
    if (!plan) return '—';
    return this.getFarmerName(plan.farmerId);
  }

  // Distinct farmers that actually own at least one crop plan — used to populate
  // the first dropdown of the observation cascade.
  farmersWithPlans(): { farmerId: number; label: string }[] {
    const ids = Array.from(new Set(this.cropPlans().map(p => p.farmerId)));
    return ids
      .map(id => ({ farmerId: id, label: this.getFarmerName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // Crop plans belonging to the farmer currently chosen in the observation form.
  plansForSelectedFarmer(): any[] {
    const farmerId = this.observationForm?.get('farmerId')?.value;
    if (!farmerId) return [];
    return this.cropPlans().filter(p => p.farmerId == farmerId);
  }

  /**
   * Growth stages in the order a crop passes through them. A plan can only move
   * forward, so anything at or before the stage already logged is behind it.
   */
  readonly growthStages = ['GERMINATION', 'VEGETATIVE', 'FLOWERING', 'MATURITY'];

  /**
   * The stage a plan has already reached — the furthest stage on its most recent
   * observation. Null when nothing has been logged against the plan yet.
   */
  currentStageForPlan(planId: any): string | null {
    if (!planId) return null;
    const logged = this.growthObservations().filter(o => o.planId == planId);
    if (logged.length === 0) return null;
    // Furthest along the flow rather than latest by date, so an out-of-order
    // back-dated entry can't appear to rewind the crop's progress.
    return logged.reduce((furthest, o) =>
      this.growthStages.indexOf(o.stage) > this.growthStages.indexOf(furthest) ? o.stage : furthest,
      logged[0].stage);
  }

  /** Current stage of the plan selected in the observation form. */
  selectedPlanStage(): string | null {
    return this.currentStageForPlan(this.observationForm?.get('planId')?.value);
  }

  /**
   * True when a stage is at or before the plan's current stage — that part of the
   * crop's life is over, so it stays visible but cannot be picked again.
   */
  isStageCompleted(stage: string): boolean {
    const current = this.selectedPlanStage();
    if (!current) return false;
    return this.growthStages.indexOf(stage) <= this.growthStages.indexOf(current);
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'GERMINATION': return 'Germination';
      case 'VEGETATIVE': return 'Vegetative';
      case 'FLOWERING': return 'Flowering';
      case 'MATURITY': return 'Maturity';
      default: return stage;
    }
  }

  // Full status label for crop catalog (backend stores 2-letter codes AC/IN).
  getStatusLabel(status: string): string {
    switch (status) {
      case 'AC': return 'Active';
      case 'IN': return 'Inactive';
      default: return status;
    }
  }

  // Lifecycle status label for a crop plan.
  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'PLANNED': return 'Planned';
      case 'SOWING': return 'Sowing';
      case 'GROWING': return 'Growing';
      case 'HARVESTED': return 'Harvested';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  }

  // Colour class for a crop plan's lifecycle status badge.
  getPlanStatusClass(status: string): string {
    switch (status) {
      case 'PLANNED': return 'badge-secondary';
      case 'SOWING': return 'badge-warning';
      case 'GROWING': return 'badge-success';
      case 'HARVESTED': return 'badge-primary';
      case 'FAILED': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  // ================= INLINE STATUS EDITOR =================
  // Only roles the backend permits to PUT a crop plan may edit status inline
  // (Farmer — restricted to their own plans, which is all a Farmer ever sees —
  // and AgriLinkAdmin). Extension officers can read but not update.
  canEditPlanStatus(): boolean {
    return this.isFarmer() || this.isAdmin();
  }

  toggleStatusMenu(plan: any, event: Event) {
    event.stopPropagation();
    if (this.statusSaving() === plan.planId) return;
    if (this.openStatusPlanId() === plan.planId) {
      this.closeStatusMenu();
      return;
    }
    // Measure the toggle button and position the fixed panel under it, clamped
    // to the viewport so it stays visible however far the table is scrolled.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - STATUS_MENU_WIDTH - 8));
    this.statusMenuLeft.set(left);
    this.statusMenuTop.set(rect.bottom + 4);
    this.openStatusPlanId.set(plan.planId);
  }

  // Close the status menu when the page or a container scrolls (the panel is
  // fixed, so it would otherwise detach from its row).
  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange() {
    this.closeStatusMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeStatusMenu();
  }

  closeStatusMenu() {
    this.openStatusPlanId.set(null);
  }

  // Persist a new status for a plan by re-sending the plan with the status
  // changed. Dates/season are unchanged so they still pass server validation.
  changePlanStatus(plan: any, status: string) {
    this.closeStatusMenu();
    if (plan.status === status) return;

    const body = {
      farmerId: plan.farmerId,
      holdingId: plan.holdingId,
      cropId: plan.cropId,
      season: plan.season,
      year: plan.year,
      sowingDate: plan.sowingDate,
      expectedHarvestDate: plan.expectedHarvestDate,
      areaPlanted: plan.areaPlanted,
      status
    };

    this.statusSaving.set(plan.planId);
    this.cropService.updateCropPlan(plan.planId, body).subscribe({
      next: (res) => {
        this.toast.success(res.message || `Status updated to ${this.getPlanStatusLabel(status)}`);
        // Update the row in place so the table doesn't need a full reload.
        this.cropPlans.set(this.cropPlans().map(p =>
          p.planId === plan.planId ? { ...p, status } : p));
        this.statusSaving.set(null);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not update status');
        this.statusSaving.set(null);
      }
    });
  }

  // Colour class for a growth observation's stage badge (progression palette).
  getStageClass(stage: string): string {
    switch (stage) {
      case 'GERMINATION': return 'badge-info';
      case 'VEGETATIVE': return 'badge-success';
      case 'FLOWERING': return 'badge-warning';
      case 'MATURITY': return 'badge-primary';
      default: return 'badge-info';
    }
  }

  private getCrop(cropId: number): any {
    return this.cropCatalogs().find(c => c.cropId == cropId);
  }

  private fmtDate(d: any): string {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ================= VIEW DETAILS =================
  viewCatalogDetails(crop: any) {
    this.detailTitle.set(`Crop Catalog #${crop.cropId}`);
    this.detailRows.set([
      { label: 'ID', value: crop.cropId },
      { label: 'Crop Name', value: crop.cropName },
      { label: 'Category', value: crop.category },
      { label: 'Season', value: crop.season },
      { label: 'Typical Duration', value: crop.typicalDurationDays + ' Days' },
      { label: 'Expected Yield (in Tons)', value: crop.expectedYieldPerAcre },
      { label: 'Status', value: this.getStatusLabel(crop.status) }
    ]);
    this.showDetailModal.set(true);
  }

  viewPlanDetails(plan: any) {
    const crop = this.getCrop(plan.cropId);
    this.detailTitle.set(`Crop Plan #${plan.planId}`);
    this.detailRows.set([
      { label: 'Plan ID', value: plan.planId },
      { label: 'Farmer', value: this.getFarmerName(plan.farmerId) },
      { label: 'Farmer ID', value: '#' + plan.farmerId },
      { label: 'Land Holding ID', value: '#' + plan.holdingId },
      { label: 'Crop Type', value: this.getCropName(plan.cropId) },
      { label: 'Category', value: crop?.category || '—' },
      { label: 'Season', value: plan.season },
      { label: 'Sowing Date', value: this.fmtDate(plan.sowingDate) },
      { label: 'Estimated Harvest Date', value: this.fmtDate(plan.expectedHarvestDate) },
      { label: 'Estimated Duration', value: crop?.typicalDurationDays ? crop.typicalDurationDays + ' Days' : '—' },
      { label: 'Expected Yield (in Tons)', value: crop?.expectedYieldPerAcre ?? '—' },
      { label: 'Area Planted (in Acres)', value: plan.areaPlanted },
      { label: 'Status', value: this.getPlanStatusLabel(plan.status) }
    ]);
    this.showDetailModal.set(true);
  }

  viewObservationDetails(obs: any) {
    this.detailTitle.set(`Observation #${obs.observationId}`);
    this.detailRows.set([
      { label: 'Observation ID', value: obs.observationId },
      { label: 'Farmer', value: this.getFarmerNameForPlan(obs.planId) },
      { label: 'Crop Plan', value: '#' + obs.planId + ' (' + this.getCropNameForPlan(obs.planId) + ')' },
      { label: 'Officer ID', value: '#' + obs.officerId },
      { label: 'Observation Date', value: this.fmtDate(obs.observationDate) },
      { label: 'Growth Stage', value: this.getStageLabel(obs.stage) },
      { label: 'Health Check', value: obs.pestOrDiseaseFlag ? 'Failed — pest or disease detected' : 'Passed' },
      { label: 'Remarks', value: obs.remarks }
    ]);
    this.showDetailModal.set(true);
  }

  viewProfileDetails(prof: any) {
    this.detailTitle.set(`Farmer Profile #${prof.farmerId}`);
    this.detailRows.set([
      { label: 'Farmer ID', value: '#' + prof.farmerId },
      { label: 'Name', value: prof.name },
      { label: 'Village', value: prof.village },
      { label: 'District', value: prof.district },
      { label: 'State', value: prof.state }
    ]);
    this.showDetailModal.set(true);
  }

  viewHoldingDetails(land: any) {
    this.detailTitle.set(`Land Holding #${land.holdingId}`);
    this.detailRows.set([
      { label: 'Holding ID', value: '#' + land.holdingId },
      { label: 'Farmer ID', value: '#' + land.farmerId },
      { label: 'Survey No', value: land.surveyNumber },
      { label: 'Area (in Acres)', value: land.areaAcres },
      { label: 'Soil Type', value: land.soilType }
    ]);
    this.showDetailModal.set(true);
  }

  // ================= CROP CATALOG CRUD =================
  openCatalogModal(crop?: any) {
    if (crop) {
      this.isEditMode.set(true);
      this.selectedCatalogItem.set(crop);
      this.catalogForm.patchValue(crop);
    } else {
      this.isEditMode.set(false);
      this.selectedCatalogItem.set(null);
      // Reset every control explicitly. Omitting a control makes Angular reset it
      // to null, which no <option> maps to — the select then renders blank instead
      // of its "Select ..." placeholder, so the box can look filled while the
      // control is still empty (invalid).
      this.catalogForm.reset({
        cropName: '',
        category: '',
        season: '',
        status: 'AC',
        typicalDurationDays: 90,
        expectedYieldPerAcre: 1.0
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
      const id = this.selectedCatalogItem().cropId;
      this.cropService.updateCropCatalog(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Crop updated successfully');
          this.closeCatalogModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating crop')
      });
    } else {
      this.cropService.createCropCatalog(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Crop added successfully');
          this.closeCatalogModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating crop')
      });
    }
  }

  confirmDeleteCatalog(crop: any) {
    this.selectedCatalogItem.set(crop);
    this.showDeleteCatalogConfirm.set(true);
  }

  executeDeleteCatalog() {
    const id = this.selectedCatalogItem().cropId;
    this.cropService.deleteCropCatalog(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Crop deleted');
        this.showDeleteCatalogConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Could not delete crop catalog item')
    });
  }

  // ================= CROP PLANS CRUD =================
  openPlanModal(plan?: any) {
    if (plan) {
      this.isEditMode.set(true);
      this.selectedPlan.set(plan);
      this.planForm.patchValue({
        ...plan,
        sowingDate: plan.sowingDate ? plan.sowingDate.split('T')[0] : '',
        expectedHarvestDate: plan.expectedHarvestDate ? plan.expectedHarvestDate.split('T')[0] : ''
      });
      // Reflect the plan's season on the chips when editing.
      this.selectedSeasons.set(plan.season ? [plan.season] : []);
    } else {
      this.isEditMode.set(false);
      this.selectedPlan.set(null);
      const ownProfiles = this.plannableFarmerProfiles();
      const defaultFarmerId = ownProfiles.length > 0 ? ownProfiles[0].farmerId : '';
      const ownHoldings = defaultFarmerId
        ? this.landHoldings().filter(h => h.farmerId == defaultFarmerId)
        : [];
      const defaultHoldingId = ownHoldings.length > 0 ? ownHoldings[0].holdingId : '';
      this.planForm.reset({
        status: 'PLANNED',
        year: new Date().getFullYear(),
        areaPlanted: 0.5,
        cropId: '',
        season: '',
        sowingDate: '',
        expectedHarvestDate: '',
        // Default to the logged-in user's OWN profile and one of its holdings.
        // Defaulting from the unscoped lists preselected whichever profile was
        // registered most recently — someone else's — and the land dropdown then
        // came up empty, because no holding of theirs belongs to that farmer.
        farmerId: defaultFarmerId,
        holdingId: defaultHoldingId
      });
      this.selectedSeasons.set([]);
    }
    this.showPlanModal.set(true);
  }

  closePlanModal() {
    this.showPlanModal.set(false);
  }

  submitPlanForm() {
    if (this.planForm.invalid) return;

    // Cross-field rules the built-in validators can't express.
    if (this.harvestBeforeSowing()) {
      this.toast.error('Expected harvest date must be after the sowing date.');
      return;
    }
    if (this.areaExceedsHolding()) {
      this.toast.error(`Area planted exceeds the selected land holding's size (${this.selectedHoldingArea()} acres).`);
      return;
    }

    const body = this.planForm.value;

    if (this.isEditMode()) {
      const id = this.selectedPlan().planId;
      this.cropService.updateCropPlan(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Plan updated');
          this.closePlanModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating plan')
      });
    } else {
      this.cropService.createCropPlan(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Plan created');
          this.closePlanModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error creating plan')
      });
    }
  }

  confirmDeletePlan(plan: any) {
    this.selectedPlan.set(plan);
    this.showDeletePlanConfirm.set(true);
  }

  executeDeletePlan() {
    const id = this.selectedPlan().planId;
    this.cropService.deleteCropPlan(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Plan deleted');
        this.showDeletePlanConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Could not delete plan')
    });
  }

  // ================= OBSERVATIONS CRUD =================
  openAddObservationModal(plan?: any) {
    this.selectedPlan.set(plan || null);
    this.observationForm.reset({
      farmerId: plan ? plan.farmerId : '',
      planId: plan ? plan.planId : '',
      observationDate: new Date().toISOString().split('T')[0],
      stage: '',
      pestOrDiseaseFlag: false,
      remarks: ''
    });
    this.showObservationModal.set(true);
  }

  closeObservationModal() {
    this.showObservationModal.set(false);
  }

  submitObservationForm() {
    if (this.observationForm.invalid) return;
    const session = this.authService.currentUserValue;
    const { farmerId, ...observation } = this.observationForm.value;
    const body = {
      ...observation,
      officerId: session ? session.userId : 1
    };

    this.cropService.createGrowthObservation(body).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Observation logged');
        this.closeObservationModal();
        this.loadAllData();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error logging observation')
    });
  }

  confirmDeleteObservation(obs: any) {
    this.selectedObservation.set(obs);
    this.showDeleteObservationConfirm.set(true);
  }

  executeDeleteObservation() {
    const id = this.selectedObservation().observationId;
    this.cropService.deleteGrowthObservation(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Log deleted');
        this.showDeleteObservationConfirm.set(false);
        this.loadAllData();
      },
      error: () => this.toast.error('Could not delete observation log')
    });
  }

  // ================= EXPORT (Admin & Extension Officer only) =================
  // Crop plans and growth observations can be exported to Excel (.xls) or PDF.
  // Buttons are gated in the template via isAdminOrOfficer(); we re-check here
  // as a safety net so the data can never be exported by other roles.

  exportCatalog(format: 'excel' | 'pdf') {
    if (!this.isAdminOrOfficer()) return;
    const catalogs = this.cropCatalogs();
    if (catalogs.length === 0) {
      this.toast.error('No crops in catalog to export.');
      return;
    }
    const columns = ['Crop Name', 'Category', 'Season', 'Typical Duration (Days)', 'Expected Yield (Tons)', 'Status'];
    const rows = catalogs.map(c => [
      c.cropName,
      c.category,
      c.season,
      c.typicalDurationDays,
      c.expectedYieldPerAcre,
      this.getStatusLabel(c.status)
    ]);
    this.doExport(format, columns, rows, 'crop-catalog', 'Crop Catalog Database');
  }

  exportPlans(format: 'excel' | 'pdf') {
    if (!this.isAdminOrOfficer()) return;
    const plans = this.filteredPlans();
    if (plans.length === 0) {
      this.toast.error('No crop plans to export.');
      return;
    }
    const columns = ['Farmer', 'Farmer ID', 'Crop Type', 'Season', 'Sowing Date', 'Estimated Harvest', 'Area (Acres)', 'Status'];
    const rows = plans.map(p => [
      this.getFarmerName(p.farmerId),
      '#' + p.farmerId,
      this.getCropName(p.cropId),
      p.season,
      this.fmtDate(p.sowingDate),
      this.fmtDate(p.expectedHarvestDate),
      p.areaPlanted,
      this.getPlanStatusLabel(p.status)
    ]);
    this.doExport(format, columns, rows, 'crop-plans', 'Crop Seeding & Harvesting Plans');
  }

  exportObservations(format: 'excel' | 'pdf') {
    if (!this.isAdminOrOfficer()) return;
    const observations = this.growthObservations();
    if (observations.length === 0) {
      this.toast.error('No growth observations to export.');
      return;
    }
    const columns = ['Farmer', 'Crop Plan', 'Observation Date', 'Growth Stage', 'Health Check', 'Remarks'];
    const rows = observations.map(o => [
      this.getFarmerNameForPlan(o.planId),
      '#' + o.planId + ' — ' + this.getCropNameForPlan(o.planId),
      this.fmtDate(o.observationDate),
      this.getStageLabel(o.stage),
      o.pestOrDiseaseFlag ? 'Failed' : 'Passed',
      o.remarks
    ]);
    this.doExport(format, columns, rows, 'growth-observations', 'Crop Growth Observation Reports');
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

  // ================= FARMER PROFILE & HOLDINGS CRUD =================
  openProfileModal(profile?: any) {
    if (profile) {
      this.isEditMode.set(true);
      this.selectedCatalogItem.set(profile); // reuse ref
      this.profileForm.patchValue({
        ...profile,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
      });
    } else {
      this.isEditMode.set(false);
      this.selectedCatalogItem.set(null);
      this.profileForm.reset({
        name: '', dateOfBirth: '', gender: '', nationalIdNumber: '',
        village: '', district: '', state: '', phone: '', bankAccountNumber: ''
      });
    }
    this.showProfileModal.set(true);
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
  }

  submitProfileForm() {
    if (this.profileForm.invalid) return;
    const body = {
      ...this.profileForm.value,
      status: 'AC'
    };

    if (this.isEditMode()) {
      const id = this.selectedCatalogItem().farmerId;
      this.farmerService.updateFarmerProfile(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Profile updated');
          this.closeProfileModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating profile')
      });
    } else {
      this.farmerService.createFarmerProfile(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Profile created');
          this.closeProfileModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error registering profile')
      });
    }
  }

  openHoldingModal(holding?: any) {
    if (holding) {
      this.isEditMode.set(true);
      this.selectedCatalogItem.set(holding); // reuse ref
      this.holdingForm.patchValue(holding);
    } else {
      this.isEditMode.set(false);
      this.selectedCatalogItem.set(null);
      const ownProfiles = this.plannableFarmerProfiles();
      this.holdingForm.reset({
        farmerId: ownProfiles.length > 0 ? ownProfiles[0].farmerId : '',
        surveyNumber: '',
        areaAcres: 1.0,
        soilType: '',
        irrigationSource: '',
        ownershipType: ''
      });
    }
    this.showHoldingModal.set(true);
  }

  closeHoldingModal() {
    this.showHoldingModal.set(false);
  }

  submitHoldingForm() {
    if (this.holdingForm.invalid) return;
    const body = {
      ...this.holdingForm.value,
      status: 'AC'
    };

    if (this.isEditMode()) {
      const id = this.selectedCatalogItem().holdingId;
      this.farmerService.updateLandHolding(id, body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Land updated');
          this.closeHoldingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error updating land')
      });
    } else {
      this.farmerService.createLandHolding(body).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Land registered');
          this.closeHoldingModal();
          this.loadAllData();
        },
        error: (err) => this.toast.error(err.error?.message || 'Error registering land')
      });
    }
  }
}
