import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page';
import { MethodsPage } from './features/methods/pages/methods-page/methods-page';
import { DataPage } from './features/data/pages/data-page/data-page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then((m) => m.LoginPage),
    title: 'Autenticación',
  },
  {
    path: '',
    component: HomePage,
    title: 'Inicio',
  },
  {
    path: 'methods',
    component: MethodsPage,
    title: 'Métodos',
  },
  {
    path: 'reservas',
    loadComponent: () =>
      import('./features/reservas/pages/reservas-page/reservas-page').then((m) => m.ReservasPage),
    title: 'Reservas',
    canActivate: [authGuard],
  },
  {
    path: 'data',
    component: DataPage,
    title: 'Datos',
    canActivate: [authGuard],
    data: { role: 'RESPONSABLE' },
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./features/flight-management/pages/management-page/management-page').then(
        (m) => m.ManagementPage,
      ),
    title: 'Gestión de Vuelos',
    canActivate: [authGuard],
    data: { role: 'RESPONSABLE' },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
