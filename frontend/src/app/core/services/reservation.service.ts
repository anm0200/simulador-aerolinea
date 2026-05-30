import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly apiUrl = 'http://localhost:3000/api/reservations';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  private getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`,
    });
  }

  getReservations() {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createReservation(flightId: string, type: 'DAILY' | 'SPECIFIC_DATE' = 'DAILY', specificDate?: string) {
    return this.http.post(this.apiUrl, { flightId, type, specificDate }, { headers: this.getHeaders() });
  }

  deleteReservation(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
