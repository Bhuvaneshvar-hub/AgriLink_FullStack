import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts$ | async; track toast.id) {
        <div class="toast" [ngClass]="'toast-' + toast.type">
          <i class="material-icons-round toast-icon">
            @if (toast.type === 'success') { check_circle }
            @else if (toast.type === 'error') { error }
            @else if (toast.type === 'warning') { warning }
            @else { info }
          </i>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">
            <i class="material-icons-round">close</i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      width: 100%;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.5rem;
      background-color: var(--bg-card);
      border-left: 4px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      pointer-events: auto;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .toast-success {
      border-left-color: var(--success);
    }
    .toast-error {
      border-left-color: var(--danger);
    }
    .toast-warning {
      border-left-color: var(--warning);
    }
    .toast-info {
      border-left-color: var(--info);
    }
    .toast-icon {
      font-size: 20px;
    }
    .toast-success .toast-icon { color: var(--success); }
    .toast-error .toast-icon { color: var(--danger); }
    .toast-warning .toast-icon { color: var(--warning); }
    .toast-info .toast-icon { color: var(--info); }
    
    .toast-message {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      flex-grow: 1;
    }
    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 4px;
      transition: all var(--transition-fast);
    }
    .toast-close:hover {
      color: var(--text-primary);
      background-color: var(--border-color);
    }
    .toast-close i {
      font-size: 16px;
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  public toastService = inject(ToastService);
  public toasts$ = this.toastService.toasts$;
}
