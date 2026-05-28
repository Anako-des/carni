import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { AuthService } from './services/auth';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HeaderComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
 
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
 
  get autenticado(): boolean {
    return this.authService.estaAutenticado();
  }
 
  cerrarSesion(): void {
    // 1. Limpiamos la sesión en el servicio
    this.authService.logout();
    
    // 2. Navegamos de forma directa y limpia
    this.router.navigate(['/productos']);
  }
}