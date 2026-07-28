import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-card">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-dark);
      background-image: radial-gradient(circle at 10% 20%, rgba(22, 163, 74, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 40%);
      padding: 1.5rem;
    }
    .auth-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2.5rem;
      width: 100%;
      max-width: 460px;
      box-shadow: var(--shadow-lg);
      transition: border-color var(--transition-normal);
    }
    .auth-card:hover {
      border-color: var(--primary-color);
    }
  `]
})
export class AuthLayoutComponent {}
