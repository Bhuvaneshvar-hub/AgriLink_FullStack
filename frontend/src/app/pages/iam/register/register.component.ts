import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FarmerService } from '../../../services/farmer.service';
import { ToastService } from '../../../services/toast.service';
import { notFutureDate, NAME_PATTERN, GMAIL_PATTERN, passwordsMatch } from '../../../utils/validators';
import { INDIAN_STATES } from '../../../utils/indian-states';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-wrapper">
      <div class="brand">
        <div class="brand-icon-badge"><i class="material-icons-round">person_add</i></div>
        <h1>Farmer Registration</h1>
        <p class="text-secondary">Create your profile — it'll be reviewed and activated by an officer</p>
      </div>

      <div class="step-indicator">
        <div class="step-dot" [class.active]="currentStep() === 1" [class.done]="currentStep() > 1">
          <span>1</span>
        </div>
        <span class="step-label" [class.active]="currentStep() === 1">Account Details</span>
        <div class="step-line" [class.done]="currentStep() > 1"></div>
        <div class="step-dot" [class.active]="currentStep() === 2">
          <span>2</span>
        </div>
        <span class="step-label" [class.active]="currentStep() === 2">Farmer &amp; Land Details</span>
      </div>

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
        @if (currentStep() === 1) {
          <div class="form-section">
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
                  {{ registerForm.get('name')?.errors?.['pattern'] ? 'Letters only (2–50 characters)' : 'Full name is required' }}
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
                <span class="error-text" [class.visible]="isFieldInvalid('email')">Must be a valid &#64;gmail.com address</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                formControlName="phone"
                placeholder="9876543210"
                [class.input-error]="isFieldInvalid('phone')" />
              <span class="error-text" [class.visible]="isFieldInvalid('phone')">Phone must be exactly 10 digits</span>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="password">Password</label>
                <div class="password-input-wrap">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    placeholder="Min. 8 characters"
                    [class.input-error]="isFieldInvalid('password')" />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                    <i class="material-icons-round">{{ showPassword() ? 'visibility_off' : 'visibility' }}</i>
                  </button>
                </div>
                <span class="error-text" [class.visible]="isFieldInvalid('password')">At least 8 characters</span>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <div class="password-input-wrap">
                  <input
                    [type]="showConfirmPassword() ? 'text' : 'password'"
                    id="confirmPassword"
                    formControlName="confirmPassword"
                    placeholder="Re-enter password"
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
                  {{ registerForm.get('confirmPassword')?.errors?.['mismatch'] ? 'Passwords do not match' : 'Please confirm' }}
                </span>
              </div>
            </div>
          </div>

          <button type="button" class="btn btn-primary w-100 mt-2" (click)="goNext()">
            <span>Next</span>
            <i class="material-icons-round">arrow_forward</i>
          </button>
        }

        @if (currentStep() === 2) {
          <div class="form-section">
            <div class="form-row-2">
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

              <div class="form-group">
                <label for="dateOfBirth">Date of Birth</label>
                <input type="date" id="dateOfBirth" formControlName="dateOfBirth"
                  [class.input-error]="isFieldInvalid('dateOfBirth')" />
                <span class="error-text" [class.visible]="isFieldInvalid('dateOfBirth')">
                  {{ registerForm.get('dateOfBirth')?.errors?.['futureDate'] ? 'Cannot be in the future' : 'Date of birth is required' }}
                </span>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="gender">Gender</label>
                <select id="gender" formControlName="gender">
                  <option value="" disabled>Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <span class="error-text"></span>
              </div>

              <div class="form-group">
                <label for="nationalIdNumber">National ID / Aadhar Number</label>
                <input type="text" id="nationalIdNumber" formControlName="nationalIdNumber" placeholder="Unique ID"
                  [class.input-error]="isFieldInvalid('nationalIdNumber')" />
                <span class="error-text" [class.visible]="isFieldInvalid('nationalIdNumber')">National ID is required</span>
              </div>
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
          </div>

          <div class="step-actions mt-2">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              <i class="material-icons-round">arrow_back</i>
              <span>Back</span>
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="loading-spinner"></span>
                Registering...
              } @else {
                <i class="material-icons-round">how_to_reg</i>
                <span>Submit Registration</span>
              }
            </button>
          </div>
        }
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
      margin-bottom: 0.85rem;
    }
    .brand-icon-badge {
      width: 38px;
      height: 38px;
      margin: 0 auto 0.4rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
    }
    .brand-icon-badge i {
      font-size: 19px;
      color: #ffffff;
    }
    .brand h1 {
      font-size: 1.15rem;
      font-weight: 700;
      font-family: var(--font-title);
    }
    .brand p {
      font-size: 0.75rem;
      margin-top: 0.2rem;
    }

    /* Step indicator */
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .step-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 700;
      background-color: var(--bg-dark);
      border: 2px solid var(--border-color);
      color: var(--text-muted);
      flex-shrink: 0;
      transition: all var(--transition-fast);
    }
    .step-dot.active {
      border-color: var(--primary-color);
      background-color: var(--primary-color);
      color: #ffffff;
    }
    .step-dot.done {
      border-color: var(--primary-color);
      background-color: var(--primary-color);
      color: #ffffff;
    }
    .step-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .step-label.active {
      color: var(--primary-color);
    }
    .step-line {
      width: 20px;
      height: 2px;
      background-color: var(--border-color);
    }
    .step-line.done {
      background-color: var(--primary-color);
    }

    .form-section {
      padding: 0.85rem 0.9rem;
      background-color: rgba(148, 163, 184, 0.06);
      border: 1px solid var(--border-color);
      border-radius: 0.65rem;
      margin-bottom: 0.85rem;
    }

    .register-form .form-group {
      margin-bottom: 0.65rem;
      gap: 0.25rem;
    }
    .register-form .form-row-2 .form-group {
      margin-bottom: 0;
    }
    .step-actions {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.85rem;
    }
    .step-actions .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .register-form label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .register-form input,
    .register-form select {
      width: 100%;
      box-sizing: border-box;
      padding: 0.45rem 0.65rem;
      font-size: 0.82rem;
      min-width: 0;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 0.65rem 0.75rem;
      margin-bottom: 0.65rem;
    }
    .form-row-2:last-child {
      margin-bottom: 0;
    }
    .form-row-2 .form-group {
      min-width: 0;
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
      font-size: 16px;
    }
    .error-text {
      display: block;
      min-height: 0.8rem;
      font-size: 0.65rem;
      line-height: 1.15;
      color: var(--danger);
      opacity: 0;
      visibility: hidden;
    }
    .error-text.visible {
      opacity: 1;
      visibility: visible;
    }
    .form-footer {
      text-align: center;
      font-size: 0.78rem;
    }
    .form-footer a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
    }
    .form-footer a:hover {
      text-decoration: underline;
    }
    .register-form button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
    /* Shrink just this form's buttons — .btn is shared globally, so override
       scoped here instead of touching padding/font-size on the shared class. */
    .register-form .btn {
      padding: 0.5rem 1rem;
      font-size: 0.82rem;
    }
    .register-form .btn i {
      font-size: 16px;
    }
    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      display: inline-block;
      animation: spin 1s linear infinite;
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
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  currentStep = signal<1 | 2>(1);
  submittedStep1 = signal(false);
  submittedStep2 = signal(false);
  readonly indianStates = INDIAN_STATES;

  private readonly STEP1_FIELDS = ['name', 'email', 'phone', 'password', 'confirmPassword'];
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
    const submitted = this.STEP1_FIELDS.includes(field) ? this.submittedStep1() : this.submittedStep2();
    return !!(control && control.invalid && submitted);
  }

  goNext(): void {
    this.submittedStep1.set(true);
    const step1Invalid = this.STEP1_FIELDS.some(f => this.registerForm.get(f)?.invalid);
    if (step1Invalid) return;
    this.currentStep.set(2);
  }

  goBack(): void {
    this.currentStep.set(1);
  }

  onSubmit(): void {
    this.submittedStep2.set(true);
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    // confirmPassword only exists for client-side validation — the backend doesn't want it.
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
