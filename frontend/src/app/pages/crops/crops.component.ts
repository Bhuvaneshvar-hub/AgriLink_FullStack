import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CropService } from '../../services/crop.service';
import { FarmerService } from '../../services/farmer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../components/detail-modal/detail-modal.component';

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
        <button class="tab-btn" [class.active]="activeTab() === 'observations'" (click)="setTab('observations')">
          <i class="material-icons-round">visibility</i>
          <span>Observations</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'profiles'" (click)="setTab('profiles')">
          <i class="material-icons-round">landscape</i>
          <span>Profiles & Land Holdings</span>
        </button>
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
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Crop Catalog Database</h3>
              @if (isAdminOrOfficer()) {
                <button class="btn btn-primary" (click)="openCatalogModal()">
                  <i class="material-icons-round">add_circle</i>
                  <span>Add Crop</span>
                </button>
              }
            </div>

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
                        <th>ID</th>
                        <th>Crop Name</th>
                        <th>Category</th>
                        <th>Season</th>
                        <th>Typical Duration</th>
                        <th>Exp. Yield (Acre)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (crop of cropCatalogs(); track crop.cropId) {
                        <tr>
                          <td>{{ crop.cropId }}</td>
                          <td><strong>{{ crop.cropName }}</strong></td>
                          <td>{{ crop.category }}</td>
                          <td>{{ crop.season }}</td>
                          <td>{{ crop.typicalDurationDays }} Days</td>
                          <td>{{ crop.expectedYieldPerAcre }} Tons</td>
                          <td>
                            <app-action-menu>
                              <button class="menu-item" (click)="viewCatalogDetails(crop)">
                                <i class="material-icons-round">visibility</i> View
                              </button>
                              @if (isAdminOrOfficer()) {
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
              </div>
            }
          </div>
        }

        <!-- 2. CROP PLANS TAB -->
        @if (activeTab() === 'plans') {
          <div class="tab-content">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Crop Seeding & Harvesting Plans</h3>
              @if (isFarmer()) {
                <button class="btn btn-primary" (click)="openPlanModal()">
                  <i class="material-icons-round">add_circle</i>
                  <span>Create Plan</span>
                </button>
              }
            </div>

            @if (cropPlans().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">agriculture</i>
                <h3>No Crop Plans Scheduled</h3>
                <p>Get started by creating a new planting plan.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Plan ID</th>
                        <th>Farmer ID</th>
                        <th>Land Holding ID</th>
                        <th>Crop</th>
                        <th>Season</th>
                        <th>Year</th>
                        <th>Sowing Date</th>
                        <th>Est. Harvest</th>
                        <th>Area (Acres)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (plan of cropPlans(); track plan.planId) {
                        <tr>
                          <td>{{ plan.planId }}</td>
                          <td>#{{ plan.farmerId }}</td>
                          <td>#{{ plan.holdingId }}</td>
                          <td>{{ getCropName(plan.cropId) }}</td>
                          <td>{{ plan.season }}</td>
                          <td>{{ plan.year }}</td>
                          <td>{{ plan.sowingDate | date:'mediumDate' }}</td>
                          <td>{{ plan.expectedHarvestDate | date:'mediumDate' }}</td>
                          <td>{{ plan.areaPlanted }} Acres</td>
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
              </div>
            }
          </div>
        }

        <!-- 3. GROWTH OBSERVATIONS TAB -->
        @if (activeTab() === 'observations') {
          <div class="tab-content">
            <h3>Crop Growth Stage Logs & Observation Reports</h3>
            <p class="text-secondary mb-3">Field inspection observations registered by extension officers.</p>

            @if (growthObservations().length === 0) {
              <div class="empty-state card">
                <i class="material-icons-round">assessment</i>
                <h3>No Observations Logged</h3>
                <p>Observations will populate once extension officers submit growth reports on crop plans.</p>
              </div>
            } @else {
              <div class="table-container">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Obs ID</th>
                        <th>Plan ID</th>
                        <th>Officer ID</th>
                        <th>Date</th>
                        <th>Growth Stage</th>
                        <th>Pest/Disease Flag</th>
                        <th>Remarks</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (obs of growthObservations(); track obs.observationId) {
                        <tr>
                          <td>{{ obs.observationId }}</td>
                          <td>#{{ obs.planId }} ({{ getCropNameForPlan(obs.planId) }})</td>
                          <td>#{{ obs.officerId }}</td>
                          <td>{{ obs.observationDate | date:'mediumDate' }}</td>
                          <td>
                            <span class="badge badge-info">
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
              </div>
            }
          </div>
        }

        <!-- 4. MY FARMER PROFILES & LAND HOLDINGS TAB -->
        @if (activeTab() === 'profiles') {
          <div class="tab-content">
            <div class="grid-layout">
              <!-- Farmer Profiles Card -->
              <div class="card">
                <div class="card-header">
                  <h3>Farmer Identity Profiles</h3>
                  @if (isFarmer()) {
                    <button class="btn btn-primary btn-small" (click)="openProfileModal()">
                      <i class="material-icons-round">add</i>
                      <span>Create Profile</span>
                    </button>
                  }
                </div>

                @if (farmerProfiles().length === 0) {
                  <div class="empty-state">
                    <p>No farmer profile registered. A farmer profile is required to assign crop plans.</p>
                  </div>
                } @else {
                  <div class="table-container mt-3">
                    <div class="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Farmer ID</th>
                            <th>Name</th>
                            <th>Village</th>
                            <th>District</th>
                            <th>State</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (prof of farmerProfiles(); track prof.farmerId) {
                            <tr>
                              <td>#{{ prof.farmerId }}</td>
                              <td><strong>{{ prof.name }}</strong></td>
                              <td>{{ prof.village }}</td>
                              <td>{{ prof.district }}</td>
                              <td>{{ prof.state }}</td>
                              <td>
                                <app-action-menu>
                                  <button class="menu-item" (click)="viewProfileDetails(prof)">
                                    <i class="material-icons-round">visibility</i> View
                                  </button>
                                  @if (isFarmer()) {
                                    <button class="menu-item" (click)="openProfileModal(prof)">
                                      <i class="material-icons-round">edit</i> Edit
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

              <!-- Land Holdings Card -->
              <div class="card">
                <div class="card-header">
                  <h3>Registered Land Holdings</h3>
                  @if (isFarmer()) {
                    <button class="btn btn-primary btn-small" (click)="openHoldingModal()">
                      <i class="material-icons-round">add</i>
                      <span>Register Land</span>
                    </button>
                  }
                </div>

                @if (landHoldings().length === 0) {
                  <div class="empty-state">
                    <p>No land holdings registered. Register land holdings to create crop schedules.</p>
                  </div>
                } @else {
                  <div class="table-container mt-3">
                    <div class="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Holding ID</th>
                            <th>Farmer ID</th>
                            <th>Survey No</th>
                            <th>Area (Acres)</th>
                            <th>Soil Type</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (land of landHoldings(); track land.holdingId) {
                            <tr>
                              <td>#{{ land.holdingId }}</td>
                              <td>#{{ land.farmerId }}</td>
                              <td><strong>{{ land.surveyNumber }}</strong></td>
                              <td>{{ land.areaAcres }} Acres</td>
                              <td>{{ land.soilType }}</td>
                              <td>
                                <app-action-menu>
                                  <button class="menu-item" (click)="viewHoldingDetails(land)">
                                    <i class="material-icons-round">visibility</i> View
                                  </button>
                                  @if (isFarmer()) {
                                    <button class="menu-item" (click)="openHoldingModal(land)">
                                      <i class="material-icons-round">edit</i> Edit
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
            </div>
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
                    <input type="text" id="cCategory" formControlName="category" placeholder="e.g. Cereal, Vegetable" />
                  </div>
                  <div class="form-group">
                    <label for="cSeason">Season</label>
                    <input type="text" id="cSeason" formControlName="season" placeholder="e.g. Kharif, Rabi" />
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
                      @for (prof of farmerProfiles(); track prof.farmerId) {
                        <option [value]="prof.farmerId">{{ prof.name }} (#{{ prof.farmerId }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="pHolding">Land Holding</label>
                    <select id="pHolding" formControlName="holdingId">
                      <option value="">Select Land</option>
                      @for (land of landHoldings(); track land.holdingId) {
                        <option [value]="land.holdingId">Survey: {{ land.surveyNumber }} (#{{ land.holdingId }})</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="pCrop">Crop Selection</label>
                  <select id="pCrop" formControlName="cropId">
                    <option value="">Select Crop Catalog</option>
                    @for (crop of cropCatalogs(); track crop.cropId) {
                      <option [value]="crop.cropId">{{ crop.cropName }} ({{ crop.season }})</option>
                    }
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="pSeason">Season</label>
                    <input type="text" id="pSeason" formControlName="season" placeholder="e.g. Rabi" />
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
                    <label for="pArea">Area Planted (Acres)</label>
                    <input type="number" step="0.01" id="pArea" formControlName="areaPlanted" />
                  </div>
                  <div class="form-group">
                    <label for="pStatus">Status</label>
                    <select id="pStatus" formControlName="status">
                      <option value="AC">Active</option>
                      <option value="IN">Inactive</option>
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
                <p>Recording inspection for Crop Plan <strong>#{{ selectedPlan()?.planId }}</strong> ({{ getCropName(selectedPlan()?.cropId) }}).</p>
                
                <div class="form-row mt-3">
                  <div class="form-group">
                    <label for="oDate">Observation Date</label>
                    <input type="date" id="oDate" formControlName="observationDate" />
                  </div>
                  <div class="form-group">
                    <label for="oStage">Growth Stage Flow</label>
                    <select id="oStage" formControlName="stage">
                      <option value="PL">PL (Planned)</option>
                      <option value="SO">SO (Sowing)</option>
                      <option value="GR">GR (Growing)</option>
                      <option value="HA">HA (Harvesting)</option>
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
                    <input type="text" id="fState" formControlName="state" />
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
                    <label for="lArea">Area (Acres)</label>
                    <input type="number" step="0.01" id="lArea" formControlName="areaAcres" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="lSoil">Soil Type</label>
                    <input type="text" id="lSoil" formControlName="soilType" placeholder="e.g. Alluvial, Black, Clay" />
                  </div>
                  <div class="form-group">
                    <label for="lIrrigation">Irrigation Source</label>
                    <input type="text" id="lIrrigation" formControlName="irrigationSource" placeholder="e.g. Well, Canal, Rainfed" />
                  </div>
                </div>
                <div class="form-group">
                  <label for="lOwnership">Ownership Type</label>
                  <input type="text" id="lOwnership" formControlName="ownershipType" placeholder="e.g. Owned, Leased" />
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
  private fb = inject(FormBuilder);

  // States
  activeTab = signal<'catalog' | 'plans' | 'observations' | 'profiles'>('catalog');
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Data signals
  cropCatalogs = signal<any[]>([]);
  cropPlans = signal<any[]>([]);
  growthObservations = signal<any[]>([]);
  farmerProfiles = signal<any[]>([]);
  landHoldings = signal<any[]>([]);

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
      status: ['AC', Validators.required]
    });

    this.observationForm = this.fb.group({
      observationDate: [new Date().toISOString().split('T')[0], Validators.required],
      stage: ['SO', Validators.required],
      pestOrDiseaseFlag: [false],
      remarks: ['', Validators.required]
    });

    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['Male', Validators.required],
      nationalIdNumber: ['', Validators.required],
      village: ['', Validators.required],
      district: ['', Validators.required],
      state: ['', Validators.required],
      phone: ['', Validators.required],
      bankAccountNumber: ['', Validators.required]
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
        this.cropCatalogs.set(catalogs);
        
        // Load plans
        this.cropService.getAllCropPlans().subscribe({
          next: (plans) => {
            this.cropPlans.set(plans);
          }
        });

        // Load growth logs
        this.cropService.getAllGrowthObservations().subscribe({
          next: (observations) => {
            this.growthObservations.set(observations);
          }
        });

        // Load Profiles & Holdings
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (profiles) => {
            this.farmerProfiles.set(profiles);
          }
        });

        this.farmerService.getAllLandHoldings().subscribe({
          next: (holdings) => {
            this.landHoldings.set(holdings);
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

  // Helpers
  getCropName(cropId: number): string {
    const crop = this.cropCatalogs().find(c => c.cropId == cropId);
    return crop ? crop.cropName : `Crop ID: ${cropId}`;
  }

  getCropNameForPlan(planId: number): string {
    const plan = this.cropPlans().find(p => p.planId == planId);
    if (!plan) return 'Unknown Plan';
    return this.getCropName(plan.cropId);
  }

  getStageLabel(stage: string): string {
    switch (stage) {
      case 'PL': return 'PL (Planned)';
      case 'SO': return 'SO (Sowing)';
      case 'GR': return 'GR (Growing)';
      case 'HA': return 'HA (Harvesting)';
      default: return stage;
    }
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
      { label: 'Exp. Yield (Acre)', value: crop.expectedYieldPerAcre + ' Tons' },
      { label: 'Status', value: crop.status === 'AC' ? 'Active' : 'Inactive' }
    ]);
    this.showDetailModal.set(true);
  }

  viewPlanDetails(plan: any) {
    this.detailTitle.set(`Crop Plan #${plan.planId}`);
    this.detailRows.set([
      { label: 'Plan ID', value: plan.planId },
      { label: 'Farmer ID', value: '#' + plan.farmerId },
      { label: 'Land Holding ID', value: '#' + plan.holdingId },
      { label: 'Crop', value: this.getCropName(plan.cropId) },
      { label: 'Season', value: plan.season },
      { label: 'Year', value: plan.year },
      { label: 'Sowing Date', value: this.fmtDate(plan.sowingDate) },
      { label: 'Est. Harvest', value: this.fmtDate(plan.expectedHarvestDate) },
      { label: 'Area (Acres)', value: plan.areaPlanted + ' Acres' },
      { label: 'Status', value: plan.status === 'AC' ? 'Active' : 'Inactive' }
    ]);
    this.showDetailModal.set(true);
  }

  viewObservationDetails(obs: any) {
    this.detailTitle.set(`Observation #${obs.observationId}`);
    this.detailRows.set([
      { label: 'Obs ID', value: obs.observationId },
      { label: 'Plan ID', value: '#' + obs.planId + ' (' + this.getCropNameForPlan(obs.planId) + ')' },
      { label: 'Officer ID', value: '#' + obs.officerId },
      { label: 'Date', value: this.fmtDate(obs.observationDate) },
      { label: 'Growth Stage', value: this.getStageLabel(obs.stage) },
      { label: 'Pest/Disease Flag', value: obs.pestOrDiseaseFlag ? 'Yes' : 'No' },
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
      { label: 'Area (Acres)', value: land.areaAcres + ' Acres' },
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
        status: 'AC',
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
  openAddObservationModal(plan: any) {
    this.selectedPlan.set(plan);
    this.observationForm.reset({
      observationDate: new Date().toISOString().split('T')[0],
      stage: 'SO',
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
      planId: this.selectedPlan().planId,
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
