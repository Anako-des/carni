import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importa ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  fechaFiltro: string = '';
  semanaInicio: string | null = null;
  totalSemana = 0;
  semanasRegistradas = 0;
  semanaActual: any[] = [];

  // 2. Inyecta cdr en el constructor correctamente
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  consultarReporte(): void {
    this.cargarDashboard(this.fechaFiltro);
  }
  
  topProductos: any[] = [];

  // En el método cargarDashboard:
  cargarDashboard(fecha?: string): void {
    this.api.getDashboard(fecha).subscribe({
      next: (data) => {
        this.semanaInicio = data.semana_inicio;
        this.totalSemana = data.total_semana;
        this.semanasRegistradas = data.semanas_registradas;
        this.semanaActual = data.semana_actual || [];
        this.topProductos = data.top_productos || []; // <--- NUEVO
        this.cdr.detectChanges();
      }
    });
  }

  getBarHeight(valor: number): string {
    return `${valor * 5}px`;
  }
}