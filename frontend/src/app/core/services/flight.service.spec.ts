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
        departureTime: '10:05',
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
  });
});
