import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FarmerService } from '../../../services/farmer.service';
import { ToastService } from '../../../services/toast.service';
import { notFutureDate, passwordsMatch, NAME_PATTERN, GMAIL_PATTERN } from '../../../utils/validators';
import { INDIAN_STATES } from '../../../utils/indian-states';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-wrapper">
      <div class="brand">
        <i class="material-icons-round brand-icon">person_add</i>
        <h1>Farmer Registration</h1>
        <p class="text-secondary">Create a pending profile for verification</p>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
        <div class="form-row-2">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              placeholder="John Doe"
              [class.input-error]="isFieldInvalid('name')" />
            <span class="error-text" [class.visible]="isFieldInvalid('name')">
              {{ registerForm.get('name')?.errors?.['pattern'] ? 'Name must be letters only (2–50 characters)' : 'Full name is required' }}
            </span>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="john.doe@gmail.com"
              [class.input-error]="isFieldInvalid('email')" />
            <span class="error-text" [class.visible]="isFieldInvalid('email')">Enter a valid Gmail address (must end with &#64;gmail.com)</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="phone">Phone Number (10 digits)</label>
            <input
              type="text"
              id="phone"
              formControlName="phone"
              placeholder="9876543210"
              [class.input-error]="isFieldInvalid('phone')" />
            <span class="error-text" [class.visible]="isFieldInvalid('phone')">Phone must be exactly 10 digits</span>
          </div>

          <div class="form-group">
            <label for="regionId">Region ID</label>
            <input
              type="number"
              id="regionId"
              formControlName="regionId"
              placeholder="1"
              [class.input-error]="isFieldInvalid('regionId')" />
            <span class="error-text" [class.visible]="isFieldInvalid('regionId')">Region ID is required</span>
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password (min 8 characters)</label>
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
          <span class="error-text" [class.visible]="isFieldInvalid('password')">Password must be at least 8 characters</span>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="password-input-wrap">
            <input
              [type]="showConfirmPassword() ? 'text' : 'password'"
              id="confirmPassword"
              formControlName="confirmPassword"
              placeholder="Re-enter your password"
              [class.input-error]="isFieldInvalid('confirmPassword')" />
            <button
              type="button"
              class="password-toggle-btn"
              (click)="showConfirmPassword.set(!showConfirmPassword())"
              [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'">
              <i class="material-icons-round">{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</i>
            </button>
          </div>
          <span class="error-text" [class.visible]="isFieldInvalid('confirmPassword')">
            {{ registerForm.get('confirmPassword')?.errors?.['passwordMismatch'] ? 'Passwords do not match' : 'Please confirm your password' }}
          </span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="dateOfBirth">Date of Birth</label>
            <input type="date" id="dateOfBirth" formControlName="dateOfBirth"
              [class.input-error]="isFieldInvalid('dateOfBirth')" />
            <span class="error-text" [class.visible]="isFieldInvalid('dateOfBirth')">
              {{ registerForm.get('dateOfBirth')?.errors?.['futureDate'] ? 'Date of birth cannot be in the future' : 'Date of birth is required' }}
            </span>
          </div>
          <div class="form-group">
            <label for="gender">Gender</label>
            <select id="gender" formControlName="gender">
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <span class="error-text"></span>
          </div>
        </div>

        <div class="form-group">
          <label for="nationalIdNumber">National ID / Aadhar Number</label>
          <input type="text" id="nationalIdNumber" formControlName="nationalIdNumber" placeholder="Unique ID"
            [class.input-error]="isFieldInvalid('nationalIdNumber')" />
          <span class="error-text" [class.visible]="isFieldInvalid('nationalIdNumber')">National ID is required</span>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="village">Village</label>
            <input type="text" id="village" formControlName="village"
              [class.input-error]="isFieldInvalid('village')" />
            <span class="error-text" [class.visible]="isFieldInvalid('village')">Village is required</span>
          </div>
          <div class="form-group">
            <label for="district">District</label>
            <input type="text" id="district" formControlName="district"
              [class.input-error]="isFieldInvalid('district')" />
            <span class="error-text" [class.visible]="isFieldInvalid('district')">District is required</span>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="state">State</label>
            <select id="state" formControlName="state"
              [class.input-error]="isFieldInvalid('state')">
              <option value="">Select State</option>
              @for (st of indianStates; track st) {
                <option [value]="st">{{ st }}</option>
              }
            </select>
            <span class="error-text" [class.visible]="isFieldInvalid('state')">State is required</span>
          </div>
          <div class="form-group">
            <label for="bankAccountNumber">Bank Account Number</label>
            <input type="text" id="bankAccountNumber" formControlName="bankAccountNumber"
              [class.input-error]="isFieldInvalid('bankAccountNumber')" />
            <span class="error-text" [class.visible]="isFieldInvalid('bankAccountNumber')">Bank account is required</span>
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-100 mt-2" [disabled]="isLoading()">
          @if (isLoading()) {
            <span class="loading-spinner"></span>
            Registering...
          } @else {
            <span>Submit Registration</span>
          }
        </button>
      </form>

      <div class="form-footer mt-2">
        <p class="text-secondary">Already have an account? <a routerLink="/login">Sign In</a></p>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      width: 100%;
    }
    .brand {
      text-align: center;
      margin-bottom: 1rem;
    }
    .brand-icon {
      font-size: 36px;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    .brand h1 {
      font-size: 1.4rem;
      font-weight: 700;
    }
    .brand p {
      font-size: 0.8rem;
      margin-top: 0.15rem;
    }
    .register-form .form-group {
      margin-bottom: 0.75rem;
      gap: 0.2rem;
    }
    .register-form label {
      font-size: 0.8rem;
    }
    .register-form input {
      padding: 0.55rem 0.85rem;
      font-size: 0.9rem;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
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
      font-size: 18px;
    }
    .error-text {
      display: block;
      min-height: 1rem;
      font-size: 0.75rem;
      opacity: 0;
      visibility: hidden;
    }
    .error-text.visible {
      opacity: 1;
      visibility: visible;
    }
    .form-footer {
      text-align: center;
      font-size: 0.8rem;
      margin-top: 0.75rem !important;
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private farmerService = inject(FarmerService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  readonly indianStates = INDIAN_STATES;
  registerForm: FormGroup = this.fb.group({
    // Login-account fields
    name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(GMAIL_PATTERN)]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    regionId: [1, [Validators.required, Validators.min(1)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    // Farmer profile fields (a full profile is created on registration, Inactive until approval)
    dateOfBirth: ['', [Validators.required, notFutureDate]],
    gender: ['', [Validators.required]],
    nationalIdNumber: ['', [Validators.required]],
    village: ['', [Validators.required]],
    district: ['', [Validators.required]],
    state: ['', [Validators.required]],
    bankAccountNumber: ['', [Validators.required]]
  }, { validators: passwordsMatch });

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    // confirmPassword is a UI-only field; exclude it from the API payload.
    const { confirmPassword, ...payload } = this.registerForm.value;
    // Creates BOTH the login account (Pending) and a linked FarmerProfile (Inactive).
    this.farmerService.selfRegisterFarmer(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(res.message || 'Registration submitted! Awaiting approval.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || 'Registration failed. Try again.';
        this.toastService.error(errorMsg);
      }
    });
  }
}
