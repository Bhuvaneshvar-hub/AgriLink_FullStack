import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { FarmerService } from '../../../services/farmer.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { toggleSort, sortIcon, applySort } from '../../../utils/table-sort.util';

@Component({
  selector: 'app-user-pending-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent, ActionMenuComponent, DetailModalComponent, ConfirmationModalComponent],
  templateUrl: './user-pending-list.component.html',
  styleUrls: ['./user-pending-list.component.css']
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

  // Reject confirmation
  showRejectConfirm = signal(false);
  selectedUser = signal<any | null>(null);

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

  confirmReject(user: any): void {
    this.selectedUser.set(user);
    this.showRejectConfirm.set(true);
  }

  onRejectConfirmed(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.userService.rejectUser(user.userId).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Rejected registration for ${user.name}.`);
        this.showRejectConfirm.set(false);
        this.loadAll();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to reject user.');
        this.showRejectConfirm.set(false);
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
