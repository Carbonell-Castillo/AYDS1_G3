// src/app/services/session.ts
import { Injectable } from '@angular/core';

type User = { usuario?: string; dpi?: string; nombre?: string; id_parqueo?: string; [k: string]: any };

@Injectable({ providedIn: 'root' })
export class SessionService {
  private LS_KEY = 'easypark.user';


  setUser(user: User) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(user));
    const dpi = user?.dpi ?? user?.usuario ?? null ;
    if (dpi) {
      sessionStorage.setItem('dpi', dpi);
      this.setCookie('dpi', dpi, 7);
    }
    
  }

  getUser(): User | null {
    const raw = localStorage.getItem(this.LS_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  getDpi(): string | null {
    const user = this.getUser();
    return user?.dpi ?? user?.usuario ?? sessionStorage.getItem('dpi') ?? this.getCookie('dpi');
  }

  getIdParqueo(): string | null {
    const user = this.getUser();
    return user?.id_parqueo ?? sessionStorage.getItem('id_parqueo') ?? this.getCookie('id_parqueo');
  }

  clear() {
    localStorage.removeItem(this.LS_KEY);
    sessionStorage.removeItem('dpi');
    sessionStorage.removeItem('idParqueo');
    this.deleteCookie('dpi');
    this.deleteCookie('idParqueo');
  }


  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
  }
  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const parts = document.cookie.split(';');
    for (let c of parts) {
      c = c.trim();
      if (c.startsWith(nameEQ)) return decodeURIComponent(c.substring(nameEQ.length));
    }
    return null;
  }
  deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  }
}
