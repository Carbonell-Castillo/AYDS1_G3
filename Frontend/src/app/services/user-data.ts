import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { error: boolean; status: number; body: T; }

export interface TotalInvertido { dpi: string; totalInvertido: number; }
export interface VehiculosCount { dpi: string; totalVehiculos: number; }
export interface MultasTotal { dpi: string; totalMultas: number; }

// Lo que devuelve tu endpoint /vehiculos/parqueo (según tu código actual):
export interface VehiculoParqueado {
  placa: string;
  modelo: string;
  marca: string;
  ubicacion: string;
  fecha_hora_ingreso: string;
  // opcionales si los agregas en backend:
  precio?: number;
  tipo?: string;
}

@Injectable({ providedIn: 'root' })
export class UserDataService {
  private api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getTotalInvertido(dpi: string): Observable<TotalInvertido> {
    return this.http.get<ApiResponse<TotalInvertido>>(
      `${this.api}/usuarios/${dpi}/total-invertido`
    ).pipe(map(r => r.body));
  }

  getVehiculosCount(dpi: string): Observable<VehiculosCount> {
    //almacenar en variable
    let vehiculosCount: VehiculosCount;
    let totalVehiculos: number;
    return this.http.get<ApiResponse<VehiculosCount>>(
      `${this.api}/usuarios/${dpi}/vehiculos/count`
    ).pipe(map(r => {
      vehiculosCount = r.body;
      totalVehiculos = vehiculosCount.totalVehiculos;
      console.log('Total de vehículos:', totalVehiculos);
      return vehiculosCount;
    }));


  }

  getMultasTotal(dpi: string): Observable<MultasTotal> {
    return this.http.get<ApiResponse<MultasTotal>>(
      `${this.api}/usuarios/${dpi}/multas/total`
    ).pipe(map(r => r.body));
  }

  getVehiculosParqueados(dpi: string): Observable<VehiculoParqueado[]> {
    return this.http.get<ApiResponse<{ dpi: string; vehiculosParqueados: VehiculoParqueado[] }>>(
      `${this.api}/usuarios/${dpi}/vehiculos/parqueo`
    ).pipe(map(r => r.body.vehiculosParqueados || []));
  }
}
