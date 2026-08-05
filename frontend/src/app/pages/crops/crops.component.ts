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
  template: `
    <div class="crops-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Crops & Farm Operations</h1>
          <p class="text-secondary">Plan crops, log development stages, view observations, and manage farmer details.</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs-container mb-3">
        <button class="tab-btn" [class.active]="activeTab() === 'catalog'" (click)="setTab('catalog')"
                title="Master list of supported crops">
          <i class="material-icons-round">list_alt</i>
          <span>Crop Catalog</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'plans'" (click)="setTab('plans')"
                title="Seasonal sowing and harvesting schedules">
          <i class="material-icons-round">calendar_today</i>
          <span>Crop Plans</span>
        </button>
        @if (canViewObservations()) {
          <button class="tab-btn" [class.active]="activeTab() === 'observations'" (click)="setTab('observations')"
                  title="Field inspection and growth stage logs">
            <i class="material-icons-round">visibility</i>
            <span>Growth Observation</span>
          </button>
        }
      </div>

      <!-- Spinner -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Fetching records...</p>
        </div>
      } @else {
        <!-- TABS CONTENT -->

        <!-- 1. CROP CATALOG TAB -->
        @if (activeTab() === 'catalog') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center">
              <h3>Crop Catalog Database</h3>
              <div class="header-actions">
                @if (isAdminOrOfficer() && cropCatalogs().length > 0) {
                  <button class="btn btn-export btn-export-icon" (click)="exportCatalog('excel')"
                          title="Export to XLS" aria-label="Export to XLS">
                    <i class="material-icons-round icon-xls">grid_on</i>
                  </button>
                  <button class="btn btn-export btn-export-icon" (click)="exportCatalog('pdf')"
                          title="Export to PDF" aria-label="Export to PDF">
                    <i class="material-icons-round icon-pdf">picture_as_pdf</i>
                  </button>
                }
                @if (isAdmin()) {
                  <button class="btn btn-primary" (click)="openCatalogModal()"
                          title="Add a new crop to the catalog">
                    <i class="material-icons-round">add_circle</i>
                    <span>Catalog</span>
                  </button>
                }
              </div>
            </div>
            <p class="text-secondary mb-3">
              Master list of supported crops that farmers choose from when creating crop plans.
            </p>

            @if (cropCatalogs().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">grass</i>
                <h3>No Crops in Catalog</h3>
                <p>Add crops to catalog to start scheduling plans.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Crop Name</th>
                        <th>Category</th>
                        <th>Season</th>
                        <th class="sortable" (click)="sortCatalogBy('typicalDurationDays')"
                            title="Sort by typical duration (click again to reverse)">
                          <span>Typical Duration</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="catalogSortField() === 'typicalDurationDays'">{{ sortIcon(catalogSortField() === 'typicalDurationDays', catalogSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortCatalogBy('expectedYieldPerAcre')"
                            title="Sort by expected yield (click again to reverse)">
                          <span>Expected Yield (in Tons)</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="catalogSortField() === 'expectedYieldPerAcre'">{{ sortIcon(catalogSortField() === 'expectedYieldPerAcre', catalogSortAsc()) }}</i>
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (crop of paginatedCatalog(); track crop.cropId) {
                        <tr>
                          <td class="cell-name"><strong>{{ crop.cropName }}</strong></td>
                          <td class="cell-nowrap">{{ crop.category }}</td>
                          <td class="cell-nowrap">{{ crop.season }}</td>
                          <td class="cell-nowrap">{{ crop.typicalDurationDays }} Days</td>
                          <td class="cell-nowrap">{{ crop.expectedYieldPerAcre }}</td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewCatalogDetails(crop)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isAdmin()) {
                                <button class="menu-item" (click)="openCatalogModal(crop)">
                                  <i class="material-icons-round">edit</i> Edit
                                </button>
                                <button class="menu-item danger" (click)="confirmDeleteCatalog(crop)">
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
                  [currentPage]="catalogPage"
                  [pageSize]="catalogPageSize"
                  [totalElements]="cropCatalogs().length"
                  (pageChange)="onCatalogPageChange($event)"
                  (pageSizeChange)="onCatalogPageSizeChange($event)">
                </app-pagination>
              </div>
            }
          </div>
        }

        <!-- 2. CROP PLANS TAB -->
        @if (activeTab() === 'plans') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center">
              <h3>Crop Seeding &amp; Harvesting Plans</h3>
              <div class="header-actions">
                @if (isAdminOrOfficer() && cropPlans().length > 0) {
                  <button class="btn btn-export btn-export-icon" (click)="exportPlans('excel')"
                          title="Export to XLS" aria-label="Export to XLS">
                    <i class="material-icons-round icon-xls">grid_on</i>
                  </button>
                  <button class="btn btn-export btn-export-icon" (click)="exportPlans('pdf')"
                          title="Export to PDF" aria-label="Export to PDF">
                    <i class="material-icons-round icon-pdf">picture_as_pdf</i>
                  </button>
                }
                @if (isFarmer()) {
                  <button class="btn btn-primary" (click)="openPlanModal()"
                          title="Create a new crop plan">
                    <i class="material-icons-round">add_circle</i>
                    <span>Plan</span>
                  </button>
                }
              </div>
            </div>
            <p class="text-secondary mb-3">
              Seasonal planting schedules — which crop is sown on which land, and when it is expected to be harvested.
            </p>

            @if (cropPlans().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">agriculture</i>
                <h3>No Crop Plans Scheduled</h3>
                <p>Get started by creating a new planting plan.</p>
              </div>
            } @else {
              <div class="card filters-card mb-3">
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="planSearch">Search</label>
                  <div class="search-field">
                    <input type="text" id="planSearch" [(ngModel)]="planSearch"
                      (ngModelChange)="onPlanSearchChange()"
                      [placeholder]="isFarmer() ? 'Search by crop, status or season...' : 'Search by farmer, crop, status or season...'"
                      title="Filter the crop plans below" />
                    <i class="material-icons-round search-icon">search</i>
                  </div>
                </div>
              </div>

              @if (filteredPlans().length === 0) {
                <div class="empty-state card">
                  <i class="material-icons-round">search_off</i>
                  <h3>No Matching Plans</h3>
                  <p>No crop plans match "{{ planSearch }}".</p>
                </div>
              } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        @if (!isFarmer()) { <th>Farmer</th> }
                        <th>Crop Type</th>
                        <th>Season</th>
                        <th class="sortable" (click)="sortPlansBy('sowingDate')"
                            title="Sort by sowing date (click again to reverse)">
                          <span>Sowing Date</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="planSortField() === 'sowingDate'">{{ sortIcon(planSortField() === 'sowingDate', planSortAsc()) }}</i>
                        </th>
                        <th class="sortable" (click)="sortPlansBy('expectedHarvestDate')"
                            title="Sort by estimated harvest date (click again to reverse)">
                          <span>Estimated Harvest</span>
                          <i class="material-icons-round sort-icon"
                             [class.active]="planSortField() === 'expectedHarvestDate'">{{ sortIcon(planSortField() === 'expectedHarvestDate', planSortAsc()) }}</i>
                        </th>
                        <th>Area (in Acres)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (plan of paginatedPlans(); track plan.planId) {
                        <tr>
                          @if (!isFarmer()) { <td class="cell-name"><strong>{{ getFarmerName(plan.farmerId) }}</strong></td> }
                          <td class="cell-nowrap">{{ getCropName(plan.cropId) }}</td>
                          <td class="cell-nowrap">{{ plan.season }}</td>
                          <td class="cell-nowrap">{{ plan.sowingDate | date:'mediumDate' }}</td>
                          <td class="cell-nowrap">{{ plan.expectedHarvestDate | date:'mediumDate' }}</td>
                          <td class="cell-nowrap">{{ plan.areaPlanted }}</td>
                          <td>
                            @if (canEditPlanStatus()) {
                              <div class="status-editor">
                                <button type="button" class="badge status-badge" [ngClass]="getPlanStatusClass(plan.status)"
                                  (click)="toggleStatusMenu(plan, $event)" [disabled]="statusSaving() === plan.planId"
                                  title="Click to change this plan's status">
                                  @if (statusSaving() === plan.planId) {
                                    <span class="spinner-tiny"></span>
                                  }
                                  <span>{{ getPlanStatusLabel(plan.status) }}</span>
                                  <i class="material-icons-round">arrow_drop_down</i>
                                </button>
                                @if (openStatusPlanId() === plan.planId) {
                                  <div class="status-menu-backdrop" (click)="closeStatusMenu()"></div>
                                  <div class="status-menu"
                                    [style.top.px]="statusMenuTop()" [style.left.px]="statusMenuLeft()">
                                    @for (s of planStatuses; track s) {
                                      <button type="button" class="status-option" (click)="changePlanStatus(plan, s)">
                                        <span class="badge" [ngClass]="getPlanStatusClass(s)">{{ getPlanStatusLabel(s) }}</span>
                                        @if (plan.status === s) { <i class="material-icons-round check">check</i> }
                                      </button>
                                    }
                                  </div>
                                }
                              </div>
                            } @else {
                              <span class="badge" [ngClass]="getPlanStatusClass(plan.status)">
                                {{ getPlanStatusLabel(plan.status) }}
                              </span>
                            }
                          </td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewPlanDetails(plan)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isFarmer()) {
                                <button class="menu-item" (click)="openPlanModal(plan)">
                                  <i class="material-icons-round">edit</i> Edit
                                </button>
                                <button class="menu-item danger" (click)="confirmDeletePlan(plan)">
                                  <i class="material-icons-round">delete</i> Delete
                                </button>
                              }
                              @if (isAdminOrOfficer()) {
                                <button class="menu-item" (click)="openAddObservationModal(plan)">
                                  <i class="material-icons-round">rate_review</i> Log Observation
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
                  [currentPage]="planPage"
                  [pageSize]="planPageSize"
                  [totalElements]="filteredPlans().length"
                  (pageChange)="onPlanPageChange($event)"
                  (pageSizeChange)="onPlanPageSizeChange($event)">
                </app-pagination>
              </div>
              }
            }
          </div>
        }

        <!-- 3. GROWTH OBSERVATIONS TAB -->
        @if (activeTab() === 'observations') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3>Crop Growth Stage Logs & Observation Reports</h3>
                <p class="text-secondary">Field inspection observations registered by extension officers.</p>
              </div>
              @if (isAdminOrOfficer()) {
                <div class="header-actions">
                  @if (growthObservations().length > 0) {
                    <button class="btn btn-export btn-export-icon" (click)="exportObservations('excel')"
                            title="Export to XLS" aria-label="Export to XLS">
                      <i class="material-icons-round icon-xls">grid_on</i>
                    </button>
                    <button class="btn btn-export btn-export-icon" (click)="exportObservations('pdf')"
                            title="Export to PDF" aria-label="Export to PDF">
                      <i class="material-icons-round icon-pdf">picture_as_pdf</i>
                    </button>
                  }
                  <button class="btn btn-primary" (click)="openAddObservationModal()"
                          title="Log a new growth observation">
                    <i class="material-icons-round">add_circle</i>
                    <span>Observation</span>
                  </button>
                </div>
              }
            </div>

            @if (growthObservations().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">assessment</i>
                <h3>No Observations Logged</h3>
                <p>Observations will populate once extension officers submit growth reports on crop plans.</p>
              </div>
            } @else {
              <div class="card filters-card mb-3">
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="obsSearch">Search</label>
                  <div class="search-field">
                    <input type="text" id="obsSearch" [(ngModel)]="obsSearch"
                      (ngModelChange)="onObsSearchChange()"
                      placeholder="Search by farmer, crop, stage, remarks or flag..."
                      title="Filter the observations below" />
                    <i class="material-icons-round search-icon">search</i>
                  </div>
                </div>
              </div>

              @if (filteredObservations().length === 0) {
                <div class="empty-state card">
                  <i class="material-icons-round">search_off</i>
                  <h3>No Matching Observations</h3>
                  <p>No observations match "{{ obsSearch }}".</p>
                </div>
              } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Farmer</th>
                        <th>Crop Plan</th>
                        <th>Date</th>
                        <th>Growth Stage</th>
                        <th>Pest/Disease Flag</th>
                        <th>Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (obs of paginatedObservations(); track obs.observationId) {
                        <tr>
                          <td class="cell-name"><strong>{{ getFarmerNameForPlan(obs.planId) }}</strong></td>
                          <td class="cell-nowrap">{{ getCropNameForPlan(obs.planId) }}</td>
                          <td class="cell-nowrap">{{ obs.observationDate | date:'mediumDate' }}</td>
                          <td>
                            <span class="badge" [ngClass]="getStageClass(obs.stage)">
                              {{ getStageLabel(obs.stage) }}
                            </span>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="obs.pestOrDiseaseFlag ? 'badge-danger' : 'badge-success'">
                              {{ obs.pestOrDiseaseFlag ? 'DANGER: Disease/Pest' : 'Healthy / Clear' }}
                            </span>
                          </td>
                          <td class="cell-remarks">{{ obs.remarks }}</td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewObservationDetails(obs)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isAdminOrOfficer()) {
                                <button class="menu-item danger" (click)="confirmDeleteObservation(obs)">
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
                  [currentPage]="obsPage"
                  [pageSize]="obsPageSize"
                  [totalElements]="filteredObservations().length"
                  (pageChange)="onObsPageChange($event)"
                  (pageSizeChange)="onObsPageSizeChange($event)">
                </app-pagination>
              </div>
              }
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
              <h3>{{ isEditMode() ? 'Edit Crop Catalog Item' : 'Add New Crop to Catalog' }}</h3>
              <button class="close-btn" (click)="closeCatalogModal()" title="Close" aria-label="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="catalogForm" (ngSubmit)="submitCatalogForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="cName">Crop Name</label>
                  <input type="text" id="cName" formControlName="cropName" placeholder="e.g. Basmati Rice"
                         [attr.maxlength]="MAX_CROP_NAME_LENGTH" autocomplete="off"
                         title="2-30 characters, letters only (no digits)" />
                  @if (showError(catalogForm, 'cropName')) {
                    <p class="field-error">{{ cropNameError() }}</p>
                  }
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="cCategory">Category</label>
                    <select id="cCategory" formControlName="category" title="Pick the crop's category">
                      <option value="">Select Category</option>
                      <option value="Cereal">Cereal</option>
                      <option value="Pulse">Pulse</option>
                      <option value="Oilseed">Oilseed</option>
                      <option value="Fibre">Fibre</option>
                      <option value="Cash Crop">Cash Crop</option>
                      <option value="Vegetable">Vegetable</option>
                      <option value="Fruit">Fruit</option>
                      <option value="Spice">Spice</option>
                    </select>
                    @if (showError(catalogForm, 'category')) {
                      <p class="field-error">Select a category.</p>
                    }
                  </div>
                  <div class="form-group">
                    <label for="cSeason">Season</label>
                    <select id="cSeason" formControlName="season" title="Pick the growing season">
                      <option value="">Select Season</option>
                      @for (s of seasons; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                    @if (showError(catalogForm, 'season')) {
                      <p class="field-error">Select a season.</p>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="cDuration">Typical Duration (Days)</label>
                    <input type="number" id="cDuration" formControlName="typicalDurationDays" placeholder="e.g. 120"
                           [min]="MIN_DURATION_DAYS" [max]="MAX_DURATION_DAYS" step="1"
                           title="Whole number of days, between 7 and 365" />
                    @if (showError(catalogForm, 'typicalDurationDays')) {
                      <p class="field-error">{{ durationError() }}</p>
                    }
                  </div>
                  <div class="form-group">
                    <label for="cYield">Exp. Yield per Acre (Tons)</label>
                    <input type="number" step="0.1" id="cYield" formControlName="expectedYieldPerAcre" placeholder="e.g. 2.5"
                           [min]="MIN_YIELD_TONS" [max]="MAX_YIELD_TONS"
                           title="Between 0.1 and 100 tons per acre" />
                    @if (showError(catalogForm, 'expectedYieldPerAcre')) {
                      <p class="field-error">{{ yieldError() }}</p>
                    }
                  </div>
                </div>
                <!-- Status is not shown: a catalogued crop is always created
                     Active, so the form sets it automatically on save. -->
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary btn-save-icon" [disabled]="catalogForm.invalid"
                        title="Save" aria-label="Save">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 2. Plan Create/Edit Modal -->
      @if (showPlanModal()) {
        <div class="modal-overlay" (click)="closePlanModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Crop Plan' : 'Create Crop Plan Schedule' }}</h3>
              <button class="close-btn" (click)="closePlanModal()" title="Close" aria-label="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="planForm" (ngSubmit)="submitPlanForm()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="pFarmer">Farmer Profile</label>
                    <select id="pFarmer" formControlName="farmerId">
                      <option value="">Select Profile</option>
                      @for (prof of plannableFarmerProfiles(); track prof.farmerId) {
                        <option [value]="prof.farmerId">{{ prof.name }}(#{{ prof.farmerId }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="pHolding">Land Holding</label>
                    <select id="pHolding" formControlName="holdingId">
                      <option value="">Select Land</option>
                      @for (land of plannableLandHoldings(); track land.holdingId) {
                        <option [value]="land.holdingId">Survey: {{ land.surveyNumber }} (#{{ land.holdingId }})</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Season</label>
                  <div class="season-chips">
                    <button type="button" class="chip" [class.active]="selectedSeasons().length === 0"
                      (click)="clearSeasonChips()">All</button>
                    @for (s of seasons; track s) {
                      <button type="button" class="chip" [class.active]="isSeasonSelected(s)"
                        (click)="toggleSeasonChip(s)">{{ s }}</button>
                    }
                  </div>
                </div>

                <div class="form-group">
                  <label for="pCrop">Crop Type</label>
                  <select id="pCrop" formControlName="cropId">
                    <option value="">Select crop type</option>
                    @for (crop of cropsForPlanSeason(); track crop.cropId) {
                      <option [value]="crop.cropId">{{ crop.cropName }} ({{ crop.season }})</option>
                    }
                  </select>
                  @if (planForm.get('season')?.value) {
                    <p class="text-secondary" style="margin: 0.4rem 0 0;">
                      Season fixed to <strong>{{ planForm.get('season')?.value }}</strong> for this crop.
                    </p>
                  }
                </div>

                <!-- No Year field: it is taken from the sowing date below. -->
                <div class="form-row">
                  <div class="form-group">
                    <label for="pSowing">Sowing Date</label>
                    <input type="date" id="pSowing" formControlName="sowingDate" />
                    @if (sowingWindowWarning()) {
                      <p class="season-window-warning">
                        <i class="material-icons-round">info</i>
                        <span>{{ sowingWindowWarning() }}</span>
                      </p>
                    }
                  </div>
                  <div class="form-group">
                    <label for="pHarvest">Expected Harvest Date</label>
                    <input type="date" id="pHarvest" formControlName="expectedHarvestDate"
                      [min]="planForm.get('sowingDate')?.value || null" />
                    @if (harvestBeforeSowing()) {
                      <p class="season-window-warning" style="color: var(--danger);">
                        <i class="material-icons-round">error_outline</i>
                        <span>Harvest date must be after the sowing date.</span>
                      </p>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="pArea">Area Planted (in Acres)</label>
                    <input type="number" step="0.01" id="pArea" formControlName="areaPlanted"
                           [min]="MIN_AREA_ACRES" [max]="MAX_AREA_ACRES"
                           title="Between 0.01 and 10000 acres" />
                    @if (showError(planForm, 'areaPlanted')) {
                      <p class="field-error">{{ areaError() }}</p>
                    }
                    @if (areaExceedsHolding()) {
                      <p class="season-window-warning" style="color: var(--danger);">
                        <i class="material-icons-round">error_outline</i>
                        <span>Area planted exceeds the selected land holding's size ({{ selectedHoldingArea() }} acres).</span>
                      </p>
                    }
                  </div>
                  <div class="form-group">
                    <label for="pStatus">Status</label>
                    <select id="pStatus" formControlName="status">
                      <option value="">Select Status</option>
                      <option value="PLANNED">Planned</option>
                      <option value="SOWING">Sowing</option>
                      <option value="GROWING">Growing</option>
                      <option value="HARVESTED">Harvested</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary btn-save-icon" [disabled]="planForm.invalid"
                        title="Save" aria-label="Save">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 3. Add Observation Modal -->
      @if (showObservationModal()) {
        <div class="modal-overlay" (click)="closeObservationModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Log Growth Inspection Observation</h3>
              <button class="close-btn" (click)="closeObservationModal()" title="Close" aria-label="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="observationForm" (ngSubmit)="submitObservationForm()">
              <div class="modal-body">
                <div class="form-row">
                  <div class="form-group">
                    <label for="oFarmer">Farmer</label>
                    <select id="oFarmer" formControlName="farmerId">
                      <option value="">Select Farmer</option>
                      @for (f of farmersWithPlans(); track f.farmerId) {
                        <option [value]="f.farmerId">{{ f.label }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="oPlan">Crop Plan</label>
                    <select id="oPlan" formControlName="planId"
                            [attr.disabled]="observationForm.get('farmerId')?.value ? null : true">
                      <option value="">{{ observationForm.get('farmerId')?.value ? 'Select Crop Plan' : 'Select a farmer first' }}</option>
                      @for (plan of plansForSelectedFarmer(); track plan.planId) {
                        <option [value]="plan.planId">#{{ plan.planId }} — {{ getCropName(plan.cropId) }} ({{ plan.season }} {{ plan.year }})</option>
                      }
                    </select>
                  </div>
                </div>
                @if (observationForm.get('planId')?.value) {
                  <p class="text-secondary" style="margin: 0.4rem 0 0;">
                    Farmer: <strong>{{ getFarmerNameForPlan(observationForm.get('planId')?.value) }}</strong>
                    &nbsp;|&nbsp; Crop: <strong>{{ getCropNameForPlan(observationForm.get('planId')?.value) }}</strong>
                  </p>
                }

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="oDate">Observation Date</label>
                    <input type="date" id="oDate" formControlName="observationDate" />
                  </div>
                  <div class="form-group">
                    <label for="oStage">Growth Stage Flow</label>
                    <select id="oStage" formControlName="stage">
                      <option value="">Select Stage</option>
                      <option value="GERMINATION">Germination</option>
                      <option value="VEGETATIVE">Vegetative</option>
                      <option value="FLOWERING">Flowering</option>
                      <option value="MATURITY">Maturity</option>
                    </select>
                  </div>
                </div>

                <label for="oFlag" class="observation-flag mt-3"
                       [class.observation-flag--active]="observationForm.get('pestOrDiseaseFlag')?.value">
                  <input type="checkbox" id="oFlag" formControlName="pestOrDiseaseFlag" />
                  <span class="observation-flag__icon">
                    <i class="material-icons-round">pest_control</i>
                  </span>
                  <span class="observation-flag__text">
                    <strong>Pest or Disease Infestation</strong>
                    <small>Tick this if pests or disease were spotted during inspection</small>
                  </span>
                </label>

                <div class="form-group mt-3">
                  <label for="oRemarks">Remarks & Description</label>
                  <textarea id="oRemarks" formControlName="remarks" rows="3" placeholder="Describe the health status, weed growth, fertilizer applications..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary btn-save-icon" [disabled]="observationForm.invalid"
                        title="Log Observation" aria-label="Log Observation">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 4. Farmer Profile Modal -->
      @if (showProfileModal()) {
        <div class="modal-overlay" (click)="closeProfileModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Farmer Identity Details' : 'Register Farmer Identity Profile' }}</h3>
              <button class="close-btn" (click)="closeProfileModal()" title="Close" aria-label="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="profileForm" (ngSubmit)="submitProfileForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="fName">Full Name</label>
                  <input type="text" id="fName" formControlName="name" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fDob">Date of Birth</label>
                    <input type="date" id="fDob" formControlName="dateOfBirth" />
                  </div>
                  <div class="form-group">
                    <label for="fGender">Gender</label>
                    <select id="fGender" formControlName="gender">
                      <option value="">Select Gender</option>
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
                  </div>
                  <div class="form-group">
                    <label for="fPhone">Phone Number</label>
                    <input type="text" id="fPhone" formControlName="phone" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fVillage">Village</label>
                    <input type="text" id="fVillage" formControlName="village" />
                  </div>
                  <div class="form-group">
                    <label for="fDistrict">District</label>
                    <input type="text" id="fDistrict" formControlName="district" />
                  </div>
                  <div class="form-group">
                    <label for="fState">State</label>
                    <select id="fState" formControlName="state">
                      <option value="">Select State</option>
                      @for (st of indianStates; track st) {
                        <option [value]="st">{{ st }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label for="fBank">Bank Account Number</label>
                  <input type="text" id="fBank" formControlName="bankAccountNumber" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary btn-save-icon" [disabled]="profileForm.invalid"
                        title="Save Profile" aria-label="Save Profile">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- 5. Land Holding Modal -->
      @if (showHoldingModal()) {
        <div class="modal-overlay" (click)="closeHoldingModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit Land Details' : 'Register Land Holding' }}</h3>
              <button class="close-btn" (click)="closeHoldingModal()" title="Close" aria-label="Close">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="holdingForm" (ngSubmit)="submitHoldingForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="lFarmer">Assign to Profile</label>
                  <select id="lFarmer" formControlName="farmerId">
                    <option value="">Select Profile</option>
                    @for (prof of plannableFarmerProfiles(); track prof.farmerId) {
                      <option [value]="prof.farmerId">{{ prof.name }}(#{{ prof.farmerId }})</option>
                    }
                  </select>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lSurvey">Survey Number (Unique)</label>
                    <input type="text" id="lSurvey" formControlName="surveyNumber" placeholder="e.g. SR-4012" />
                  </div>
                  <div class="form-group">
                    <label for="lArea">Area (in Acres)</label>
                    <input type="number" step="0.01" id="lArea" formControlName="areaAcres" />
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
                  </div>
                </div>
                <div class="form-group">
                  <label for="lOwnership">Ownership Type</label>
                  <select id="lOwnership" formControlName="ownershipType">
                    <option value="">Select</option>
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                    <option value="SharedCropping">Shared Cropping</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary btn-save-icon" [disabled]="holdingForm.invalid"
                        title="Register" aria-label="Register">
                  <i class="material-icons-round">save</i>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modals -->
      @if (showDeleteCatalogConfirm()) {
        <app-confirmation-modal
          title="Delete Crop Catalog Entry"
          [message]="'Are you sure you want to delete crop catalog ' + selectedCatalogItem()?.cropName + '?'"
          (confirm)="executeDeleteCatalog()"
          (cancel)="showDeleteCatalogConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showDeletePlanConfirm()) {
        <app-confirmation-modal
          title="Delete Crop Plan Schedule"
          message="Are you sure you want to delete this scheduled crop plan?"
          (confirm)="executeDeletePlan()"
          (cancel)="showDeletePlanConfirm.set(false)">
        </app-confirmation-modal>
      }

      @if (showDeleteObservationConfirm()) {
        <app-confirmation-modal
          title="Delete Observation Log"
          message="Are you sure you want to delete this growth inspection entry?"
          (confirm)="executeDeleteObservation()"
          (cancel)="showDeleteObservationConfirm.set(false)">
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
    .crops-page {
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
    /* Icon-only submit button in modal footers — the tooltip/aria-label carries
       the action name ("Save", "Register", ...). */
    .btn-save-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.6rem 1.4rem;
      border-radius: 0.6rem;
      gap: 0;
    }
    .btn-save-icon .material-icons-round {
      font-size: 22px;
      line-height: 1;
    }
    .btn-small {
      padding: 0.4rem 0.8rem !important;
      font-size: 0.8rem !important;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
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
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 1.5rem;
      align-items: start;
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
    /* Inline validation message under a field */
    .field-error {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0.3rem 0 0;
      font-size: 0.78rem;
      color: var(--danger);
    }
    /* Column behaviour: short values stay on one line, only Remarks wraps —
       so the table reads as tidy columns instead of ragged two-line cells. */
    td.cell-nowrap { white-space: nowrap; }
    td.cell-name {
      white-space: nowrap;
      min-width: 140px;
    }
    td.cell-remarks {
      min-width: 220px;
      white-space: normal;
      color: var(--text-secondary);
    }
    /* Sortable column headers */
    th.sortable {
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }
    th.sortable:hover { color: var(--primary-color); }
    .sort-icon {
      font-size: 15px;
      vertical-align: middle;
      margin-left: 0.15rem;
      opacity: 0.45;
    }
    .sort-icon.active {
      opacity: 1;
      color: var(--primary-color);
    }
    .criteria-cell {
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .season-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      border: 1px solid var(--border-color);
      background: var(--surface-2, #f2f2f2);
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }
    .chip:hover {
      filter: brightness(0.96);
    }
    .chip.active {
      background: var(--primary-color, #2e7d32);
      color: #fff;
      border-color: var(--primary-color, #2e7d32);
    }
    .chip.active:hover {
      background: var(--primary-hover, #276b2b);
      border-color: var(--primary-hover, #276b2b);
    }
    .status-editor {
      position: relative;
      display: inline-block;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.15rem;
      border: none;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }
    .status-badge:hover:not(:disabled) {
      filter: brightness(0.95);
    }
    .status-badge:disabled {
      cursor: default;
      opacity: 0.8;
    }
    .status-badge i {
      font-size: 16px;
    }
    .status-menu-backdrop {
      position: fixed;
      inset: 0;
      z-index: 20;
    }
    /* Fixed (not absolute) so the panel is never clipped by the table's
       horizontal overflow — top/left are measured from the toggle button. */
    .status-menu {
      position: fixed;
      z-index: 1200;
      background: var(--surface, #fff);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      padding: 0.35rem;
      min-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .status-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      border-radius: 0.35rem;
      width: 100%;
    }
    .status-option:hover {
      background: var(--primary-light, #eef);
    }
    .status-option .check {
      font-size: 16px;
      color: var(--primary-color);
    }
    .spinner-tiny {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s infinite linear;
      display: inline-block;
    }
    .season-window-warning {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.4rem 0 0;
      font-size: 0.8rem;
      color: var(--warning, #b26a00);
    }
    .season-window-warning i {
      font-size: 16px;
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
    /* Icon-only export button — square, no label. The tooltip/aria-label names
       the format. */
    .btn-export-icon {
      padding: 0.5rem;
      width: 38px;
      height: 38px;
      justify-content: center;
      gap: 0;
    }
    .icon-xls { color: #16a34a; }
    .icon-pdf { color: #ef4444; }
    /* Pest/disease flag toggle card */
    .observation-flag {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      width: 100%;
      padding: 0.85rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      background: var(--bg-dark);
      cursor: pointer;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .observation-flag:hover {
      border-color: var(--primary-color);
    }
    .observation-flag input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: var(--danger);
      cursor: pointer;
      flex-shrink: 0;
    }
    .observation-flag__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(148, 163, 184, 0.15);
      color: var(--text-secondary);
      flex-shrink: 0;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .observation-flag__icon .material-icons-round { font-size: 20px; }
    .observation-flag__text {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .observation-flag__text strong { font-size: 0.9rem; }
    .observation-flag__text small {
      color: var(--text-secondary);
      font-size: 0.75rem;
    }
    .observation-flag--active {
      border-color: var(--danger);
      background: rgba(239, 68, 68, 0.08);
    }
    .observation-flag--active .observation-flag__icon {
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
    }
    .observation-flag--active .observation-flag__text strong { color: var(--danger); }
  `]
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

  // Column sorting state for the catalog and plan tables (null = default order).
  catalogSortField = signal<string | null>(null);
  catalogSortAsc = signal<boolean>(true);
  planSortField = signal<string | null>(null);
  planSortAsc = signal<boolean>(true);

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
  planPage = 0;      planPageSize = 5;
  obsPage = 0;       obsPageSize = 5;
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

  // Growth observations: backend allows read only for these roles
  // (Farmer and ProcurementOfficer are denied). Keep the frontend in sync.
  canViewObservations(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst']);
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
      status: ['', Validators.required]
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

        // Load plans (newest sowing date first)
        this.cropService.getAllCropPlans().subscribe({
          next: (plans) => {
            this.cropPlans.set(this.sortByDateDesc(plans, 'sowingDate', 'planId'));
            this.planPage = 0;
          }
        });

        // Load growth logs (newest observation date first) — only for roles
        // the backend permits; Farmer/Procurement would get a 403 otherwise.
        if (this.canViewObservations()) {
          this.cropService.getAllGrowthObservations().subscribe({
            next: (observations) => {
              this.growthObservations.set(this.sortByDateDesc(observations, 'observationDate', 'observationId'));
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

  // Newest date first; ties broken by id so ordering stays stable.
  private sortByDateDesc(list: any[], dateField: string, idField: string): any[] {
    return [...(list || [])].sort((a, b) => {
      const da = a[dateField] ? new Date(a[dateField]).getTime() : 0;
      const db = b[dateField] ? new Date(b[dateField]).getTime() : 0;
      if (db !== da) return db - da;
      return (b[idField] || 0) - (a[idField] || 0);
    });
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

    return `Heads up: ${season} crops are usually sown between ${window.label}. You can still save this plan.`;
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
      const flagText = o.pestOrDiseaseFlag ? 'danger disease pest' : 'healthy clear';
      return this.getFarmerNameForPlan(o.planId).toLowerCase().includes(q) ||
        this.getCropNameForPlan(o.planId).toLowerCase().includes(q) ||
        this.getStageLabel(o.stage).toLowerCase().includes(q) ||
        (o.stage || '').toLowerCase().includes(q) ||
        (o.remarks || '').toLowerCase().includes(q) ||
        flagText.includes(q);
    });
  }

  paginatedObservations(): any[] { return this.page(this.filteredObservations(), this.obsPage, this.obsPageSize); }
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
      { label: 'Pest / Disease', value: obs.pestOrDiseaseFlag ? 'Detected' : 'Healthy / Clear' },
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
        status: '',
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
    const columns = ['Farmer', 'Crop Plan', 'Observation Date', 'Growth Stage', 'Pest/Disease Flag', 'Remarks'];
    const rows = observations.map(o => [
      this.getFarmerNameForPlan(o.planId),
      '#' + o.planId + ' — ' + this.getCropNameForPlan(o.planId),
      this.fmtDate(o.observationDate),
      this.getStageLabel(o.stage),
      o.pestOrDiseaseFlag ? 'Disease/Pest Detected' : 'Healthy / Clear',
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
