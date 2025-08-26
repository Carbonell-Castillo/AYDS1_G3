import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export type EstadoMulta = 'Pendiente' | 'Pagada' | 'Apelada' | 'Anulada';

export interface Multa {
  id_multa: number;
  placa: string;
  marca?: string;
  modelo?: string;
  tipo: 'Multa' | 'Sancion';
  motivo: string;
  fecha_hora: string; 
  monto: number;
  estado: EstadoMulta; 
}

@Injectable({ providedIn: 'root' })
export class FinesService {
  private api = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  getMultas(dpi: string): Observable<Multa[]> {
    return this.http
      .get<ApiResponse<{ multas: Multa[] }>>(`${this.api}/usuarios/${dpi}/multas`)
      .pipe(map(r => r.body.multas || []));
  }

  pagarMulta(dpi: string, id_multa: number) {
    return this.http.post<ApiResponse<any>>(`${this.api}/usuarios/${dpi}/multas/${id_multa}/pagar`, {});
  }

  apelarMulta(dpi: string, id_multa: number) {
    return this.http.post<ApiResponse<any>>(`${this.api}/usuarios/${dpi}/multas/${id_multa}/apelar`, {});
  }
}
