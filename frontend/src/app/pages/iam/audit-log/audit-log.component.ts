import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { exportTableToExcel } from '../../../utils/export-excel.util';
import { toggleSort, sortIcon, applySort } from '../../../utils/table-sort.util';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  // States
  logs = signal<any[]>([]);
  filteredLogs = signal<any[]>([]);
  isLoading = signal(true);
  userNamesById = new Map<number, string>();

  // Filters
  userIdFilter: number | null = null;
  moduleFilter = '';
  actionQuery = '';

  // Pagination
  currentPage = 0;
  pageSize = 20;

  // Column sorting state (defaults to newest-first by timestamp, matching the natural log order).
  sortField = signal<string | null>('timestamp');
  sortAsc = signal(false);
  sortIcon = sortIcon;

  ngOnInit(): void {
    this.loadUsers();
    this.loadLogs();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.userNamesById = new Map(data.map(u => [u.userId, u.name]));
      },
      error: () => {
        this.toastService.error('Failed to load user list.');
      }
    });
  }

  getUserName(userId: number): string {
    return this.userNamesById.get(userId) || `User #${userId}`;
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.userService.getAllAuditLogs().subscribe({
      next: (data) => {
        this.logs.set(data.sort((a, b) => b.auditId - a.auditId)); // Sort descending by ID
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.error('Failed to load audit logs.');
      }
    });
  }

  applyFilters(): void {
    let list = this.logs();

    if (this.userIdFilter !== null && this.userIdFilter !== undefined && this.userIdFilter.toString().trim() !== '') {
      list = list.filter(l => l.userId === this.userIdFilter);
    }

    if (this.moduleFilter) {
      list = list.filter(l => l.module?.toLowerCase() === this.moduleFilter.toLowerCase());
    }

    if (this.actionQuery.trim()) {
      const q = this.actionQuery.toLowerCase();
      list = list.filter(l => l.action?.toLowerCase().includes(q));
    }

    this.filteredLogs.set(list);
    this.currentPage = 0;
  }

  paginatedLogs(): any[] {
    const sorted = applySort(this.filteredLogs(), this.sortField(), this.sortAsc());
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return sorted.slice(start, end);
  }

  sortBy(field: string): void {
    toggleSort(this.sortField, this.sortAsc, field);
    this.currentPage = 0;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
  }

  exportToExcel(): void {
    const headers = ['S.No', 'User Name', 'Module', 'Action Performed', 'IP Address', 'Timestamp'];
    const rows = this.filteredLogs().map((log, i) => [
      i + 1,
      this.getUserName(log.userId),
      log.module,
      log.action,
      log.ipAddress || '127.0.0.1',
      log.timestamp ? new Date(log.timestamp).toLocaleString() : ''
    ]);
    exportTableToExcel(headers, rows, `audit-trail-${Date.now()}`);
  }
}
