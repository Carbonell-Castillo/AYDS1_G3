import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map } from 'rxjs';

interface CreateUserBody {
  dpi: string;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

interface ApiResponse<T = any> {
  error: boolean;
  status: number;
  body: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/usuarios`;

//Registro de usuario
  createUser(payload: CreateUserBody): Observable<any> {
    return this.http.post<ApiResponse>(this.base, payload).pipe(
      map(res => res.body)
    );
  }
}
