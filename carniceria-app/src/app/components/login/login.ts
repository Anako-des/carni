import { Component, ChangeDetectorRef } from '@angular/core'; // ← NUEVO: Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  // ── ORIGINAL (no se tocó) ──────────────────
  usuario = '';
  password = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef // ← NUEVO: Inyectar la herramienta de refresco
  ) {}

  iniciarSesion(): void {
    this.error = '';

    if (!this.usuario || !this.password) {
      this.error = 'Completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.cdr.detectChanges();

    this.authService.login(this.usuario, this.password)
      .subscribe({
        next: (res) => {
          this.cargando = false;

          if (res.usuario) {
            localStorage.setItem('autenticado', 'true');
            this.router.navigate(['/dashboard']);
          } else {
            this.error = 'Credenciales incorrectas';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargando = false;

          if (err.status === 401) {
            this.error = 'Usuario o contraseña incorrectos';
          } else {
            this.error = 'No se pudo conectar con Flask';
          }
          this.cdr.detectChanges();
        }
      });
  }
  // ── FIN ORIGINAL ───────────────────────────


  // ── NUEVO - Crear usuario ──────────────────
  modoCrear = false;
  nuevoUsuario = '';
  nuevoPassword = '';
  confirmarPassword = '';
  errorCrear = '';
  exitoCrear = '';
  cargandoCrear = false;

  private BASE_URL = 'http://34.151.214.143:5000';

  abrirCrear(): void {
    this.modoCrear = true;
    this.nuevoUsuario = '';
    this.nuevoPassword = '';
    this.confirmarPassword = '';
    this.errorCrear = '';
    this.exitoCrear = '';
    this.cdr.detectChanges();
  }

  cerrarCrear(): void {
    this.modoCrear = false;
    this.errorCrear = '';
    this.exitoCrear = '';
    this.cdr.detectChanges();
  }

  crearUsuario(): void {
    this.errorCrear = '';
    this.exitoCrear = '';

    if (!this.nuevoUsuario || !this.nuevoPassword || !this.confirmarPassword) {
      this.errorCrear = 'Completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    if (this.nuevoPassword !== this.confirmarPassword) {
      this.errorCrear = 'Las contraseñas no coinciden';
      this.cdr.detectChanges();
      return;
    }

    this.cargandoCrear = true;
    this.cdr.detectChanges();

    this.http.post(`${this.BASE_URL}/usuarios`, {
      usuar: this.nuevoUsuario,
      pass: this.nuevoPassword
    }).subscribe({
      next: () => {
        this.cargandoCrear = false;
        this.exitoCrear = `Usuario "${this.nuevoUsuario}" creado correctamente`;
        this.nuevoUsuario = '';
        this.nuevoPassword = '';
        this.confirmarPassword = '';
        this.cdr.detectChanges();
        setTimeout(() => this.cerrarCrear(), 1500);
      },
      error: (err) => {
        this.cargandoCrear = false;
        if (err.status === 409) {
          this.errorCrear = 'Ese nombre de usuario ya existe';
        } else {
          this.errorCrear = 'Error al crear el usuario. Intenta de nuevo';
        }
        this.cdr.detectChanges(); // ← CRÍTICO: Fuerza a Angular a pintar la alerta de error en la página
      }
    });
  }
  // ── FIN NUEVO ──────────────────────────────
}