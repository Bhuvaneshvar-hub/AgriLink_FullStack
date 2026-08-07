import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  // Users CRUD
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/user');
  }

  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/user/pending');
  }

  getUser(id: number): Observable<any> {
    return this.http.get<any>(`/agriLink/user/${id}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post<any>('/agriLink/user/createUser', userData);
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put<any>(`/agriLink/user/${id}`, userData);
  }

  approveUser(id: number): Observable<any> {
    return this.http.post<any>(`/agriLink/user/${id}/approve`, {});
  }

  rejectUser(id: number): Observable<any> {
    return this.http.post<any>(`/agriLink/user/${id}/reject`, {});
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`/agriLink/user/${id}`);
  }

  resetPassword(id: number, data: any): Observable<any> {
    return this.http.post<any>(`/agriLink/user/${id}/reset-password`, data);
  }

  // Roles
  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/role');
  }

  // Audit Logs
  getAllAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/audit');
  }

  getAuditLogsByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`/agriLink/audit/user/${userId}`);
  }
}
