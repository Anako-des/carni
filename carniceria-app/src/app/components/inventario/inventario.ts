import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, InventarioItem } from '../../services/api'; // Asegúrate de que esta ruta sea la correcta para tu api.ts

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html'
})
export class InventarioComponent implements OnInit {

  listaInventario: InventarioItem[] = [];
  productoSeleccionado: InventarioItem | null = null;
  
  // Variables de control de UI
  cargando = false;
  guardando = false;
  mensajeError = '';
  mensajeExito = '';

  // Modelo del formulario
  movimiento = {
    tipo: 'entrada' as 'entrada' | 'salida',
    cantidad: 0
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdr.detectChanges();

    this.apiService.getInventario().subscribe({
      next: (data: InventarioItem[]) => {
        this.listaInventario = data || [];
        this.cargando = false;
        this.cdr.detectChanges(); // Asegura el renderizado rápido de las celdas
      },
      error: (err) => {
        console.error('Error al traer inventario de Flask', err);
        this.mensajeError = 'No se pudo obtener el inventario desde el servidor';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarProducto(item: InventarioItem): void {
    this.productoSeleccionado = item;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.movimiento.cantidad = 0; // Limpia la caja de texto para el nuevo ajuste
    this.cdr.detectChanges();
  }

  guardarMovimiento(): void {
    if (!this.productoSeleccionado) {
      this.mensajeError = 'Por favor selecciona un producto de la tabla primero';
      return;
    }

    if (this.movimiento.cantidad <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a cero';
      return;
    }

    // Validar que no se retire más carne de la que hay en existencia física
    if (this.movimiento.tipo === 'salida' && this.movimiento.cantidad > this.productoSeleccionado.stock) {
      this.mensajeError = `Operación inválida: No puedes retirar ${this.movimiento.cantidad} Kg porque el stock actual es de ${this.productoSeleccionado.stock} Kg.`;
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.cdr.detectChanges();

    // Se conecta directamente a la ruta PUT /inventario/<id> de tu Flask
    this.apiService.actualizarStock(
      this.productoSeleccionado.id_produc,
      this.movimiento.tipo,
      this.movimiento.cantidad
    ).subscribe({
      next: (res) => {
        this.guardando = false;
        this.mensajeExito = `¡Base de datos actualizada! Se registró la ${this.movimiento.tipo} de forma correcta.`;
        
        // Limpiamos la selección del formulario
        this.productoSeleccionado = null;
        this.movimiento.cantidad = 0;
        
        // Recargamos la tabla de inmediato para reflejar el nuevo stock y color de alertas (Badges)
        this.cargarInventario(); 
      },
      error: (err) => {
        console.error('Error al guardar el movimiento', err);
        this.mensajeError = 'Error al enviar los datos a Flask. Intenta de nuevo.';
        this.guardando = false;
        this.cdr.detectChanges();
      }
    });
  }
}