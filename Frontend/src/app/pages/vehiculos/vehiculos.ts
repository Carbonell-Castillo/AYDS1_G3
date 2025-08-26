// src/app/pages/vehiculos/vehiculos.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { VehiclesService, Vehiculo } from '../../services/vehicles';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css']
})
export class Vehiculos implements OnInit {
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  items = signal<Vehiculo[]>([]);

  constructor(
    private vehicles: VehiclesService,
    private session: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const dpi = this.session.getDpi();
    if (!dpi) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.cargar(dpi);
  }

  private cargar(dpi: string) {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.vehicles.getVehiculosUsuario(dpi).subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar tus vehículos.');
        this.loading.set(false);
      }
    });
  }

  // Helpers UI
  imagenPara(v: Vehiculo): string {
    // coloca imágenes por tipo/marca si quieres; por ahora un placeholder
    return 'https://placehold.co/600x400/png';
  }
  tituloPara(v: Vehiculo) {
    // Marca + opcional modelo si existe
    return [v.marca].filter(Boolean).join(' ');
  }
  anioDe(v: Vehiculo) {
    // si modelo trae año; si no, muestra placa como secundario
    return v.modelo || v.placa;
  }
}
