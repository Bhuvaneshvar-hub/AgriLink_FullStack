import { Component, OnInit, inject, signal } from '@angular/core';
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
          <div class="password-input-wrap">
            <input
              [type]="showPassword() ? 'text' : 'password'"
              id="password"
              formControlName="password"
              placeholder="••••••••"
              [class.input-error]="isFieldInvalid('password')" />
            <button
              type="button"
              class="password-toggle-btn"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
              <i class="material-icons-round">{{ showPassword() ? 'visibility_off' : 'visibility' }}</i>
            </button>
          </div>
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
      margin-bottom: 1rem;
    }
    .brand-icon {
      font-size: 36px;
      color: var(--primary-color);
      margin-bottom: 0.35rem;
    }
    .brand h1 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .brand p {
      font-size: 0.85rem;
      margin-top: 0.2rem;
    }
    .input-error {
      border-color: var(--danger) !important;
    }
    .password-input-wrap {
      position: relative;
      display: flex;
    }
    .password-input-wrap input {
      width: 100%;
      box-sizing: border-box;
      padding-right: 2.75rem;
    }
    /* Hide native browser reveal/clear icons (Edge/IE) so only our custom toggle shows */
    .password-input-wrap input::-ms-reveal,
    .password-input-wrap input::-ms-clear {
      display: none;
    }
    .password-toggle-btn {
      position: absolute;
      top: 50%;
      right: 0.5rem;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      color: var(--text-muted);
    }
    .password-toggle-btn:hover {
      color: var(--primary-color);
    }
    .password-toggle-btn i {
      font-size: 20px;
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
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // If a valid session already exists, skip the login screen (e.g. when landing
    // on the root URL, which redirects here) and go straight to the dashboard.
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  isLoading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
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
