import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private API_URL = 'http://34.151.214.143:5000/productos';

  private busquedaSubject = new BehaviorSubject<string>('');

  busqueda$ = this.busquedaSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtenerProductos(): Observable<any[]> {

    return this.http.get<any[]>(this.API_URL);
  }

  setBusqueda(texto: string): void {

    this.busquedaSubject.next(texto);
  }
}