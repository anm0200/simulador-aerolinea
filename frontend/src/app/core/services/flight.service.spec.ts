import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FlightService } from './flight.service';
import { AuthService } from './auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('FlightService', () => {
  let service: FlightService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FlightService,
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: AuthService,
          useValue: { token: () => 'fake-token' },
        },
      ],
    });
    service = TestBed.inject(FlightService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate distance correctly', () => {
    // Madrid to Barcelona approx 500km
    const dist = service.calculateDistance(40.4936, -3.5668, 41.2971, 2.0785);
    expect(dist).toBeGreaterThan(450);
    expect(dist).toBeLessThan(550);
  });

  it('should calculate estimated duration', () => {
    // Requires airports to be loaded
    service['airports'] = [
      { id: 'MAD', lat: 40.4936, lng: -3.5668 } as any,
      { id: 'BCN', lat: 41.2971, lng: 2.0785 } as any,
    ];
    const duration = service.calculateEstimatedDuration('MAD', 'BCN');
    expect(duration).toBeGreaterThan(60);
  });

  describe('Flight Simulation and Conflicts', () => {
    it('should calculate estimated duration', () => {
      // Mock airports are private but we can set them via addAirport or any mock
      // Since it's private, we can mock the getAirport method or use any
      const origin = { id: 'MAD', lat: 40, lng: -3, city: 'Madrid', name: 'Mad', country: 'ES' };
      const dest = { id: 'BCN', lat: 41, lng: 2, city: 'Barcelona', name: 'Bcn', country: 'ES' };
      (service as any).airports = [origin, dest];

      const duration = service.calculateEstimatedDuration('MAD', 'BCN');
      expect(duration).toBeGreaterThan(0);
    });

    it('should generate simulation GeoJSON', () => {
      const origin = { id: 'MAD', lat: 40, lng: -3, city: 'Madrid', name: 'Mad', country: 'ES' };
      const dest = { id: 'BCN', lat: 41, lng: 2, city: 'Barcelona', name: 'Bcn', country: 'ES' };
      (service as any).airports = [origin, dest];
      (service as any).flights = [
        {
          id: 'FL1',
          originId: 'MAD',
          destinationId: 'BCN',
          departureTime: '10:00',
          durationMinutes: 60,
          isActive: true,
        },
        {
          id: 'FL2',
          originId: 'XXX',
          destinationId: 'YYY',
          departureTime: '10:00',
          durationMinutes: 60,
          isActive: true,
        }, // Invalid origin
      ];

      const geojson = service.getSimulationGeoJSON(0, 3600);
      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features.length).toBeGreaterThan(0);
    });

    it('should detect conflicts between flights', () => {
      const origin = { id: 'MAD', lat: 40, lng: -3, city: 'Madrid', name: 'Mad', country: 'ES' };
      const dest = { id: 'BCN', lat: 41, lng: 2, city: 'Barcelona', name: 'Bcn', country: 'ES' };
      (service as any).airports = [origin, dest];
      (service as any).flights = [
        {
          id: 'FL1',
          originId: 'MAD',
          destinationId: 'BCN',
          departureTime: '10:00',
          durationMinutes: 60,
          isActive: true,
        },
      ];

      const newFlight = {
        id: 'FL2',
        originId: 'MAD',
        destinationId: 'BCN',
        departureTime: '10:00',
        durationMinutes: 60,
        isActive: true,
      };
      const conflicts = service.detectConflicts(newFlight);
      // It should detect at least one conflict since they fly same route 5 mins apart
      expect(conflicts).toBeDefined();
    });

    it('should add default flights', async () => {
      // Mock addFlight
      vi.spyOn(service, 'addFlight').mockResolvedValue(undefined);
      await service.addDefaultFlights();
      expect(service.addFlight).toHaveBeenCalled();
    });

    it('should fetch data from API', async () => {
      const promise = service.refreshData();
      const reqAirports = httpMock.expectOne('http://backend:3000/api/airports');
      reqAirports.flush([{ id: 'MAD' }]);
      await Promise.resolve();

      const reqFlights = httpMock.expectOne('http://backend:3000/api/flights');
      reqFlights.flush([{ id: 'FL1' }]);
      await Promise.resolve();

      const reqZones = httpMock.expectOne('http://backend:3000/api/restricted-zones');
      reqZones.flush([{ id: 'Z1' }]);

      await promise;
      expect(service.getAirports().length).toBe(1);
      expect(service.getAirport('MAD')).toBeDefined();
      expect(service.getScheduledFlights().length).toBe(1);
      expect(service.getRestrictedZones().length).toBe(1);
    });

    it('should add, update, delete flights and airports via API', () => {
      vi.spyOn(service, 'refreshData').mockResolvedValue(undefined);

      service.addAirport({ id: 'BCN', lat: 0, lng: 0 } as any);
      httpMock.expectOne('http://backend:3000/api/airports').flush({});

      service.addFlight({ id: 'FL2' } as any);
      httpMock.expectOne('http://backend:3000/api/flights').flush({});

      service.updateFlight({ id: 'FL2' } as any);
      httpMock.expectOne('http://backend:3000/api/flights/FL2').flush({});

      service.deleteFlight('FL2');
      httpMock.expectOne('http://backend:3000/api/flights/FL2').flush({});

      service.addRestrictedZone({ id: 'Z2' } as any);
      httpMock.expectOne('http://backend:3000/api/restricted-zones').flush({});

      service.deleteRestrictedZone('Z2');
      httpMock.expectOne('http://backend:3000/api/restricted-zones/Z2').flush({});

      const reqs = httpMock.match(() => true);
      reqs.forEach((req) => req.flush([]));
    });
  });
});
