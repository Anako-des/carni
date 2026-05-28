import { Component } from '@angular/core';
import { ProductosService } from '../../services/productos';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {

  constructor(
    private productosService: ProductosService
  ) {}

  buscar(event: Event): void {

    const texto = (event.target as HTMLInputElement).value;

    this.productosService.setBusqueda(texto);
  }
}