import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private isBrowser: boolean;


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
    return this.http.get<any[]>(`${environment.apiUrl}/reservations`, { headers: this.getHeaders() });
  }

  createReservation(
    flightId: string,
    type: 'DAILY' | 'SPECIFIC_DATE' = 'DAILY',
    specificDate?: string,
  ) {
    return this.http.post(
      `${environment.apiUrl}/reservations`,
      { flightId, type, specificDate },
      { headers: this.getHeaders() },
    );
  }

  deleteReservation(id: string) {
    return this.http.delete(`${environment.apiUrl}/reservations/${id}`, { headers: this.getHeaders() });
  }
}
