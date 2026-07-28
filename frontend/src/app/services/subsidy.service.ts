import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubsidyService {
  private http = inject(HttpClient);

  // Scheme Catalog API
  getAllSchemes(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/subsidyScheme/fetchSchemes');
  }

  getSchemeById(id: number): Observable<any> {
    return this.http.get<any>(`/agriLink/subsidyScheme/fetchSchemeById/${id}`);
  }

  createScheme(schemeData: any): Observable<any> {
    return this.http.post<any>('/agriLink/subsidyScheme/createScheme', schemeData);
  }

  updateScheme(id: number, schemeData: any): Observable<any> {
    return this.http.put<any>(`/agriLink/subsidyScheme/updateScheme/${id}`, schemeData);
  }

  updateSchemeStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`/agriLink/subsidyScheme/updateSchemeStatus/${id}`, { status });
  }

  deleteScheme(id: number): Observable<any> {
    return this.http.delete<any>(`/agriLink/subsidyScheme/deleteScheme/${id}`);
  }

  // Subsidy Applications API
  getAllApplications(): Observable<any[]> {
    return this.http.get<any[]>('/agriLink/subsidyScheme/fetchApplications');
  }

  getApplicationById(id: number): Observable<any> {
    return this.http.get<any>(`/agriLink/subsidyScheme/fetchApplicationById/${id}`);
  }

  getApplicationsByFarmer(farmerId: number): Observable<any[]> {
    return this.http.get<any[]>(`/agriLink/subsidyScheme/fetchApplicationsByFarmer/${farmerId}`);
  }

  createApplication(appData: any): Observable<any> {
    return this.http.post<any>('/agriLink/subsidyScheme/createApplication', appData);
  }

  updateApplication(id: number, appData: any): Observable<any> {
    return this.http.put<any>(`/agriLink/subsidyScheme/updateApplication/${id}`, appData);
  }

  reviewApplication(id: number, reviewData: any): Observable<any> {
    return this.http.put<any>(`/agriLink/subsidyScheme/reviewApplication/${id}`, reviewData);
  }

  updateApplicationStatus(id: number, statusData: any): Observable<any> {
    return this.http.put<any>(`/agriLink/subsidyScheme/updateApplicationStatus/${id}`, statusData);
  }

  deleteApplication(id: number): Observable<any> {
    return this.http.delete<any>(`/agriLink/subsidyScheme/deleteApplication/${id}`);
  }
}
