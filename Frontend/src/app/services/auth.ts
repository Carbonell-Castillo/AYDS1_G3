import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { error: boolean; status: number; body: T; }
interface LoginResult { autenticado: boolean; user?: any; }
interface UploadResult { path: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}


  register(payload: {
    dpi: string;
    password: string;
    nombre: string;
    apellido: string;
    genero: 'M'|'F'|'X';
    email: string;
    telefono: string;
    licencia_path: string | null;
  }) {
    return this.http.post<ApiResponse<{ mensaje: string }>>(
      `${this.api}/usuarios`, payload
    );
  }

  login(emailOrDpi: string, password: string) {
    alert('Iniciando sesión...');


    console.log(`Iniciando sesión con ${emailOrDpi}`);
    console.log(`Contraseña: ${password}`);
    console.log(`url: ${this.api}/usuarios/auth/login`);

    return this.http.post<ApiResponse<LoginResult>>(
      `${this.api}/usuarios/auth/login`,
      { email: emailOrDpi, password }
    );

  }
}
