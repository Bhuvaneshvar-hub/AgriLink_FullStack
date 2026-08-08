import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SubsidyService } from '../../services/subsidy.service';
import { FarmerService } from '../../services/farmer.service';
import { ProduceService } from '../../services/produce.service';
import { CropService } from '../../services/crop.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private subsidyService = inject(SubsidyService);
  private farmerService = inject(FarmerService);
  private produceService = inject(ProduceService);
  private cropService = inject(CropService);
  private notificationService = inject(NotificationService);

  isLoadingStats = signal(true);
  isLoadingActivity = signal(true);
  isLoadingRoleStats = signal(true);
  isLoadingNotifications = signal(true);
  recentNotifications = signal<any[]>([]);

  pendingUsersCount = signal(0);
  pendingApplicationsCount = signal(0);
  pendingLandCount = signal(0);
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
  totalSchemesCount = signal(0);
  totalApplicationsCount = signal(0);
  totalDisbursedAmount = signal(0);

  // ComplianceAnalyst
  rejectedApplicationsCount = signal(0);

  // Farmer (self-scoped)
  myLandHoldingsCount = signal(0);
  myCropPlanStats = signal<{ total: number; growing: number }>({ total: 0, growing: 0 });
  myProduceListingsCount = signal(0);
  mySubsidyStats = signal<{ total: number; pending: number }>({ total: 0, pending: 0 });

  // Status-breakdown bar charts (role-specific)
  chartCards = signal<{ title: string; icon: string; bars: { label: string; count: number; percent: number; color: string }[] }[]>([]);

  private pendingUsersList: any[] = [];
  private pendingApplicationsList: any[] = [];
  private pendingLandList: any[] = [];
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

  goToFarmers() {
    this.router.navigate(['/farmers']);
  }

  // Recent alerts feed for the dashboard (approvals, subsidy/produce updates, etc.) —
  // always the current user's own inbox, regardless of role.
  private loadRecentNotifications(): void {
    this.isLoadingNotifications.set(true);
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        const sorted = [...(data || [])]
          .filter(n => n.status !== 'DI')
          .sort((a, b) => (b.notificationId || 0) - (a.notificationId || 0));
        this.recentNotifications.set(sorted.slice(0, 5));
        this.isLoadingNotifications.set(false);
      },
      error: () => this.isLoadingNotifications.set(false)
    });
  }

  notificationIcon(category: string): string {
    switch (category) {
      case 'Subsidy': return 'monetization_on';
      case 'InputProcurement': return 'shopping_bag';
      case 'CropAdvisory': return 'eco';
      case 'ProduceSale': return 'storefront';
      case 'Compliance': return 'verified_user';
      default: return 'notifications';
    }
  }

  ngOnInit(): void {
    this.loadRecentNotifications();
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
            this.totalApplicationsCount.set(data.length);
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

      // Land holdings a farmer submitted (status PE) await admin approval on the Farmers page.
      statCalls.push(new Promise((resolve) => {
        this.farmerService.getAllLandHoldings().subscribe({
          next: (data) => {
            const pending = (data || []).filter(h => h.status === 'PE');
            this.pendingLandCount.set(pending.length);
            this.pendingLandList = pending;
          },
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

    // Active/total-schemes counts feed the SubsidyAdmin overview AND the
    // "Active Subsidy Schemes" hero card shown to ProcurementOfficer.
    if (this.authService.hasRole(['SubsidyAdmin', 'ProcurementOfficer'])) {
      roleStatsCalls.push(new Promise((resolve) => {
        this.subsidyService.getAllSchemes().subscribe({
          next: (data) => {
            this.activeSchemesCount.set(data.filter(s => s.status === 'AC').length);
            this.totalSchemesCount.set(data.length);
          },
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
            // Every farmer-scoped fetch below must finish before this promise resolves —
            // buildChartCards() and isLoadingRoleStats() read the *Raw fields synchronously
            // once roleStatsCalls settles, so a call that hasn't completed yet (e.g. subsidy
            // applications arriving slower than crop plans) would otherwise be built empty
            // and never recomputed.
            const farmerSubCalls: Promise<void>[] = [];

            farmerSubCalls.push(new Promise((res) => {
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
                complete: () => res()
              });
            }));

            farmerSubCalls.push(new Promise((res) => {
              this.produceService.getAllProduceListings().subscribe({
                next: (listings) => {
                  this.myProduceListingsCount.set(listings.filter(l => l.farmerId === farmerId).length);
                },
                error: () => {},
                complete: () => res()
              });
            }));

            farmerSubCalls.push(new Promise((res) => {
              this.subsidyService.getApplicationsByFarmer(farmerId).subscribe({
                next: (data) => {
                  this.mySubsidyStats.set({
                    total: data.length,
                    pending: data.filter(a => a.status === 'PE').length
                  });
                  this.subsidyAppsRaw = data;
                },
                error: () => {},
                complete: () => res()
              });
            }));

            // Land holdings is scoped server-side to the caller's own farmer profile(s).
            farmerSubCalls.push(new Promise((res) => {
              this.farmerService.getAllLandHoldings().subscribe({
                next: (holdings) => this.myLandHoldingsCount.set((holdings || []).length),
                error: () => {},
                complete: () => res()
              });
            }));

            Promise.all(farmerSubCalls).then(() => resolve());
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

    for (const land of this.pendingLandList.slice(0, 3)) {
      items.push({
        key: `land-${land.holdingId}`,
        title: `Land holding ${land.surveyNumber} pending approval`,
        subtitle: 'Review on the Farmer & Land Registration page',
        icon: 'terrain',
        color: 'var(--warning)',
        link: '/farmers'
      });
    }

    this.actionNeededItems.set(items.slice(0, 8));
  }
}
