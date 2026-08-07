import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="auth-layout split">
      <div class="auth-visual">
        <div class="visual-glow glow-a"></div>
        <div class="visual-glow glow-b"></div>

        <div class="visual-content">
          <div class="visual-brand">
            <i class="material-icons-round">agriculture</i>
            <span>AgriLink</span>
          </div>

          @if (isRegister()) {
            <h2>Join AgriLink as a registered farmer</h2>
            <p>Create your profile in minutes and get access to subsidies, procurement and support once approved.</p>

            <ul class="visual-features">
              <li><i class="material-icons-round">verified_user</i> Simple, guided self-registration</li>
              <li><i class="material-icons-round">payments</i> Access subsidy &amp; procurement programs</li>
              <li><i class="material-icons-round">support_agent</i> Support from extension officers</li>
              <li><i class="material-icons-round">insights</i> Track your applications in real time</li>
            </ul>
          } @else {
            <h2>Empowering agriculture with smarter technology</h2>
            <p>One platform to manage farmers, subsidies, procurement and compliance — end to end.</p>

            <ul class="visual-features">
              <li><i class="material-icons-round">eco</i> Farmer &amp; crop lifecycle management</li>
              <li><i class="material-icons-round">payments</i> Subsidy &amp; procurement tracking</li>
              <li><i class="material-icons-round">fact_check</i> Compliance &amp; audit visibility</li>
              <li><i class="material-icons-round">insights</i> Real-time analytics &amp; reporting</li>
            </ul>
          }
        </div>

        <div class="floating-icon icon-1"><i class="material-icons-round">local_florist</i></div>
        <div class="floating-icon icon-2"><i class="material-icons-round">water_drop</i></div>
        <div class="floating-icon icon-3"><i class="material-icons-round">grass</i></div>
      </div>

      <div class="auth-panel">
        <div class="auth-card" [class.wide]="isRegister()">
          <router-outlet></router-outlet>
        </div>
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
    .auth-layout.split {
      padding: 0;
      justify-content: stretch;
    }
    .auth-panel {
      flex: 1 1 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .auth-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 1.75rem;
      width: 100%;
      max-width: 380px;
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
      box-shadow: var(--shadow-lg);
      transition: border-color var(--transition-normal), max-width var(--transition-normal);
    }
    .auth-card.wide {
      max-width: 460px;
      padding: 1.25rem 1.5rem;
    }
    .auth-card:hover {
      border-color: var(--primary-color);
    }

    /* Left visual panel */
    .auth-visual {
      position: relative;
      flex: 1 1 55%;
      min-height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      background: linear-gradient(155deg, #14532d 0%, #16a34a 45%, #0f766e 100%);
      color: #fff;
    }
    .visual-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.55;
      pointer-events: none;
    }
    .glow-a {
      width: 320px;
      height: 320px;
      top: -80px;
      left: -60px;
      background: rgba(255, 255, 255, 0.18);
    }
    .glow-b {
      width: 380px;
      height: 380px;
      bottom: -120px;
      right: -80px;
      background: rgba(59, 130, 246, 0.35);
    }
    .visual-content {
      position: relative;
      z-index: 1;
      padding: 3rem 3.5rem;
      max-width: 480px;
    }
    .visual-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 2.5rem;
    }
    .visual-brand i {
      font-size: 28px;
    }
    .visual-content h2 {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 1rem;
      color: #E8F5E9;
    }
    .visual-content p {
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 2rem;
      color: #E8F5E9;
    }
    .visual-features {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      padding: 0;
      margin: 0;
    }
    .visual-features li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .visual-features i {
      font-size: 20px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      padding: 0.35rem;
    }
    .floating-icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 0.85rem;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(4px);
      animation: float 6s ease-in-out infinite;
    }
    .floating-icon i {
      font-size: 22px;
      opacity: 0.9;
    }
    .icon-1 { top: 10%; right: 8%; animation-delay: 0s; }
    .icon-2 { top: 48%; right: 5%; animation-delay: 1.5s; }
    .icon-3 { bottom: 10%; right: 14%; animation-delay: 3s; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-14px); }
    }

    @media (max-width: 1024px) {
      .auth-visual { display: none; }
    }
  `]
})
export class AuthLayoutComponent {
  private router = inject(Router);

  isRegister = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.includes('/register')),
      startWith(this.router.url.includes('/register'))
    ),
    { initialValue: this.router.url.includes('/register') }
  );
}
