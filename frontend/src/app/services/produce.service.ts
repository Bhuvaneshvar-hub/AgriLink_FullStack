import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProduceService {
  private http = inject(HttpClient);

  // Produce Listing API
  getAllProduceListings(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/produce/produce-listings');
  }

  getProduceListingById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/produce/produce-listings/${id}`);
  }

  createProduceListing(listingData: any): Observable<any> {
    return this.http.post<any>('/agrilink/produce/produce-listings', listingData);
  }

  updateProduceListing(id: number, listingData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/produce/produce-listings/${id}`, listingData);
  }

  deleteProduceListing(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/produce/produce-listings/${id}`);
  }

  // Produce Sale API
  getAllProduceSales(): Observable<any[]> {
    return this.http.get<any[]>('/agrilink/produce/produce-sales');
  }

  getProduceSaleById(id: number): Observable<any> {
    return this.http.get<any>(`/agrilink/produce/produce-sales/${id}`);
  }

  createProduceSale(saleData: any): Observable<any> {
    return this.http.post<any>('/agrilink/produce/produce-sales', saleData);
  }

  updateProduceSale(id: number, saleData: any): Observable<any> {
    return this.http.put<any>(`/agrilink/produce/produce-sales/${id}`, saleData);
  }

  deleteProduceSale(id: number): Observable<any> {
    return this.http.delete<any>(`/agrilink/produce/produce-sales/${id}`);
  }

  /** Selling farmer's confirmation that a payment marked Paid actually reached them. */
  confirmFarmerPayment(id: number): Observable<any> {
    return this.http.post<any>(`/agrilink/produce/produce-sales/${id}/farmer-confirmation`, {});
  }
}
