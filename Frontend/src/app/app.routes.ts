import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login').then(m => m.LoginComponent),
  },
  {
    path: 'app', // layout con menú fijo
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home').then(m => m.Home),
      },
      {
        path: 'parqueo',
        loadComponent: () => import('./pages/parqueo/parqueo').then(m => m.Parqueo),
      },
      {
        path: 'vehiculos',
        loadComponent: () => import('./pages/vehiculos/vehiculos').then(m => m.Vehiculos),
      },
      {
        path: 'multas',
        loadComponent: () => import('./pages/multas/multas').then(m => m.Multas),
      },
      {
        path: 'agregarVehiculos',
        loadComponent: () => import('./pages/agregar-vehiculos/agregar-vehiculos').then(m => m.AgregarVehiculos),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' },
];
