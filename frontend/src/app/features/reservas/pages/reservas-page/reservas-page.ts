import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../../../core/services/flight.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { ScheduledFlight } from '../../../../core/models/airports.data';

import { Header } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';

@Component({
  selector: 'app-reservas-page',
  standalone: true,
  imports: [CommonModule, Header, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="reservas-container">
      <header class="page-header">
        <h1>Centro de Reservas</h1>
        <p>Gestiona tus suscripciones de vuelo para recibir avisos en tiempo real</p>
      </header>

      <div class="dashboard-grid">
        <!-- Mis Reservas -->
        <section class="card reservations-section">
          <div class="card-header">
            <h2>Mis Reservas Activas</h2>
            <span class="badge">{{ myReservations().length }}</span>
          </div>
          <div class="reservations-list">
            <div *ngIf="myReservations().length === 0" class="empty-state">
              <p>No tienes vuelos reservados actualmente.</p>
            </div>
            <div *ngFor="let res of myReservations()" class="reservation-item">
              <div class="flight-info">
                <span class="flight-id">{{ res.flight.id }}</span>
                <span class="route"
                  >{{ res.flight.origin.city }} → {{ res.flight.destination.city }}</span
                >
                <span class="time">🕒 {{ res.flight.departureTime }}</span>
              </div>
              <button (click)="cancelReservation(res.id)" class="btn-outline-danger">
                Cancelar
              </button>
            </div>
          </div>
        </section>

        <!-- Vuelos Disponibles -->
        <section class="card flights-section">
          <div class="card-header">
            <h2>Vuelos Programados</h2>
          </div>
          <div class="flights-list">
            <div *ngFor="let flight of availableFlights()" class="flight-card">
              <div class="flight-card-body">
                <div class="flight-main">
                  <h3>{{ flight.id }}</h3>
                  <div class="flight-route">
                    <div class="point">
                      <span class="city">{{ flight.originId }}</span>
                      <span class="time">{{ flight.departureTime }}</span>
                    </div>
                    <div class="plane-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        style="width: 24px; height: 24px;"
                      >
                        <path
                          d="m17.8 19.2-1.8-8.2 3.5-3.5c1.2-1.2 1.7-3.2 1.2-4.2-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1.1.1-1.3.6l-.3.6c-.2.5 0 1.1.5 1.4L10 12l-3 3-2.5-.5c-.5-.1-1 .1-1.2.6l-.3.5c-.2.5 0 1.1.5 1.4l3.5 2 2 3.5c.3.5.9.7 1.4.5l.5-.3c.5-.2.7-.7.6-1.2L12 17l3 3"
                        />
                      </svg>
                    </div>
                    <div class="point">
                      <span class="city">{{ flight.destinationId }}</span>
                      <span class="duration">{{ flight.durationMinutes }} min</span>
                    </div>
                  </div>
                </div>
                <button
                  (click)="reserveFlight(flight.id)"
                  [disabled]="isReserved(flight.id)"
                  class="btn-primary"
                >
                  {{ isReserved(flight.id) ? 'Suscrito' : 'Suscribirse' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .reservas-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 2rem;
      }
      .page-header h1 {
        font-size: 2.5rem;
        color: var(--primary-color, #1a73e8);
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 2rem;
      }
      @media (max-width: 900px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }
      .card {
        background: white;
        border-radius: 1.5rem;
        padding: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .badge {
        background: var(--primary-color, #1a73e8);
        color: white;
        padding: 0.2rem 0.8rem;
        border-radius: 1rem;
        font-weight: bold;
      }
      .reservations-list,
      .flights-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .reservation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 1rem;
        border-left: 4px solid var(--primary-color, #1a73e8);
      }
      .flight-info {
        display: flex;
        flex-direction: column;
      }
      .flight-id {
        font-weight: bold;
        font-size: 1.1rem;
      }
      .route {
        color: #555;
      }
      .time {
        font-size: 0.9rem;
        color: #777;
      }

      .flight-card {
        background: #ffffff;
        border: 1px solid #eee;
        border-radius: 1rem;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }
      .flight-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
      }
      .flight-card-body {
        padding: 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .flight-route {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-top: 0.5rem;
      }
      .point {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .point .city {
        font-weight: bold;
        font-size: 1.2rem;
      }
      .plane-icon {
        font-size: 1.5rem;
      }

      .btn-primary {
        padding: 0.6rem 1.2rem;
        background: var(--primary-color, #1a73e8);
        color: white;
        border: none;
        border-radius: 0.75rem;
        cursor: pointer;
      }
      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      .btn-outline-danger {
        padding: 0.4rem 0.8rem;
        background: transparent;
        border: 1px solid #dc3545;
        color: #dc3545;
        border-radius: 0.5rem;
        cursor: pointer;
      }
      .btn-outline-danger:hover {
        background: #dc3545;
        color: white;
      }
      .empty-state {
        text-align: center;
        color: #888;
        padding: 2rem;
      }
    `,
  ],
})
export class ReservasPage implements OnInit {
  availableFlights = signal<ScheduledFlight[]>([]);
  myReservations = signal<any[]>([]);

  constructor(
    private flightService: FlightService,
    private reservationService: ReservationService,
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    await this.flightService.refreshData();
    this.availableFlights.set(this.flightService.getScheduledFlights());
    this.reservationService.getReservations().subscribe((res) => {
      this.myReservations.set(res);
    });
  }

  isReserved(flightId: string) {
    return this.myReservations().some((r) => r.flightId === flightId);
  }

  reserveFlight(flightId: string) {
    this.reservationService.createReservation(flightId).subscribe(() => {
      this.loadData();
    });
  }

  cancelReservation(id: string) {
    this.reservationService.deleteReservation(id).subscribe(() => {
      this.loadData();
    });
  }
}
