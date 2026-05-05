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
  activeFlightsNow = signal(0);

  constructor(
    private flightService: FlightService,
    private auth: AuthService,
    private reservationService: ReservationService,
  ) {}

  async ngOnInit() {
    await this.flightService.refreshData();
    this.calculateStats();

    if (this.auth.isLoggedIn()) {
      this.reservationService.getReservations().subscribe((res) => {
        this.userReservations.set(res.length);
      });
    }

    // Actualizar vuelos activos cada minuto
    setInterval(() => this.updateActiveFlights(), 60000);
    this.updateActiveFlights();
  }

  private calculateStats() {
    const flights = this.flightService.getScheduledFlights();
    const airports = this.flightService.getAirports();

    this.totalFlights.set(flights.length);
    this.totalAirports.set(airports.length);

    const countries = new Set(airports.map((a) => a.country));
    this.totalCountries.set(countries.size);
  }

  private updateActiveFlights() {
    const flights = this.flightService.getScheduledFlights();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activeCount = 0;
    for (const flight of flights) {
      if (!flight.isActive) continue;

      const [h, m] = flight.departureTime.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + flight.durationMinutes;

      // Caso normal: el vuelo empieza y termina el mismo día
      if (endMinutes < 1440) {
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          activeCount++;
        }
      } else {
        // Caso medianoche: el vuelo cruza a las 00:00
        if (currentMinutes >= startMinutes || currentMinutes <= endMinutes % 1440) {
          activeCount++;
        }
      }
    }

    this.activeFlightsNow.set(activeCount);

    // Lógica para el estado del tráfico basado en vuelos activos REALES
    if (activeCount > 30) this.trafficStatus.set('Intenso');
    else if (activeCount > 10) this.trafficStatus.set('Moderado');
    else this.trafficStatus.set('Fluido');
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
}
