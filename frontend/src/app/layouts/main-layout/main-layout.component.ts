import { Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { FarmerService } from '../../services/farmer.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  public authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private userService = inject(UserService);
  private farmerService = inject(FarmerService);
  private notificationService = inject(NotificationService);

  isSidebarOpen = signal(false);
  isProfileMenuOpen = signal(false);
  isNotifMenuOpen = signal(false);

  // Count shown as a badge next to "Pending Approvals" (pending users + pending land holdings).
  pendingApprovalsCount = signal(0);

  // Bell dropdown — always the current user's own inbox, regardless of role.
  unreadCount = signal(0);
  recentNotifs = signal<any[]>([]);
  isLoadingNotifs = signal(false);

  ngOnInit(): void {
    this.syncFarmerDisplayName();
    this.refreshPendingCount();
    this.refreshUnreadCount();
    // Recompute after navigation so approving/rejecting elsewhere keeps the badges current.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshPendingCount();
        this.refreshUnreadCount();
      });
  }

  private refreshUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res?.unread || 0),
      error: () => {}
    });
  }

  toggleNotifMenu(event: MouseEvent): void {
    event.stopPropagation();
    const opening = !this.isNotifMenuOpen();
    this.isNotifMenuOpen.set(opening);
    this.isProfileMenuOpen.set(false);
    if (opening) {
      this.isLoadingNotifs.set(true);
      this.notificationService.getMyNotifications().subscribe({
        next: (data) => {
          const sorted = [...(data || [])]
            .filter(n => n.status !== 'DI')
            .sort((a, b) => (b.notificationId || 0) - (a.notificationId || 0));
          this.recentNotifs.set(sorted.slice(0, 6));
          this.isLoadingNotifs.set(false);
        },
        error: () => this.isLoadingNotifs.set(false)
      });
    }
  }

  closeNotifMenu(): void {
    this.isNotifMenuOpen.set(false);
  }

  openNotification(note: any): void {
    if (note.status === 'UN') {
      this.notificationService.markAsRead(note.notificationId).subscribe({
        next: () => {
          note.status = 'RD';
          this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
        },
        error: () => {}
      });
    }
  }

  notifIcon(category: string): string {
    switch (category) {
      case 'Subsidy': return 'monetization_on';
      case 'InputProcurement': return 'shopping_bag';
      case 'CropAdvisory': return 'eco';
      case 'ProduceSale': return 'storefront';
      case 'Compliance': return 'verified_user';
      default: return 'notifications';
    }
  }

  /**
   * A Farmer's real name lives on their farmer profile, so take the display name
   * from there. GET /farmer-profiles is already scoped to the caller, so the first
   * row is this user's own profile.
   */
  private syncFarmerDisplayName(): void {
    if (!this.authService.hasRole(['Farmer'])) return;
    this.farmerService.getAllFarmerProfiles().subscribe({
      next: (profiles) => this.authService.updateDisplayName((profiles || [])[0]?.name),
      error: () => {}
    });
  }

  private refreshPendingCount(): void {
    if (!this.authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
      this.pendingApprovalsCount.set(0);
      return;
    }
    let users = 0;
    let holdings = 0;
    this.userService.getPendingUsers().subscribe({
      next: (data) => { users = (data || []).length; this.pendingApprovalsCount.set(users + holdings); },
      error: () => {}
    });
    this.farmerService.getAllLandHoldings().subscribe({
      next: (data) => { holdings = (data || []).filter(h => h.status === 'PE').length; this.pendingApprovalsCount.set(users + holdings); },
      error: () => {}
    });
  }

  get currentUser() {
    return this.authService.currentUserValue;
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isProfileMenuOpen.update(v => !v);
    this.isNotifMenuOpen.set(false);
  }

  @HostListener('document:click')
  closeProfileMenu() {
    this.isProfileMenuOpen.set(false);
    this.isNotifMenuOpen.set(false);
  }

  goToProfile() {
    this.closeProfileMenu();
    this.router.navigate(['/profile']);
  }

  navigateToFarmers() {
    this.closeSidebar();
    this.router.navigate(['/farmers']);
  }

  get userInitials(): string {
    const name = this.currentUser?.name || '';
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.success('Logged out successfully');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toastService.success('Logged out successfully');
        this.router.navigate(['/login']);
      }
    });
  }
}
