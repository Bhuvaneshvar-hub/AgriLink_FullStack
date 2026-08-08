import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { NAME_PATTERN } from '../../../utils/validators';
import { PaginationComponent } from '../../../components/pagination/pagination.component';
import { ConfirmationModalComponent } from '../../../components/confirmation-modal/confirmation-modal.component';
import { ActionMenuComponent } from '../../../components/action-menu/action-menu.component';
import { DetailModalComponent, DetailRow } from '../../../components/detail-modal/detail-modal.component';
import { exportTableToExcel } from '../../../utils/export-excel.util';
import { toggleSort, sortIcon, applySort } from '../../../utils/table-sort.util';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, PaginationComponent, ConfirmationModalComponent, ActionMenuComponent, DetailModalComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
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

  // Sorting
  sortField = signal<string | null>(null);
  sortAsc = signal(true);
  sortIcon = sortIcon;

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
    const sorted = applySort(this.filteredUsers(), this.sortField(), this.sortAsc());
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
      name: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
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
