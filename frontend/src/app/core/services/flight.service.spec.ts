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
});
