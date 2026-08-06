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
  template: `
    <div class="main-wrapper">
      <!-- Mobile Sidebar Toggle -->
      <button class="mobile-toggle" (click)="toggleSidebar()">
        <i class="material-icons-round">{{ isSidebarOpen() ? 'close' : 'menu' }}</i>
      </button>

      <!-- Sidebar Navigation -->
      <aside class="sidebar" [class.open]="isSidebarOpen()">
        <div class="sidebar-brand">
          <i class="material-icons-round brand-icon">agriculture</i>
          <h2>AgriLink</h2>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebar()">
            <i class="material-icons-round">dashboard</i>
            <span>Dashboard</span>
          </a>

          @if (authService.hasRole(['AgriLinkAdmin'])) {
            <a routerLink="/users" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">people</i>
              <span>User Accounts</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
            <a routerLink="/pending-users" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">how_to_reg</i>
              <span>Pending Approvals</span>
              @if (pendingApprovalsCount() > 0) {
                <span class="nav-badge">{{ pendingApprovalsCount() }}</span>
              }
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
            <a routerLink="/schemes" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">inventory_2</i>
              <span>Subsidy Schemes</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst', 'Farmer'])) {
            <a routerLink="/applications" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">assignment</i>
              <span>Subsidy Applications</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'])) {
            <a routerLink="/reports" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">analytics</i>
              <span>Reports & Analytics</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ComplianceAnalyst'])) {
            <a routerLink="/audit-logs" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">history</i>
              <span>Audit Logs</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer'])) {
            <a routerLink="/farmers" routerLinkActive="active" (click)="navigateToFarmers()">
              <i class="material-icons-round">groups</i>
              <span>Farmer Registration</span>
            </a>
          }

          @if (authService.hasRole(['Farmer'])) {
            <a routerLink="/my-land" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">terrain</i>
              <span>My Land Holdings</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'ExtensionOfficer', 'Farmer'])) {
            <a routerLink="/crops" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">eco</i>
              <span>Crops Management</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'Farmer', 'ProcurementOfficer'])) {
            <a routerLink="/produce" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">storefront</i>
              <span>Produce Market</span>
            </a>
          }

          @if (authService.hasRole(['AgriLinkAdmin', 'Farmer', 'ExtensionOfficer', 'ProcurementOfficer'])) {
            <a routerLink="/inputs" routerLinkActive="active" (click)="closeSidebar()">
              <i class="material-icons-round">shopping_bag</i>
              <span>Input Operations</span>
            </a>
          }

        </nav>
      </aside>

      <!-- Main Panel -->
      <div class="main-panel">
        <header class="top-header">
          <div class="header-breadcrumb">
            <span class="breadcrumb-item">Platform</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">Management</span>
          </div>

          <div class="header-actions">
            @if (currentUser?.regionId) {
              <div class="region-badge">
                <i class="material-icons-round">pin_drop</i>
                <span>Region ID: {{ currentUser?.regionId }}</span>
              </div>
            }

            <div class="notif-menu">
              <button class="notif-trigger" [class.active]="isNotifMenuOpen()" (click)="toggleNotifMenu($event)" aria-label="Notifications">
                <i class="material-icons-round">notifications</i>
                @if (unreadCount() > 0) {
                  <span class="notif-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
                }
              </button>
              @if (isNotifMenuOpen()) {
                <div class="notif-dropdown">
                  <div class="notif-dropdown-header">
                    <span>Notifications</span>
                    @if (unreadCount() > 0) {
                      <span class="notif-unread-chip">{{ unreadCount() }} new</span>
                    }
                  </div>
                  <div class="notif-list">
                    @if (isLoadingNotifs()) {
                      <p class="notif-empty">Loading...</p>
                    } @else if (recentNotifs().length === 0) {
                      <p class="notif-empty">You're all caught up!</p>
                    } @else {
                      @for (note of recentNotifs(); track note.notificationId) {
                        <button class="notif-row" [class.unread]="note.status === 'UN'" (click)="openNotification(note)">
                          <i class="material-icons-round notif-row-icon">{{ notifIcon(note.category) }}</i>
                          <span class="notif-row-text">{{ note.message }}</span>
                          @if (note.status === 'UN') {
                            <span class="notif-row-dot"></span>
                          }
                        </button>
                      }
                    }
                  </div>
                  <a routerLink="/notifications" class="notif-view-all" (click)="closeNotifMenu()">View All</a>
                </div>
              }
            </div>

            <div class="profile-menu">
              <button class="profile-trigger" [class.active]="isProfileMenuOpen()" (click)="toggleProfileMenu($event)">
                <span class="profile-avatar">{{ userInitials }}</span>
                <span class="profile-text">
                  <span class="profile-name">{{ currentUser?.name }}</span>
                  <span class="profile-role">{{ currentUser?.roleName }}</span>
                </span>
                <i class="material-icons-round chevron" [class.open]="isProfileMenuOpen()">expand_more</i>
              </button>
              @if (isProfileMenuOpen()) {
                <div class="profile-dropdown">
                  <button class="profile-item" (click)="goToProfile()">
                    <i class="material-icons-round">person</i> Profile
                  </button>
                  <div class="profile-divider"></div>
                  <button class="profile-item danger" (click)="onLogout()">
                    <i class="material-icons-round">logout</i> Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="main-content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-wrapper {
      display: flex;
      min-height: 100vh;
      /* 100%, not 100vw: 100vw includes the vertical scrollbar's width, which
         made the layout permanently ~15px wider than the usable viewport and
         produced a horizontal scrollbar on every page. */
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      background-color: var(--bg-dark);
    }
    .sidebar {
      width: var(--sidebar-width);
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      transition: transform var(--transition-normal);
    }
    .sidebar-brand {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--sidebar-border);
    }
    .brand-icon {
      color: var(--sidebar-icon);
      font-size: 28px;
    }
    .sidebar-brand h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--sidebar-brand);
    }
    .sidebar-nav {
      padding: 1.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-grow: 1;
      overflow-y: auto;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--sidebar-text);
      text-decoration: none;
      border-radius: 0.5rem;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .sidebar-nav a i {
      font-size: 20px;
    }
    .nav-badge {
      margin-left: auto;
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
    .sidebar-nav a:hover {
      background-color: var(--sidebar-hover-bg);
      color: var(--sidebar-text-hover);
    }
    .sidebar-nav a.active {
      background-color: var(--sidebar-active-bg);
      color: var(--sidebar-active-text);
      font-weight: 600;
    }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--sidebar-border);
      background-color: var(--sidebar-footer-bg);
    }
    .user-brief {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--sidebar-active-bg);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .user-details-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--sidebar-brand);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-role {
      font-size: 0.75rem;
      color: var(--sidebar-text);
    }
    
    .main-panel {
      flex-grow: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-width: 0;
    }
    .top-header {
      height: 50px;
      background-color: var(--bg-header);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .header-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .breadcrumb-separator {
      color: var(--text-muted);
    }
    .breadcrumb-item.active {
      color: var(--text-primary);
      font-weight: 500;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .region-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background-color: rgba(22, 163, 74, 0.1);
      color: var(--primary-hover);
      border: 1px solid rgba(22, 163, 74, 0.2);
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .region-badge i {
      font-size: 16px;
    }
    /* Top-right notification bell */
    .notif-menu {
      position: relative;
    }
    .notif-trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 0.6rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .notif-trigger i {
      font-size: 22px;
    }
    .notif-trigger:hover,
    .notif-trigger.active {
      background: var(--primary-light);
      border-color: var(--border-color);
      color: var(--primary-color);
    }
    .notif-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background-color: var(--danger, #dc2626);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      border: 2px solid var(--bg-header);
    }
    .notif-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      max-width: 90vw;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.6rem;
      box-shadow: var(--shadow-lg);
      z-index: 200;
      animation: fadeIn var(--transition-fast) ease-out;
      overflow: hidden;
    }
    .notif-dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .notif-unread-chip {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary-color);
      background: var(--primary-light);
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
    }
    .notif-list {
      max-height: 320px;
      overflow-y: auto;
    }
    .notif-empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0;
    }
    .notif-row {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      width: 100%;
      text-align: left;
      padding: 0.7rem 1rem;
      border: none;
      border-bottom: 1px solid var(--border-color);
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      transition: background var(--transition-fast);
    }
    .notif-row:last-child {
      border-bottom: none;
    }
    .notif-row:hover {
      background: var(--primary-light);
    }
    .notif-row.unread {
      background: rgba(22, 163, 74, 0.05);
    }
    .notif-row-icon {
      font-size: 18px;
      color: var(--primary-color);
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .notif-row-text {
      flex-grow: 1;
      font-size: 0.85rem;
      color: var(--text-primary);
      line-height: 1.35;
    }
    .notif-row-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      flex-shrink: 0;
      margin-top: 0.3rem;
    }
    .notif-view-all {
      display: block;
      text-align: center;
      padding: 0.65rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
      border-top: 1px solid var(--border-color);
    }
    .notif-view-all:hover {
      background: var(--primary-light);
    }

    /* Top-right profile dropdown */
    .profile-menu {
      position: relative;
    }
    .profile-trigger {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 0.6rem;
      padding: 0.3rem 0.5rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .profile-trigger:hover,
    .profile-trigger.active {
      background: var(--primary-light);
      border-color: var(--border-color);
    }
    .profile-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .profile-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }
    .profile-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .profile-role {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .chevron {
      font-size: 20px;
      color: var(--text-muted);
      transition: transform var(--transition-fast);
    }
    .chevron.open {
      transform: rotate(180deg);
    }
    .profile-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 0.6rem;
      box-shadow: var(--shadow-lg);
      padding: 0.35rem;
      z-index: 200;
      animation: fadeIn var(--transition-fast) ease-out;
    }
    .profile-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      text-align: left;
      padding: 0.6rem 0.7rem;
      border: none;
      background: transparent;
      border-radius: 0.4rem;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
      transition: background var(--transition-fast), color var(--transition-fast);
    }
    .profile-item:hover {
      background: var(--primary-light);
      color: var(--primary-color);
    }
    .profile-item i { font-size: 18px; }
    .profile-item.danger { color: var(--danger); }
    .profile-item.danger:hover {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
    }
    .profile-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.25rem 0;
    }
    @media (max-width: 600px) {
      .profile-text { display: none; }
    }
    .main-content-area {
      padding: 1.25rem;
      flex-grow: 1;
      min-width: 0;
      overflow-y: auto;
      /* Must be explicit: with overflow-y set, an unspecified overflow-x
         computes to auto, which gave this pane its own horizontal scrollbar. */
      overflow-x: hidden;
    }

    .mobile-toggle {
      display: none;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 1000;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .main-panel {
        margin-left: 0;
      }
      .mobile-toggle {
        display: flex;
      }
      .top-header {
        padding-left: 4.5rem;
      }
      .main-content-area {
        padding: 1.25rem;
      }
    }
  `]
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
