import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserDataService, VehiculoParqueado } from '../../services/user-data';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  // UI / estado
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);

  // Datos de sesión
  nombre = signal<string>('Usuario');
  dpi = signal<string>('');

  // KPIs
  totalInvertido = signal<number>(0);
  totalVehiculos = signal<number>(0);
  totalMultas = signal<number>(0);

  // Tabla de parqueos actuales
  parqueos = signal<VehiculoParqueado[]>([]);

  // Texto de bienvenida
  bienvenido = computed(() => `Bienvenido ${this.nombre()}! 👋`);

  constructor(
    private router: Router,
    private session: SessionService,
    private api: UserDataService,
  ) {}

  ngOnInit(): void {
    const dpi = this.session.getDpi();
    const user = this.session.getUser();

    if (!dpi) {
      // si no hay sesión, manda al login
      this.router.navigateByUrl('/login');
      return;
    }

    this.dpi.set(dpi);
    this.nombre.set(user?.nombre || 'Usuario');

    this.cargarKPIsYParqueos(dpi);
  }

  private cargarKPIsYParqueos(dpi: string) {
    this.loading.set(true);
    this.errorMsg.set(null);

    // Disparamos en paralelo
    Promise.all([
      this.api.getVehiculosCount(dpi).toPromise(),
      this.api.getMultasTotal(dpi).toPromise(),
      this.api.getVehiculosParqueados(dpi).toPromise(),
    ])
      .then(([vehCount, multasTot, parqueos]) => {
        console.log('Total de vehículos:', vehCount?.totalVehiculos);
        console.log('Total de multas:', multasTot?.totalMultas);
        this.totalVehiculos.set(vehCount?.totalVehiculos ?? 0);
        this.totalMultas.set(multasTot?.totalMultas ?? 0);
        this.parqueos.set(parqueos ?? []);
      })
      .catch((err) => {
        console.error(err);
        this.errorMsg.set('No se pudo cargar la información.');
      })
      .finally(() => this.loading.set(false));
  }

  // Helpers para mostrar campos opcionales (precio/tipo)
  precioDe(v: VehiculoParqueado): string {
    return typeof v.precio === 'number' ? `Q${v.precio.toFixed(2)}` : '—';
  }
  tipoDe(v: VehiculoParqueado): string {
    return v.tipo || '—';
  }
  estatusDe(_v: VehiculoParqueado): string {
    // Como vienen de ingresos abiertos, están "Activos"
    return 'Activo';
  }
}
