import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InputService {
  private http = inject(HttpClient);

  // Input Catalog API
  getAllInputCatalogs(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/input/catalogs');
  }

  getInputCatalogById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/input/catalogs/${id}`);
  }

  createInputCatalog(catalogData: any): Observable<any> {
    return this.http.post<any>('/agrilink/input/catalogs', catalogData);
  }

  updateInputCatalog(id: number, catalogData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/input/catalogs/${id}`, catalogData);
  }

  deleteInputCatalog(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/input/catalogs/${id}`);
  }

  // Input Request API
  getAllInputRequests(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/input/requests');
  }

  getInputRequestById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/input/requests/${id}`);
  }

  createInputRequest(requestData: any): Observable<any> {
    return this.http.post<any>('/agrilink/input/requests', requestData);
  }

  updateInputRequest(id: number, requestData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/input/requests/${id}`, requestData);
  }

  deleteInputRequest(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/input/requests/${id}`);
  }
}
