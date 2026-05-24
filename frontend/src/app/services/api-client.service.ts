import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Animal, ListingFilters, Product, ServiceListing, User } from '../models/listing.models';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly api = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getAnimals(filters: ListingFilters = {}): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.api}/animals`, { params: this.params(filters) });
  }

  getAnimalById(id: number | string): Observable<Animal> {
    return this.http.get<Animal>(`${this.api}/animals/${id}`);
  }

  createAnimal(data: Partial<Animal>): Observable<Animal> {
    return this.http.post<Animal>(`${this.api}/animals`, data);
  }

  updateAnimal(id: number | string, data: Partial<Animal>): Observable<Animal> {
    return this.http.put<Animal>(`${this.api}/animals/${id}`, data);
  }

  deleteAnimal(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/animals/${id}`);
  }

  getProducts(filters: ListingFilters = {}): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products`, { params: this.params(filters) });
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.api}/products`, data);
  }

  updateProduct(id: number | string, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.api}/products/${id}`, data);
  }

  deleteProduct(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/products/${id}`);
  }

  getServices(filters: ListingFilters = {}): Observable<ServiceListing[]> {
    return this.http.get<ServiceListing[]>(`${this.api}/profiles`, { params: this.params(filters) });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.api}/users/me`);
  }

  private params(filters: ListingFilters): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
