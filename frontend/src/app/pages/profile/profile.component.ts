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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
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

  /** Farmer-domain status codes (see farmer-service enums/Status.java). */
  farmStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'AC': return 'Active';
      case 'VE': return 'Verified';
      case 'PE': return 'Pending';
      case 'DP': return 'Disputed';
      case 'IN': return 'Inactive';
      default: return status || '';
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
