import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { FarmerService } from '../../../services/farmer.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { toggleSort, sortIcon, applySort } from '../../../utils/table-sort.util';

@Component({
  selector: 'app-user-pending-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="pending-users-page">
      <div class="page-header mb-3">
        <h1>Pending Approvals</h1>
        <p class="text-secondary">Review and approve pending farmer self-registrations, field-staff enrolments, and land-holding submissions.</p>
      </div>

      <!-- Data Table -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading pending requests...</p>
        </div>
      } @else if (users().length === 0 && pendingHoldings().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">rule_folder</i>
          <h3>No Pending Approvals</h3>
          <p>All requests have been processed. Great job!</p>
        </div>
      } @else {
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
            User Registrations
            @if (users().length > 0) { <span class="tab-count">{{ users().length }}</span> }
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'holdings'" (click)="activeTab.set('holdings')">
            Land Holdings
            @if (pendingHoldings().length > 0) { <span class="tab-count">{{ pendingHoldings().length }}</span> }
          </button>
        </div>

        <!-- Pending user registrations -->
        @if (activeTab() === 'users') {
          @if (users().length === 0) {
            <div class="empty-state card">
              <i class="material-icons-round">rule_folder</i>
              <h3>No Pending User Registrations</h3>
              <p>All registration requests have been processed.</p>
            </div>
          } @else {
            <div class="table-container">
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Requested Role</th>
                      <th>Region ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of paginatedUsers(); track user.userId) {
                      <tr>
                        <td><strong>{{ user.name }}</strong> <span class="id-note">(#{{ user.userId }})</span></td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.phone }}</td>
                        <td>{{ user.roleName }}</td>
                        <td>{{ user.regionId || 'N/A' }}</td>
                        <td>
                          <span class="badge badge-warning">Pending</span>
                        </td>
                        <td>
                          <app-action-menu>
                            <button class="menu-item" (click)="viewUserDetails(user)">
                              <i class="material-icons-round">visibility</i> View
                            </button>
                            <button class="menu-item" (click)="onApprove(user)">
                              <i class="material-icons-round">done</i> Approve
                            </button>
                          </app-action-menu>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination
                [currentPage]="currentPage"
                [pageSize]="pageSize"
                [totalElements]="users().length"
                (pageChange)="onPageChange($event)"
                (pageSizeChange)="onPageSizeChange($event)">
              </app-pagination>
            </div>
          }
        }

        <!-- Pending land-holding submissions -->
        @if (activeTab() === 'holdings') {
          @if (pendingHoldings().length === 0) {
            <div class="empty-state card">
              <i class="material-icons-round">rule_folder</i>
              <h3>No Pending Land Holdings</h3>
              <p>All land-holding submissions have been processed.</p>
            </div>
          } @else {
            <div class="table-container">
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Farmer</th>
                      <th>Survey #</th>
                      <th class="sortable" (click)="sortHoldingsBy('areaAcres')" title="Sort by Area (Acres)">
                        <span>Area (Acres)</span>
                        <i class="material-icons-round sort-icon" [class.active]="holdingsSortField() === 'areaAcres'">{{ sortIcon(holdingsSortField() === 'areaAcres', holdingsSortAsc()) }}</i>
                      </th>
                      <th>Soil</th>
                      <th>Irrigation</th>
                      <th>Ownership</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (h of paginatedHoldings(); track h.holdingId) {
                      <tr>
                        <td><strong>{{ getFarmerName(h.farmerId) }}</strong> <span class="id-note">(#{{ h.farmerId }})</span></td>
                        <td>{{ h.surveyNumber }}</td>
                        <td>{{ h.areaAcres }}</td>
                        <td>{{ h.soilType }}</td>
                        <td>{{ h.irrigationSource }}</td>
                        <td>{{ h.ownershipType }}</td>
                        <td>
                          <span class="badge badge-warning">Pending</span>
                        </td>
                        <td>
                          <app-action-menu>
                            <button class="menu-item" (click)="approveHolding(h)">
                              <i class="material-icons-round">done</i> Approve
                            </button>
                            <button class="menu-item danger" (click)="rejectHolding(h)">
                              <i class="material-icons-round">close</i> Reject
                            </button>
                          </app-action-menu>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination
                [currentPage]="holdingsPage"
                [pageSize]="holdingsPageSize"
                [totalElements]="pendingHoldings().length"
                (pageChange)="onHoldingsPageChange($event)"
                (pageSizeChange)="onHoldingsPageSizeChange($event)">
              </app-pagination>
            </div>
          }
        }
      }

      @if (showDetailModal()) {
        <app-detail-modal
          [title]="detailTitle()"
          [rows]="detailRows()"
          (close)="showDetailModal.set(false)">
        </app-detail-modal>
      }
    </div>
  `,
  styles: [`
    .section-title {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .mb-4 { margin-bottom: 1.5rem; }
    .tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      transition: color var(--transition-fast), border-color var(--transition-fast);
    }
    .tab-btn:hover {
      color: var(--text-primary);
    }
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .tab-count {
      background-color: var(--danger, #dc2626);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .id-note {
      color: var(--text-muted);
      font-size: 0.8em;
    }
    .approve-btn {
      padding: 0.35rem 0.75rem !important;
      font-size: 0.8rem !important;
      border-radius: 0.35rem !important;
    }
    .approve-btn i {
      font-size: 16px;
    }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class UserPendingListComponent implements OnInit {
  private userService = inject(UserService);
  private farmerService = inject(FarmerService);
  private toastService = inject(ToastService);

  readonly sortIcon = sortIcon;

  // States
  users = signal<any[]>([]);
  pendingHoldings = signal<any[]>([]);
  isLoading = signal(true);
  activeTab = signal<'users' | 'holdings'>('users');
  private farmerNames = new Map<number, string>();

  // Detail (view) modal
  showDetailModal = signal(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Pagination
  currentPage = 0;
  pageSize = 10;
  holdingsPage = 0;
  holdingsPageSize = 10;

  // Sorting
  usersSortField = signal<string | null>(null);
  usersSortAsc = signal(true);
  holdingsSortField = signal<string | null>(null);
  holdingsSortAsc = signal(true);

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);
    let done = 0;
    const finish = () => { if (++done === 3) this.isLoading.set(false); };

    this.userService.getPendingUsers().subscribe({
      next: (data) => this.users.set(data || []),
      error: () => { this.toastService.error('Failed to load pending users.'); finish(); },
      complete: () => finish()
    });

    // Land holdings awaiting approval (status PE) — surfaced here for the admin/officer.
    this.farmerService.getAllLandHoldings().subscribe({
      next: (data) => this.pendingHoldings.set((data || []).filter(h => h.status === 'PE')),
      error: () => { this.toastService.error('Failed to load pending land holdings.'); finish(); },
      complete: () => finish()
    });

    // Resolves land holdings' farmerId -> name, so the table can show a name instead of a raw id.
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (profiles) => {
        this.farmerNames = new Map((profiles || []).map(p => [p.farmerId, p.name]));
      },
      error: () => {},
      complete: () => finish()
    });
  }

  getFarmerName(farmerId: number): string {
    return this.farmerNames.get(farmerId) || 'Unknown Farmer';
  }

  sortUsersBy(field: string): void {
    toggleSort(this.usersSortField, this.usersSortAsc, field);
    this.currentPage = 0;
  }

  paginatedUsers(): any[] {
    const sorted = applySort(this.users(), this.usersSortField(), this.usersSortAsc());
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return sorted.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
  }

  sortHoldingsBy(field: string): void {
    toggleSort(this.holdingsSortField, this.holdingsSortAsc, field);
    this.holdingsPage = 0;
  }

  paginatedHoldings(): any[] {
    const sorted = applySort(this.pendingHoldings(), this.holdingsSortField(), this.holdingsSortAsc());
    const start = this.holdingsPage * this.holdingsPageSize;
    const end = start + this.holdingsPageSize;
    return sorted.slice(start, end);
  }

  onHoldingsPageChange(page: number): void {
    this.holdingsPage = page;
  }

  onHoldingsPageSizeChange(size: number): void {
    this.holdingsPageSize = size;
    this.holdingsPage = 0;
  }

  viewUserDetails(user: any): void {
    this.detailTitle.set(`${user.name} (#${user.userId})`);
    this.detailRows.set([
      { label: 'Name', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Phone', value: user.phone },
      { label: 'Requested Role', value: user.roleName },
      { label: 'Region ID', value: user.regionId || 'N/A' },
      { label: 'Status', value: 'Pending' }
    ]);
    this.showDetailModal.set(true);
  }

  onApprove(user: any): void {
    this.userService.approveUser(user.userId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Approved user ${user.name} successfully.`);
        this.loadAll();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to approve user.');
      }
    });
  }

  approveHolding(h: any): void {
    this.farmerService.approveLandHolding(h.holdingId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Land holding ${h.surveyNumber} approved.`);
        this.loadAll();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to approve land holding.')
    });
  }

  rejectHolding(h: any): void {
    this.farmerService.rejectLandHolding(h.holdingId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Land holding ${h.surveyNumber} rejected.`);
        this.loadAll();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to reject land holding.')
    });
  }
}
