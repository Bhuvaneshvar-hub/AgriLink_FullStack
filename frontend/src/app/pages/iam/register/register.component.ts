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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
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
    nationalIdNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
    village: ['', [Validators.required, Validators.maxLength(50)]],
    district: ['', [Validators.required, Validators.maxLength(50)]],
    state: ['', [Validators.required]],
    bankAccountNumber: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]]
  }, { validators: passwordsMatch });

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    const submitted = this.STEP1_FIELDS.includes(field) ? this.submittedStep1() : this.submittedStep2();
    return !!(control && control.invalid && submitted);
  }

  /** Strips any non-digit characters as the user types (phone, national ID, bank account). */
  restrictToDigits(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '');
    if (digitsOnly !== input.value) {
      input.value = digitsOnly;
      input.dispatchEvent(new Event('input'));
    }
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
