import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export type Periodo = 'diaria' | 'semanal';

export interface PuntoOcupacion {
  fecha: string;        
  porcentaje: number;   
}

export interface SancionRow {
  id: number;
  fecha: string;          
  placa: string;
  tipo: string;
  motivo: string;
  rol: 'Admin' | 'Usuario';
  estado: 'Pendiente' | 'Pagada' | 'Anulada' | string;
}

export interface MovimientoRow {
  id: number;
  fecha: string;         
  placa: string;
  evento: 'Entrada' | 'Salida';
  parqueo: string;       
}

export interface PagoUsuarioRow {
  usuario: string;
  dpi: string;
  multas: number;
  pagadas: number;
  pendientes: number;
  total: number;          
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private api = environment.apiBaseUrl; 

  constructor(private http: HttpClient) {}


  getOcupacion(periodo: Periodo, desde?: string) {
    const params: any = { periodo };
    if (desde) params.desde = desde;
    return this.http
      .get<ApiResponse<PuntoOcupacion[] | {labels:string[];data:number[]}>>(`${this.api}/reportes/ocupacion`, { params })
      .pipe(
        map(r => {
          const b: any = r.body;
          if (Array.isArray(b)) return b as PuntoOcupacion[];
          if (b && Array.isArray(b.labels) && Array.isArray(b.data)) {
          
            return (b.labels as string[]).map((fecha, i) => ({ fecha, porcentaje: b.data[i] ?? 0 }));
          }
          return [];
        })
      );
  }


  getSanciones(filt: { q?: string; desde?: string; hasta?: string; rol?: string }) {
    return this.http
      .get<ApiResponse<SancionRow[]>>(`${this.api}/reportes/sanciones`, { params: filt as any })
      .pipe(map(r => r.body || []));
  }


  getMovimientos(filt: { q?: string; desde?: string; hasta?: string }) {
    return this.http
      .get<ApiResponse<MovimientoRow[]>>(`${this.api}/reportes/movimientos`, { params: filt as any })
      .pipe(map(r => r.body || []));
  }


  getPagosUsuarios(filt: { desde?: string; hasta?: string; q?: string }) {
    return this.http
      .get<ApiResponse<PagoUsuarioRow[]>>(`${this.api}/reportes/pagos-usuarios`, { params: filt as any })
      .pipe(map(r => r.body || []));
  }


  getRecaudoMensual(yyyyMM: string) {
    return this.http
      .get<ApiResponse<{ total: number }>>(`${this.api}/reportes/recaudo`, { params: { mes: yyyyMM } })
      .pipe(map(r => r.body?.total ?? 0));
  }
}
