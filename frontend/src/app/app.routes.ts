import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Public landing / home page (no layout, no guard)
  {
    path: 'home',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },

  // Auth Layout Routes
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/iam/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/iam/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },

  // Main Layout Protected Routes
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/iam/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin'] }
      },
      {
        path: 'pending-users',
        loadComponent: () => import('./pages/iam/user-pending-list/user-pending-list.component').then(m => m.UserPendingListComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer'] }
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/iam/audit-log/audit-log.component').then(m => m.AuditLogComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ComplianceAnalyst'] }
      },
      {
        path: 'schemes',
        loadComponent: () => import('./pages/subsidy/scheme-list/scheme-list.component').then(m => m.SchemeListComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'] }
      },
      {
        path: 'applications',
        loadComponent: () => import('./pages/subsidy/application-list/application-list.component').then(m => m.ApplicationListComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer', 'SubsidyAdmin', 'ComplianceAnalyst', 'Farmer'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reporting/report-dashboard/report-dashboard.component').then(m => m.ReportDashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer', 'ProcurementOfficer', 'SubsidyAdmin', 'ComplianceAnalyst'] }
      },
      {
        path: 'farmers',
        loadComponent: () => import('./pages/farmers/farmers.component').then(m => m.FarmersComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer'] }
      },
      {
        path: 'my-land',
        loadComponent: () => import('./pages/farmers/my-land-holdings.component').then(m => m.MyLandHoldingsComponent),
        canActivate: [roleGuard],
        data: { roles: ['Farmer'] }
      },
      {
        path: 'crops',
        loadComponent: () => import('./pages/crops/crops.component').then(m => m.CropsComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'ExtensionOfficer', 'Farmer'] }
      },
      {
        path: 'produce',
        loadComponent: () => import('./pages/produce/produce.component').then(m => m.ProduceComponent),
        canActivate: [roleGuard],
        // Produce Market is for Farmers (sell), ProcurementOfficer (buy) and Admin.
        // An ExtensionOfficer has no role in produce trading.
        data: { roles: ['AgriLinkAdmin', 'Farmer', 'ProcurementOfficer'] }
      },
      {
        path: 'inputs',
        loadComponent: () => import('./pages/inputs/inputs.component').then(m => m.InputsComponent),
        canActivate: [roleGuard],
        data: { roles: ['AgriLinkAdmin', 'Farmer', 'ExtensionOfficer', 'ProcurementOfficer'] }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback Route
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
