import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

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

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-3">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name" 
            formControlName="name" 
            placeholder="John Doe"
            [class.input-error]="isFieldInvalid('name')" />
          @if (isFieldInvalid('name')) {
            <span class="error-text">Full name is required</span>
          }
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            formControlName="email" 
            placeholder="john.doe@example.com"
            [class.input-error]="isFieldInvalid('email')" />
          @if (isFieldInvalid('email')) {
            <span class="error-text">Please enter a valid email address</span>
          }
        </div>

        <div class="form-group">
          <label for="phone">Phone Number (10 digits)</label>
          <input 
            type="text" 
            id="phone" 
            formControlName="phone" 
            placeholder="9876543210"
            [class.input-error]="isFieldInvalid('phone')" />
          @if (isFieldInvalid('phone')) {
            <span class="error-text">Phone number must be exactly 10 digits</span>
          }
        </div>

        <div class="form-group">
          <label for="regionId">Region ID</label>
          <input 
            type="number" 
            id="regionId" 
            formControlName="regionId" 
            placeholder="1"
            [class.input-error]="isFieldInvalid('regionId')" />
          @if (isFieldInvalid('regionId')) {
            <span class="error-text">Region ID is required</span>
          }
        </div>

        <div class="form-group">
          <label for="password">Password (min 8 characters)</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password" 
            placeholder="••••••••"
            [class.input-error]="isFieldInvalid('password')" />
          @if (isFieldInvalid('password')) {
            <span class="error-text">Password must be at least 8 characters</span>
          }
        </div>

        <button type="submit" class="btn btn-primary w-100 mt-3" [disabled]="isLoading() || registerForm.invalid">
          @if (isLoading()) {
            <span class="loading-spinner"></span>
            Registering...
          } @else {
            <span>Submit Registration</span>
          }
        </button>
      </form>

      <div class="form-footer mt-3">
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
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isLoading = signal(false);
  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    regionId: [1, [Validators.required, Validators.min(1)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Farmer'] // Default role is Farmer
  });

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.authService.register(this.registerForm.value).subscribe({
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
