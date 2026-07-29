import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      <div class="brand">
        <i class="material-icons-round brand-icon">agriculture</i>
        <h1>AgriLink</h1>
        <p class="text-secondary">Agricultural Management Platform</p>
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="mt-3">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            formControlName="email"
            placeholder="name@agrilink.com"
            [class.input-error]="isFieldInvalid('email')" />
          <span class="error-text" [class.visible]="isFieldInvalid('email')">Please enter a valid email address</span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            formControlName="password"
            placeholder="••••••••"
            [class.input-error]="isFieldInvalid('password')" />
          <span class="error-text" [class.visible]="isFieldInvalid('password')">Password is required</span>
        </div>

        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" formControlName="role">
            <option value="">Select</option>
            <option value="AgriLinkAdmin">System Administrator</option>
            <option value="ExtensionOfficer">Extension Officer</option>
            <option value="ProcurementOfficer">Procurement Officer</option>
            <option value="SubsidyAdmin">Subsidy Administrator</option>
            <option value="ComplianceAnalyst">Compliance Analyst</option>
            <option value="Farmer">Farmer</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary w-100 mt-3" [disabled]="isLoading()">
          @if (isLoading()) {
            <span class="loading-spinner"></span>
            Signing In...
          } @else {
            <span>Sign In</span>
          }
        </button>
      </form>

      <div class="form-footer mt-3">
        <p class="text-secondary">Are you a Farmer? <a routerLink="/register">Self Register Here</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      width: 100%;
    }
    .brand {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .brand-icon {
      font-size: 48px;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    .brand h1 {
      font-size: 1.75rem;
      font-weight: 700;
    }
    .brand p {
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .input-error {
      border-color: var(--danger) !important;
    }
    .error-text {
      display: block;
      min-height: 1.1rem;
      opacity: 0;
      visibility: hidden;
    }
    .error-text.visible {
      opacity: 1;
      visibility: visible;
    }
    .form-footer {
      text-align: center;
      font-size: 0.85rem;
    }
    .form-footer a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
    }
    .form-footer a:hover {
      text-decoration: underline;
    }
    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top: 2px solid #000;
      border-radius: 50%;
      display: inline-block;
      animation: spin 1s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  submitted = signal(false);
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    role: ['']
  });

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    const credentials = this.loginForm.value;
    
    // clean up empty string role
    if (!credentials.role) {
      delete credentials.role;
    }

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('Logged in successfully');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || err.error?.error || 'Authentication failed. Please verify credentials.';
        this.toastService.error(errorMsg);
      }
    });
  }
}
