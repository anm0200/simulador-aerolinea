import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService, FlightConflict } from '../../../../core/services/flight.service';
import { Airport, ScheduledFlight } from '../../../../core/models/airports.data';
import { Header } from '../../../../shared/components/header/header';
import {
  NAVIGATION_WAYPOINTS,
  AIRWAY_CONNECTIONS,
  Waypoint,
} from '../../../../core/models/navigation.data';

@Component({
  selector: 'app-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './management-page.html',
  styleUrl: './management-page.css',
})
export class ManagementPage implements OnInit {
  get flights(): ScheduledFlight[] {
    return this.flightService.getScheduledFlights();
  }
  get airports(): Airport[] {
    return this.flightService.getAirports();
  }

  trackByFlight(index: number, flight: ScheduledFlight): string {
    return flight.id;
  }

  // Búsqueda en selectores
  originSearch = '';
  destinationSearch = '';

  // Formulario
  newFlight: ScheduledFlight = this.resetForm();
  isEditing = false;
  conflicts: FlightConflict[] = [];
  showConflictModal = false;

  // Nuevo Aeropuerto
  showAirportForm = false;
  newAirport: Airport = { id: '', name: '', city: '', country: '', lat: 0, lng: 0 };

  // Filtros de búsqueda
  searchFilters = {
    query: '',
    origin: '',
    destination: '',
    minDuration: 0,
    maxDuration: 600,
    startTime: '',
    endTime: '',
  };

  constructor(
    private flightService: FlightService,
    private cdr: ChangeDetectorRef,
  ) {}

  get filteredFlights(): ScheduledFlight[] {
    return this.flights.filter((flight) => {
      // Filtro por texto (ID, Origen o Destino)
      const query = this.searchFilters.query.toLowerCase();
      const matchesQuery =
        !query ||
        flight.id.toLowerCase().includes(query) ||
        flight.originId.toLowerCase().includes(query) ||
        flight.destinationId.toLowerCase().includes(query);

      // Filtro por aeropuertos específicos
      const matchesOrigin =
        !this.searchFilters.origin || flight.originId === this.searchFilters.origin;
      const matchesDest =
        !this.searchFilters.destination || flight.destinationId === this.searchFilters.destination;

      // Filtro por duración
      const matchesDuration =
        flight.durationMinutes >= this.searchFilters.minDuration &&
        flight.durationMinutes <= this.searchFilters.maxDuration;

      // Filtro por hora de salida
      let matchesTime = true;
      if (this.searchFilters.startTime) {
        matchesTime = matchesTime && flight.departureTime >= this.searchFilters.startTime;
      }
      if (this.searchFilters.endTime) {
        matchesTime = matchesTime && flight.departureTime <= this.searchFilters.endTime;
      }

      return matchesQuery && matchesOrigin && matchesDest && matchesDuration && matchesTime;
    });
  }

  async ngOnInit() {
    console.log('Iniciando carga de datos...');
    try {
      await this.flightService.refreshData();
      console.log('Datos cargados:', {
        vuelos: this.flights.length,
        aeropuertos: this.airports.length,
      });
      this.cdr.detectChanges(); // Forzar actualización de la vista
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  get filteredOriginAirports(): Airport[] {
    const search = this.originSearch.toLowerCase().trim();
    if (!search) return this.airports;
    return this.airports.filter(
      (a) =>
        a.city.toLowerCase().includes(search) ||
        a.id.toLowerCase().includes(search) ||
        a.country.toLowerCase().includes(search),
    );
  }

  get filteredDestinationAirports(): Airport[] {
    const search = this.destinationSearch.toLowerCase().trim();
    if (!search) return this.airports;
    return this.airports.filter(
      (a) =>
        a.city.toLowerCase().includes(search) ||
        a.id.toLowerCase().includes(search) ||
        a.country.toLowerCase().includes(search),
    );
  }

  refreshData(): void {
    // Ya no es necesario reasignar, los getters lo hacen automáticamente
  }

  resetForm(): ScheduledFlight {
    return {
      id: '',
      originId: '',
      destinationId: '',
      departureTime: '12:00',
      durationMinutes: 60,
      isDaily: true,
      isActive: true,
    };
  }

  onSubmit(): void {
    // Validar conflictos antes de guardar
    this.conflicts = this.flightService.detectConflicts(this.newFlight);

    if (this.conflicts.length > 0) {
      this.showConflictModal = true;
      return;
    }

    this.saveFlight();
  }

  async saveFlight() {
    if (this.isEditing) {
      await this.flightService.updateFlight(this.newFlight);
      this.isEditing = false;
    } else {
      await this.flightService.addFlight(this.newFlight);
    }
    this.newFlight = this.resetForm();
    this.showConflictModal = false;
    this.conflicts = [];
  }

  async saveAirport() {
    try {
      await this.flightService.addAirport(this.newAirport);
      this.newAirport = { id: '', name: '', city: '', country: '', lat: 0, lng: 0 };
      this.showAirportForm = false;
      alert('Aeropuerto añadido correctamente');
    } catch (e: any) {
      alert(e.message);
    }
  }

  closeModal(): void {
    this.showConflictModal = false;
    this.conflicts = [];
  }

  resetFilters(): void {
    this.searchFilters = {
      query: '',
      origin: '',
      destination: '',
      minDuration: 0,
      maxDuration: 600,
      startTime: '',
      endTime: '',
    };
  }

  loadDefaults(): void {
    if (
      confirm(
        '¿Quieres cargar los vuelos predeterminados? Esto sobreescribirá tus vuelos actuales.',
      )
    ) {
      this.flightService.addDefaultFlights();
      this.refreshData();
    }
  }

  onRouteChanged(): void {
    if (this.newFlight.originId && this.newFlight.destinationId) {
      this.newFlight.durationMinutes = this.flightService.calculateEstimatedDuration(
        this.newFlight.originId,
        this.newFlight.destinationId,
      );
    }
  }

  editFlight(flight: ScheduledFlight): void {
    this.newFlight = { ...flight };
    this.isEditing = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteFlight(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este vuelo?')) {
      await this.flightService.deleteFlight(id);
    }
  }

  async toggleActive(flight: ScheduledFlight) {
    flight.isActive = !flight.isActive;
    await this.flightService.updateFlight(flight);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.newFlight = this.resetForm();
  }

  getArrivalTime(departureTime: string, durationMinutes: number): string {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + durationMinutes, 0, 0);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDurationLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }
}
