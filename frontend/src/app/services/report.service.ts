import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);

  generateReport(reportData: any): Observable<any> {
    return this.http.post<any>('/agriLink/analytics/reports/generate', reportData);
  }

  getAllReports(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/reports/fetchAll');
  }

  getReportById(id: number): Observable<any> {
    return this.http.get<any>(`/agriLink/analytics/reports/fetchById/${id}`);
  }

  getReportsByScope(scope: string): Observable<any[]> {
    return this.http.get<any[]>(`/agriLink/analytics/reports/fetchByScope/${scope}`);
  }

  deleteReport(id: number): Observable<any> {
    return this.http.delete<any>(`/agriLink/analytics/reports/delete/${id}`);
  }

  exportReports(format: 'pdf' | 'excel'): Observable<Blob> {
    return this.http.post('/agriLink/analytics/reports/export', { format }, {
      responseType: 'blob'
    });
  }

  // ── Live analytics endpoints (used by the Analytics tab dashboard) ──
  // These aggregate real data live from the other services on each call.
  getUtilisationByScheme(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/subsidy/utilisationByScheme');
  }

  getDisbursementTrend(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/subsidy/disbursementTrend');
  }

  getSalesTrend(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/produce/salesTrend');
  }

  getProduceSalesSummary(): Observable<any> {
    return this.http.get<any>('/agriLink/analytics/dashboard/produceSalesSummary');
  }

  getCropCoverage(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/dashboard/cropCoverage');
  }

  getRegistrationSummary(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/analytics/farmers/registrationSummary');
  }
}
