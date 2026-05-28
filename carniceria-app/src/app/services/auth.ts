import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Usuario {
  id_usuar: number;
  usuar: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private BASE_URL = 'http://localhost:5000';
  private STORAGE_KEY = 'usuario';

  constructor(private http: HttpClient) {}

  private tieneLocalStorage(): boolean {
    return typeof window !== 'undefined' &&
           typeof localStorage !== 'undefined';
  }

  login(usuar: string, pass: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.BASE_URL}/login`,
      { usuar, pass }
    ).pipe(

      tap((res) => {

        if (res.usuario && this.tieneLocalStorage()) {

          localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(res.usuario)
          );
        }
      })
    );
  }

  logout(): void {

    if (this.tieneLocalStorage()) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  estaAutenticado(): boolean {

    if (!this.tieneLocalStorage()) {
      return false;
    }

    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  getUsuario(): Usuario | null {

    if (!this.tieneLocalStorage()) {
      return null;
    }

    const data = localStorage.getItem(this.STORAGE_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }
}