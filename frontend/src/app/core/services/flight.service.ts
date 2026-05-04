import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Airport, ScheduledFlight } from '../models/airports.data';
import { NAVIGATION_WAYPOINTS, AIRWAY_CONNECTIONS, Waypoint } from '../models/navigation.data';
import { firstValueFrom } from 'rxjs';

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
    return this.isBrowser ? 'http://localhost:3000/api' : 'http://backend:3000/api';
  }
  private flights: ScheduledFlight[] = [];
  private airports: Airport[] = [];
  private isBrowser: boolean;
  
  private pathCache = new Map<string, any[]>();

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.refreshData();
    }
  }

  async refreshData() {
    if (this.isBrowser) {
      await this.migrateCustomAirports();
      await this.migrateLocalStorage();
    }
    this.airports = await firstValueFrom(this.http.get<Airport[]>(`${this.API_URL}/airports`));
    this.flights = await firstValueFrom(this.http.get<ScheduledFlight[]>(`${this.API_URL}/flights`));
  }

  private async migrateCustomAirports() {
    try {
      const storedAirports = localStorage.getItem('sim_custom_airports') || localStorage.getItem('sim_custom_airports_migrated');
      if (storedAirports) {
        console.log('✈️ Migrando aeropuertos personalizados desde LocalStorage a PostgreSQL...');
        const airports: Airport[] = JSON.parse(storedAirports);
        
        let migrados = 0;
        for (const a of airports) {
          try {
            await firstValueFrom(this.http.post(`${this.API_URL}/airports`, a));
            migrados++;
          } catch (e) {
            // Ignorar errores (ej. si ya existe)
          }
        }
        
        localStorage.removeItem('sim_custom_airports');
        localStorage.setItem('sim_custom_airports_migrated', JSON.stringify(airports));
        if (migrados > 0) {
          console.log(`✅ Migración de aeropuertos completada: ${migrados} aeropuertos pasados a la base de datos.`);
        }
      }
    } catch (e) {
      console.error('Error migrando aeropuertos', e);
    }
  }

  private async migrateLocalStorage() {
    try {
      const storedFlights = localStorage.getItem('sim_scheduled_flights') || localStorage.getItem('sim_scheduled_flights_migrated');
      if (storedFlights) {
        console.log('✈️ Migrando vuelos antiguos desde LocalStorage a PostgreSQL...');
        const flights: ScheduledFlight[] = JSON.parse(storedFlights);
        
        let migrados = 0;
        for (const f of flights) {
          try {
            // Ignorar los que ya existen para evitar errores de clave duplicada
            const exists = this.flights.find(v => v.id === f.id);
            if (!exists) {
              await firstValueFrom(this.http.post(`${this.API_URL}/flights`, f));
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
           console.log(`✅ Migración completada: ${migrados} nuevos vuelos pasados a la base de datos.`);
        }
      }
    } catch (e) {
      console.error('Error durante la migración de LocalStorage', e);
    }
  }

  getAirports(): Airport[] {
    return this.airports;
  }

  async addAirport(airport: Airport) {
    await firstValueFrom(this.http.post(`${this.API_URL}/airports`, airport));
    await this.refreshData();
  }

  getScheduledFlights(): ScheduledFlight[] {
    return this.flights;
  }

  async addFlight(flight: ScheduledFlight) {
    await firstValueFrom(this.http.post(`${this.API_URL}/flights`, flight));
    await this.refreshData();
  }

  async updateFlight(flight: ScheduledFlight) {
    await firstValueFrom(this.http.put(`${this.API_URL}/flights/${flight.id}`, flight));
    this.pathCache.delete(flight.id);
    await this.refreshData();
  }

  async deleteFlight(id: string) {
    await firstValueFrom(this.http.delete(`${this.API_URL}/flights/${id}`));
    this.pathCache.delete(id);
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
      const departureAbsoluteSeconds = startOfDaySeconds + (hours * 3600) + (minutes * 60);
      const arrivalAbsoluteSeconds = departureAbsoluteSeconds + (flight.durationMinutes * 60);
      features.push(this.generateFlightFeature(flight, departureAbsoluteSeconds, arrivalAbsoluteSeconds));
    }

    return { type: 'FeatureCollection', features };
  }

  private generateFlightFeature(flight: ScheduledFlight, startTs: number, endTs: number): any {
    const origin = this.airports.find(a => a.id === flight.originId);
    const dest = this.airports.find(a => a.id === flight.destinationId);
    if (!origin || !dest) return null;

    const distKm = this.calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    let cruiseAlt = distKm < 300 ? 7000 : distKm < 600 ? 9000 : 11000 + (Math.random() > 0.5 ? 500 : -500);
    const bearing = Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * 180 / Math.PI;
    if (bearing > 0 && bearing < 180) cruiseAlt += 300;

    let fullPath: { lat: number, lng: number }[] = [{ lat: origin.lat, lng: origin.lng }];
    const seed = flight.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let j = 1; j <= 3; j++) {
      const ratio = j / 4;
      const mLat = origin.lat + (dest.lat - origin.lat) * ratio;
      const mLng = origin.lng + (dest.lng - origin.lng) * ratio;
      const offLat = ((seed * j) % 15 / 10 - 0.75) * 0.6;
      const offLng = ((seed * j) % 25 / 10 - 1.25) * 0.6;
      fullPath.push({ lat: mLat + offLat, lng: mLng + offLng });
    }
    fullPath.push({ lat: dest.lat, lng: dest.lng });

    const coordinates = [];
    const numPoints = flight.durationMinutes;
    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints;
      const segmentIndex = Math.min(fullPath.length - 2, Math.floor(f * (fullPath.length - 1)));
      const segmentFraction = (f * (fullPath.length - 1)) - segmentIndex;
      const p1 = fullPath[segmentIndex];
      const p2 = fullPath[segmentIndex + 1];

      const lat1 = p1.lat * Math.PI / 180, lon1 = p1.lng * Math.PI / 180;
      const lat2 = p2.lat * Math.PI / 180, lon2 = p2.lng * Math.PI / 180;
      const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
      const A = Math.sin((1 - segmentFraction) * d) / Math.sin(d), B = Math.sin(segmentFraction * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x*x + y*y)), lon = Math.atan2(y, x);

      let alt = cruiseAlt;
      if (f < 0.18) alt = Math.round(cruiseAlt * (f / 0.18));
      else if (f > 0.82) alt = Math.round(cruiseAlt * ((1 - f) / 0.18));

      coordinates.push([lon * 180 / Math.PI, lat * 180 / Math.PI, alt, startTs + (endTs - startTs) * f]);
    }

    return {
      type: 'Feature',
      properties: { flight_id: flight.id, callsign: flight.id, origin: origin.city, destination: dest.city },
      geometry: { type: 'LineString', coordinates }
    };
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  detectConflicts(newFlight: ScheduledFlight): FlightConflict[] {
    const conflicts: FlightConflict[] = [];
    const newPathPoints = this.generatePathMinutes(newFlight, 1);
    const [h, m] = newFlight.departureTime.split(':').map(Number);
    const startNew = h * 60 + m, endNew = startNew + newFlight.durationMinutes;

    for (const other of this.flights) {
      if (!other.isActive || other.id === newFlight.id) continue;
      const [hO, mO] = other.departureTime.split(':').map(Number);
      const startOther = hO * 60 + mO, endOther = startOther + other.durationMinutes;
      if (endNew < startOther || endOther < startNew) continue;

      let otherPathPoints = this.pathCache.get(other.id);
      if (!otherPathPoints) {
        otherPathPoints = this.generatePathMinutes(other, 1);
        this.pathCache.set(other.id, otherPathPoints);
      }
      
      const otherPointsByTime = new Map();
      otherPathPoints.forEach(p => otherPointsByTime.set(p.time, p));
      
      for (const pNew of newPathPoints) {
        const pOther = otherPointsByTime.get(pNew.time);
        if (pOther) {
          const dist = this.calculateDistance(pNew.lat, pNew.lng, pOther.lat, pOther.lng);
          if (dist < 10) {
            conflicts.push({ flightId: other.id, type: dist < 3 ? 'COLISION' : 'CERCANIA', time: pNew.time, distance: Math.round(dist * 10) / 10, lat: pNew.lat, lng: pNew.lng });
            break; 
          }
        }
      }
    }
    return conflicts;
  }

  private generatePathMinutes(flight: ScheduledFlight, step: number): any[] {
    const origin = this.airports.find(a => a.id === flight.originId);
    const dest = this.airports.find(a => a.id === flight.destinationId);
    if (!origin || !dest) return [];

    const distKm = this.calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    let cruiseAlt = distKm < 300 ? 7000 : distKm < 600 ? 9000 : 11000 + (flight.id.charCodeAt(0) % 2 === 0 ? 500 : -500);
    const bearing = Math.atan2(dest.lng - origin.lng, dest.lat - origin.lat) * 180 / Math.PI;
    if (bearing > 0 && bearing < 180) cruiseAlt += 300;

    let fullPath: { lat: number, lng: number }[] = [{ lat: origin.lat, lng: origin.lng }];
    const seed = flight.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let j = 1; j <= 3; j++) {
      const ratio = j / 4, mLat = origin.lat + (dest.lat - origin.lat) * ratio, mLng = origin.lng + (dest.lng - origin.lng) * ratio;
      fullPath.push({ lat: mLat + ((seed * j) % 15 / 10 - 0.75) * 0.6, lng: mLng + ((seed * j) % 25 / 10 - 1.25) * 0.6 });
    }
    fullPath.push({ lat: dest.lat, lng: dest.lng });

    const points = [];
    const [h, m] = flight.departureTime.split(':').map(Number);
    const startTimeInMinutes = h * 60 + m;
    for (let t = 0; t <= flight.durationMinutes; t += step) {
      const f = t / flight.durationMinutes;
      const segmentIndex = Math.min(fullPath.length - 2, Math.floor(f * (fullPath.length - 1))), segmentFraction = (f * (fullPath.length - 1)) - segmentIndex;
      const p1 = fullPath[segmentIndex], p2 = fullPath[segmentIndex + 1];
      const lat1 = p1.lat * Math.PI / 180, lon1 = p1.lng * Math.PI / 180, lat2 = p2.lat * Math.PI / 180, lon2 = p2.lng * Math.PI / 180;
      const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
      const A = Math.sin((1 - segmentFraction) * d) / Math.sin(d), B = Math.sin(segmentFraction * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2), y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2), z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x*x + y*y)), lon = Math.atan2(y, x);
      const currentTimeInMinutes = (startTimeInMinutes + t) % (24 * 60), curH = Math.floor(currentTimeInMinutes / 60).toString().padStart(2, '0'), curM = (currentTimeInMinutes % 60).toString().padStart(2, '0');
      let alt = cruiseAlt;
      if (f < 0.18) alt = Math.round(cruiseAlt * (f / 0.18)); else if (f > 0.82) alt = Math.round(cruiseAlt * ((1 - f) / 0.18));
      points.push({ time: `${curH}:${curM}`, lat: lat * 180 / Math.PI, lng: lon * 180 / Math.PI, altitude: alt });
    }
    return points;
  }

  calculateEstimatedDuration(originId: string, destId: string): number {
    const origin = this.airports.find(a => a.id === originId);
    const dest = this.airports.find(a => a.id === destId);
    if (!origin || !dest) return 60;
    const distance = this.calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    const hours = distance / 700; 
    const minutes = Math.round(hours * 60) + 35; 
    return Math.max(30, minutes); 
  }

  async addDefaultFlights() {
    const defaults: ScheduledFlight[] = [
      { id: 'IB3012', originId: 'MAD', destinationId: 'BCN', departureTime: '07:30', durationMinutes: 75, isDaily: true, isActive: true },
      { id: 'IB3110', originId: 'MAD', destinationId: 'VLC', departureTime: '15:10', durationMinutes: 60, isDaily: true, isActive: true },
      { id: 'AF1101', originId: 'MAD', destinationId: 'CDG', departureTime: '10:15', durationMinutes: 125, isDaily: true, isActive: true },
      { id: 'BA457', originId: 'MAD', destinationId: 'LHR', departureTime: '12:50', durationMinutes: 145, isDaily: true, isActive: true }
    ];

    for (const f of defaults) {
      try {
        await this.addFlight(f);
      } catch (e) {
        console.error(`Error adding default flight ${f.id}`, e);
      }
    }
  }
}
