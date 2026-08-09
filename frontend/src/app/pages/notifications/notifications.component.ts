import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { FarmerService } from '../../services/farmer.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="notifications-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Alerts & System Notifications</h1>
          <p class="text-secondary">View critical alerts, subsidy application updates, scheme deadlines, and broadcast messages.</p>
        </div>
        @if (isAdminOrOfficer()) {
          <button class="btn btn-primary" (click)="openBroadcastModal()">
            <i class="material-icons-round">campaign</i>
            <span> Alert</span>
          </button>
        }
        
      </div>

      <!-- Unread summary bar: only worth showing when something is actually unread. -->
      @if (unreadVisibleCount() > 0) {
        <div class="card unread-bar mb-3">
          <span class="unread-info">
            <i class="material-icons-round">mark_email_unread</i>
            <span><strong>{{ unreadVisibleCount() }}</strong> unread {{ unreadVisibleCount() === 1 ? 'alert' : 'alerts' }}{{ hasActiveFilter() ? ' in this view' : '' }}</span>
          </span>
          <button class="btn btn-secondary btn-sm" (click)="openMarkAllConfirm()" [disabled]="isMarkingAll()">
            <i class="material-icons-round">done_all</i>
            <span>{{ isMarkingAll() ? 'Marking...' : 'Mark all as read' }}</span>
          </button>
        </div>
      }

      <!-- Mark-all confirmation -->
      @if (showMarkAllConfirm()) {
        <div class="modal-overlay" (click)="closeMarkAllConfirm()">
          <div class="modal-content compact" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Mark all as read</h3>
              <button class="close-btn" (click)="closeMarkAllConfirm()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <div class="modal-body">
              <p class="confirm-text">
                Mark {{ unreadVisibleCount() }} unread {{ unreadVisibleCount() === 1 ? 'alert' : 'alerts' }}{{ hasActiveFilter() ? ' matching the current filters' : '' }} as read?
              </p>
              @if (hasActiveFilter()) {
                <p class="confirm-hint">Unread alerts hidden by the current filters are left untouched.</p>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeMarkAllConfirm()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="markAllAsRead()" [disabled]="isMarkingAll()">
                <i class="material-icons-round">done_all</i>
                <span>{{ isMarkingAll() ? 'Marking...' : 'Mark all as read' }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="card filters-card mb-3">
        <div class="form-row">
          <div class="form-group">
            <label for="statusFilter">Status Filter</label>
            <select id="statusFilter" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option value="">All Notifications</option>
              <option value="UN">Unread Alerts</option>
              <option value="RD">Read Alerts</option>
            </select>
          </div>
          <div class="form-group">
            <label for="categoryFilter">Category</label>
            <select id="categoryFilter" [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()">
              <option value="">All Categories</option>
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="dateRangeFilter">Date Range</label>
            <select id="dateRangeFilter" [(ngModel)]="dateRangeFilter" (ngModelChange)="applyFilters()">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading system alerts...</p>
        </div>
      } @else if (filteredNotifications().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">notifications_off</i>
          <h3>No Alerts Found</h3>
          <p>You have no notifications matching the filters.</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (alert of filteredNotifications(); track alert.notificationId) {
            <div class="notification-item" [class.unread]="alert.status === 'UN'" [class.dismissed]="alert.status === 'DI'">
              <div class="notification-icon" [ngClass]="iconTheme(alert.category)">
                <i class="material-icons-round">
                  {{ getIconForCategory(alert.category) }}
                </i>
              </div>
              <div class="notification-body">
                <div class="notification-header">
                  <span class="category-badge">{{ categoryLabel(alert.category) }}</span>
                  <span class="date">{{ alert.createdDate | date:'mediumDate' }}</span>
                </div>
                <p class="message">{{ alert.message }}</p>
                <div class="notification-footer">
                  <div class="actions">
                    @if (alert.status === 'UN') {
                      <button class="action-link-btn" (click)="markAsRead(alert)">
                        <i class="material-icons-round">done</i>
                        <span>Mark as Read</span>
                      </button>
                    } @else if (alert.status === 'RD') {
                      <button class="action-link-btn" (click)="markAsUnread(alert)">
                        <i class="material-icons-round">mark_email_unread</i>
                        <span>Mark as Unread</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Broadcast Modal -->
      @if (showBroadcastModal()) {
        <div class="modal-overlay" (click)="closeBroadcastModal()">
          <div class="modal-content wide" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Broadcast New Alert</h3>
              <button class="close-btn" (click)="closeBroadcastModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="broadcastForm" (ngSubmit)="submitBroadcastForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label>Send To (Roles)</label>
                  <div class="role-checks">
                    @for (role of availableRoles(); track role) {
                      <label class="check-chip" [class.checked]="isRoleSelected(role)">
                        <input type="checkbox" [checked]="isRoleSelected(role)" (change)="toggleRole(role)" />
                        <span>{{ role }}</span>
                      </label>
                    }
                  </div>
                </div>

                @if (isRoleSelected('Farmer')) {
                  <div class="form-group">
                    <div class="picker-head">
                      <label>Farmers ({{ selectAllFarmers() ? visibleFarmerOptions().length : selectedFarmerIds().length }} selected)</label>
                      <button type="button" class="select-all-btn" (click)="toggleSelectAllFarmers()">
                        {{ selectAllFarmers() ? 'Deselect All' : 'Select All' }}
                      </button>
                    </div>
                    <input type="number" [(ngModel)]="regionFilter" [ngModelOptions]="{standalone: true}"
                      placeholder="Filter by region (optional)" class="mb-2" />
                    @if (isLoadingFarmers()) {
                      <p class="text-muted picker-empty">Loading farmers...</p>
                    } @else if (visibleFarmerOptions().length === 0) {
                      <p class="text-muted picker-empty">No farmers found for this region.</p>
                    } @else {
                      <div class="user-picker" [class.disabled]="selectAllFarmers()">
                        @for (f of visibleFarmerOptions(); track f.farmerId) {
                          <label class="picker-row">
                            <input type="checkbox" [checked]="selectAllFarmers() || isFarmerSelected(f.farmerId)"
                              [disabled]="selectAllFarmers()" (change)="toggleFarmer(f.farmerId)" />
                            <span>{{ f.name }}</span>
                            <span class="picker-meta">Region {{ f.regionId ?? '—' }}</span>
                          </label>
                        }
                      </div>
                    }
                  </div>
                }

                @if (hasNonFarmerRoleSelected()) {
                  <div class="form-group">
                    <div class="picker-head">
                      <label>Staff ({{ selectAllStaff() ? visibleStaffOptions().length : selectedStaffIds().length }} selected)</label>
                      <button type="button" class="select-all-btn" (click)="toggleSelectAllStaff()">
                        {{ selectAllStaff() ? 'Deselect All' : 'Select All' }}
                      </button>
                    </div>
                    @if (isLoadingStaff()) {
                      <p class="text-muted picker-empty">Loading users...</p>
                    } @else if (visibleStaffOptions().length === 0) {
                      <p class="text-muted picker-empty">No active users found for the selected roles.</p>
                    } @else {
                      <div class="user-picker" [class.disabled]="selectAllStaff()">
                        @for (u of visibleStaffOptions(); track u.userId) {
                          <label class="picker-row">
                            <input type="checkbox" [checked]="selectAllStaff() || isStaffSelected(u.userId)"
                              [disabled]="selectAllStaff()" (change)="toggleStaff(u.userId)" />
                            <span>{{ u.name }}</span>
                            <span class="picker-meta">{{ u.roleName }} &middot; Region {{ u.regionId ?? '—' }}</span>
                          </label>
                        }
                      </div>
                    }
                  </div>
                }

                <div class="form-group">
                  <label for="bCategory">Alert Category</label>
                  <select id="bCategory" formControlName="category">
                    @for (cat of categories; track cat.value) {
                      <option [value]="cat.value">{{ cat.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="bMessage">Message Content</label>
                  <textarea id="bMessage" formControlName="message" rows="3" placeholder="Enter the broadcast description..."></textarea>
                </div>

                <p class="recipient-summary">
                  <i class="material-icons-round">groups</i>
                  {{ recipientCountLabel() }}
                </p>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="broadcastForm.invalid || isSending() || !hasAnyRecipientSelectable()">
                  {{ isSending() ? 'Sending...' : 'Send Alert' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-page {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    /* Unread summary bar sitting above the filters. */
    .unread-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
    }
    .unread-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .unread-info i {
      font-size: 20px;
      color: var(--primary-color);
    }
    .unread-info strong {
      color: var(--text-primary);
    }
    .btn-sm {
      font-size: 0.82rem;
      padding: 0.4rem 0.8rem;
    }
    .unread-bar .btn i,
    .modal-footer .btn i {
      font-size: 16px;
    }
    .modal-content.compact {
      max-width: 420px;
    }
    .confirm-text {
      font-size: 0.95rem;
      color: var(--text-primary);
      margin: 0;
    }
    .confirm-hint {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0.5rem 0 0;
    }
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .notification-item {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      gap: 1.25rem;
      transition: border-color var(--transition-normal);
      position: relative;
    }
    .notification-item:hover {
      border-color: var(--primary-hover);
    }
    .notification-item.unread {
      border-left: 4px solid var(--primary-color);
      background-color: rgba(22, 163, 74, 0.02);
    }
    .notification-item.dismissed {
      opacity: 0.6;
    }
    .notification-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary-light);
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .notification-icon.subsidy {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--secondary-color);
    }
    .notification-icon.input {
      background-color: rgba(245, 158, 11, 0.1);
      color: var(--warning);
    }
    .notification-icon.crop {
      background-color: rgba(22, 163, 74, 0.1);
      color: var(--primary-color);
    }
    .notification-body {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .category-badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .date {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .message {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .notification-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
    }
    .actions {
      display: flex;
      gap: 1rem;
    }
    .action-link-btn {
      background: transparent;
      border: none;
      color: var(--primary-color);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0;
    }
    .action-link-btn:hover {
      text-decoration: underline;
    }
    .action-link-btn.danger {
      color: var(--danger);
    }
    .action-link-btn i {
      font-size: 16px;
    }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
    }
    .close-btn:hover {
      color: var(--text-primary);
    }
    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s infinite linear;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Broadcast recipient picker */
    .modal-content.wide {
      max-width: 560px;
    }
    .role-checks {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .check-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border-color);
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .check-chip input {
      width: auto;
      margin: 0;
    }
    .check-chip.checked {
      border-color: var(--primary-color);
      background-color: var(--primary-light);
      color: var(--primary-color);
    }
    .picker-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .picker-head label {
      margin-bottom: 0;
    }
    .select-all-btn {
      background: transparent;
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.25rem 0.7rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .select-all-btn:hover {
      background-color: var(--primary-light);
    }
    .mb-2 {
      margin-bottom: 0.5rem;
    }
    .user-picker {
      max-height: 180px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      transition: opacity var(--transition-fast);
    }
    .user-picker.disabled {
      opacity: 0.45;
      pointer-events: none;
    }
    .picker-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.85rem;
      cursor: pointer;
    }
    .picker-row:last-child {
      border-bottom: none;
    }
    .picker-row input {
      width: auto;
      margin: 0;
    }
    .picker-row span:first-of-type {
      flex-grow: 1;
    }
    .picker-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .picker-empty {
      font-size: 0.85rem;
      padding: 0.5rem 0;
    }
    .recipient-summary {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-color);
      background-color: var(--primary-light);
      padding: 0.6rem 0.85rem;
      border-radius: 0.5rem;
      margin: 0;
    }
    .recipient-summary i {
      font-size: 18px;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private farmerService = inject(FarmerService);

  // States
  isLoading = signal<boolean>(false);
  notifications = signal<any[]>([]);
  filteredNotifications = signal<any[]>([]);

  // Filters
  statusFilter = '';
  categoryFilter = '';
  dateRangeFilter: 'all' | 'today' | '7days' | 'month' = 'all';

  // Fixed notification categories (mirror the backend NotificationCategory enum / design section 4.8).
  readonly categories = [
    { value: 'CropAdvisory', label: 'Crop Advisory' },
    { value: 'Subsidy', label: 'Subsidy' },
    { value: 'InputProcurement', label: 'Input Procurement' },
    { value: 'ProduceSale', label: 'Produce Sale' },
    { value: 'Compliance', label: 'Compliance' }
  ];

  // Modals
  showBroadcastModal = signal<boolean>(false);
  showMarkAllConfirm = signal<boolean>(false);
  isMarkingAll = signal<boolean>(false);

  // Forms
  broadcastForm!: FormGroup;

  // ===== Broadcast recipient picker =====
  // Roles: an ExtensionOfficer can only reach Farmers (and only their own region — the
  // farmer-profiles endpoint they call is already region-scoped server-side); Admin can
  // target any role. This mirrors what iam-service's user list actually permits per role.
  private readonly ALL_ROLES = ['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst', 'Farmer'];
  selectedRoles = signal<string[]>(['Farmer']);
  regionFilter: number | null = null;
  selectAllFarmers = signal<boolean>(true);
  isLoadingFarmers = signal<boolean>(false);
  farmerOptions = signal<any[]>([]);
  selectedFarmerIds = signal<number[]>([]);
  isLoadingStaff = signal<boolean>(false);
  staffOptions = signal<any[]>([]);
  selectedStaffIds = signal<number[]>([]);
  selectAllStaff = signal<boolean>(true);
  isSending = signal<boolean>(false);

  ngOnInit() {
    this.initForm();
    this.loadNotifications();
  }

  isAdminOrOfficer(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer']);
  }

  availableRoles(): string[] {
    return this.authService.hasRole(['AgriLinkAdmin']) ? this.ALL_ROLES : ['Farmer'];
  }

  private initForm() {
    this.broadcastForm = this.fb.group({
      category: ['CropAdvisory', Validators.required],
      message: ['', Validators.required]
    });
  }

  categoryLabel(category: string): string {
    return this.categories.find(c => c.value === category)?.label || category || 'General';
  }

  // Maps a category to a color theme class on the icon bubble.
  iconTheme(category: string): string {
    switch (category) {
      case 'Subsidy': return 'subsidy';
      case 'InputProcurement': return 'input';
      case 'CropAdvisory': return 'crop';
      default: return 'general';
    }
  }

  private loadNotifications() {
    this.isLoading.set(true);
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load system notifications.');
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    let list = [...this.notifications()];

    // Filter by status. Dismissed alerts are hidden from the default ("All") view —
    // dismiss is meant to archive an alert out of your way, not just fade it in place —
    // but they're never deleted, so picking "Dismissed Alerts" still surfaces them.
    if (this.statusFilter) {
      list = list.filter(n => n.status === this.statusFilter);
    } else {
      list = list.filter(n => n.status !== 'DI');
    }

    // No free-text search; dismissed alerts remain excluded by default.

    // Filter by category (exact match against the fixed category set)
    if (this.categoryFilter) {
      list = list.filter(n => n.category === this.categoryFilter);
    }

    // Filter by date range
    if (this.dateRangeFilter !== 'all') {
      list = list.filter(n => this.matchesDateRange(n.createdDate));
    }

    // Sort descending by id
    list.sort((a, b) => b.notificationId - a.notificationId);

    this.filteredNotifications.set(list);
  }

  private matchesDateRange(dateStr: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    if (this.dateRangeFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (this.dateRangeFilter === '7days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return d >= start;
    }
    if (this.dateRangeFilter === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  }

  getIconForCategory(category: string): string {
    switch (category) {
      case 'Subsidy': return 'monetization_on';
      case 'InputProcurement': return 'shopping_bag';
      case 'CropAdvisory': return 'eco';
      case 'ProduceSale': return 'storefront';
      case 'Compliance': return 'verified_user';
      default: return 'info';
    }
  }

  markAsRead(alert: any) {
    this.notificationService.markAsRead(alert.notificationId).subscribe({
      next: () => { this.toast.success('Notification marked as read'); this.loadNotifications(); },
      error: () => this.toast.error('Failed to update status')
    });
  }

  // ===== Mark all as read =====
  // Scoped to what the user can currently see, so the action never silently
  // touches alerts the active filters have hidden from them.
  private unreadVisible(): any[] {
    return this.filteredNotifications().filter(n => n.status === 'UN');
  }

  unreadVisibleCount(): number {
    return this.unreadVisible().length;
  }

  hasActiveFilter(): boolean {
    return !!this.statusFilter || !!this.categoryFilter || this.dateRangeFilter !== 'all';
  }

  openMarkAllConfirm() {
    if (this.unreadVisibleCount() === 0) return;
    this.showMarkAllConfirm.set(true);
  }

  closeMarkAllConfirm() {
    if (this.isMarkingAll()) return;
    this.showMarkAllConfirm.set(false);
  }

  // There's no bulk endpoint, so fan out the per-id call and report how many
  // actually succeeded rather than assuming all of them did.
  markAllAsRead() {
    const targets = this.unreadVisible();
    if (targets.length === 0) return;

    this.isMarkingAll.set(true);
    forkJoin(
      targets.map(n =>
        this.notificationService.markAsRead(n.notificationId).pipe(catchError(() => of(null)))
      )
    ).subscribe(results => {
      this.isMarkingAll.set(false);
      this.showMarkAllConfirm.set(false);
      const done = results.filter(r => r !== null).length;
      if (done === 0) {
        this.toast.error('Failed to mark the alerts as read.');
      } else if (done < targets.length) {
        this.toast.error(`Marked ${done} of ${targets.length} alerts as read.`);
      } else {
        this.toast.success(`Marked ${done} alert${done === 1 ? '' : 's'} as read`);
      }
      this.loadNotifications();
    });
  }

  markAsUnread(alert: any) {
    this.notificationService.markAsUnread(alert.notificationId).subscribe({
      next: () => { this.toast.success('Notification marked as unread'); this.loadNotifications(); },
      error: () => this.toast.error('Failed to update status')
    });
  }

  // ================= BROADCAST =================
  openBroadcastModal() {
    this.broadcastForm.reset({ category: 'CropAdvisory', message: '' });
    this.selectedRoles.set(['Farmer']);
    this.regionFilter = null;
    this.selectAllFarmers.set(true);
    this.selectedFarmerIds.set([]);
    this.selectAllStaff.set(true);
    this.selectedStaffIds.set([]);
    // Both lists are fetched exactly once, up front — they don't depend on which
    // checkboxes end up ticked, only WHICH ROWS ARE SHOWN does (see visibleStaffOptions /
    // visibleFarmerOptions). Re-fetching on every checkbox click was what caused the
    // "loading..." flash on each toggle.
    this.loadFarmerOptions();
    if (this.availableRoles().length > 1) {
      this.loadStaffOptions();
    }
    this.showBroadcastModal.set(true);
  }

  closeBroadcastModal() {
    this.showBroadcastModal.set(false);
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().includes(role);
  }

  toggleRole(role: string): void {
    const current = this.selectedRoles();
    this.selectedRoles.set(current.includes(role) ? current.filter(r => r !== role) : [...current, role]);
  }

  hasNonFarmerRoleSelected(): boolean {
    return this.selectedRoles().some(r => r !== 'Farmer');
  }

  // Only the rows matching the currently-checked (non-Farmer) roles — and the typed
  // region, if any — so ticking "ExtensionOfficer" doesn't show every officer role.
  visibleStaffOptions(): any[] {
    const targetRoles = this.selectedRoles().filter(r => r !== 'Farmer');
    let pool = this.staffOptions().filter(u => targetRoles.includes(u.roleName));
    if (this.regionFilter != null) {
      pool = pool.filter(u => u.regionId === this.regionFilter);
    }
    return pool;
  }

  // getAllFarmerProfiles() is already region-scoped server-side for an ExtensionOfficer
  // (their own region only) and unrestricted for AgriLinkAdmin — so no client-side role
  // check is needed here, the backend already only returns what the caller may reach.
  private loadFarmerOptions(): void {
    this.isLoadingFarmers.set(true);
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (data) => {
        this.farmerOptions.set((data || []).filter(f => f.status === 'AC'));
        this.isLoadingFarmers.set(false);
      },
      error: () => { this.farmerOptions.set([]); this.isLoadingFarmers.set(false); }
    });
  }

  

  // getAllUsers() is Admin-only server-side — only called when the picker for a
  // non-Farmer role is actually shown (which itself only happens for AgriLinkAdmin).
  private loadStaffOptions(): void {
    this.isLoadingStaff.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.staffOptions.set((data || []).filter(u => u.status === 'A' && u.roleName !== 'Farmer'));
        this.isLoadingStaff.set(false);
      },
      error: () => { this.staffOptions.set([]); this.isLoadingStaff.set(false); }
    });
  }

  toggleSelectAllFarmers(): void {
    this.selectAllFarmers.update(v => !v);
    if (this.selectAllFarmers()) {
      this.selectedFarmerIds.set([]);
    }
  }

  toggleSelectAllStaff(): void {
    this.selectAllStaff.update(v => !v);
    if (this.selectAllStaff()) {
      this.selectedStaffIds.set([]);
    }
  }

  isFarmerSelected(farmerId: number): boolean {
    return this.selectedFarmerIds().includes(farmerId);
  }

  toggleFarmer(farmerId: number): void {
    const current = this.selectedFarmerIds();
    this.selectedFarmerIds.set(current.includes(farmerId) ? current.filter(id => id !== farmerId) : [...current, farmerId]);
  }

  isStaffSelected(userId: number): boolean {
    return this.selectedStaffIds().includes(userId);
  }

  toggleStaff(userId: number): void {
    const current = this.selectedStaffIds();
    this.selectedStaffIds.set(current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]);
  }

  // The farmer picker list itself is already narrowed to the region typed above.
  visibleFarmerOptions(): any[] {
    if (this.regionFilter == null) return this.farmerOptions();
    return this.farmerOptions().filter(f => f.regionId === this.regionFilter);
  }

  private resolveRecipientUserIds(): number[] {
    const ids = new Set<number>();

    if (this.isRoleSelected('Farmer')) {
      const pool = this.visibleFarmerOptions();
      const chosen = this.selectAllFarmers() ? pool : pool.filter(f => this.isFarmerSelected(f.farmerId));
      chosen.forEach(f => { if (f.userId != null) ids.add(f.userId); });
    }

    if (this.hasNonFarmerRoleSelected()) {
      const pool = this.visibleStaffOptions();
      const chosen = this.selectAllStaff() ? pool : pool.filter(u => this.isStaffSelected(u.userId));
      chosen.forEach(u => ids.add(u.userId));
    }

    return [...ids];
  }

  hasAnyRecipientSelectable(): boolean {
    return this.resolveRecipientUserIds().length > 0;
  }

  recipientCountLabel(): string {
    const count = this.resolveRecipientUserIds().length;
    if (count === 0) return 'No matching recipients yet — adjust your selection above.';
    return `This alert will be sent to ${count} recipient${count === 1 ? '' : 's'}.`;
  }

  submitBroadcastForm() {
    if (this.broadcastForm.invalid) return;
    const userIds = this.resolveRecipientUserIds();
    if (userIds.length === 0) {
      this.toast.error('No recipients match your selection.');
      return;
    }

    this.isSending.set(true);
    const { category, message } = this.broadcastForm.value;
    const createdDate = new Date().toISOString().split('T')[0];

    forkJoin(
      userIds.map(userId =>
        this.notificationService.createNotification({ userId, category, message, status: 'UN', createdDate })
          .pipe(catchError(() => of(null)))
      )
    ).subscribe(results => {
      this.isSending.set(false);
      const sent = results.filter(r => r !== null).length;
      if (sent === 0) {
        this.toast.error('Failed to send the alert.');
        return;
      }
      this.toast.success(`Alert sent to ${sent} of ${userIds.length} recipient${userIds.length === 1 ? '' : 's'}.`);
      this.closeBroadcastModal();
      this.loadNotifications();
    });
  }
}
