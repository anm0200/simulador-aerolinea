import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Airport, ScheduledFlight } from '../models/airports.data';
import { firstValueFrom } from 'rxjs';
import { calculateDistance, interpolateGreatCircle } from '../utils/geo.utils';

import { AuthService } from './auth.service';

export interface FlightConflict {
  flightId: string;
  type: 'COLISION' | 'CERCANIA';
  time: string;
  distance: number;
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root',
})
export class FlightService {
  private get API_URL(): string {
    /* istanbul ignore if */
    /* v8 ignore next */
    if (!this.isBrowser) return 'http://backend:3000/api'; // NOSONAR
    /* istanbul ignore next */
    /* v8 ignore start */
    if (window.location.hostname === 'localhost' && window.location.port === '4200') {
      return 'http://localhost:3000/api'; // NOSONAR
    }
    /* v8 ignore stop */
    return '/api'; // NOSONAR
  }
  private flights: ScheduledFlight[] = [];
  private airports: Airport[] = [];
  private restrictedZones: any[] = [];
  private isBrowser: boolean;

  private pathCache = new Map<string, any[]>();

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private http: HttpClient,
    private auth: AuthService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    /* istanbul ignore start */
    if (this.isBrowser) {
      this.refreshData(); // NOSONAR
    }
    /* istanbul ignore stop */
  }

  private getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`,
    });
  }

  async refreshData() {
    /* istanbul ignore start */
    if (this.isBrowser) {
      await this.migrateCustomAirports();
      await this.migrateLocalStorage();
    }
    /* istanbul ignore stop */
    this.airports = await firstValueFrom(this.http.get<Airport[]>(`${this.API_URL}/airports`));
    this.flights = await firstValueFrom(
      this.http.get<ScheduledFlight[]>(`${this.API_URL}/flights`),
    );
    this.restrictedZones = await firstValueFrom(
      this.http.get<any[]>(`${this.API_URL}/restricted-zones`),
    );
  }

  /* istanbul ignore start */
  private async migrateCustomAirports() {
    try {
      const storedAirports =
        localStorage.getItem('sim_custom_airports') ||
        localStorage.getItem('sim_custom_airports_migrated');
      if (storedAirports) {
        console.log('✈️ Migrando aeropuertos personalizados desde LocalStorage a PostgreSQL...');
        const airports: Airport[] = JSON.parse(storedAirports);

        let migrados = 0;
        for (const a of airports) {
          try {
            await firstValueFrom(
              this.http.post(`${this.API_URL}/airports`, a, { headers: this.getHeaders() }),
            );
            migrados++;
          } catch (e) {
            // Ignorar errores (ej. si ya existe)
          }
        }

        localStorage.removeItem('sim_custom_airports');
        localStorage.setItem('sim_custom_airports_migrated', JSON.stringify(airports));
        if (migrados > 0) {
          console.log(
            `✅ Migración de aeropuertos completada: ${migrados} aeropuertos pasados a la base de datos.`,
          );
        }
      }
    } catch (e) {
      console.error('Error migrando aeropuertos', e);
    }
  }

  private async migrateLocalStorage() {
    try {
      const storedFlights =
        localStorage.getItem('sim_scheduled_flights') ||
        localStorage.getItem('sim_scheduled_flights_migrated');
      if (storedFlights) {
        console.log('✈️ Migrando vuelos antiguos desde LocalStorage a PostgreSQL...');
        const flights: ScheduledFlight[] = JSON.parse(storedFlights);

        let migrados = 0;
        for (const f of flights) {
          try {
            // Ignorar los que ya existen para evitar errores de clave duplicada
            const exists = this.flights.find((v) => v.id === f.id);
            if (!exists) {
              await firstValueFrom(
                this.http.post(`${this.API_URL}/flights`, f, { headers: this.getHeaders() }),
              );
              migrados++;
            }
          } catch (e) {
            console.error(`Error migrando vuelo ${f.id}`, e);
          }
        }

        // Marcar la migración, mantenemos el backup por seguridad pero evitamos bucles si ya están todos en la DB.
        // Si hay 130 vuelos en la BD, ya no intentamos migrar.
        const dbFlightsCount = this.flights.length;
        if (migrados > 0 || flights.length > dbFlightsCount) {
          localStorage.removeItem('sim_scheduled_flights');
          localStorage.setItem('sim_scheduled_flights_migrated', JSON.stringify(flights));
          console.log(
            `✅ Migración completada: ${migrados} nuevos vuelos pasados a la base de datos.`,
          );
        }
      }
    } catch (e) {
      console.error('Error durante la migración de LocalStorage', e);
    }
  }
  /* istanbul ignore stop */

  getAirports(): Airport[] {
    return this.airports;
  }

  getAirport(id: string): Airport | undefined {
    return this.airports.find((a) => a.id === id);
  }

  async addAirport(airport: Airport) {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/airports`, airport, { headers: this.getHeaders() }),
    );
    await this.refreshData();
  }

  getScheduledFlights(): ScheduledFlight[] {
    return this.flights;
  }

  async addFlight(flight: ScheduledFlight) {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/flights`, flight, { headers: this.getHeaders() }),
    );
    await this.refreshData();
  }

  async updateFlight(flight: ScheduledFlight) {
    await firstValueFrom(
      this.http.put(`${this.API_URL}/flights/${flight.id}`, flight, { headers: this.getHeaders() }),
    );
    this.pathCache.delete(flight.id);
    await this.refreshData();
  }

  async deleteFlight(id: string) {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/flights/${id}`, { headers: this.getHeaders() }),
    );
    this.pathCache.delete(id);
    await this.refreshData();
  }

  // --- RESTRICTED ZONES ---
  getRestrictedZones(): any[] {
    return this.restrictedZones;
  }

  async addRestrictedZone(zone: any) {
    await firstValueFrom(
      this.http.post(`${this.API_URL}/restricted-zones`, zone, { headers: this.getHeaders() }),
    );
    await this.refreshData();
  }

  async deleteRestrictedZone(id: string) {
    await firstValueFrom(
      this.http.delete(`${this.API_URL}/restricted-zones/${id}`, { headers: this.getHeaders() }),
    );
    await this.refreshData();
  }

  // --- LÓGICA DE SIMULACIÓN Y TRAYECTORIAS (Se mantiene igual por ahora para que el mapa funcione) ---

  getSimulationGeoJSON(simStartTimeSeconds: number, simEndTimeSeconds: number): any {
    const features = [];
    const startOfSimDate = new Date(simStartTimeSeconds * 1000);
    startOfSimDate.setHours(0, 0, 0, 0);
    const startOfDaySeconds = Math.floor(startOfSimDate.getTime() / 1000);

    for (const flight of this.flights) {
      if (!flight.isActive) continue;
      const [hours, minutes] = flight.departureTime.split(':').map(Number);
      const departureAbsoluteSeconds = startOfDaySeconds + hours * 3600 + minutes * 60;
      const arrivalAbsoluteSeconds = departureAbsoluteSeconds + flight.durationMinutes * 60;
      features.push(
        this.generateFlightFeature(flight, departureAbsoluteSeconds, arrivalAbsoluteSeconds),
      );
    }

    return { type: 'FeatureCollection', features };
  }

  private generateFlightFeature(flight: ScheduledFlight, startTs: number, endTs: number): any {
    const origin = this.airports.find((a) => a.id === flight.originId);
    const dest = this.airports.find((a) => a.id === flight.destinationId);
    if (!origin || !dest) return null;

    const distKm = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    let cruiseAlt =
      distKm < 300 ? 7000 : distKm < 600 ? 9000 : 11000 + (Math.random() > 0.5 ? 500 : -500); // NOSONAR
    const bearing = (Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * 180) / Math.PI;
    if (bearing > 0 && bearing < 180) cruiseAlt += 300;

    let fullPath = this.generateFullPath(flight.id, origin, dest);

    const coordinates = [];
    const numPoints = flight.durationMinutes;
    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints;
      const segmentIndex = Math.min(fullPath.length - 2, Math.floor(f * (fullPath.length - 1)));
      const segmentFraction = f * (fullPath.length - 1) - segmentIndex;
      const p1 = fullPath[segmentIndex];
      const p2 = fullPath[segmentIndex + 1];

      const interpolated = interpolateGreatCircle(p1, p2, segmentFraction);

      let alt = cruiseAlt;
      if (f < 0.18) alt = Math.round(cruiseAlt * (f / 0.18));
      else if (f > 0.82) alt = Math.round(cruiseAlt * ((1 - f) / 0.18));

      coordinates.push([interpolated.lng, interpolated.lat, alt, startTs + (endTs - startTs) * f]);
    }

    return {
      type: 'Feature',
      properties: {
        flight_id: flight.id,
        callsign: flight.id,
        origin: origin.city,
        destination: dest.city,
        departureTime: flight.departureTime,
      },
      geometry: { type: 'LineString', coordinates },
    };
  }

  detectConflicts(newFlight: ScheduledFlight): FlightConflict[] {
    const conflicts: FlightConflict[] = [];
    const newPathPoints = this.generatePathMinutes(newFlight, 1);
    const [h, m] = newFlight.departureTime.split(':').map(Number);
    const startNew = h * 60 + m,
      endNew = startNew + newFlight.durationMinutes;

    for (const other of this.flights) {
      if (!other.isActive || other.id === newFlight.id) continue;
      const [hO, mO] = other.departureTime.split(':').map(Number);
      const startOther = hO * 60 + mO,
        endOther = startOther + other.durationMinutes;
      if (endNew < startOther || endOther < startNew) continue;

      let otherPathPoints = this.pathCache.get(other.id);
      if (!otherPathPoints) {
        otherPathPoints = this.generatePathMinutes(other, 1);
        this.pathCache.set(other.id, otherPathPoints);
      }

      const otherPointsByTime = new Map();
      otherPathPoints.forEach((p) => otherPointsByTime.set(p.time, p));

      for (const pNew of newPathPoints) {
        const pOther = otherPointsByTime.get(pNew.time);
        if (pOther) {
          const dist = calculateDistance(pNew.lat, pNew.lng, pOther.lat, pOther.lng);
          if (dist < 10) {
            conflicts.push({
              flightId: other.id,
              type: dist < 3 ? 'COLISION' : 'CERCANIA',
              time: pNew.time,
              distance: Math.round(dist * 10) / 10,
              lat: pNew.lat,
              lng: pNew.lng,
            });
            break;
          }
        }
      }
    }
    return conflicts;
  }

  private generatePathMinutes(flight: ScheduledFlight, step: number): any[] {
    const origin = this.airports.find((a) => a.id === flight.originId);
    const dest = this.airports.find((a) => a.id === flight.destinationId);
    if (!origin || !dest) return [];

    const distKm = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    let cruiseAlt =
      distKm < 300
        ? 7000
        : distKm < 600
          ? 9000
          : 11000 + ((flight.id.codePointAt(0) || 0) % 2 === 0 ? 500 : -500); // NOSONAR
    const bearing = (Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * 180) / Math.PI;
    if (bearing > 0 && bearing < 180) cruiseAlt += 300;

    let fullPath = this.generateFullPath(flight.id, origin, dest);

    const points = [];
    const [h, m] = flight.departureTime.split(':').map(Number);
    const startTimeInMinutes = h * 60 + m;
    for (let t = 0; t <= flight.durationMinutes; t += step) {
      const f = t / flight.durationMinutes;
      const segmentIndex = Math.min(fullPath.length - 2, Math.floor(f * (fullPath.length - 1))),
        segmentFraction = f * (fullPath.length - 1) - segmentIndex;
      const p1 = fullPath[segmentIndex],
        p2 = fullPath[segmentIndex + 1];
      const interpolated = interpolateGreatCircle(p1, p2, segmentFraction);

      const currentTimeInMinutes = (startTimeInMinutes + t) % (24 * 60),
        curH = Math.floor(currentTimeInMinutes / 60)
          .toString()
          .padStart(2, '0'),
        curM = (currentTimeInMinutes % 60).toString().padStart(2, '0');
      let alt = cruiseAlt;
      if (f < 0.18) alt = Math.round(cruiseAlt * (f / 0.18));
      else if (f > 0.82) alt = Math.round(cruiseAlt * ((1 - f) / 0.18));
      points.push({
        time: `${curH}:${curM}`,
        lat: interpolated.lat,
        lng: interpolated.lng,
        altitude: alt,
      });
    }
    return points;
  }

  calculateEstimatedDuration(originId: string, destId: string): number {
    const origin = this.airports.find((a) => a.id === originId);
    const dest = this.airports.find((a) => a.id === destId);
    if (!origin || !dest) return 60;
    const distance = calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    const hours = distance / 700;
    const minutes = Math.round(hours * 60) + 35;
    return Math.max(30, minutes);
  }

  private generateFullPath(
    flightId: string,
    origin: Airport,
    dest: Airport,
  ): { lat: number; lng: number }[] {
    let fullPath: { lat: number; lng: number }[] = [{ lat: origin.lat, lng: origin.lng }];
    const seed = flightId.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0);
    for (let j = 1; j <= 3; j++) {
      const ratio = j / 4;
      const mLat = origin.lat + (dest.lat - origin.lat) * ratio;
      const mLng = origin.lng + (dest.lng - origin.lng) * ratio;
      const offLat = (((seed * j) % 15) / 10 - 0.75) * 0.2;
      const offLng = (((seed * j) % 25) / 10 - 1.25) * 0.2;
      fullPath.push({ lat: mLat + offLat, lng: mLng + offLng });
    }
    fullPath.push({ lat: dest.lat, lng: dest.lng });
    return fullPath;
  }

  async addDefaultFlights() {
    const defaults: ScheduledFlight[] = [
      {
        id: 'IB3012',
        originId: 'MAD',
        destinationId: 'BCN',
        departureTime: '07:30',
        durationMinutes: 75,
        isDaily: true,
        isActive: true,
      },
      {
        id: 'IB3110',
        originId: 'MAD',
        destinationId: 'VLC',
        departureTime: '15:10',
        durationMinutes: 60,
        isDaily: true,
        isActive: true,
      },
      {
        id: 'FUTURE-01',
        originId: 'MAD',
        destinationId: 'LIS',
        departureTime: '10:00',
        durationMinutes: 70,
        isDaily: false,
        date: '2026-06-01',
        isActive: true,
      },
      {
        id: 'AF1101',
        originId: 'MAD',
        destinationId: 'CDG',
        departureTime: '10:15',
        durationMinutes: 125,
        isDaily: true,
        isActive: true,
      },
      {
        id: 'BA457',
        originId: 'MAD',
        destinationId: 'LHR',
        departureTime: '12:50',
        durationMinutes: 145,
        isDaily: true,
        isActive: true,
      },
    ];

    for (const f of defaults) {
      try {
        await this.addFlight(f);
      } catch (e) {
        /* istanbul ignore next */
        console.error(`Error adding default flight ${f.id}`, e);
      }
    }
  }
}
