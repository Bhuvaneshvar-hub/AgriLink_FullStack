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
  template: `
    <div class="audit-logs-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>Audit Trail</h1>
          <p class="text-secondary">View user actions, system operations, and security logs for compliance tracking.</p>
        </div>
        <button class="btn btn-secondary" (click)="exportToExcel()" [disabled]="filteredLogs().length === 0" title="Export to Excel">
          <i class="material-icons-round text-success">table_view</i>
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="card filters-card">
        <div class="form-row">
          <div class="form-group">
            <label for="searchUser">Search User</label>
            <div class="search-field">
              <input
                type="number"
                id="searchUser"
                [(ngModel)]="userIdFilter"
                (ngModelChange)="applyFilters()"
                placeholder="e.g. 1" />
              <i class="material-icons-round search-icon">search</i>
            </div>
          </div>
          <div class="form-group">
            <label for="moduleFilter">Module</label>
            <select id="moduleFilter" [(ngModel)]="moduleFilter" (ngModelChange)="applyFilters()">
              <option value="">All Modules</option>
              <option value="IAM">IAM</option>
              <option value="Farmer">Farmer</option>
              <option value="Crop">Crop</option>
              <option value="Input">Input</option>
              <option value="Subsidy">Subsidy</option>
              <option value="Produce">Produce</option>
              <option value="Report">Report</option>
              <option value="Notification">Notification</option>
            </select>
          </div>
          <div class="form-group">
            <label for="actionQuery">Search Action</label>
            <div class="search-field">
              <input
                type="text"
                id="actionQuery"
                [(ngModel)]="actionQuery"
                (ngModelChange)="applyFilters()"
                placeholder="e.g. login, delete" />
              <i class="material-icons-round search-icon">search</i>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading audit trail...</p>
        </div>
      } @else if (filteredLogs().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">history_toggle_off</i>
          <h3>No Logs Found</h3>
          <p>No system activity matches your filter configuration.</p>
        </div>
      } @else {
        <div class="table-container">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Module</th>
                  <th>Action performed</th>
                  <th>IP Address</th>
                  <th class="sortable" (click)="sortBy('timestamp')" title="Sort by Timestamp (click again to reverse)">
                    <span>Timestamp</span>
                    <i class="material-icons-round sort-icon" [class.active]="sortField() === 'timestamp'">{{ sortIcon(sortField() === 'timestamp', sortAsc()) }}</i>
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (log of paginatedLogs(); track log.auditId) {
                  <tr>
                    <td><strong>{{ getUserName(log.userId) }}</strong></td>
                    <td><span class="module-label">{{ log.module }}</span></td>
                    <td>{{ log.action }}</td>
                    <td><code>{{ log.ipAddress || '127.0.0.1' }}</code></td>
                    <td>{{ log.timestamp | date:'medium' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalElements]="filteredLogs().length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-card {
      padding: 1rem 1.5rem 0.5rem;
      margin-bottom: 1.5rem;
    }
    .module-label {
      background-color: var(--primary-light);
      color: var(--primary-color);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    code {
      background-color: var(--bg-dark);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.85rem;
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
