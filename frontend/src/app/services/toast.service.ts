import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 0;

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3000) {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
    this.persistAsNotification(message);
  }

  /**
   * Mirrors an action confirmation into a persistent notification so it also
   * appears on the Alerts & Notifications page. Best-effort and silent: any
   * failure is ignored and never shows another toast (avoids loops).
   */
  private persistAsNotification(message: string) {
    const userId = this.authService.currentUserValue?.userId;
    if (!userId || !message) {
      return;
    }
    // Don't persist the notification-inbox actions themselves (read/unread/dismiss)
    // — that would just create self-referential noise.
    if (/mark(ed)?\s+as\s+(read|unread)|dismiss/i.test(message)) {
      return;
    }
    this.notificationService.createSystemNotification({
      userId,
      message,
      category: this.categoryFor(message)
    }).subscribe({ error: () => {} });
  }

  private categoryFor(message: string): string {
    const m = message.toLowerCase();
    if (/subsid|scheme|application/.test(m)) return 'Subsidy';
    if (/produce|listing|sale/.test(m)) return 'ProduceSale';
    if (/crop|plan|observation|harvest/.test(m)) return 'CropAdvisory';
    if (/input|catalog|request/.test(m)) return 'InputProcurement';
    return 'Compliance';
  }

  error(message: string, duration = 4000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 3000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  remove(id: number) {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
