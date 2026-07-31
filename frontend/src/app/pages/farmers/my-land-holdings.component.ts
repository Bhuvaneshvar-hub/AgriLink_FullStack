import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmerService } from '../../services/farmer.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../components/action-menu/action-menu.component';

@Component({
  selector: 'app-my-land-holdings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent],
  template: `
    <div class="land-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>My Land Holdings</h1>
          <p class="text-secondary">Register your land holdings. New entries are sent to an administrator for approval.</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()" [disabled]="!myProfile()">
          <i class="material-icons-round">add_circle</i><span>Register Land</span>
        </button>
      </div>

      @if (isLoading()) {
        <div class="empty-state"><span class="spinner-large"></span><p class="mt-3">Loading your land holdings...</p></div>
      } @else if (!myProfile()) {
        <div class="empty-state card">
          <i class="material-icons-round">person_off</i>
          <h3>No Farmer Profile</h3>
          <p>Your farmer profile isn't set up yet. Please contact an officer to complete your registration.</p>
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
                  <th>Survey Number</th><th>Area (Acres)</th><th>Soil Type</th>
                  <th>Irrigation</th><th>Ownership</th><th>Status</th><th>Actions</th>
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
                        @if (land.status === 'PE' || land.status === 'DP') {
                          <button class="menu-item danger" (click)="confirmDelete(land)">
                            <i class="material-icons-round">delete</i> Withdraw
                          </button>
                        }
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
              <h3>Register Land Holding</h3>
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
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Submit for Approval</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showDeleteConfirm()) {
        <app-confirmation-modal title="Withdraw Land Holding"
          [message]="'Withdraw survey number ' + selected()?.surveyNumber + '?'"
          confirmText="Withdraw" (confirm)="executeDelete()" (cancel)="showDeleteConfirm.set(false)">
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
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  submitted = signal(false);
  myProfile = signal<any | null>(null);
  holdings = signal<any[]>([]);
  selected = signal<any | null>(null);
  showModal = signal(false);
  showDeleteConfirm = signal(false);

  page = 0;
  pageSize = 10;

  form!: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      surveyNumber: ['', Validators.required],
      areaAcres: [1.0, [Validators.required, Validators.min(0.01)]],
      soilType: ['', Validators.required],
      irrigationSource: ['', Validators.required],
      ownershipType: ['', Validators.required]
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
    const start = this.page * this.pageSize;
    return this.holdings().slice(start, start + this.pageSize);
  }
  onPageChange(p: number) { this.page = p; }
  onPageSizeChange(s: number) { this.pageSize = s; this.page = 0; }

  statusLabel(s: string): string {
    switch (s) { case 'AC': return 'Active'; case 'PE': return 'Pending'; case 'DP': return 'Disputed'; case 'IN': return 'Inactive'; default: return s; }
  }

  openModal() {
    this.submitted.set(false);
    this.form.reset({ areaAcres: 1.0, soilType: '', irrigationSource: '', ownershipType: '', surveyNumber: '' });
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }

  submit() {
    this.submitted.set(true);
    if (this.form.invalid || !this.myProfile()) return;
    const body = { ...this.form.value, farmerId: this.myProfile().farmerId, status: 'PE' };
    this.farmerService.createLandHolding(body).subscribe({
      next: (res) => { this.toast.success(res.message || 'Submitted for approval'); this.closeModal(); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to submit land holding')
    });
  }

  confirmDelete(land: any) { this.selected.set(land); this.showDeleteConfirm.set(true); }
  executeDelete() {
    this.farmerService.deleteLandHolding(this.selected().holdingId).subscribe({
      next: (res) => { this.toast.success(res.message || 'Withdrawn'); this.showDeleteConfirm.set(false); this.load(); },
      error: () => this.toast.error('Failed to withdraw')
    });
  }
}
