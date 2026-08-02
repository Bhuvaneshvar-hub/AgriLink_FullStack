import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SubsidyService } from '../../services/subsidy.service';
import { FarmerService } from '../../services/farmer.service';
import { CropService } from '../../services/crop.service';
import { ProduceService } from '../../services/produce.service';

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

        @if (authService.hasRole(['SubsidyAdmin'])) {
          <a routerLink="/schemes" class="hero-card hero-teal">
            <div class="hero-card-top">
              <span class="hero-chip">Live</span>
              <i class="material-icons-round">inventory_2</i>
            </div>
            <div class="hero-value">{{ isLoadingRoleStats() ? '...' : activeSchemesCount() }}</div>
            <div class="hero-sub">Active Subsidy Schemes</div>
          </a>
        }

        @if (authService.hasRole(['ComplianceAnalyst'])) {
          <a routerLink="/applications" class="hero-card hero-teal">
            <div class="hero-card-top">
              <span class="hero-chip">Flagged</span>
              <i class="material-icons-round">gpp_bad</i>
            </div>
            <div class="hero-value">{{ isLoadingRoleStats() ? '...' : rejectedApplicationsCount() }}</div>
            <div class="hero-sub">Rejected Applications</div>
          </a>
        }

        @if (authService.hasRole(['ProcurementOfficer'])) {
          <a routerLink="/produce" class="hero-card hero-teal">
            <div class="hero-card-top">
              <span class="hero-chip">Ready</span>
              <i class="material-icons-round">storefront</i>
            </div>
            <div class="hero-value">{{ isLoadingRoleStats() ? '...' : availableListingsCount() }}</div>
            <div class="hero-sub">Available for Procurement</div>
          </a>
        }

        @if (authService.hasRole(['Farmer'])) {
          <a routerLink="/crops" class="hero-card hero-teal">
            <div class="hero-card-top">
              <span class="hero-chip">In Progress</span>
              <i class="material-icons-round">eco</i>
            </div>
            <div class="hero-value">{{ isLoadingRoleStats() ? '...' : myCropPlanStats().growing }}</div>
            <div class="hero-sub">Crop Plans Growing</div>
          </a>
        }
      </div>

      <!-- Status Overview (role-specific bar-graph breakdowns) -->
      @if (isLoadingRoleStats()) {
        <div class="chart-grid mb-3">
          <div class="card chart-card"><p class="text-secondary">Loading status overview...</p></div>
        </div>
      } @else if (chartCards().length > 0) {
        <div class="chart-grid mb-3">
          @for (chart of chartCards(); track chart.title) {
            <div class="card chart-card">
              <div class="card-header">
                <h3><i class="material-icons-round chart-card-icon">{{ chart.icon }}</i>{{ chart.title }}</h3>
              </div>
              <div class="bar-chart mt-3">
                @for (bar of chart.bars; track bar.label) {
                  <div class="bar-row">
                    <span class="bar-label">{{ bar.label }}</span>
                    <div class="bar-track">
                      <div class="bar-fill" [style.width.%]="bar.percent" [style.background-color]="bar.color"></div>
                    </div>
                    <span class="bar-count">{{ bar.count }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Mini Activity Row (audit-log based; only roles with audit read access) -->
      @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
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

      <!-- Role Insights Row (responsibility-specific KPIs) -->
      @if (authService.hasRole(['ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
        <div class="mini-grid">
          @if (authService.hasRole(['ExtensionOfficer'])) {
            <div class="mini-card">
              <div class="mini-card-header"><span class="mini-label">Registered Farmers</span></div>
              <div class="mini-big-value">{{ isLoadingRoleStats() ? '...' : registeredFarmersCount() }}</div>
              <span class="mini-caption">Active farmer accounts in the system</span>
            </div>
            <div class="mini-card">
              <div class="mini-card-header"><span class="mini-label">Pest / Disease Alerts</span></div>
              <div class="mini-big-value" [class.text-danger]="pestAlertsCount() > 0">{{ isLoadingRoleStats() ? '...' : pestAlertsCount() }}</div>
              <span class="mini-caption">Flagged during growth observations</span>
            </div>
          }
          @if (authService.hasRole(['ProcurementOfficer'])) {
            <a routerLink="/produce" class="mini-card mini-card-link">
              <div class="mini-card-header"><span class="mini-label">Available for Procurement</span></div>
              <div class="mini-big-value">{{ isLoadingRoleStats() ? '...' : availableListingsCount() }}</div>
              <span class="mini-caption">Produce listings ready to buy</span>
            </a>
            <a routerLink="/produce" class="mini-card mini-card-link">
              <div class="mini-card-header"><span class="mini-label">Payments Pending</span></div>
              <div class="mini-big-value">{{ isLoadingRoleStats() ? '...' : pendingPaymentsCount() }}</div>
              <span class="mini-caption">Produce sales awaiting payment</span>
            </a>
          }
          @if (authService.hasRole(['SubsidyAdmin'])) {
            <a routerLink="/schemes" class="mini-card mini-card-link">
              <div class="mini-card-header"><span class="mini-label">Active Schemes</span></div>
              <div class="mini-big-value">{{ isLoadingRoleStats() ? '...' : activeSchemesCount() }}</div>
              <span class="mini-caption">Currently open for applications</span>
            </a>
            <div class="mini-card">
              <div class="mini-card-header"><span class="mini-label">Total Disbursed</span></div>
              <div class="mini-big-value">₹{{ isLoadingRoleStats() ? '...' : (totalDisbursedAmount() | number) }}</div>
              <span class="mini-caption">Across all approved applications</span>
            </div>
          }
          @if (authService.hasRole(['ComplianceAnalyst'])) {
            <a routerLink="/applications" class="mini-card mini-card-link">
              <div class="mini-card-header"><span class="mini-label">Rejected Applications</span></div>
              <div class="mini-big-value">{{ isLoadingRoleStats() ? '...' : rejectedApplicationsCount() }}</div>
              <span class="mini-caption">Subsidy applications marked rejected</span>
            </a>
          }
        </div>
      }

      <div class="grid-layout">
        @if (authService.hasRole(['Farmer'])) {
          <!-- My Farm Overview Card (Farmer-scoped data) -->
          <div class="card my-farm-card">
            <div class="card-header">
              <h3>My Farm Overview</h3>
            </div>
            <div class="my-farm-stats mt-3">
              @if (isLoadingRoleStats()) {
                <p class="text-secondary">Loading your farm data...</p>
              } @else {
                <div class="farm-stat-row">
                  <span class="farm-stat-label">Crop Plans</span>
                  <span class="farm-stat-value">{{ myCropPlanStats().total }} total &middot; {{ myCropPlanStats().growing }} growing</span>
                </div>
                <div class="farm-stat-row">
                  <span class="farm-stat-label">Produce Listings</span>
                  <span class="farm-stat-value">{{ myProduceListingsCount() }} active</span>
                </div>
                <div class="farm-stat-row">
                  <span class="farm-stat-label">Subsidy Applications</span>
                  <span class="farm-stat-value">{{ mySubsidyStats().total }} total &middot; {{ mySubsidyStats().pending }} pending</span>
                </div>
              }
            </div>
          </div>
        }

        @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
          <!-- Recent Activity Card (audit read access only) -->
          <div class="card recent-activity-card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3>Recent Activity</h3>
              <a routerLink="/audit-logs" class="view-all-link">View All</a>
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
        }

        @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
          <!-- Action Needed Card (pending users / applications access) -->
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
    .hero-amber {
      background: linear-gradient(135deg, #b45309 0%, var(--warning) 100%);
    }
    .hero-blue {
      background: linear-gradient(135deg, #1d4ed8 0%, var(--secondary-color) 100%);
    }
    .hero-teal {
      background: linear-gradient(135deg, #0e7490 0%, var(--info) 100%);
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

    /* Status overview bar charts */
    .chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .chart-card-icon {
      font-size: 18px;
      vertical-align: middle;
      margin-right: 0.4rem;
      color: var(--primary-color);
    }
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .bar-row {
      display: grid;
      grid-template-columns: 90px 1fr 32px;
      align-items: center;
      gap: 0.75rem;
    }
    .bar-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .bar-track {
      height: 10px;
      background-color: var(--bg-dark);
      border-radius: 9999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width var(--transition-normal);
      min-width: 3px;
    }
    .bar-count {
      font-size: 0.85rem;
      font-weight: 700;
      text-align: right;
      font-family: var(--font-title);
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
    .mini-big-value {
      font-size: 1.75rem;
      font-weight: 700;
      font-family: var(--font-title);
      margin: 0.25rem 0;
    }
    .mini-card-link {
      text-decoration: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: transform var(--transition-normal);
    }
    .mini-card-link:hover {
      transform: translateY(-2px);
    }

    /* My Farm Overview (Farmer role) */
    .my-farm-stats {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .farm-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .farm-stat-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .farm-stat-label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .farm-stat-value {
      font-weight: 700;
      font-size: 0.95rem;
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
  private farmerService = inject(FarmerService);
  private cropService = inject(CropService);
  private produceService = inject(ProduceService);

  isLoadingStats = signal(true);
  isLoadingActivity = signal(true);
  isLoadingRoleStats = signal(true);

  pendingUsersCount = signal(0);
  pendingApplicationsCount = signal(0);
  activeUsersCount = signal(0);
  recentActivity = signal<any[]>([]);
  moduleActivityStats = signal<{ module: string; totalCount: number; days: { label: string; count: number; percent: number }[] }[]>([]);
  actionNeededItems = signal<{ key: string; title: string; subtitle: string; icon: string; color: string; link: string }[]>([]);

  // ExtensionOfficer
  registeredFarmersCount = signal(0);
  pestAlertsCount = signal(0);

  // ProcurementOfficer
  availableListingsCount = signal(0);
  pendingPaymentsCount = signal(0);

  // SubsidyAdmin
  activeSchemesCount = signal(0);
  totalDisbursedAmount = signal(0);

  // ComplianceAnalyst
  rejectedApplicationsCount = signal(0);

  // Farmer (self-scoped)
  myCropPlanStats = signal<{ total: number; growing: number }>({ total: 0, growing: 0 });
  myProduceListingsCount = signal(0);
  mySubsidyStats = signal<{ total: number; pending: number }>({ total: 0, pending: 0 });

  // Status-breakdown bar charts (role-specific)
  chartCards = signal<{ title: string; icon: string; bars: { label: string; count: number; percent: number; color: string }[] }[]>([]);

  private pendingUsersList: any[] = [];
  private pendingApplicationsList: any[] = [];
  private cropPlansRaw: any[] = [];
  private subsidyAppsRaw: any[] = [];
  private produceListingsRaw: any[] = [];
  private produceSalesRaw: any[] = [];

  private readonly CROP_STATUS_META: Record<string, { label: string; color: string }> = {
    PLANNED: { label: 'Planned', color: 'var(--secondary-color)' },
    SOWING: { label: 'Sowing', color: 'var(--info)' },
    GROWING: { label: 'Growing', color: 'var(--primary-color)' },
    HARVESTED: { label: 'Harvested', color: 'var(--success)' },
    FAILED: { label: 'Failed', color: 'var(--danger)' }
  };
  private readonly SUBSIDY_STATUS_META: Record<string, { label: string; color: string }> = {
    PE: { label: 'Pending', color: 'var(--warning)' },
    AP: { label: 'Approved', color: 'var(--success)' },
    RE: { label: 'Rejected', color: 'var(--danger)' },
    DB: { label: 'Disbursed', color: 'var(--secondary-color)' }
  };
  private readonly PRODUCE_STATUS_META: Record<string, { label: string; color: string }> = {
    AV: { label: 'Available', color: 'var(--success)' },
    PB: { label: 'Pending Bid', color: 'var(--warning)' },
    WD: { label: 'Withdrawn', color: 'var(--text-muted)' },
    SO: { label: 'Sold', color: 'var(--secondary-color)' }
  };
  private readonly PAYMENT_STATUS_META: Record<string, { label: string; color: string }> = {
    PD: { label: 'Paid', color: 'var(--success)' },
    PE: { label: 'Pending', color: 'var(--warning)' },
    OV: { label: 'Overdue', color: 'var(--danger)' }
  };

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

    let applicationsPromise: Promise<void> | null = null;
    if (this.authService.hasRole(['AgriLinkAdmin', 'SubsidyAdmin', 'ExtensionOfficer', 'ComplianceAnalyst'])) {
      applicationsPromise = new Promise((resolve) => {
        this.subsidyService.getAllApplications().subscribe({
          next: (data) => {
            const pending = data.filter(a => a.status === 'PE');
            this.pendingApplicationsCount.set(pending.length);
            this.pendingApplicationsList = pending;
            this.totalDisbursedAmount.set(data.reduce((sum, a) => sum + (a.disbursedAmount || 0), 0));
            this.rejectedApplicationsCount.set(data.filter(a => a.status === 'RE').length);
            this.subsidyAppsRaw = data;
          },
          error: () => {},
          complete: () => resolve()
        });
      });
      statCalls.push(applicationsPromise);
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

    if (this.authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
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

    this.loadRoleStats(applicationsPromise);
  }

  private loadRoleStats(applicationsPromise: Promise<void> | null): void {
    const roleStatsCalls: Promise<void>[] = [];
    if (applicationsPromise) {
      roleStatsCalls.push(applicationsPromise);
    }

    if (this.authService.hasRole(['ExtensionOfficer'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (data) => this.registeredFarmersCount.set(data.filter(f => f.status === 'AC').length),
          error: () => {},
          complete: () => resolve()
        });
      }));
      roleStatsCalls.push(new Promise((resolve) => {
        this.cropService.getAllGrowthObservations().subscribe({
          next: (data) => this.pestAlertsCount.set(data.filter(o => o.pestOrDiseaseFlag).length),
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.cropService.getAllCropPlans().subscribe({
          next: (data) => this.cropPlansRaw = data,
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['ProcurementOfficer'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.produceService.getAllProduceListings().subscribe({
          next: (data) => {
            this.availableListingsCount.set(data.filter(l => l.status === 'AV').length);
            this.produceListingsRaw = data;
          },
          error: () => {},
          complete: () => resolve()
        });
      }));
      roleStatsCalls.push(new Promise((resolve) => {
        this.produceService.getAllProduceSales().subscribe({
          next: (data) => {
            this.pendingPaymentsCount.set(data.filter(s => s.paymentStatus === 'PE').length);
            this.produceSalesRaw = data;
          },
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['SubsidyAdmin'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.subsidyService.getAllSchemes().subscribe({
          next: (data) => this.activeSchemesCount.set(data.filter(s => s.status === 'AC').length),
          error: () => {},
          complete: () => resolve()
        });
      }));
    }

    if (this.authService.hasRole(['Farmer'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.farmerService.getAllFarmerProfiles().subscribe({
          next: (profiles) => {
            const farmerId = profiles[0]?.farmerId;
            if (farmerId == null) {
              resolve();
              return;
            }
            this.cropService.getAllCropPlans().subscribe({
              next: (plans) => {
                const mine = plans.filter(p => p.farmerId === farmerId);
                this.myCropPlanStats.set({
                  total: mine.length,
                  growing: mine.filter(p => p.status === 'GROWING').length
                });
                this.cropPlansRaw = mine;
              },
              error: () => {},
              complete: () => resolve()
            });
            this.produceService.getAllProduceListings().subscribe({
              next: (listings) => {
                this.myProduceListingsCount.set(listings.filter(l => l.farmerId === farmerId).length);
              },
              error: () => {}
            });
            this.subsidyService.getApplicationsByFarmer(farmerId).subscribe({
              next: (data) => {
                this.mySubsidyStats.set({
                  total: data.length,
                  pending: data.filter(a => a.status === 'PE').length
                });
                this.subsidyAppsRaw = data;
              },
              error: () => {}
            });
          },
          error: () => resolve()
        });
      }));
    }

    Promise.all(roleStatsCalls).then(() => {
      this.isLoadingRoleStats.set(false);
      this.buildChartCards();
    });
  }

  private buildBars(
    data: any[],
    statusField: string,
    meta: Record<string, { label: string; color: string }>
  ): { label: string; count: number; percent: number; color: string }[] {
    const counts = new Map<string, number>();
    for (const item of data) {
      const key = item[statusField];
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return Object.keys(meta).map(key => {
      const count = counts.get(key) || 0;
      return { label: meta[key].label, count, percent: Math.round((count / max) * 100), color: meta[key].color };
    });
  }

  private buildChartCards(): void {
    const cards: { title: string; icon: string; bars: { label: string; count: number; percent: number; color: string }[] }[] = [];

    if (this.authService.hasRole(['Farmer'])) {
      cards.push({ title: 'My Crop Plans', icon: 'eco', bars: this.buildBars(this.cropPlansRaw, 'status', this.CROP_STATUS_META) });
      cards.push({ title: 'My Subsidy Applications', icon: 'assignment', bars: this.buildBars(this.subsidyAppsRaw, 'status', this.SUBSIDY_STATUS_META) });
    }
    if (this.authService.hasRole(['ExtensionOfficer'])) {
      cards.push({ title: 'Crop Plans (All Farmers)', icon: 'eco', bars: this.buildBars(this.cropPlansRaw, 'status', this.CROP_STATUS_META) });
      cards.push({ title: 'Subsidy Applications', icon: 'assignment', bars: this.buildBars(this.subsidyAppsRaw, 'status', this.SUBSIDY_STATUS_META) });
    }
    if (this.authService.hasRole(['ProcurementOfficer'])) {
      cards.push({ title: 'Produce Listings', icon: 'storefront', bars: this.buildBars(this.produceListingsRaw, 'status', this.PRODUCE_STATUS_META) });
      cards.push({ title: 'Sale Payment Status', icon: 'payments', bars: this.buildBars(this.produceSalesRaw, 'paymentStatus', this.PAYMENT_STATUS_META) });
    }
    if (this.authService.hasRole(['SubsidyAdmin', 'ComplianceAnalyst'])) {
      cards.push({ title: 'Subsidy Applications', icon: 'assignment', bars: this.buildBars(this.subsidyAppsRaw, 'status', this.SUBSIDY_STATUS_META) });
    }
    if (this.authService.hasRole(['AgriLinkAdmin'])) {
      cards.push({ title: 'Crop Plans', icon: 'eco', bars: this.buildBars(this.cropPlansRaw, 'status', this.CROP_STATUS_META) });
      cards.push({ title: 'Subsidy Applications', icon: 'assignment', bars: this.buildBars(this.subsidyAppsRaw, 'status', this.SUBSIDY_STATUS_META) });
    }

    this.chartCards.set(cards);
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
