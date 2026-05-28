import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ==========================
   Interfaces
========================== */

export interface Categoria {
  id_categoria: number;
  nombre: string;
}

export interface ProductoAPI {
  id_produc: number;
  categoria: string;
  nombre: string;
  precio: number;
  imagen: string | null;
}

export interface InventarioItem {
  id_produc: number;
  categoria: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  estado_stock: 'BAJO' | 'OK';
}

export interface Movimiento {
  id_movim: number;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario?: {
    id_usuar: number;
    usuar: string;
  };
}

export interface DashboardData {
  semana_inicio: string | null;
  semana_actual: any[];
  total_semana: number;
  semanas_registradas: number;
  top_productos: any[]; // <--- NUEVO
}

/* NUEVO */

export interface Usuario {
  usuar: string;
  pass: string;
}

/* ==========================
   Servicio
========================== */

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private BASE_URL = 'http://34.151.214.143:5000';

  constructor(
    private http: HttpClient
  ) {}

  /* ==========================
     USUARIOS
  ========================== */

  login(
    usuar: string,
    pass: string
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.BASE_URL}/login`,
      {
        usuar,
        pass
      }
    );

  }

  registrar(
    usuario: Usuario
  ): Observable<any> {

    return this.http.post(
      `${this.BASE_URL}/usuarios`,
      usuario
    );

  }

  /* ==========================
     CATEGORÍAS
  ========================== */

  getCategorias(): Observable<Categoria[]> {

    return this.http.get<Categoria[]>(
      `${this.BASE_URL}/categorias`
    );

  }

  /* ==========================
     PRODUCTOS
  ========================== */

  getProductos(): Observable<ProductoAPI[]> {

    return this.http.get<ProductoAPI[]>(
      `${this.BASE_URL}/productos`
    );

  }

  crearProducto(
    body: any
  ): Observable<any> {

    return this.http.post(
      `${this.BASE_URL}/productos`,
      body
    );

  }

  actualizarProducto(
    id: number,
    body: any
  ): Observable<any> {

    return this.http.put(
      `${this.BASE_URL}/productos/${id}`,
      body
    );

  }

  eliminarProducto(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.BASE_URL}/productos/${id}`
    );

  }

  /* ==========================
     INVENTARIO
  ========================== */

  getInventario(): Observable<InventarioItem[]> {

    return this.http.get<InventarioItem[]>(
      `${this.BASE_URL}/inventario`
    );

  }

  getBajoStock(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.BASE_URL}/inventario/bajo-stock`
    );

  }

  actualizarStock(
    id: number,
    tipo: 'entrada' | 'salida',
    cantidad: number
  ): Observable<any> {

    return this.http.put(
      `${this.BASE_URL}/inventario/${id}`,
      {
        tipo,
        cantidad
      }
    );

  }

  getMovimientosProducto(
    id: number
  ): Observable<Movimiento[]> {

    return this.http.get<Movimiento[]>(
      `${this.BASE_URL}/inventario/${id}/movimientos`
    );

  }

  /* ==========================
     DASHBOARD
  ========================== */

  getDashboard(
    inicio?: string
  ): Observable<DashboardData> {

    const params =
      inicio
      ? `?inicio=${inicio}`
      : '';

    return this.http.get<DashboardData>(
      `${this.BASE_URL}/dashboard${params}`
    );

  }

}