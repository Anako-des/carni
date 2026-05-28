import { Routes } from '@angular/router';

import { ProductosComponent } from './components/productos/productos';
import { InventarioComponent } from './components/inventario/inventario';
import { DashboardComponent } from './components/dashboard/dashboard';
import { LoginComponent } from './components/login/login';

import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'productos',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'productos',
    component: ProductosComponent
  },

  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [authGuard]
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  {
    path: '**',
    redirectTo: 'productos'
  }
];