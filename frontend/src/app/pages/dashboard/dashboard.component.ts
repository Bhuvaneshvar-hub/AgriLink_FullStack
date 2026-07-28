import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

      <!-- Quick Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="material-icons-round">account_circle</i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Your Role</span>
            <span class="stat-value" style="font-size: 1.25rem;">{{ currentUser?.roleName }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="color: var(--secondary-color); background-color: rgba(59, 130, 246, 0.1);">
            <i class="material-icons-round">pin_drop</i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Allocated Region</span>
            <span class="stat-value">#{{ currentUser?.regionId || 'Global' }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="color: var(--success); background-color: rgba(22, 163, 74, 0.1);">
            <i class="material-icons-round">verified_user</i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Account Status</span>
            <span class="stat-value text-success" style="font-size: 1.25rem;">Active</span>
          </div>
        </div>
      </div>

      <div class="grid-layout">
        <!-- Profile Info Card -->
        <div class="card profile-card">
          <div class="card-header">
            <h3>My Account Profile</h3>
          </div>
          <div class="profile-details mt-3">
            <div class="detail-row">
              <span class="label">Full Name:</span>
              <span class="value">{{ currentUser?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email Address:</span>
              <span class="value">{{ currentUser?.email }}</span>
            </div>
            <div class="detail-row">
              <span class="label">User ID:</span>
              <span class="value">#{{ currentUser?.userId }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Role Tier:</span>
              <span class="value badge badge-success">{{ currentUser?.roleName }}</span>
            </div>
          </div>
        </div>

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
    .grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-row .label {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .detail-row .value {
      font-weight: 600;
    }
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
export class DashboardComponent {
  public authService = inject(AuthService);

  get currentUser() {
    return this.authService.currentUserValue;
  }
}
