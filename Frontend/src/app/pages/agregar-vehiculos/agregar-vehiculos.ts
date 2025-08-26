// src/app/pages/agregar-vehiculos/agregar-vehiculos.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { VehiclesService, RegistrarVehiculoPayload } from '../../services/vehicles';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-agregar-vehiculos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-vehiculos.html',
  styleUrls: ['./agregar-vehiculos.css'],
})
export class AgregarVehiculos {
  loading = signal<boolean>(false);

  // Mapa tipo -> id de catálogo (ajusta a los tuyos)
  private TIPO_MAP: Record<string, number> = { auto: 1, moto: 2 };

  vehicleForm!: FormGroup; // <-- declarar primero

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private vehicles: VehiclesService,
    private session: SessionService
  ) {
    // <-- inicializar aquí (ya existe fb)
    this.vehicleForm = this.fb.group({
      tipo: ['auto', [Validators.required]],                  // 'auto' | 'moto'
      placa: ['', [Validators.required, Validators.minLength(4)]],
      marca: ['', []],                                        // opcional
      modelo: ['', [Validators.required]],
      linea: ['', []],                                        // opcional
      color: ['#000000', []],
    });
  }

  // Normaliza placa (mayúsculas, sin espacios)
  private normalizePlaca(v: string): string {
    return (v || '').toUpperCase().replace(/\s+/g, '');
  }

  onSubmit() {
    this.vehicleForm.markAllAsTouched();
    if (this.vehicleForm.invalid) return;

    const dpi = this.session.getDpi();
    if (!dpi) {
      alert('Sesión no válida. Inicia sesión nuevamente.');
      this.router.navigateByUrl('/login');
      return;
    }

    const v = this.vehicleForm.value as any;
    const payload: RegistrarVehiculoPayload = {
      placa: this.normalizePlaca(v.placa),
      tipo_vehiculo_id: this.TIPO_MAP[v.tipo as 'auto' | 'moto'],
      marca: (v.marca || '').trim() || null,
      modelo: (v.modelo || '').trim(),
      linea: (v.linea || '').trim() || null,
      color: v.color || null,
    };

    this.loading.set(true);
    this.vehicles.registrarVehiculoUsuario(dpi, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        alert(res.body?.mensaje || 'Vehículo registrado correctamente.');
        this.router.navigateByUrl('/app/vehiculos');
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        alert('No se pudo registrar el vehículo. Revisa los datos e inténtalo de nuevo.');
      },
    });
  }

  // helpers UI
  isInvalid(name: string) {
    const c = this.vehicleForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  toUpperPlaca(e: Event) {
    const input = e.target as HTMLInputElement;
    const up = input.value.toUpperCase();
    input.value = up;
    this.vehicleForm.patchValue({ placa: up }, { emitEvent: false });
  }
}
