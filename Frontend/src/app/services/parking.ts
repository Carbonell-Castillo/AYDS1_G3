// src/app/services/parking.ts  (o donde lo tengas)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export interface EspacioOcupado {
  idEspacio: number;
  nombreParqueo: string;
  ubicacion: string;
  tipo_vehiculo_id: 1 | 2;
}
export interface ParqueoConfig {
  nombre: string;
  cantidad_total: number;
  cantidad_vehiculos: number;
  cantidad_motocicletas: number;
  imagen_distribucion: string | null;
  id_parqueo: string;
  habilitado: number;
  direccion: string;
  asignacion_manual: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private api = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  getConfiguracionParqueo(id: string) {
    return this.http
      .get<ApiResponse<ParqueoConfig[]>>(`${this.api}/parqueo/configuracion/${id}`)
      .pipe(map(r => r.body[0]));
  }

  getEspaciosOcupados() {
    return this.http
      .get<ApiResponse<{ espaciosOcupados: EspacioOcupado[] }>>(`${this.api}/parqueo/ocupados`)
      .pipe(map(r => r.body.espaciosOcupados || []));
  }

  // 👇 NUEVO
  asignarParqueoAutomatico(body: { usuario: string; placa: string }) {
    return this.http.post<ApiResponse<{ mensaje: string; idParqueo: string; idEspacio: number; fechaIngresoHora: string }>>(
      `${this.api}/parqueo/asignar-automatico`,
      body
    );
  }

  // ya tenías:
  asignarParqueoManual(body: { usuario: string; placa: string; idParqueo: string; idEspacio: number }) {
    return this.http.post<ApiResponse<any>>(`${this.api}/parqueo/asignar`, body);
  }
}
