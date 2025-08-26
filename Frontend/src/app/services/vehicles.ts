// src/app/services/vehicles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export interface RegistrarVehiculoPayload {
  placa: string;
  tipo_vehiculo_id: number;
  marca: string | null;
  modelo: string;
    linea?: string | null;
  color?: string | null;
}

export interface Vehiculo {
  placa: string;
  // nombre del tipo (p. ej. 'Automóvil', 'Motocicleta')
  marca: string;
  modelo?: string;  // si tu query ya lo devuelve
  color?: string;   // si tu query ya lo devuelve
  tipo_vehiculo_id?: string; 
}

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private api = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  registrarVehiculoUsuario(dpi: string, payload: RegistrarVehiculoPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.api}/usuarios/${dpi}/vehiculos`, payload);
  }

  // 👇 nuevo: listar vehículos de un usuario
  getVehiculosUsuario(dpi: string): Observable<Vehiculo[]> {
    return this.http
      .get<ApiResponse<{ vehiculos: Vehiculo[] }>>(`${this.api}/usuarios/${dpi}/vehiculos`)
      .pipe(map(res => {
        console.log("Vehículos del usuario:", res.body.vehiculos || []);
        return res.body.vehiculos || [];
      }));
  }
}
