import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = {
      isLoggedIn: vitest.fn(),
      hasRole: vitest.fn(),
    };
    router = {
      navigate: vitest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should navigate to login if not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(
        { data: {} } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  it('should return true if logged in and no role required', () => {
    authService.isLoggedIn.mockReturnValue(true);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(
        { data: {} } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
      expect(result).toBe(true);
    });
  });

  it('should navigate to home if logged in but lacks required role', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(false);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(
        { data: { role: 'ADMIN' } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  it('should return true if logged in and has required role', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.hasRole.mockReturnValue(true);

    TestBed.runInInjectionContext(() => {
      const result = authGuard(
        { data: { role: 'ADMIN' } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      );
      expect(result).toBe(true);
    });
  });
});
