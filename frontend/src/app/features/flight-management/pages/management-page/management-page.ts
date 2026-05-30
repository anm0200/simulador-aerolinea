import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService, FlightConflict } from '../../../../core/services/flight.service';
import { Airport, ScheduledFlight } from '../../../../core/models/airports.data';
import { Header } from '../../../../shared/components/header/header';
import { FooterComponent } from '../../../../shared/components/footer/footer';
import {
  NAVIGATION_WAYPOINTS,
  AIRWAY_CONNECTIONS,
  Waypoint,
} from '../../../../core/models/navigation.data';

import { AuthService } from '../../../../core/services/auth.service';
import { dmsToDecimal } from '../../../../core/utils/geo.utils';

@Component({
  selector: 'app-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, FooterComponent],
  templateUrl: './management-page.html',
  styleUrl: './management-page.css',
})
export class ManagementPage implements OnInit {
  // Tabs: 'users' | 'airports' | 'flights' | 'zones' | 'csv'
  activeTab: 'users' | 'airports' | 'flights' | 'zones' | 'csv' = 'users';

  // Gestión de Usuarios (Solo Responsables)
  newUser = { name: '', email: '', password: '' };
  userError = '';
  userSuccess = '';

  // CSV Upload
  csvFile: File | null = null;
  csvError = '';

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

  // Gestión de Zonas
  tempZone: any = {
    name: '',
    type: 'CIRCLE',
    radius: 50,
    upperLimit: 'UNL',
    coordinatesText: '',
  };

  get restrictedZones() {
    return this.flightService.getRestrictedZones();
  }

  constructor(
    private flightService: FlightService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  async saveResponsable() {
    this.userError = '';
    this.userSuccess = '';
    this.auth.createResponsable(this.newUser).subscribe({
      next: (res: any) => {
        this.userSuccess = res.message;
        this.newUser = { name: '', email: '', password: '' };
      },
      error: (err) => {
        this.userError = err.error?.error || 'Error al crear usuario';
      },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.csvFile = file;
      this.csvError = '';
    }
  }

  async uploadCSV() {
    if (!this.csvFile) return;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const text = e.target.result;
      const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
      if (lines.length < 2) {
         this.csvError = 'El archivo CSV está vacío o no tiene el formato correcto';
         return;
      }
      
      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
           const flightData = {
              id: parts[0].trim(),
              originId: parts[1].trim(),
              destinationId: parts[2].trim(),
              departureTime: parts[3].trim(),
              durationMinutes: Number(parts[4].trim()),
              isDaily: parts[5] ? parts[5].trim().toLowerCase() === 'true' : true,
              date: parts[6] ? parts[6].trim() : undefined,
              isActive: true
           };
           try {
             await this.flightService.addFlight(flightData as any);
             successCount++;
           } catch (e) {
             console.error('Error uploading flight', flightData.id, e);
           }
        }
      }
      alert(`Se han cargado ${successCount} vuelos correctamente desde el CSV.`);
      this.flightService.refreshData();
      this.csvFile = null;
    };
    reader.readAsText(this.csvFile);
  }

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
      date: new Date().toISOString().split('T')[0],
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
    const flightData = { ...this.newFlight };
    if (flightData.isDaily) {
      delete (flightData as any).date;
    }

    if (this.isEditing) {
      await this.flightService.updateFlight(flightData);
      this.isEditing = false;
    } else {
      await this.flightService.addFlight(flightData);
    }
    this.newFlight = this.resetForm();
    this.showConflictModal = false;
    this.conflicts = [];
  }

  async saveAirport() {
    try {
      await this.flightService.addAirport(this.newAirport);
      this.newAirport = { id: '', name: '', city: '', country: '', lat: 0, lng: 0 };
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
    this.activeTab = 'flights';
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

  // --- MÉTODOS DE ZONAS ---
  async saveZone() {
    try {
      const coords = this.tempZone.coordinatesText.split(',').map((c: string) => c.trim());
      const points = coords.map((c: string) => {
        const parts = c.split(' ');
        if (parts.length === 2) {
          return { lat: dmsToDecimal(parts[0]), lng: dmsToDecimal(parts[1]) };
        } else {
          // Asumir decimal si no hay espacio o formato raro
          const [lat, lng] = parts[0].includes(',') ? parts[0].split(',') : [parts[0], parts[1]];
          return { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) };
        }
      });

      const zoneData: any = {
        name: this.tempZone.name,
        type: this.tempZone.type,
        upperLimit: this.tempZone.upperLimit,
        isActive: true,
      };

      if (this.tempZone.type === 'CIRCLE') {
        zoneData.center = points[0];
        zoneData.radius = this.tempZone.radius;
      } else {
        zoneData.points = points;
      }

      await this.flightService.addRestrictedZone(zoneData);
      this.tempZone = {
        name: '',
        type: 'CIRCLE',
        radius: 50,
        upperLimit: 'UNL',
        coordinatesText: '',
      };
      alert('Zona guardada correctamente');
    } catch (e: any) {
      alert('Error al guardar zona: ' + e.message);
    }
  }

  async deleteZone(id: string) {
    if (confirm('¿Eliminar esta zona restringida?')) {
      await this.flightService.deleteRestrictedZone(id);
    }
  }
}
