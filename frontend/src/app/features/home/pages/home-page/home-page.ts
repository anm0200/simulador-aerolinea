import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';
import { MapCanvas } from '../../../map-view/components/map-canvas/map-canvas';
import { FlightService } from '../../../../core/services/flight.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ReservationService } from '../../../../core/services/reservation.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, FooterComponent, MapCanvas],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  // Estadísticas
  totalFlights = signal(0);
  totalAirports = signal(0);
  totalCountries = signal(0);
  userReservations = signal(0);
  trafficStatus = signal('Normal');

  constructor(
    private flightService: FlightService,
    private auth: AuthService,
    private reservationService: ReservationService,
  ) {}

  async ngOnInit() {
    await this.flightService.refreshData();
    this.calculateStats();

    if (this.auth.isAuthenticated()) {
      this.reservationService.getReservations().subscribe((res) => {
        this.userReservations.set(res.length);
      });
    }
  }

  private calculateStats() {
    const flights = this.flightService.getScheduledFlights();
    const airports = this.flightService.getAirports();

    this.totalFlights.set(flights.length);
    this.totalAirports.set(airports.length);

    const countries = new Set(airports.map((a) => a.country));
    this.totalCountries.set(countries.size);

    // Lógica simple para el estado del tráfico
    if (flights.length > 50) this.trafficStatus.set('Intenso');
    else if (flights.length > 20) this.trafficStatus.set('Moderado');
    else this.trafficStatus.set('Fluido');
  }

  isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }
}
