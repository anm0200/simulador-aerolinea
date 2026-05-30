import { Component, OnInit, signal, computed } from '@angular/core';
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
    <div class="reservas-bg"></div>
    <div class="reservas-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Centro de Reservas</h1>
          <p>Gestiona tus suscripciones de vuelo para recibir avisos en tiempo real</p>
        </div>
        <div class="search-group">
          <div class="search-box glass">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="search-icon"
            >
              <path d="M3 21h18M3 7l9-4 9 4M5 7v14M19 7v14M10 21V11h4v10" />
            </svg>
            <input
              type="text"
              placeholder="Desde: Ciudad o Aeropuerto..."
              (input)="updateOriginFilter($any($event.target).value)"
              class="search-input"
            />
          </div>
          <div class="search-box glass">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="search-icon"
            >
              <path
                d="M3 21h18M3 7l9-4 9 4M5 7v14M19 7v14M10 21V11h4v10"
                style="transform: scaleX(-1); transform-origin: center;"
              />
            </svg>
            <input
              type="text"
              placeholder="Hacia: Ciudad o Aeropuerto..."
              (input)="updateDestFilter($any($event.target).value)"
              class="search-input"
            />
          </div>
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- Mis Reservas -->
        <section class="card reservations-section glass">
          <div class="card-header">
            <h2>Mis Reservas Activas</h2>
            <span class="badge">{{ myReservations().length }}</span>
          </div>
          <div class="reservations-list">
            <div *ngIf="myReservations().length === 0" class="empty-state">
              <div class="empty-illustration">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path
                    d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.69.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"
                  />
                  <path d="M2 13h10" />
                  <path d="m9 16 3-3-3-3" />
                </svg>
              </div>
              <p>No tienes vuelos reservados actualmente.</p>
            </div>
            <div *ngFor="let res of myReservations()" class="reservation-item glass-item">
              <div class="flight-info">
                <div class="flight-id-row">
                  <span class="flight-id">{{ res.flight.id }}</span>
                  <span class="airline-mini">TFG AIR</span>
                </div>
                <div class="route-info">
                  <span class="route">{{ res.flight.origin.city }} → {{ res.flight.destination.city }}</span>
                  <span class="sub-badge" [class.badge-daily]="res.type === 'DAILY'">
                    {{ res.type === 'DAILY' ? 'Diario' : (res.specificDate | date:'dd/MM/yyyy') }}
                  </span>
                </div>
                <div class="time-range">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="mini-icon"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span
                    >{{ res.flight.departureTime }} —
                    {{
                      calculateArrival(res.flight.departureTime, res.flight.durationMinutes)
                    }}</span
                  >
                </div>
              </div>
              <button
                (click)="cancelReservation(res.id)"
                class="btn-cancel"
                title="Cancelar suscripción"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-trash">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </section>

        <!-- Vuelos Disponibles -->
        <section class="card flights-section glass">
          <div class="card-header">
            <h2>Vuelos Programados</h2>
            <span class="results-count" *ngIf="filterOrigin() || filterDest()"
              >{{ filteredFlights().length }} resultados</span
            >
          </div>
          <div class="flights-list">
            <div *ngFor="let flight of filteredFlights()" class="boarding-pass">
              <div class="pass-header">
                <span class="airline-tag">TFG AIR</span>
                <span class="flight-code">{{ flight.id }}</span>
              </div>
              <div class="pass-body">
                <div class="station">
                  <span class="iata">{{ flight.originId }}</span>
                  <span class="time">{{ flight.departureTime }}</span>
                </div>
                <div class="flight-path">
                  <span class="path-duration">{{ flight.durationMinutes }}m</span>
                  <div class="path-visuals">
                    <div class="line"></div>
                    <svg viewBox="0 0 24 24" fill="currentColor" class="plane-svg">
                      <path
                        d="M21,16L21,14L13,9L13,3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5L10,9L2,14L2,16L10,13.5L10,19L8,20.5L8,22L11.5,21L15,22L15,20.5L13,19L13,13.5L21,16Z"
                      />
                    </svg>
                    <div class="line"></div>
                  </div>
                </div>
                <div class="station">
                  <span class="iata">{{ flight.destinationId }}</span>
                  <span class="time">{{
                    calculateArrival(flight.departureTime, flight.durationMinutes)
                  }}</span>
                </div>
              </div>
              <div class="pass-footer">
                <button
                  *ngIf="!isReserved(flight.id)"
                  (click)="openSubscribeModal(flight)"
                  class="btn-ticket"
                >
                  Suscribir a vuelo
                </button>
                <button
                  *ngIf="isReserved(flight.id)"
                  (click)="cancelByFlightId(flight.id)"
                  class="btn-ticket-cancel"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-check">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Suscrito
                </button>
              </div>
            </div>

            <div *ngIf="filteredFlights().length === 0" class="no-results">
              <p>No se han encontrado vuelos para esta ruta</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Modal Suscripción -->
    <div class="modal-backdrop" *ngIf="isModalOpen()">
      <div class="modal-card glass">
        <div class="modal-header">
          <h3>Suscribirse a {{ selectedFlightForSub()?.id }}</h3>
          <button class="btn-close" (click)="closeSubscribeModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="modal-body" *ngIf="selectedFlightForSub()?.isDaily">
          <p class="modal-subtitle">¿Cuándo deseas recibir notificaciones?</p>
          <label class="radio-label" [class.selected]="subType() === 'DAILY'">
            <input type="radio" name="subType" value="DAILY" [checked]="subType() === 'DAILY'" (change)="subType.set('DAILY')">
            Suscripción Diaria (Todos los días)
          </label>
          <label class="radio-label" [class.selected]="subType() === 'SPECIFIC_DATE'">
            <input type="radio" name="subType" value="SPECIFIC_DATE" [checked]="subType() === 'SPECIFIC_DATE'" (change)="subType.set('SPECIFIC_DATE')">
            Solo un día específico
          </label>
          
          <div *ngIf="subType() === 'SPECIFIC_DATE'" class="date-picker-wrapper">
            <label>Selecciona la fecha del vuelo:</label>
            <input type="date" [value]="subDate()" (change)="subDate.set($any($event.target).value)" min="{{ getTodayString() }}" class="date-input">
          </div>
        </div>

        <div class="modal-body" *ngIf="!selectedFlightForSub()?.isDaily">
          <div class="alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Este vuelo no es diario. Opera únicamente el <strong>{{ selectedFlightForSub()?.specificDate | date:'dd/MM/yyyy' }}</strong>.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary-modal" (click)="closeSubscribeModal()">Cancelar</button>
          <button class="btn-primary-modal" (click)="confirmSubscription()" [disabled]="subType() === 'SPECIFIC_DATE' && !subDate()">Confirmar Suscripción</button>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      :host {
        --glass-bg: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(255, 255, 255, 0.3);
        --primary-blue: #1a73e8;
        --dark-blue: #0d47a1;
      }

      .reservas-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%);
        z-index: -1;
      }

      .reservas-container {
        padding: 3rem 2rem;
        max-width: 1400px;
        margin: 0 auto;
        min-height: 80vh;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 3rem;
        gap: 2rem;
      }

      @media (max-width: 900px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      .header-content h1 {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(120deg, #1a73e8, #0d47a1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        letter-spacing: -1px;
      }

      .header-content p {
        color: #627d98;
        font-size: 1.1rem;
        margin-top: 0.5rem;
      }

      .glass {
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
      }

      .search-group {
        display: flex;
        gap: 1rem;
        width: 100%;
        max-width: 800px;
      }

      @media (max-width: 1200px) {
        .search-group {
          flex-direction: column;
          max-width: 100%;
        }
      }

      .search-box {
        display: flex;
        align-items: center;
        padding: 0.8rem 1.2rem;
        border-radius: 1.2rem;
        flex: 1;
        transition: all 0.3s ease;
      }

      .search-box:focus-within {
        box-shadow: 0 8px 32px 0 rgba(26, 115, 232, 0.15);
        border-color: rgba(26, 115, 232, 0.4);
        transform: translateY(-2px);
        background: white;
      }

      .search-icon {
        width: 20px;
        height: 20px;
        color: #9fb3c8;
        margin-right: 1rem;
      }

      .search-input {
        background: transparent;
        border: none;
        color: #102a43;
        font-size: 1rem;
        width: 100%;
        outline: none;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: 2.5rem;
        animation: fadeIn 0.8s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 1100px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        border-radius: 2rem;
        padding: 2rem;
        transition: all 0.3s ease;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .card-header h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #334e68;
        margin: 0;
      }

      .badge {
        background: var(--primary-blue);
        color: white;
        padding: 0.4rem 1rem;
        border-radius: 2rem;
        font-weight: 700;
        font-size: 0.9rem;
      }

      .reservations-list {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }

      .glass-item {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 1.2rem;
        padding: 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
        animation: slideIn 0.5s ease-out both;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .glass-item:hover {
        background: rgba(255, 255, 255, 0.8);
        transform: translateX(5px);
      }

      .flight-id-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .airline-mini {
        font-size: 0.7rem;
        font-weight: 700;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 0.1rem 0.4rem;
        border-radius: 0.3rem;
      }

      .flight-id {
        font-weight: 800;
        color: var(--primary-blue);
        font-size: 1.1rem;
      }

      .route {
        display: block;
        color: #486581;
        font-weight: 500;
        margin: 0.2rem 0;
      }

      .time-range {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #64748b;
      }

      .mini-icon {
        width: 14px;
        height: 14px;
      }

      .btn-cancel {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: rgba(220, 53, 69, 0.05);
        color: #dc3545;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-cancel:hover {
        background: #dc3545;
        color: white;
      }

      /* Boarding Pass Style */
      .flights-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }

      .boarding-pass {
        background: white;
        border-radius: 1.5rem;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        border: 1px solid #f0f4f8;
        transition: all 0.3s ease;
        animation: cardIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
      }

      @keyframes cardIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .boarding-pass:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      }

      .pass-header {
        background: #f8fafc;
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed #cbd5e0;
      }

      .airline-tag {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .flight-code {
        font-weight: 800;
        color: #1e293b;
      }

      .pass-body {
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .station {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .iata {
        font-size: 1.8rem;
        font-weight: 900;
        color: #0f172a;
      }

      .flight-path {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 1rem;
        gap: 0.3rem;
        position: relative;
      }

      .path-duration {
        font-size: 0.75rem;
        font-weight: 700;
        color: #94a3b8;
        background: white;
        padding: 0 0.5rem;
        z-index: 2;
      }

      .path-visuals {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .line {
        flex: 1;
        height: 2px;
        background: #e2e8f0;
      }

      .plane-svg {
        width: 18px;
        height: 18px;
        color: var(--primary-blue);
        transform: rotate(90deg);
      }

      .pass-footer {
        padding: 1rem 1.5rem;
        background: #fcfcfc;
        display: flex;
        justify-content: center;
      }

      .btn-ticket {
        width: 100%;
        padding: 0.8rem;
        border-radius: 1rem;
        border: none;
        background: var(--primary-blue);
        color: white;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-ticket:hover {
        background: var(--dark-blue);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
      }

      .btn-ticket-cancel {
        width: 100%;
        padding: 0.8rem;
        border-radius: 1rem;
        border: 2px solid #ecfdf5;
        background: #f0fdf4;
        color: #166534;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-ticket-cancel:hover {
        background: #fef2f2;
        border-color: #fee2e2;
        color: #991b1b;
      }

      .empty-state {
        padding: 3rem 1rem;
        text-align: center;
      }

      .empty-illustration {
        width: 64px;
        height: 64px;
        margin: 0 auto 1.5rem;
        color: #cbd5e0;
      }

      .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem;
        color: #94a3b8;
      }

      /* Estilos del Modal */
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;
      }

      .modal-card {
        background: white;
        border-radius: 24px;
        width: 90%;
        max-width: 450px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .modal-header {
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f1f5f9;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: #1e293b;
      }

      .btn-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }

      .btn-close:hover {
        background: #f1f5f9;
        color: #475569;
      }

      .modal-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .modal-subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.95rem;
      }

      .radio-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        color: #475569;
        font-weight: 500;
      }

      .radio-label:hover {
        border-color: #cbd5e1;
        background: #f8fafc;
      }

      .radio-label.selected {
        border-color: var(--primary-blue);
        background: #eff6ff;
        color: var(--dark-blue);
      }

      .date-picker-wrapper {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .date-picker-wrapper label {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 600;
      }

      .date-input {
        padding: 0.75rem 1rem;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        font-family: inherit;
        font-size: 1rem;
        color: #1e293b;
        outline: none;
        transition: border-color 0.2s;
      }

      .date-input:focus {
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
      }

      .alert-info {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #166534;
        padding: 1rem;
        border-radius: 12px;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .alert-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .modal-footer {
        padding: 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
      }

      .btn-secondary-modal {
        padding: 0.75rem 1.5rem;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        color: #475569;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary-modal:hover {
        background: #f1f5f9;
      }

      .btn-primary-modal {
        padding: 0.75rem 1.5rem;
        background: var(--primary-blue);
        border: none;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary-modal:hover:not(:disabled) {
        background: var(--dark-blue);
      }

      .btn-primary-modal:disabled {
        background: #94a3b8;
        cursor: not-allowed;
      }

      /* Nuevos Estilos Badges e Iconos */
      .route-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .sub-badge {
        align-self: flex-start;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
        background: #e2e8f0;
        color: #475569;
        letter-spacing: 0.5px;
      }

      .badge-daily {
        background: #dbeafe;
        color: #1e40af;
      }

      .icon-trash {
        width: 18px;
        height: 18px;
      }

      .icon-check {
        width: 18px;
        height: 18px;
        margin-right: 6px;
      }

      .btn-ticket-cancel {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class ReservasPage implements OnInit {
  private allFlights = signal<ScheduledFlight[]>([]);
  myReservations = signal<any[]>([]);
  filterOrigin = signal('');
  filterDest = signal('');

  // Estado del Modal
  isModalOpen = signal(false);
  selectedFlightForSub = signal<any>(null);
  subType = signal<'DAILY' | 'SPECIFIC_DATE'>('DAILY');
  subDate = signal('');


  // Lógica de filtrado reactivo mejorada (Doble buscador)
  filteredFlights = computed(() => {
    const originQuery = this.filterOrigin().toLowerCase().trim();
    const destQuery = this.filterDest().toLowerCase().trim();
    const flights = this.allFlights();

    if (!originQuery && !destQuery) return flights;

    return flights.filter((f) => {
      const originIata = f.originId.toLowerCase();
      const destIata = f.destinationId.toLowerCase();
      const originCity = this.flightService.getAirport(f.originId)?.city.toLowerCase() || '';
      const destCity = this.flightService.getAirport(f.destinationId)?.city.toLowerCase() || '';
      const flightId = f.id.toLowerCase();

      // Si hay ambos filtros, debe cumplir los dos
      if (originQuery && destQuery) {
        const matchesOrigin =
          originIata.includes(originQuery) ||
          originCity.includes(originQuery) ||
          flightId.includes(originQuery);
        const matchesDest = destIata.includes(destQuery) || destCity.includes(destQuery);
        return matchesOrigin && matchesDest;
      }

      // Si solo hay origen
      if (originQuery) {
        return (
          originIata.includes(originQuery) ||
          originCity.includes(originQuery) ||
          flightId.includes(originQuery)
        );
      }

      // Si solo hay destino
      if (destQuery) {
        return destIata.includes(destQuery) || destCity.includes(destQuery);
      }

      return true;
    });
  });

  constructor(
    private flightService: FlightService,
    private reservationService: ReservationService,
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    await this.flightService.refreshData();
    this.allFlights.set(this.flightService.getScheduledFlights());
    this.reservationService.getReservations().subscribe((res) => {
      this.myReservations.set(res);
    });
  }

  updateOriginFilter(query: string) {
    this.filterOrigin.set(query);
  }

  updateDestFilter(query: string) {
    this.filterDest.set(query);
  }

  calculateArrival(departure: string, duration: number): string {
    const [h, m] = departure.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration;
    const finalH = Math.floor(totalMinutes / 60) % 24;
    const finalM = totalMinutes % 60;
    return `${finalH.toString().padStart(2, '0')}:${finalM.toString().padStart(2, '0')}`;
  }

  isReserved(flightId: string) {
    return this.myReservations().some((r) => r.flightId === flightId);
  }

  openSubscribeModal(flight: any) {
    this.selectedFlightForSub.set(flight);
    if (!flight.isDaily && flight.specificDate) {
      this.subType.set('SPECIFIC_DATE');
      this.subDate.set(flight.specificDate);
    } else {
      this.subType.set('DAILY');
      this.subDate.set('');
    }
    this.isModalOpen.set(true);
  }

  closeSubscribeModal() {
    this.isModalOpen.set(false);
    this.selectedFlightForSub.set(null);
  }

  confirmSubscription() {
    const flight = this.selectedFlightForSub();
    if (!flight) return;
    
    if (this.subType() === 'SPECIFIC_DATE' && !this.subDate()) {
        return; 
    }

    this.reservationService.createReservation(flight.id, this.subType(), this.subDate()).subscribe(() => {
      this.loadData();
      this.closeSubscribeModal();
    });
  }

  getTodayString(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  }

  cancelReservation(id: string) {
    this.reservationService.deleteReservation(id).subscribe(() => {
      this.loadData();
    });
  }

  cancelByFlightId(flightId: string) {
    const res = this.myReservations().find((r) => r.flightId === flightId);
    if (res) {
      this.cancelReservation(res.id);
    }
  }
}
