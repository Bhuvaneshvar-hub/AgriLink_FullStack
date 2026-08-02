import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);

  getAllNotifications(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/notification/notifications');
  }

  getNotificationById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/notification/notifications/${id}`);
  }

  createNotification(notificationData: any): Observable<any> {
    return this.http.post<any>('/agrilink/notification/notifications', notificationData);
  }

  updateNotification(id: number, notificationData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/notification/notifications/${id}`, notificationData);
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/notification/notifications/${id}`);
  }

  // The authenticated user's own inbox.
  getMyNotifications(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/notification/notifications/me');
  }

  // Unread badge count for the authenticated user.
  getUnreadCount(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>('/agrilink/notification/notifications/unread-count');
  }

  // Recipient inbox actions.
  markAsRead(id: number): Observable<any> {
    return this.http.put<any>(`/agrilink/notification/notifications/${id}/read`, {});
  }

  markAsUnread(id: number): Observable<any> {
    return this.http.put<any>(`/agrilink/notification/notifications/${id}/unread`, {});
  }

  dismiss(id: number): Observable<any> {
    return this.http.put<any>(`/agrilink/notification/notifications/${id}/dismiss`, {});
  }
}
