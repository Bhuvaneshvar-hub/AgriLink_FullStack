import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SubsidyService } from '../../services/subsidy.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <div class="dashboard-greeting mb-3">
        <h1>Welcome Back, {{ currentUser?.name }}!</h1>
        <p class="text-secondary">Here is an overview of the agricultural portal activities based on your role.</p>
      </div>

      <!-- Hero Row -->
      <div class="hero-grid">
        <div class="hero-card hero-profile">
          <div class="hero-card-top">
            <span class="hero-chip">Account</span>
            <i class="material-icons-round">account_circle</i>
          </div>
          <div class="hero-name">{{ currentUser?.name }}</div>
          <div class="hero-sub">{{ currentUser?.email }}</div>
          <div class="hero-footer">
            <span class="hero-footer-label">Role</span>
            <span class="hero-footer-value">{{ currentUser?.roleName }}</span>
          </div>
        </div>

        @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
          <a routerLink="/pending-users" class="hero-card hero-amber">
            <div class="hero-card-top">
              <span class="hero-chip">Needs Review</span>
              <i class="material-icons-round">how_to_reg</i>
            </div>
            <div class="hero-value">{{ isLoadingStats() ? '...' : pendingUsersCount() }}</div>
            <div class="hero-sub">Pending User Approvals</div>
          </a>
        }

        @if (authService.hasRole(['AgriLinkAdmin', 'SubsidyAdmin', 'ExtensionOfficer', 'ComplianceAnalyst'])) {
          <a routerLink="/applications" class="hero-card hero-blue">
            <div class="hero-card-top">
              <span class="hero-chip">Awaiting Action</span>
              <i class="material-icons-round">assignment_late</i>
            </div>
            <div class="hero-value">{{ isLoadingStats() ? '...' : pendingApplicationsCount() }}</div>
            <div class="hero-sub">Pending Subsidy Applications</div>
          </a>
        }

        @if (!authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
          <div class="hero-card hero-blue">
            <div class="hero-card-top">
              <span class="hero-chip">Region</span>
              <i class="material-icons-round">pin_drop</i>
            </div>
            <div class="hero-value">#{{ currentUser?.regionId || 'Global' }}</div>
            <div class="hero-sub">Allocated Region</div>
          </div>
        }
      </div>

      <!-- Mini Activity Row -->
      @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst', 'ExtensionOfficer', 'SubsidyAdmin'])) {
        <div class="mini-grid">
          @if (isLoadingActivity()) {
            <div class="mini-card"><p class="text-secondary">Loading activity breakdown...</p></div>
          } @else if (moduleActivityStats().length === 0) {
            <div class="mini-card"><p class="text-secondary">No activity recorded yet.</p></div>
          } @else {
            @for (stat of moduleActivityStats(); track stat.module) {
              <div class="mini-card">
                <div class="mini-card-header">
                  <span class="mini-label">{{ stat.module }} Activity</span>
                  <span class="mini-count">{{ stat.totalCount }}</span>
                </div>
                <div class="sparkline">
                  @for (day of stat.days; track day.label) {
                    <div class="sparkline-bar-wrap" [title]="day.label + ': ' + day.count">
                      <div class="sparkline-bar" [style.height.%]="day.percent"></div>
                    </div>
                  }
                </div>
                <span class="mini-caption">Last 7 days</span>
              </div>
            }
          }
        </div>
      }

      <div class="grid-layout">
        @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst', 'ExtensionOfficer', 'SubsidyAdmin'])) {
          <!-- Recent Activity Card -->
          <div class="card recent-activity-card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3>Recent Activity</h3>
              @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
                <a routerLink="/audit-logs" class="view-all-link">View All</a>
              }
            </div>
            <div class="activity-list mt-3">
              @if (isLoadingActivity()) {
                <p class="text-secondary">Loading recent activity...</p>
              } @else if (recentActivity().length === 0) {
                <p class="text-secondary">No recent activity to show.</p>
              } @else {
                @for (log of recentActivity(); track log.auditId) {
                  <div class="activity-row">
                    <i class="material-icons-round activity-icon">history</i>
                    <div class="activity-details">
                      <span class="activity-action">{{ log.action }}</span>
                      <span class="activity-meta">{{ log.module }} &middot; {{ log.timestamp | date:'medium' }}</span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Action Needed Card -->
          <div class="card action-needed-card">
            <div class="card-header">
              <h3>Action Needed</h3>
            </div>
            <div class="action-needed-list mt-3">
              @if (isLoadingStats()) {
                <p class="text-secondary">Loading pending items...</p>
              } @else if (actionNeededItems().length === 0) {
                <p class="text-secondary">Nothing pending &mdash; you're all caught up!</p>
              } @else {
                @for (item of actionNeededItems(); track item.key) {
                  <a [routerLink]="item.link" class="action-needed-row">
                    <i class="material-icons-round action-needed-icon" [style.color]="item.color">{{ item.icon }}</i>
                    <div class="action-needed-details">
                      <span class="action-needed-title">{{ item.title }}</span>
                      <span class="action-needed-meta">{{ item.subtitle }}</span>
                    </div>
                    <i class="material-icons-round action-needed-arrow">chevron_right</i>
                  </a>
                }
              }
            </div>
          </div>
        }

        <!-- Quick Actions Card -->
        <div class="card quick-actions-card">
          <div class="card-header">
            <h3>Quick Operations</h3>
          </div>
          <div class="actions-grid mt-3">
            @if (authService.hasRole(['AgriLinkAdmin'])) {
              <a routerLink="/users" class="action-link">
                <i class="material-icons-round">people</i>
                <span>Manage Users</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
              <a routerLink="/pending-users" class="action-link">
                <i class="material-icons-round">how_to_reg</i>
                <span>Pending Approvals</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
              <a routerLink="/schemes" class="action-link">
                <i class="material-icons-round">inventory_2</i>
                <span>View Schemes</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst', 'Farmer'])) {
              <a routerLink="/applications" class="action-link">
                <i class="material-icons-round">assignment</i>
                <span>Subsidy Applications</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
              <a routerLink="/reports" class="action-link">
                <i class="material-icons-round">analytics</i>
                <span>Generate Reports</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
              <a routerLink="/audit-logs" class="action-link">
                <i class="material-icons-round">history</i>
                <span>Audit Logs</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'Farmer'])) {
              <a routerLink="/crops" class="action-link">
                <i class="material-icons-round">eco</i>
                <span>Crops Management</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'Farmer', 'ProcurementOfficer', 'ExtensionOfficer'])) {
              <a routerLink="/produce" class="action-link">
                <i class="material-icons-round">storefront</i>
                <span>Produce Market</span>
              </a>
            }

            @if (authService.hasRole(['AgriLinkAdmin', 'Farmer', 'ExtensionOfficer'])) {
              <a routerLink="/inputs" class="action-link">
                <i class="material-icons-round">shopping_bag</i>
                <span>Input Operations</span>
              </a>
            }

            <a routerLink="/notifications" class="action-link">
              <i class="material-icons-round">notifications</i>
              <span>System Alerts</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Hero cards */
    .hero-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .hero-card {
      border-radius: 1rem;
      padding: 1.5rem;
      color: #ffffff;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 150px;
      box-shadow: var(--shadow-lg);
      transition: transform var(--transition-normal);
    }
    a.hero-card:hover {
      transform: translateY(-3px);
    }
    .hero-profile {
      background: linear-gradient(135deg, var(--sidebar-bg) 0%, var(--primary-color) 100%);
    }
    .hero-amber {
      background: linear-gradient(135deg, #b45309 0%, var(--warning) 100%);
    }
    .hero-blue {
      background: linear-gradient(135deg, #1d4ed8 0%, var(--secondary-color) 100%);
    }
    .hero-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hero-card-top i {
      font-size: 22px;
      opacity: 0.85;
    }
    .hero-chip {
      background: rgba(255, 255, 255, 0.18);
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .hero-name {
      font-size: 1.15rem;
      font-weight: 700;
      font-family: var(--font-title);
    }
    .hero-value {
      font-size: 2.25rem;
      font-weight: 700;
      font-family: var(--font-title);
    }
    .hero-sub {
      font-size: 0.85rem;
      opacity: 0.9;
    }
    .hero-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 0.65rem;
      font-size: 0.8rem;
    }
    .hero-footer-label {
      opacity: 0.75;
    }
    .hero-footer-value {
      font-weight: 700;
    }

    /* Mini activity row */
    .mini-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .mini-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: var(--shadow-md);
    }
    .mini-card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.6rem;
    }
    .mini-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .mini-count {
      font-size: 1.1rem;
      font-weight: 700;
      font-family: var(--font-title);
      color: var(--primary-color);
    }
    .sparkline {
      display: flex;
      align-items: flex-end;
      gap: 0.35rem;
      height: 48px;
    }
    .sparkline-bar-wrap {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: flex-end;
      background-color: var(--bg-dark);
      border-radius: 4px;
      overflow: hidden;
    }
    .sparkline-bar {
      width: 100%;
      min-height: 3px;
      border-radius: 4px;
      background-color: var(--primary-color);
      transition: height var(--transition-normal);
    }
    .mini-caption {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Bottom layout */
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .recent-activity-card, .action-needed-card {
      display: flex;
      flex-direction: column;
    }
    .view-all-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .activity-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .activity-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .activity-icon {
      font-size: 20px;
      color: var(--text-secondary);
      margin-top: 0.15rem;
    }
    .activity-details {
      display: flex;
      flex-direction: column;
    }
    .activity-action {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .activity-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Action needed list */
    .action-needed-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .action-needed-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: background-color var(--transition-fast);
    }
    .action-needed-row:hover {
      background-color: var(--primary-light);
    }
    .action-needed-icon {
      font-size: 20px;
    }
    .action-needed-details {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .action-needed-title {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .action-needed-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .action-needed-arrow {
      color: var(--text-muted);
      font-size: 20px;
    }

    /* Quick operations */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .action-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border-color);
      background-color: rgba(241, 245, 249, 0.8);
      color: var(--text-primary);
      text-decoration: none;
      transition: all var(--transition-normal);
      gap: 0.5rem;
    }
    .action-link:hover {
      border-color: var(--primary-color);
      background-color: var(--primary-light);
      transform: translateY(-2px);
    }
    .action-link i {
      font-size: 28px;
      color: var(--primary-color);
    }
    .action-link span {
      font-size: 0.85rem;
      font-weight: 600;
    }
  `]
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private userService = inject(UserService);
  private subsidyService = inject(SubsidyService);

  isLoadingStats = signal(true);
  isLoadingActivity = signal(true);

  pendingUsersCount = signal(0);
  pendingApplicationsCount = signal(0);
  activeUsersCount = signal(0);
  recentActivity = signal<any[]>([]);
  moduleActivityStats = signal<{ module: string; totalCount: number; days: { label: string; count: number; percent: number }[] }[]>([]);
  actionNeededItems = signal<{ key: string; title: string; subtitle: string; icon: string; color: string; link: string }[]>([]);

  private pendingUsersList: any[] = [];
  private pendingApplicationsList: any[] = [];

  get currentUser() {
    return this.authService.currentUserValue;
  }

  ngOnInit(): void {
    const statCalls: Promise<void>[] = [];

    if (this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
      statCalls.push(new Promise((resolve) => {
        this.userService.getPendingUsers().subscribe({
          next: (data) => {
            this.pendingUsersCount.set(data.length);
            this.pendingUsersList = data;
          },
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['AgriLinkAdmin', 'SubsidyAdmin', 'ExtensionOfficer', 'ComplianceAnalyst'])) {
      statCalls.push(new Promise((resolve) => {
        this.subsidyService.getAllApplications().subscribe({
          next: (data) => {
            const pending = data.filter(a => a.status === 'PE');
            this.pendingApplicationsCount.set(pending.length);
            this.pendingApplicationsList = pending;
          },
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['AgriLinkAdmin'])) {
      statCalls.push(new Promise((resolve) => {
        this.userService.getAllUsers().subscribe({
          next: (data) => this.activeUsersCount.set(data.filter(u => u.status === 'A').length),
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    Promise.all(statCalls).then(() => {
      this.buildActionNeededItems();
      this.isLoadingStats.set(false);
    });

    if (this.authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst', 'ExtensionOfficer', 'SubsidyAdmin'])) {
      this.userService.getAllAuditLogs().subscribe({
        next: (data) => {
          const sorted = data.sort((a, b) => b.auditId - a.auditId);
          this.recentActivity.set(sorted.slice(0, 5));
          this.buildModuleActivityStats(data);
          this.isLoadingActivity.set(false);
        },
        error: () => this.isLoadingActivity.set(false)
      });
    } else {
      this.isLoadingActivity.set(false);
    }
  }

  private buildModuleActivityStats(logs: any[]): void {
    const dayKeys: string[] = [];
    const dayLabels = new Map<string, string>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayKeys.push(key);
      dayLabels.set(key, d.toLocaleDateString(undefined, { weekday: 'short' }));
    }
    const earliest = new Date(dayKeys[0]);

    const recentLogs = logs.filter(l => l.timestamp && new Date(l.timestamp) >= earliest);
    const totals = new Map<string, number>();
    const perModulePerDay = new Map<string, Map<string, number>>();

    for (const log of recentLogs) {
      const module = log.module || 'Other';
      const dayKey = new Date(log.timestamp).toISOString().slice(0, 10);
      totals.set(module, (totals.get(module) || 0) + 1);
      if (!perModulePerDay.has(module)) {
        perModulePerDay.set(module, new Map());
      }
      const dayMap = perModulePerDay.get(module)!;
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    }

    const topModules = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    this.moduleActivityStats.set(topModules.map(([module, totalCount]) => {
      const dayMap = perModulePerDay.get(module) || new Map<string, number>();
      const maxDay = Math.max(1, ...dayKeys.map(k => dayMap.get(k) || 0));
      const days = dayKeys.map(key => {
        const count = dayMap.get(key) || 0;
        return {
          label: dayLabels.get(key)!,
          count,
          percent: Math.round((count / maxDay) * 100)
        };
      });
      return { module, totalCount, days };
    }));
  }

  private buildActionNeededItems(): void {
    const items: { key: string; title: string; subtitle: string; icon: string; color: string; link: string }[] = [];

    for (const user of this.pendingUsersList.slice(0, 3)) {
      items.push({
        key: `user-${user.userId}`,
        title: `${user.name} awaiting approval`,
        subtitle: `Requested role: ${user.roleName}`,
        icon: 'how_to_reg',
        color: 'var(--warning)',
        link: '/pending-users'
      });
    }

    for (const app of this.pendingApplicationsList.slice(0, 3)) {
      items.push({
        key: `app-${app.applicationId}`,
        title: `Subsidy application #${app.applicationId} pending review`,
        subtitle: app.schemeId ? `Scheme #${app.schemeId}` : 'Awaiting review',
        icon: 'assignment_late',
        color: 'var(--secondary-color)',
        link: '/applications'
      });
    }

    this.actionNeededItems.set(items.slice(0, 5));
  }
}
