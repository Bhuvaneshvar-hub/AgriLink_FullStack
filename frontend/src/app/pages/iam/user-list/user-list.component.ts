import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { exportTableToExcel } from '../../../utils/export-excel.util';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  template: `
    <div class="user-list-page">
      <div class="page-header d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1>User Accounts</h1>
          <p class="text-secondary">Manage system user profiles, permissions, and status.</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-secondary" (click)="exportToExcel()" [disabled]="filteredUsers().length === 0">
            <i class="material-icons-round">file_download</i>
            <span>Export to Excel</span>
          </button>
          <button class="btn btn-primary" (click)="openCreateModal()">
            <i class="material-icons-round">person_add</i>
            <span>Add User</span>
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="card filters-card">
        <div class="form-row">
          <div class="form-group">
            <label for="search">Search Name / Email</label>
            <div class="search-field">
              <input
                type="text"
                id="search"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="Type name or email to search..." />
              <i class="material-icons-round search-icon">search</i>
            </div>
          </div>
          <div class="form-group">
            <label for="roleFilter">Role</label>
            <select id="roleFilter" [(ngModel)]="roleFilter" (ngModelChange)="applyFilters()">
              <option value="">All Roles</option>
              @for (role of roles(); track role.roleId) {
                <option [value]="role.roleName">{{ role.roleName }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="P">Pending</option>
              <option value="S">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      @if (isLoading()) {
        <div class="empty-state">
          <span class="spinner-large"></span>
          <p class="mt-3">Loading users...</p>
        </div>
      } @else if (filteredUsers().length === 0) {
        <div class="empty-state card">
          <i class="material-icons-round">people_outline</i>
          <h3>No Users Found</h3>
          <p>Try modifying your search query or filters.</p>
        </div>
      } @else {
        <div class="table-container">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Region ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of paginatedUsers(); track user.userId; let i = $index) {
                  <tr>
                    <td>{{ currentPage * pageSize + i + 1 }}</td>
                    <td><strong>{{ user.name }}</strong></td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.phone }}</td>
                    <td>{{ user.roleName }}</td>
                    <td>{{ user.regionId || 'N/A' }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'badge-success': user.status === 'A',
                        'badge-secondary': user.status === 'I',
                        'badge-warning': user.status === 'P',
                        'badge-danger': user.status === 'S'
                      }">
                        {{ getStatusLabel(user.status) }}
                      </span>
                    </td>
                    <td>
                      <app-action-menu>
                        <button class="menu-item" (click)="viewUserDetails(user)">
                          <i class="material-icons-round">visibility</i> View
                        </button>
                        <button class="menu-item" (click)="openEditModal(user)">
                          <i class="material-icons-round">edit</i> Edit
                        </button>
                        <button class="menu-item" (click)="openResetModal(user)">
                          <i class="material-icons-round">vpn_key</i> Reset Password
                        </button>
                        @if (user.status !== 'I') {
                          <button class="menu-item danger" (click)="confirmDeactivate(user)">
                            <i class="material-icons-round">block</i> Deactivate
                          </button>
                        }
                      </app-action-menu>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalElements]="filteredUsers().length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showFormModal()) {
        <div class="modal-overlay" (click)="closeFormModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode() ? 'Edit User Profile' : 'Add New User Account' }}</h3>
              <button class="close-btn" (click)="closeFormModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="userForm" (ngSubmit)="onFormSubmit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="formName">Full Name</label>
                  <input type="text" id="formName" formControlName="name" placeholder="John Doe" />
                  @if (isFieldInvalid('name')) {
                    <span class="error-text">Full name is required</span>
                  }
                </div>

                @if (!isEditMode()) {
                  <div class="form-group">
                    <label for="formEmail">Email Address</label>
                    <input type="email" id="formEmail" formControlName="email" placeholder="john.doe@example.com" />
                    @if (isFieldInvalid('email')) {
                      <span class="error-text">Valid email is required</span>
                    }
                  </div>
                  
                  <div class="form-group">
                    <label for="formPassword">Password (min 8 characters)</label>
                    <input type="password" id="formPassword" formControlName="password" placeholder="••••••••" />
                    @if (isFieldInvalid('password')) {
                      <span class="error-text">Password must be at least 8 characters</span>
                    }
                  </div>
                }

                <div class="form-row">
                  <div class="form-group">
                    <label for="formPhone">Phone Number (10 digits)</label>
                    <input type="text" id="formPhone" formControlName="phone" placeholder="9876543210" />
                    @if (isFieldInvalid('phone')) {
                      <span class="error-text">Phone must be exactly 10 digits</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="formRegion">Region ID</label>
                    <input type="number" id="formRegion" formControlName="regionId" placeholder="1" />
                    @if (isFieldInvalid('regionId')) {
                      <span class="error-text">Valid Region ID is required</span>
                    }
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="formRole">System Role</label>
                    <select id="formRole" formControlName="roleId">
                      <option [value]="null" disabled>Select role...</option>
                      @for (role of roles(); track role.roleId) {
                        <option [value]="role.roleId">{{ role.roleName }}</option>
                      }
                    </select>
                    @if (isFieldInvalid('roleId')) {
                      <span class="error-text">Role selection is required</span>
                    }
                  </div>

                  @if (isEditMode()) {
                    <div class="form-group">
                      <label for="formStatus">Account Status</label>
                      <select id="formStatus" formControlName="status">
                        <option value="A">Active</option>
                        <option value="I">Inactive</option>
                        <option value="P">Pending</option>
                        <option value="S">Suspended</option>
                      </select>
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                  {{ isEditMode() ? 'Save Changes' : 'Create User' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Reset Password Modal -->
      @if (showResetModal()) {
        <div class="modal-overlay" (click)="closeResetModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reset Password</h3>
              <button class="close-btn" (click)="closeResetModal()">
                <i class="material-icons-round">close</i>
              </button>
            </div>
            <form [formGroup]="resetForm" (ngSubmit)="onResetSubmit()">
              <div class="modal-body">
                <p class="mb-3 text-secondary">Set a new password for user <strong>{{ selectedUser()?.email }}</strong>.</p>
                <div class="form-group">
                  <label for="resetPassword">New Password (min 8 characters)</label>
                  <input type="password" id="resetPassword" formControlName="newPassword" placeholder="••••••••" />
                  @if (resetForm.get('newPassword')?.invalid && (resetForm.get('newPassword')?.dirty || resetForm.get('newPassword')?.touched)) {
                    <span class="error-text">Password must be at least 8 characters</span>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-primary" [disabled]="resetForm.invalid">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Confirmation dialog for deactivation -->
      @if (showDeactivateConfirm()) {
        <app-confirmation-modal
          title="Deactivate Account"
          [message]="'Are you sure you want to deactivate ' + selectedUser()?.name + '\\\'s account? This will set their status to Inactive.'"
          confirmText="Deactivate"
          cancelText="Cancel"
          (confirm)="onDeactivate()"
          (cancel)="closeDeactivateConfirm()">
        </app-confirmation-modal>
      }

      @if (showDetailModal()) {
        <app-detail-modal
          [title]="detailTitle()"
          [rows]="detailRows()"
          (close)="showDetailModal.set(false)">
        </app-detail-modal>
      }
    </div>
  `,
  styles: [`
    .filters-card {
      padding: 1rem 1.5rem 0.5rem;
      margin-bottom: 1.5rem;
    }
    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color var(--transition-fast);
    }
    .action-btn:hover {
      background-color: var(--border-color);
    }
    .action-btn i {
      font-size: 20px;
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover {
      color: var(--text-primary);
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
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // States
  users = signal<any[]>([]);
  filteredUsers = signal<any[]>([]);
  roles = signal<any[]>([]);
  isLoading = signal(true);
  
  // Modals/Dialogs Toggle
  showFormModal = signal(false);
  showResetModal = signal(false);
  showDeactivateConfirm = signal(false);
  
  isEditMode = signal(false);
  selectedUser = signal<any | null>(null);

  // Detail (view) modal
  showDetailModal = signal(false);
  detailTitle = signal<string>('');
  detailRows = signal<DetailRow[]>([]);

  // Filters
  searchQuery = '';
  roleFilter = '';
  statusFilter = '';

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // Forms
  userForm!: FormGroup;
  resetForm!: FormGroup;

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.initForms();
  }

  initForms(): void {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastService.error('Failed to load user accounts.');
      }
    });
  }

  loadRoles(): void {
    this.userService.getAllRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.toastService.error('Failed to load roles.')
    });
  }

  applyFilters(): void {
    let list = this.users();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    if (this.roleFilter) {
      list = list.filter(u => u.roleName === this.roleFilter);
    }

    if (this.statusFilter) {
      list = list.filter(u => u.status === this.statusFilter);
    }

    this.filteredUsers.set(list);
    this.currentPage = 0; // reset pagination to first page
  }

  paginatedUsers(): any[] {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers().slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
  }

  exportToExcel(): void {
    const headers = ['S.No', 'Name', 'Email', 'Phone', 'Role', 'Region ID', 'Status'];
    const rows = this.filteredUsers().map((u, i) => [
      i + 1,
      u.name,
      u.email,
      u.phone,
      u.roleName,
      u.regionId ?? 'N/A',
      this.getStatusLabel(u.status)
    ]);
    exportTableToExcel(headers, rows, `user-accounts-${Date.now()}`);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'A': return 'Active';
      case 'I': return 'Inactive';
      case 'P': return 'Pending';
      case 'S': return 'Suspended';
      default: return status;
    }
  }

  viewUserDetails(user: any): void {
    this.detailTitle.set(`User #${user.userId}`);
    this.detailRows.set([
      { label: 'User ID', value: user.userId },
      { label: 'Name', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Phone', value: user.phone },
      { label: 'Role', value: user.roleName },
      { label: 'Region ID', value: user.regionId || 'N/A' },
      { label: 'Status', value: this.getStatusLabel(user.status) }
    ]);
    this.showDetailModal.set(true);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.userForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedUser.set(null);
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      regionId: [1, [Validators.required, Validators.min(1)]],
      roleId: [null, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.showFormModal.set(true);
  }

  openEditModal(user: any): void {
    this.isEditMode.set(true);
    this.selectedUser.set(user);
    
    // Find role object
    const roleObj = this.roles().find(r => r.roleName === user.roleName);
    
    this.userForm = this.fb.group({
      name: [user.name, [Validators.required]],
      phone: [user.phone, [Validators.required, Validators.pattern(/^\d{10}$/)]],
      regionId: [user.regionId, [Validators.required, Validators.min(1)]],
      roleId: [roleObj ? roleObj.roleId : null, [Validators.required]],
      status: [user.status, [Validators.required]]
    });
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  onFormSubmit(): void {
    if (this.userForm.invalid) return;

    const val = this.userForm.value;
    if (this.isEditMode()) {
      const id = this.selectedUser().userId;
      this.userService.updateUser(id, val).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'User profile updated successfully.');
          this.closeFormModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to update user profile.');
        }
      });
    } else {
      this.userService.createUser(val).subscribe({
        next: (res) => {
          this.toastService.success(res.message || 'User created successfully.');
          this.closeFormModal();
          this.loadUsers();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to create user account.');
        }
      });
    }
  }

  openResetModal(user: any): void {
    this.selectedUser.set(user);
    this.resetForm.reset();
    this.showResetModal.set(true);
  }

  closeResetModal(): void {
    this.showResetModal.set(false);
  }

  onResetSubmit(): void {
    if (this.resetForm.invalid) return;
    const id = this.selectedUser().userId;
    this.userService.resetPassword(id, this.resetForm.value).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'Password reset successfully.');
        this.closeResetModal();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to reset password.');
      }
    });
  }

  confirmDeactivate(user: any): void {
    this.selectedUser.set(user);
    this.showDeactivateConfirm.set(true);
  }

  closeDeactivateConfirm(): void {
    this.showDeactivateConfirm.set(false);
  }

  onDeactivate(): void {
    const id = this.selectedUser().userId;
    this.userService.deleteUser(id).subscribe({
      next: (res) => {
        this.toastService.success(res.message || 'User deactivated successfully.');
        this.closeDeactivateConfirm();
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Failed to deactivate user.');
      }
    });
  }
}
