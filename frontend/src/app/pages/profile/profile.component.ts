import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FarmerService } from '../../services/farmer.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="profile-header card">
        <div class="profile-avatar-lg">{{ userInitials }}</div>
        <div class="profile-header-info">
          <h1>{{ currentUser?.name }}</h1>
          <p class="text-secondary">{{ currentUser?.email }}</p>
          <div class="profile-header-badges">
            <span class="badge badge-primary">{{ currentUser?.roleName }}</span>
            @if (currentUser?.regionId) {
              <span class="badge badge-secondary">Region {{ currentUser?.regionId }}</span>
            }
            @if (accountDetails()?.status) {
              <span class="badge" [ngClass]="{
                'badge-success': accountDetails()?.status === 'A',
                'badge-warning': accountDetails()?.status === 'P',
                'badge-danger': accountDetails()?.status === 'S' || accountDetails()?.status === 'I'
              }">{{ accountStatusLabel(accountDetails()?.status) }}</span>
            }
          </div>
        </div>
      </div>

      <div class="grid-layout mt-3">
        <div class="card">
          <div class="card-header"><h3>Account Details</h3></div>
          <div class="detail-list mt-3">
            <div class="detail-row">
              <span class="detail-label">Full Name</span>
              <span class="detail-value">{{ currentUser?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ currentUser?.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Role</span>
              <span class="detail-value">{{ currentUser?.roleName }}</span>
            </div>
            @if (currentUser?.regionId) {
              <div class="detail-row">
                <span class="detail-label">Region ID</span>
                <span class="detail-value">{{ currentUser?.regionId }}</span>
              </div>
            }
            @if (accountDetails()?.phone) {
              <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">{{ accountDetails()?.phone }}</span>
              </div>
            }
            @if (accountDetails()?.createdAt) {
              <div class="detail-row">
                <span class="detail-label">Member Since</span>
                <span class="detail-value">{{ accountDetails()?.createdAt | date:'mediumDate' }}</span>
              </div>
            }
          </div>
        </div>

        @if (isFarmer() && farmProfile()) {
          <div class="card">
            <div class="card-header"><h3>Farm Details</h3></div>
            <div class="detail-list mt-3">
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="badge" [ngClass]="{
                  'badge-success': farmProfile()?.status === 'AC',
                  'badge-secondary': farmProfile()?.status === 'IN'
                }">{{ farmProfile()?.status === 'AC' ? 'Active' : 'Inactive' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date of Birth</span>
                <span class="detail-value">{{ farmProfile()?.dateOfBirth | date:'mediumDate' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Gender</span>
                <span class="detail-value">{{ farmProfile()?.gender }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">National ID</span>
                <span class="detail-value">{{ farmProfile()?.nationalIdNumber }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Village</span>
                <span class="detail-value">{{ farmProfile()?.village }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">District</span>
                <span class="detail-value">{{ farmProfile()?.district }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">State</span>
                <span class="detail-value">{{ farmProfile()?.state }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bank Account</span>
                <span class="detail-value">{{ farmProfile()?.bankAccountNumber }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>My Land Holdings</h3></div>
            <div class="detail-list mt-3">
              @if (landHoldings().length === 0) {
                <p class="text-secondary">No land holdings registered yet.</p>
              } @else {
                @for (land of landHoldings(); track land.holdingId) {
                  <div class="detail-row">
                    <span class="detail-label">{{ land.surveyNumber }}</span>
                    <span class="detail-value">{{ land.areaAcres }} acres &middot; {{ land.soilType }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3>Change Password</h3>
            <button class="btn btn-secondary" (click)="togglePasswordForm()">
              {{ showPasswordForm() ? 'Cancel' : 'Change' }}
            </button>
          </div>
          @if (showPasswordForm()) {
            <form [formGroup]="passwordForm" (ngSubmit)="submitPasswordChange()" class="mt-3">
              <div class="form-group">
                <label for="currentPassword">Current Password</label>
                <input type="password" id="currentPassword" formControlName="currentPassword" placeholder="••••••••" />
                <span class="error-text" [class.visible]="invalid('currentPassword')">Current password is required</span>
              </div>
              <div class="form-group">
                <label for="newPassword">New Password (min 8 characters)</label>
                <input type="password" id="newPassword" formControlName="newPassword" placeholder="••••••••" />
                <span class="error-text" [class.visible]="invalid('newPassword')">New password must be at least 8 characters</span>
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid || isChangingPassword()">
                {{ isChangingPassword() ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 0.5rem; }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.75rem;
    }
    .profile-avatar-lg {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--sidebar-bg) 0%, var(--primary-color) 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    .profile-header-info h1 {
      font-size: 1.5rem;
      margin-bottom: 0.15rem;
    }
    .profile-header-badges {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.6rem;
      flex-wrap: wrap;
    }
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .detail-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .detail-value {
      font-weight: 600;
      font-size: 0.9rem;
      text-align: right;
    }
    .error-text {
      display: block;
      min-height: 1rem;
      font-size: 0.75rem;
      color: var(--danger);
      opacity: 0;
      visibility: hidden;
    }
    .error-text.visible {
      opacity: 1;
      visibility: visible;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private farmerService = inject(FarmerService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  accountDetails = signal<any | null>(null);
  farmProfile = signal<any | null>(null);
  landHoldings = signal<any[]>([]);
  showPasswordForm = signal(false);
  isChangingPassword = signal(false);
  submitted = signal(false);

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  get currentUser() {
    return this.authService.currentUserValue;
  }

  get userInitials(): string {
    const name = this.currentUser?.name || '';
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  isFarmer(): boolean {
    return this.authService.hasRole(['Farmer']);
  }

  ngOnInit(): void {
    const userId = this.currentUser?.userId;
    if (userId != null) {
      // Only AgriLinkAdmin can read account records via this endpoint; other roles
      // simply won't see the extra fields (phone/status/createdAt) below.
      this.userService.getUser(userId).subscribe({
        next: (data) => this.accountDetails.set(data),
        error: () => {}
      });
    }

    if (this.isFarmer()) {
      this.farmerService.getAllFarmerProfiles().subscribe({
        next: (profiles) => {
          const profile = profiles && profiles.length ? profiles[0] : null;
          this.farmProfile.set(profile);
          if (profile) {
            this.farmerService.getAllLandHoldings().subscribe({
              next: (holdings) => this.landHoldings.set(holdings.filter(h => h.farmerId === profile.farmerId)),
              error: () => {}
            });
          }
        },
        error: () => {}
      });
    }
  }

  accountStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'A': return 'Active';
      case 'P': return 'Pending';
      case 'S': return 'Suspended';
      case 'I': return 'Inactive';
      default: return status || '';
    }
  }

  togglePasswordForm(): void {
    this.showPasswordForm.update(v => !v);
    this.submitted.set(false);
    this.passwordForm.reset();
  }

  invalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }

  submitPasswordChange(): void {
    this.submitted.set(true);
    if (this.passwordForm.invalid) return;

    this.isChangingPassword.set(true);
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: (res) => {
        this.isChangingPassword.set(false);
        this.toastService.success(res.message || 'Password changed successfully');
        this.showPasswordForm.set(false);
        this.passwordForm.reset();
        this.submitted.set(false);
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.toastService.error(err.error?.message || 'Failed to change password');
      }
    });
  }
}
