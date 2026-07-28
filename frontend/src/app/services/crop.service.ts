import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private http = inject(HttpClient);

  // Crop Catalog API
  getAllCropCatalogs(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/crop/crop-catalogs');
  }

  getCropCatalogById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/crop/crop-catalogs/${id}`);
  }

  createCropCatalog(catalogData: any): Observable<any> {
    return this.http.post<any>('/agrilink/crop/crop-catalogs', catalogData);
  }

  updateCropCatalog(id: number, catalogData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/crop/crop-catalogs/${id}`, catalogData);
  }

  deleteCropCatalog(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/crop/crop-catalogs/${id}`);
  }

  // Crop Plan API
  getAllCropPlans(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/crop/crop-plans');
  }

  getCropPlanById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/crop/crop-plans/${id}`);
  }

  createCropPlan(planData: any): Observable<any> {
    return this.http.post<any>('/agrilink/crop/crop-plans', planData);
  }

  updateCropPlan(id: number, planData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/crop/crop-plans/${id}`, planData);
  }

  deleteCropPlan(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/crop/crop-plans/${id}`);
  }

  // Growth Observation API
  getAllGrowthObservations(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/crop/growth-observations');
  }

  getGrowthObservationById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/crop/growth-observations/${id}`);
  }

  createGrowthObservation(observationData: any): Observable<any> {
    return this.http.post<any>('/agrilink/crop/growth-observations', observationData);
  }

  updateGrowthObservation(id: number, observationData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/crop/growth-observations/${id}`, observationData);
  }

  deleteGrowthObservation(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/crop/growth-observations/${id}`);
  }
}
