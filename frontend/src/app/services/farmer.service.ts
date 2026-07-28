import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FarmerService {
  private http = inject(HttpClient);

  // Farmer Profile API
  getAllFarmerProfiles(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/farmer/farmer-profiles');
  }

  getFarmerProfileById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/farmer/farmer-profiles/${id}`);
  }

  createFarmerProfile(profileData: any): Observable<any> {
    return this.http.post<any>('/agrilink/farmer/farmer-profiles', profileData);
  }

  updateFarmerProfile(id: number, profileData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/farmer/farmer-profiles/${id}`, profileData);
  }

  deleteFarmerProfile(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/farmer/farmer-profiles/${id}`);
  }

  // Land Holding API
  getAllLandHoldings(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/farmer/land-holdings');
  }

  getLandHoldingById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/farmer/land-holdings/${id}`);
  }

  createLandHolding(holdingData: any): Observable<any> {
    return this.http.post<any>('/agrilink/farmer/land-holdings', holdingData);
  }

  updateLandHolding(id: number, holdingData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/farmer/land-holdings/${id}`, holdingData);
  }

  deleteLandHolding(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/farmer/land-holdings/${id}`);
  }
}
