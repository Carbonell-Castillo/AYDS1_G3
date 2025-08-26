import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export interface MultaApiRow {
  id_multa_sancion: number;
  usuario: string;
  placa_vehiculo: string;
  descripcion: string;
  monto: number;
  id_tipo_multa: number;
  tipo_descripcion: string;
  fecha: string;              
  pagada: 0|1;
  anulada: 0|1;
  descripcion_anulacion?: string|null;
}

export type TipoMultaKey =
  | 'Mal estacionado'
  | 'Bloqueo de rampa'
  | 'Área exclusiva (PMR/Residente)'
  | 'Excedió tiempo permitido';

export const TIPOS_MULTA_MAP: Record<TipoMultaKey, number> = {
  'Mal estacionado': 1,
  'Bloqueo de rampa': 2,
  'Área exclusiva (PMR/Residente)': 3,
  'Excedió tiempo permitido': 4,
};

@Injectable({ providedIn: 'root' })
export class MultasService {
  private api = environment.apiBaseUrl; 

  constructor(private http: HttpClient) {}

  /** Crear multa */
  crearMulta(payload: {
    placa: string;
    tipo: TipoMultaKey;          
    monto: number;
    fechaISO: string;            
    ubicacion?: string;
    motivo?: string;
  }) {
    const id_tipo_multa = TIPOS_MULTA_MAP[payload.tipo] ?? 1;
    const fecha = this.toSQLDateTime(payload.fechaISO);
    const body = {
      id_tipo_multa,
      monto: payload.monto,
      fecha,                           
      descripcion: payload.motivo || payload.tipo,
      placa_vehiculo: payload.placa.toUpperCase().trim(),
      placa: payload.placa.toUpperCase().trim(), 
      ubicacion: payload.ubicacion || null
    };
    return this.http.post<ApiResponse<any>>(`${this.api}/multas/registrar`, body);
  }

  /** Editar multa (tu SQL actualiza monto + motivo/descripcion) */
  actualizarMulta(id: number, cambios: { monto: number; motivo: string }) {
    return this.http.put<ApiResponse<any>>(`${this.api}/multas/${id}`, {
      monto: cambios.monto,
      motivo: cambios.motivo
    });
  }

  /** Anular multa */
  anularMulta(id: number) {
    return this.http.delete<ApiResponse<any>>(`${this.api}/multas/${id}`);
  }

  /** Listar multas por DPI */
  listarPorDpi(dpi: string) {
    return this.http
      .get<ApiResponse<MultaApiRow[]>>(`${this.api}/usuarios/${dpi}/multas`)
      .pipe(map(r => r.body || []));
  }

  /** Helper: 'YYYY-MM-DDTHH:mm' -> 'YYYY-MM-DD HH:mm:ss' */
  private toSQLDateTime(local: string) {
    
    if (!local) return null;
    const base = local.replace('T', ' ');
    return base.length === 16 ? `${base}:00` : base;
  }
}
