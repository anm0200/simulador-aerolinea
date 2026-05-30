import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReservationService } from './reservation.service';
import { AuthService } from './auth.service';

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReservationService,
        {
          provide: AuthService,
          useValue: { token: () => 'fake-token' },
        },
      ],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch reservations', () => {
    service.getReservations().subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/reservations');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush([{ id: 'res1' }]);
  });

  it('should create a reservation', () => {
    service.createReservation('FL123').subscribe((res: any) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/reservations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ flightId: 'FL123', type: 'DAILY', specificDate: undefined });
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush({ success: true });
  });

  it('should delete a reservation', () => {
    service.deleteReservation('res1').subscribe((res: any) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne('/api/reservations/res1');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush({ success: true });
  });
});

describe('ReservationService (SSR)', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReservationService,
        {
          provide: AuthService,
          useValue: { token: () => 'fake-token' },
        },
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use backend internal URL when running on server', () => {
    service.getReservations().subscribe();
    const req = httpMock.expectOne('http://backend:3000/api/reservations');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
