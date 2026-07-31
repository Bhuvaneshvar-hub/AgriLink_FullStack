import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CropService } from '../../services/crop.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';
import { notFutureDate, NAME_PATTERN } from '../../utils/validators';
import { INDIAN_STATES } from '../../utils/indian-states';

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
        <button class="tab-btn" [class.active]="activeTab() === 'catalog'" (click)="setTab('catalog')">
          <i class="material-icons-round">list_alt</i>
          <span>Crop Catalog</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'plans'" (click)="setTab('plans')">
          <i class="material-icons-round">calendar_today</i>
          <span>Crop Plans</span>
        </button>
        @if (canViewObservations()) {
          <button class="tab-btn" [class.active]="activeTab() === 'observations'" (click)="setTab('observations')">
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
                  <button class="btn btn-secondary" (click)="exportCatalog('excel')">
                    <i class="material-icons-round">grid_on</i>
                    <span>Export Excel</span>
                  </button>
                  <button class="btn btn-secondary" (click)="exportCatalog('pdf')">
                    <i class="material-icons-round">picture_as_pdf</i>
                    <span>Export PDF</span>
                  </button>
                }
                @if (isAdmin()) {
                  <button class="btn btn-primary" (click)="openCatalogModal()">
                    <i class="material-icons-round">add_circle</i>
                    <span>Add Crop</span>
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
                        <th>Typical Duration</th>
                        <th>Expected Yield (in Tons)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (crop of paginatedCatalog(); track crop.cropId) {
                        <tr>
                          <td><strong>{{ crop.cropName }}</strong></td>
                          <td>{{ crop.category }}</td>
                          <td>{{ crop.season }}</td>
                          <td>{{ crop.typicalDurationDays }} Days</td>
                          <td>{{ crop.expectedYieldPerAcre }}</td>
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
              <h3>{{ isFarmer() ? 'My Crop Plans' : 'Crop Seeding & Harvesting Plans' }}</h3>
              <div class="header-actions">
                @if (isAdminOrOfficer() && cropPlans().length > 0) {
                  <button class="btn btn-secondary" (click)="exportPlans('excel')">
                    <i class="material-icons-round">grid_on</i>
                    <span>Export Excel</span>
                  </button>
                  <button class="btn btn-secondary" (click)="exportPlans('pdf')">
                    <i class="material-icons-round">picture_as_pdf</i>
                    <span>Export PDF</span>
                  </button>
                }
                @if (isFarmer()) {
                  <button class="btn btn-primary" (click)="openPlanModal()">
                    <i class="material-icons-round">add_circle</i>
                    <span>Create Plan</span>
                  </button>
                }
              </div>
            </div>
            <p class="text-secondary mb-3">
              {{ isFarmer()
                ? 'Your seasonal planting schedules — which crop is sown on which land, and when it is expected to be harvested.'
                : 'Seasonal planting schedules of farmers — which crop is sown on which land, and when it is expected to be harvested.' }}
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
                      [placeholder]="isFarmer() ? 'Search by crop, status or season...' : 'Search by farmer, crop, status or season...'" />
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
                        <th>Year</th>
                        <th>Sowing Date</th>
                        <th>Estimated Harvest</th>
                        <th>Area (in Acres)</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (plan of paginatedPlans(); track plan.planId) {
                        <tr>
                          @if (!isFarmer()) { <td><strong>{{ getFarmerName(plan.farmerId) }}</strong></td> }
                          <td>{{ getCropName(plan.cropId) }}</td>
                          <td>{{ plan.season }}</td>
                          <td>{{ plan.year }}</td>
                          <td>{{ plan.sowingDate | date:'mediumDate' }}</td>
                          <td>{{ plan.expectedHarvestDate | date:'mediumDate' }}</td>
                          <td>{{ plan.areaPlanted }}</td>
                          <td>
                            <span class="badge" [ngClass]="getPlanStatusClass(plan.status)">
                              {{ getPlanStatusLabel(plan.status) }}
                            </span>
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
                    <button class="btn btn-secondary" (click)="exportObservations('excel')">
                      <i class="material-icons-round">grid_on</i>
                      <span>Export Excel</span>
                    </button>
                    <button class="btn btn-secondary" (click)="exportObservations('pdf')">
                      <i class="material-icons-round">picture_as_pdf</i>
                      <span>Export PDF</span>
                    </button>
                  }
                  <button class="btn btn-primary" (click)="openAddObservationModal()">
                    <i class="material-icons-round">add_circle</i>
                    <span>Log Growth Observation</span>
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
                      placeholder="Search by farmer, crop, stage, remarks or flag..." />
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
                          <td><strong>{{ getFarmerNameForPlan(obs.planId) }}</strong></td>
                          <td>{{ getCropNameForPlan(obs.planId) }}</td>
                          <td>{{ obs.observationDate | date:'mediumDate' }}</td>
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
                          <td>{{ obs.remarks }}</td>
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
              <button class="close-btn" (click)="closeCatalogModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="catalogForm" (ngSubmit)="submitCatalogForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="cName">Crop Name</label>
                  <input type="text" id="cName" formControlName="cropName" placeholder="e.g. Basmati Rice" />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="cCategory">Category</label>
                    <select id="cCategory" formControlName="category">
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
                  </div>
                  <div class="form-group">
                    <label for="cSeason">Season</label>
                    <select id="cSeason" formControlName="season">
                      <option value="">Select Season</option>
                      <option value="Kharif">Kharif</option>
                      <option value="Rabi">Rabi</option>
                      <option value="Zaid">Zaid</option>
                      <option value="Perennial">Perennial</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="cDuration">Typical Duration (Days)</label>
                    <input type="number" id="cDuration" formControlName="typicalDurationDays" placeholder="e.g. 120" />
                  </div>
                  <div class="form-group">
                    <label for="cYield">Exp. Yield per Acre (Tons)</label>
                    <input type="number" step="0.1" id="cYield" formControlName="expectedYieldPerAcre" placeholder="e.g. 2.5" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="cStatus">Status</label>
                  <select id="cStatus" formControlName="status">
                    <option value="AC">Active</option>
                    <option value="IN">Inactive</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="catalogForm.invalid">Save</button>
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
              <button class="close-btn" (click)="closePlanModal()">
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
                        <option [value]="prof.farmerId">{{ prof.name }} (#{{ prof.farmerId }})</option>
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
                  <label for="pCrop">Crop Type</label>
                  <select id="pCrop" formControlName="cropId">
                    <option value="">Select Crop Catalog</option>
                    @for (crop of cropsForPlanSeason(); track crop.cropId) {
                      <option [value]="crop.cropId">{{ crop.cropName }} ({{ crop.season }})</option>
                    }
                  </select>
                  @if (planForm.get('season')?.value && cropsForPlanSeason().length === 0) {
                    <p class="text-secondary" style="margin: 0.4rem 0 0;">
                      No active crops in the catalog for the {{ planForm.get('season')?.value }} season.
                    </p>
                  }
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="pSeason">Season</label>
                    <select id="pSeason" formControlName="season">
                      <option value="">Select Season</option>
                      <option value="Kharif">Kharif</option>
                      <option value="Rabi">Rabi</option>
                      <option value="Zaid">Zaid</option>
                      <option value="Perennial">Perennial</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="pYear">Year</label>
                    <input type="number" id="pYear" formControlName="year" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="pSowing">Sowing Date</label>
                    <input type="date" id="pSowing" formControlName="sowingDate" />
                  </div>
                  <div class="form-group">
                    <label for="pHarvest">Expected Harvest Date</label>
                    <input type="date" id="pHarvest" formControlName="expectedHarvestDate" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="pArea">Area Planted (in Acres)</label>
                    <input type="number" step="0.01" id="pArea" formControlName="areaPlanted" />
                  </div>
                  <div class="form-group">
                    <label for="pStatus">Status</label>
                    <select id="pStatus" formControlName="status">
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
                <button type="submit" class="btn btn-primary" [disabled]="planForm.invalid">Save</button>
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
              <button class="close-btn" (click)="closeObservationModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="observationForm" (ngSubmit)="submitObservationForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="oPlan">Crop Plan</label>
                  <select id="oPlan" formControlName="planId">
                    <option value="">Select Crop Plan</option>
                    @for (plan of cropPlans(); track plan.planId) {
                      <option [value]="plan.planId">#{{ plan.planId }} — {{ getFarmerNameForPlan(plan.planId) }} — {{ getCropName(plan.cropId) }} ({{ plan.season }} {{ plan.year }})</option>
                    }
                  </select>
                  @if (observationForm.get('planId')?.value) {
                    <p class="text-secondary" style="margin: 0.4rem 0 0;">
                      Farmer: <strong>{{ getFarmerNameForPlan(observationForm.get('planId')?.value) }}</strong>
                      &nbsp;|&nbsp; Crop: <strong>{{ getCropNameForPlan(observationForm.get('planId')?.value) }}</strong>
                    </p>
                  }
                </div>

                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="oDate">Observation Date</label>
                    <input type="date" id="oDate" formControlName="observationDate" />
                  </div>
                  <div class="form-group">
                    <label for="oStage">Growth Stage Flow</label>
                    <select id="oStage" formControlName="stage">
                      <option value="GERMINATION">Germination</option>
                      <option value="VEGETATIVE">Vegetative</option>
                      <option value="FLOWERING">Flowering</option>
                      <option value="MATURITY">Maturity</option>
                    </select>
                  </div>
                </div>

                <div class="form-group mt-3 d-flex align-items-center gap-2">
                  <input type="checkbox" id="oFlag" formControlName="pestOrDiseaseFlag" style="width: 20px; height: 20px;" />
                  <label for="oFlag" style="margin-bottom: 0; color: var(--danger); font-weight: bold;">Pest or Disease Infestation Flagged</label>
                </div>

                <div class="form-group mt-3">
                  <label for="oRemarks">Remarks & Description</label>
                  <textarea id="oRemarks" formControlName="remarks" rows="3" placeholder="Describe the health status, weed growth, fertilizer applications..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="observationForm.invalid">Log Observation</button>
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
              <button class="close-btn" (click)="closeProfileModal()">
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
                <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid">Save Profile</button>
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
              <button class="close-btn" (click)="closeHoldingModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="holdingForm" (ngSubmit)="submitHoldingForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="lFarmer">Assign to Profile</label>
                  <select id="lFarmer" formControlName="farmerId">
                    <option value="">Select Profile</option>
                    @for (prof of farmerProfiles(); track prof.farmerId) {
                      <option [value]="prof.farmerId">{{ prof.name }} (#{{ prof.farmerId }})</option>
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
                <button type="submit" class="btn btn-primary" [disabled]="holdingForm.invalid">Register</button>
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
    .criteria-cell {
      max-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
export class CropsComponent implements OnInit {
  private cropService = inject(CropService);
  private farmerService = inject(FarmerService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private exportService = inject(ExportService);
  private fb = inject(FormBuilder);

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
      cropName: ['', Validators.required],
      category: ['', Validators.required],
      season: ['', Validators.required],
      typicalDurationDays: [90, [Validators.required, Validators.min(1)]],
      expectedYieldPerAcre: [1.0, [Validators.required, Validators.min(0.01)]],
      status: ['AC', Validators.required]
    });

    this.planForm = this.fb.group({
      farmerId: ['', Validators.required],
      holdingId: ['', Validators.required],
      cropId: ['', Validators.required],
      season: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
      sowingDate: ['', Validators.required],
      expectedHarvestDate: ['', Validators.required],
      areaPlanted: [0.5, [Validators.required, Validators.min(0.01)]],
      status: ['PLANNED', Validators.required]
    });

    // Two-way sync between Season and Crop Type on the plan form.
    // Picking a crop fills the season from its catalog entry; changing the
    // season clears a crop that no longer belongs to that season.
    this.planForm.get('cropId')!.valueChanges.subscribe(cropId => {
      if (!cropId) return;
      const crop = this.cropCatalogs().find(c => c.cropId == cropId);
      if (crop && crop.season) {
        this.planForm.get('season')!.setValue(crop.season, { emitEvent: false });
      }
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

    this.observationForm = this.fb.group({
      planId: ['', Validators.required],
      observationDate: [new Date().toISOString().split('T')[0], Validators.required],
      stage: ['GERMINATION', Validators.required],
      pestOrDiseaseFlag: [false],
      remarks: ['', Validators.required]
    });

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['Male', Validators.required],
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

  paginatedCatalog(): any[] { return this.page(this.cropCatalogs(), this.catalogPage, this.catalogPageSize); }
  onCatalogPageChange(p: number) { this.catalogPage = p; }
  onCatalogPageSizeChange(s: number) { this.catalogPageSize = s; this.catalogPage = 0; }

  planSearch = '';
  onPlanSearchChange() { this.planPage = 0; }

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

  paginatedPlans(): any[] { return this.page(this.filteredPlans(), this.planPage, this.planPageSize); }

  // Crop Type options for the plan form: only Active catalog crops, and when a
  // season is chosen, only crops grown in that season (the currently selected
  // crop is always kept so editing an existing plan never loses its value).
  cropsForPlanSeason(): any[] {
    const active = this.cropCatalogs().filter(c => c.status === 'AC');
    const season = this.planForm?.get('season')?.value;
    if (!season) return active;
    const currentId = this.planForm?.get('cropId')?.value;
    return active.filter(c => c.season === season || c.cropId == currentId);
  }
  onPlanPageChange(p: number) { this.planPage = p; }
  onPlanPageSizeChange(s: number) { this.planPageSize = s; this.planPage = 0; }

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
    return prof ? prof.name : `Farmer #${farmerId}`;
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

  // Land holdings the current user may plan against (own holdings only, for a Farmer).
  plannableLandHoldings(): any[] {
    const owned = this.myOwnedFarmerIds();
    if (owned === null) return this.landHoldings();
    return this.landHoldings().filter(h => owned.includes(h.farmerId));
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
      { label: 'Year', value: plan.year },
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
      this.catalogForm.reset({ status: 'AC', typicalDurationDays: 90, expectedYieldPerAcre: 1.0 });
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
    } else {
      this.isEditMode.set(false);
      this.selectedPlan.set(null);
      this.planForm.reset({
        status: 'PLANNED',
        year: new Date().getFullYear(),
        areaPlanted: 0.5,
        farmerId: this.farmerProfiles().length > 0 ? this.farmerProfiles()[0].farmerId : '',
        holdingId: this.landHoldings().length > 0 ? this.landHoldings()[0].holdingId : ''
      });
    }
    this.showPlanModal.set(true);
  }

  closePlanModal() {
    this.showPlanModal.set(false);
  }

  submitPlanForm() {
    if (this.planForm.invalid) return;
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
      planId: plan ? plan.planId : '',
      observationDate: new Date().toISOString().split('T')[0],
      stage: 'GERMINATION',
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
    const body = {
      ...this.observationForm.value,
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
    const columns = ['Farmer', 'Farmer ID', 'Crop Type', 'Season', 'Year', 'Sowing Date', 'Estimated Harvest', 'Area (Acres)', 'Status'];
    const rows = plans.map(p => [
      this.getFarmerName(p.farmerId),
      '#' + p.farmerId,
      this.getCropName(p.cropId),
      p.season,
      p.year,
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
      this.profileForm.reset({ gender: 'Male' });
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
      this.holdingForm.reset({
        farmerId: this.farmerProfiles().length > 0 ? this.farmerProfiles()[0].farmerId : '',
        areaAcres: 1.0
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
