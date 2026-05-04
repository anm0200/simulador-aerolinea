import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page';
import { MethodsPage } from './features/methods/pages/methods-page/methods-page';
import { DataPage } from './features/data/pages/data-page/data-page';

export const routes: Routes = [
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
    path: 'data',
    component: DataPage,
    title: 'Datos',
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./features/flight-management/pages/management-page/management-page').then(
        (m) => m.ManagementPage,
      ),
    title: 'Gestión de Vuelos',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
