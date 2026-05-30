import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear data on logout', () => {
    service.token.set('test-token');
    service.currentUser.set({ id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENTE' });
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1' }));

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should login and set user data', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENTE' as const },
    };

    service.login({ email: 'test@test.com', password: 'password' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.token()).toBe('fake-token');
    expect(service.currentUser()?.email).toBe('test@test.com');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });

  it('should register and set user data', () => {
    const mockResponse = {
      token: 'fake-token',
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENTE' as const },
    };

    service.register({ email: 'test@test.com', password: 'password', name: 'Test' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.token()).toBe('fake-token');
  });

  it('should verify email', () => {
    service.verify('test@test.com', '123456').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/verify');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com', code: '123456' });
    req.flush({});
  });

  it('should create responsable with auth headers', () => {
    service.token.set('fake-token');
    service.createResponsable({ email: 'resp@test.com', name: 'Resp', password: 'pw' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/create-responsable');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush({});
  });

  it('should login with Google', () => {
    const mockResponse = {
      token: 'google-token',
      user: { id: '2', email: 'google@test.com', name: 'Google', role: 'CLIENTE' as const },
    };

    service.loginWithGoogle({ token: 'google-token-id' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/google');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'google-token-id' });
    req.flush(mockResponse);

    expect(service.token()).toBe('google-token');
    expect(service.currentUser()?.email).toBe('google@test.com');
  });

  it('should not set user data if loginWithGoogle returns incomplete data', () => {
    const mockResponse = {
      requiresVerification: true,
      message: 'Cuenta registrada. Revisa tu email.',
    };

    service.loginWithGoogle({ token: 'google-token-id' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/google');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    // Should not have set token or currentUser
    expect(service.token()).toBeNull();
  });

  it('should handle recoverPassword', () => {
    service.recoverPassword('test@test.com').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/recover-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@test.com' });
    req.flush({});
  });

  it('should return isLoggedIn correctly', () => {
    expect(service.isLoggedIn()).toBe(false);
    service.token.set('fake-token');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should return hasRole correctly', () => {
    expect(service.hasRole('ADMIN')).toBe(false);
    service.currentUser.set({ id: '1', email: 'test@test.com', name: 'Test', role: 'CLIENTE' });
    expect(service.hasRole('CLIENTE')).toBe(true);
    expect(service.hasRole('RESPONSABLE')).toBe(false);
  });

  it('should restore token and user from localStorage on init', () => {
    localStorage.setItem('token', 'restored-token');
    localStorage.setItem('user', JSON.stringify({ email: 'restored@test.com' }));

    // We create a new instance directly to test the constructor logic
    const newService = new AuthService({} as any, 'browser');

    expect(newService.token()).toBe('restored-token');
    expect(newService.currentUser()?.email).toBe('restored@test.com');
  });

  it('should not use localStorage if not in browser', () => {
    // Create service with 'server' platform
    const serverService = new AuthService({} as any, 'server');

    // Test logout does not crash
    serverService.logout();
    expect(serverService.token()).toBeNull();

    // Test handleAuth does not crash (call login with mocked http to trigger handleAuth privately)
    // Actually handleAuth is private, we can trigger it via login if we inject httpMock
    // But since handleAuth is private, we can just use any public method that calls it, like register.
    (serverService as any).handleAuth({ token: 'server-token', user: { email: 'a@a.com' } });
    expect(serverService.token()).toBe('server-token');
  });

  it('should not restore token if user is missing in localStorage', () => {
    localStorage.setItem('token', 'restored-token');
    localStorage.removeItem('user');
    const newService = new AuthService({} as any, 'browser');
    expect(newService.token()).toBeNull();
  });

  it('should not restore token if token is missing in localStorage', () => {
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify({ email: 'a@a.com' }));
    const newService = new AuthService({} as any, 'browser');
    expect(newService.token()).toBeNull();
  });

  it('should return false from hasRole if currentUser is null', () => {
    service.currentUser.set(null);
    expect(service.hasRole('ADMIN')).toBe(false);
  });
});
