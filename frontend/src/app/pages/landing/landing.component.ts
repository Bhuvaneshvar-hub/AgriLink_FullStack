import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing">
      <!-- ===== Top nav ===== -->
      <header class="landing-nav">
        <div class="brand">
          <i class="material-icons-round">agriculture</i>
          <span>AgriLink</span>
        </div>
        <nav class="nav-links">
          <a href="#features" (click)="scrollTo('features', $event)">Features</a>
          <a href="#how" (click)="scrollTo('how', $event)">How it works</a>
          <a href="#roles" (click)="scrollTo('roles', $event)">Roles</a>
        </nav>
        @if (authService.isLoggedIn()) {
          <a class="btn-nav" routerLink="/dashboard">Go to Dashboard</a>
        } @else {
          <a class="btn-nav" routerLink="/login">Login</a>
        }
      </header>

      <!-- ===== Hero ===== -->
      <section class="hero">
        <div class="hero-glow glow-a"></div>
        <div class="hero-glow glow-b"></div>
        <div class="hero-content">
          <span class="hero-badge">
            <i class="material-icons-round">verified</i> Trusted farm management platform
          </span>
          <h1>Empowering agriculture with <span>smarter technology</span></h1>
          <p>One platform to manage farmers, crops, subsidies, procurement, produce sales and compliance — from the field to the final report.</p>
          <div class="hero-actions">
            @if (authService.isLoggedIn()) {
              <a class="btn btn-primary" routerLink="/dashboard">
                <i class="material-icons-round">dashboard</i> Go to Dashboard
              </a>
            } @else {
              <a class="btn btn-primary" routerLink="/login">
                <i class="material-icons-round">login</i> Login to your account
              </a>
            }
          </div>
          <div class="hero-stats">
            <div class="stat"><strong>8</strong><span>Integrated modules</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><strong>6</strong><span>User roles</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><strong>100%</strong><span>End-to-end lifecycle</span></div>
          </div>
        </div>
      </section>

      <!-- ===== Features ===== -->
      <section class="section" id="features">
        <div class="section-head">
          <h2>Everything you need, in one place</h2>
          <p>Purpose-built modules that cover the entire agricultural journey.</p>
        </div>
        <div class="features">
          <div class="feature-card">
            <i class="material-icons-round">eco</i>
            <h3>Farmer &amp; land registration</h3>
            <p>Onboard farmers, verify identity, and manage land holdings and ownership records.</p>
          </div>
          <div class="feature-card">
            <i class="material-icons-round">grass</i>
            <h3>Crop planning</h3>
            <p>Plan seasonal sowing and harvest, and track growth observations from the field.</p>
          </div>
          <div class="feature-card">
            <i class="material-icons-round">payments</i>
            <h3>Subsidy &amp; schemes</h3>
            <p>Publish schemes, let farmers apply, and review, approve and disburse subsidies.</p>
          </div>
          <div class="feature-card">
            <i class="material-icons-round">inventory_2</i>
            <h3>Input &amp; procurement</h3>
            <p>Request subsidized inputs and manage procurement across distribution centres.</p>
          </div>
          <div class="feature-card">
            <i class="material-icons-round">storefront</i>
            <h3>Produce marketplace</h3>
            <p>List harvested produce, connect with buyers, and record sales and payments.</p>
          </div>
          <div class="feature-card">
            <i class="material-icons-round">insights</i>
            <h3>Analytics &amp; reporting</h3>
            <p>Real-time dashboards and exportable reports for data-driven decisions.</p>
          </div>
        </div>
      </section>

      <!-- ===== How it works ===== -->
      <section class="section alt" id="how">
        <div class="section-head">
          <h2>How AgriLink works</h2>
          <p>A connected flow from registration to reporting.</p>
        </div>
        <div class="steps">
          <div class="step"><span class="step-no">1</span><i class="material-icons-round">how_to_reg</i><h4>Register</h4><p>Farmers &amp; land onboarded and verified.</p></div>
          <div class="step-arrow"><i class="material-icons-round">arrow_forward</i></div>
          <div class="step"><span class="step-no">2</span><i class="material-icons-round">grass</i><h4>Plan crops</h4><p>Seasonal sowing &amp; harvest schedules.</p></div>
          <div class="step-arrow"><i class="material-icons-round">arrow_forward</i></div>
          <div class="step"><span class="step-no">3</span><i class="material-icons-round">local_shipping</i><h4>Get inputs</h4><p>Request subsidized seeds &amp; fertilizer.</p></div>
          <div class="step-arrow"><i class="material-icons-round">arrow_forward</i></div>
          <div class="step"><span class="step-no">4</span><i class="material-icons-round">payments</i><h4>Apply subsidy</h4><p>Submit &amp; track scheme applications.</p></div>
          <div class="step-arrow"><i class="material-icons-round">arrow_forward</i></div>
          <div class="step"><span class="step-no">5</span><i class="material-icons-round">sell</i><h4>Sell produce</h4><p>List &amp; sell to connected buyers.</p></div>
          <div class="step-arrow"><i class="material-icons-round">arrow_forward</i></div>
          <div class="step"><span class="step-no">6</span><i class="material-icons-round">assessment</i><h4>Report</h4><p>Analytics &amp; compliance visibility.</p></div>
        </div>
      </section>

      <!-- ===== Farmer CTA banner ===== -->
      @if (!authService.isLoggedIn()) {
        <section class="farmer-cta">
          <div class="farmer-cta-inner">
            <div class="farmer-cta-text">
              <i class="material-icons-round">agriculture</i>
              <div>
                <h2>Are you a farmer?</h2>
                <p>Create your profile in minutes and get access to subsidies, inputs and market linkage once approved.</p>
              </div>
            </div>
            <a class="btn btn-primary lg" routerLink="/register">
              <i class="material-icons-round">person_add</i> Register now
            </a>
          </div>
        </section>
      }

      <!-- ===== Roles ===== -->
      <section class="section" id="roles">
        <div class="section-head">
          <h2>Built for every role</h2>
          <p>Secure, role-based access tailored to each user.</p>
        </div>
        <div class="roles">
          <div class="role-chip"><i class="material-icons-round">admin_panel_settings</i> AgriLink Admin</div>
          <div class="role-chip"><i class="material-icons-round">account_balance_wallet</i> Subsidy Admin</div>
          <div class="role-chip"><i class="material-icons-round">support_agent</i> Extension Officer</div>
          <div class="role-chip"><i class="material-icons-round">local_shipping</i> Procurement Officer</div>
          <div class="role-chip"><i class="material-icons-round">fact_check</i> Compliance Analyst</div>
          <div class="role-chip"><i class="material-icons-round">agriculture</i> Farmer</div>
        </div>
      </section>

      <!-- ===== Footer ===== -->
      <footer class="landing-footer">
        <div class="footer-brand">
          <div class="brand">
            <i class="material-icons-round">agriculture</i>
            <span>AgriLink</span>
          </div>
          <p>Farm Management &amp; Agricultural Services Platform.</p>
        </div>
        <div class="footer-copy">© {{ year }} AgriLink · Agricultural Management Platform</div>
      </footer>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-dark); }

    /* Nav */
    .landing-nav {
      display: flex; align-items: center; gap: 1.5rem;
      padding: 1rem 2.5rem;
      position: sticky; top: 0; z-index: 20;
      background-color: color-mix(in srgb, var(--bg-dark) 88%, transparent);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
    }
    .brand { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
    .brand i { color: var(--primary-color); font-size: 28px; }
    .nav-links { display: flex; gap: 1.5rem; margin-left: auto; }
    .nav-links a { color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; font-weight: 500; }
    .nav-links a:hover { color: var(--primary-color); }
    .btn-nav {
      background-color: var(--primary-color); color: #fff;
      padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 600;
      text-decoration: none; font-size: 0.9rem; white-space: nowrap;
    }
    .btn-nav:hover { background-color: var(--primary-hover, #15803d); }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.7rem 1.6rem; border-radius: 0.5rem; font-weight: 600;
      text-decoration: none; font-size: 0.95rem;
    }
    .btn i { font-size: 20px; }
    .btn.lg { padding: 0.85rem 2rem; font-size: 1rem; }
    .btn-primary { background-color: #fff; color: #15803d; }
    .btn-primary:hover { background-color: #f0fdf4; }
    .btn-outline { border: 1px solid rgba(255,255,255,0.85); color: #fff; }
    .btn-outline:hover { background-color: rgba(255,255,255,0.12); }
    .btn-ghost { border: 1px solid var(--border-color); color: var(--text-primary); background: transparent; }
    .btn-ghost:hover { border-color: var(--primary-color); }

    /* Hero */
    .hero {
      position: relative; overflow: hidden;
      margin: 1.5rem 2.5rem 0;
      border-radius: 1.5rem;
      background: linear-gradient(155deg, #14532d 0%, #16a34a 48%, #0f766e 100%);
      color: #fff; padding: 5rem 2rem; text-align: center;
    }
    .hero-glow { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.5; pointer-events: none; }
    .glow-a { width: 360px; height: 360px; top: -100px; left: -70px; background: rgba(255,255,255,0.18); }
    .glow-b { width: 420px; height: 420px; bottom: -140px; right: -90px; background: rgba(59,130,246,0.35); }
    .hero-content { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
      padding: 0.4rem 1rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 500; margin-bottom: 1.5rem;
    }
    .hero-badge i { font-size: 18px; }
    .hero-content h1 { font-size: 2.75rem; font-weight: 800; line-height: 1.15; margin-bottom: 1rem; }
    .hero-content h1 span { color: #bbf7d0; }
    .hero-content p { font-size: 1.1rem; opacity: 0.92; margin-bottom: 2rem; line-height: 1.6; }
    .hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
    .hero-stats { display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; }
    .stat strong { font-size: 2rem; font-weight: 800; }
    .stat span { font-size: 0.85rem; opacity: 0.85; }
    .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.25); }

    /* Sections */
    .section { padding: 4rem 2.5rem; }
    #features, #how, #roles { scroll-margin-top: 90px; }
    .section.alt { background-color: var(--bg-card); }
    .section-head { text-align: center; max-width: 620px; margin: 0 auto 2.5rem; }
    .section-head h2 { font-size: 1.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
    .section-head p { font-size: 1rem; color: var(--text-secondary); }

    /* Features */
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; max-width: 1100px; margin: 0 auto; }
    .feature-card {
      background-color: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 1rem; padding: 1.75rem 1.5rem;
      transition: border-color var(--transition-normal, 0.2s), transform var(--transition-normal, 0.2s);
    }
    .section.alt .feature-card { background-color: var(--bg-dark); }
    .feature-card:hover { border-color: var(--primary-color); transform: translateY(-4px); }
    .feature-card i {
      font-size: 30px; color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      border-radius: 0.75rem; padding: 0.55rem;
    }
    .feature-card h3 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.5rem; color: var(--text-primary); }
    .feature-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    /* Steps */
    .steps { display: flex; align-items: stretch; justify-content: center; gap: 0.5rem; flex-wrap: wrap; max-width: 1150px; margin: 0 auto; }
    .step {
      flex: 1 1 150px; max-width: 175px;
      background-color: var(--bg-dark); border: 1px solid var(--border-color);
      border-radius: 1rem; padding: 1.5rem 1rem; text-align: center; position: relative;
    }
    .step-no {
      position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--primary-color); color: #fff; font-size: 0.8rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .step i { font-size: 28px; color: var(--primary-color); margin-top: 0.5rem; }
    .step h4 { font-size: 0.95rem; font-weight: 700; margin: 0.6rem 0 0.35rem; color: var(--text-primary); }
    .step p { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; margin: 0; }
    .step-arrow { display: flex; align-items: center; color: var(--text-secondary); opacity: 0.5; }
    .step-arrow i { font-size: 22px; }

    /* Farmer CTA */
    .farmer-cta { padding: 2rem 2.5rem; }
    .farmer-cta-inner {
      background: linear-gradient(120deg, #15803d 0%, #0f766e 100%);
      border-radius: 1.5rem; padding: 2.5rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
      color: #fff;
    }
    .farmer-cta-text { display: flex; align-items: center; gap: 1rem; }
    .farmer-cta-text > i { font-size: 44px; background: rgba(255,255,255,0.18); border-radius: 1rem; padding: 0.6rem; }
    .farmer-cta-text h2 { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.3rem; }
    .farmer-cta-text p { font-size: 0.95rem; opacity: 0.92; margin: 0; max-width: 480px; }

    /* Roles */
    .roles { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 900px; margin: 0 auto; }
    .role-chip {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background-color: var(--bg-card); border: 1px solid var(--border-color);
      padding: 0.7rem 1.25rem; border-radius: 2rem; font-size: 0.9rem; font-weight: 500; color: var(--text-primary);
    }
    .role-chip i { font-size: 20px; color: var(--primary-color); }

    /* Footer */
    .landing-footer {
      margin-top: auto; padding: 2.5rem;
      display: grid; grid-template-columns: 1fr; gap: 1rem;
      border-top: 1px solid var(--border-color); background-color: var(--bg-card);
    }
    .footer-brand p { font-size: 0.85rem; color: var(--text-secondary); margin: 0.5rem 0 0; }
    .footer-actions { display: flex; gap: 0.75rem; align-items: center; }
    .footer-copy { grid-column: 1 / -1; border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.8rem; color: var(--text-secondary); }

    /* Responsive */
    @media (max-width: 1024px) { .features { grid-template-columns: repeat(2, 1fr); } .step-arrow { display: none; } }
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .hero { margin: 1rem 1.25rem 0; padding: 3.5rem 1.25rem; }
      .hero-content h1 { font-size: 2rem; }
      .section { padding: 3rem 1.25rem; }
      .farmer-cta-inner { padding: 1.75rem; }
      .landing-footer { grid-template-columns: 1fr; }
    }
    @media (max-width: 560px) { .features { grid-template-columns: 1fr; } }
  `]
})
export class LandingComponent {
  public authService = inject(AuthService);
  year = new Date().getFullYear();

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
