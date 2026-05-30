import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private isBrowser: boolean;

  private get apiUrl(): string {
    if (!this.isBrowser) return 'http://backend:3000/api/reservations';
    if (window.location.hostname === 'localhost' && (window.location.port === '4200' || window.location.port === '')) {
      return 'http://localhost:3000/api/reservations';
    }
    return '/api/reservations';
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`,
    });
  }

  getReservations() {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createReservation(
    flightId: string,
    type: 'DAILY' | 'SPECIFIC_DATE' = 'DAILY',
    specificDate?: string,
  ) {
    return this.http.post(
      this.apiUrl,
      { flightId, type, specificDate },
      { headers: this.getHeaders() },
    );
  }

  deleteReservation(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
