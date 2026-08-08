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
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
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
