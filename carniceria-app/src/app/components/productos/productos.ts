import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductosService } from '../../services/productos';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit, OnDestroy {

  productos: any[] = [];
  productosFiltrados: any[] = [];
  
  private subscripcionBusqueda!: Subscription;
  private textoBusqueda: string = '';

  constructor(
    private productosService: ProductosService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef  // ← NUEVO: Herramienta para forzar el refresco de pantalla
  ) {}

  ngOnInit(): void {
    this.obtenerProductos();

    this.subscripcionBusqueda = this.productosService.busqueda$.subscribe((texto: any) => {
      this.textoBusqueda = texto;
      this.filtrarProductos(this.textoBusqueda);
    });
  }

  ngOnDestroy(): void {
    // ← NUEVO: Limpia la memoria al irte al Dashboard o Inventario
    if (this.subscripcionBusqueda) {
      this.subscripcionBusqueda.unsubscribe();
    }
  }

  obtenerProductos(): void {
    this.productosService.obtenerProductos()
      .subscribe({
        next: (data: any[]) => {
          this.productos = data || [];
          this.filtrarProductos(this.textoBusqueda);
          this.cdr.detectChanges(); // ← MAGIA: Obliga a Angular a pintar las carnes inmediatamente
        },
        error: (err: any) => {
          console.error('Error al obtener productos', err);
          this.cdr.detectChanges();
        }
      });
  }

  filtrarProductos(texto: any): void {
    if (typeof texto !== 'string' || !texto.trim()) {
      this.productosFiltrados = [...this.productos];
      this.cdr.detectChanges(); // ← Obliga el refresco
      return;
    }

    const textoLimpio = texto.toLowerCase();

    this.productosFiltrados = this.productos.filter((producto: any) =>
      (producto.nombre && producto.nombre.toLowerCase().includes(textoLimpio)) ||
      (producto.categoria && producto.categoria.toLowerCase().includes(textoLimpio))
    );
    this.cdr.detectChanges(); // ← Obliga el refresco
  }

  irLogin(): void {
    this.router.navigate(['/login']);
  }

  get autenticado(): boolean {
    return this.authService.estaAutenticado();
  }
}