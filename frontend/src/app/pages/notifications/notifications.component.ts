import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

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

      <!-- Filters -->
      <div class="card filters-card mb-3">
        <div class="form-row">
          <div class="form-group">
            <label for="statusFilter">Status Filter</label>
            <select id="statusFilter" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option value="">All Notifications</option>
              <option value="UN">Unread Alerts</option>
              <option value="RD">Read Alerts</option>
              <option value="DI">Dismissed Alerts</option>
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
                  <span class="target-user">User ID Tag: #{{ alert.userId }}</span>
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
                    @if (alert.status !== 'DI') {
                      <button class="action-link-btn danger" (click)="dismiss(alert)">
                        <i class="material-icons-round">notifications_off</i>
                        <span>Dismiss</span>
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
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Broadcast New System Alert</h3>
              <button class="close-btn" (click)="closeBroadcastModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="broadcastForm" (ngSubmit)="submitBroadcastForm()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="bUser">Target User ID</label>
                  <input type="number" id="bUser" formControlName="userId" placeholder="Enter target user ID (e.g. 1)" />
                  <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.25rem;">Specify the recipient user's ID.</p>
                </div>
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
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="broadcastForm.invalid">Send Alert</button>
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
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
    }
    .target-user {
      font-size: 0.8rem;
      color: var(--text-secondary);
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
  `]
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  isLoading = signal<boolean>(false);
  notifications = signal<any[]>([]);
  filteredNotifications = signal<any[]>([]);

  // Filters
  statusFilter = '';
  categoryFilter = '';

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

  // Forms
  broadcastForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadNotifications();
  }

  isAdminOrOfficer(): boolean {
    return this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer']);
  }

  private initForm() {
    this.broadcastForm = this.fb.group({
      userId: [1, [Validators.required, Validators.min(1)]],
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
    this.notificationService.getAllNotifications().subscribe({
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

    // Filter by status
    if (this.statusFilter) {
      list = list.filter(n => n.status === this.statusFilter);
    }

    // Filter by category (exact match against the fixed category set)
    if (this.categoryFilter) {
      list = list.filter(n => n.category === this.categoryFilter);
    }

    // Sort descending by id
    list.sort((a, b) => b.notificationId - a.notificationId);

    this.filteredNotifications.set(list);
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

  markAsUnread(alert: any) {
    this.notificationService.markAsUnread(alert.notificationId).subscribe({
      next: () => { this.toast.success('Notification marked as unread'); this.loadNotifications(); },
      error: () => this.toast.error('Failed to update status')
    });
  }

  dismiss(alert: any) {
    this.notificationService.dismiss(alert.notificationId).subscribe({
      next: () => { this.toast.success('Notification dismissed'); this.loadNotifications(); },
      error: () => this.toast.error('Failed to dismiss notification')
    });
  }

  // ================= BROADCAST =================
  openBroadcastModal() {
    this.broadcastForm.reset({
      userId: 1,
      category: 'CropAdvisory',
      message: ''
    });
    this.showBroadcastModal.set(true);
  }

  closeBroadcastModal() {
    this.showBroadcastModal.set(false);
  }

  submitBroadcastForm() {
    if (this.broadcastForm.invalid) return;
    const body = {
      ...this.broadcastForm.value,
      status: 'UN',
      createdDate: new Date().toISOString().split('T')[0]
    };

    this.notificationService.createNotification(body).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Broadcast alert sent');
        this.closeBroadcastModal();
        this.loadNotifications();
      },
      error: (err) => this.toast.error(err.error?.message || 'Error broadcasting alert')
    });
  }
}
