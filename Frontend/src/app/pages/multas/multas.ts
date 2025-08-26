import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FinesService, Multa } from '../../services/fines';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multas.html',
  styleUrls: ['./multas.css']
})
export class Multas implements OnInit {
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  multas = signal<Multa[]>([]);
  trackByMulta = (_: number, m: Multa) => m.id_multa;
  // KPIs
  totalMultas = computed(() => this.multas().length);
  totalDeuda = computed(
    () => this.multas()
            .filter(m => m.estado === 'Pendiente')
            .reduce((acc, m) => acc + (Number(m.monto) || 0), 0)
  );

  constructor(
    private fines: FinesService,
    private session: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const dpi = this.session.getDpi();
    if (!dpi) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.cargar(dpi);
  }

  private cargar(dpi: string) {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.fines.getMultas(dpi).subscribe({
      next: (list) => {
        // Normaliza por si backend usa nombres distintos de estado
        const normalize = (s: string) => {
          const x = (s || '').toLowerCase();
          if (x.includes('pend')) return 'Pendiente';
          if (x.includes('apel')) return 'Apelada';
          if (x.includes('pag')) return 'Pagada';
          if (x.includes('anul')) return 'Anulada';
          return 'Pendiente';
        };
        this.multas.set(list.map(m => ({ ...m, estado: normalize(m.estado) as any })));
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudo cargar el listado de multas.');
        this.loading.set(false);
      }
    });
  }

  pagar(m: Multa) {
    if (m.estado !== 'Pendiente') return;
    const dpi = this.session.getDpi();
    if (!dpi) return;

    if (!confirm(`¿Pagar la multa #${m.id_multa} por Q${m.monto}?`)) return;

    this.fines.pagarMulta(dpi, m.id_multa).subscribe({
      next: (res) => {
        alert(res.body?.mensaje || 'Pago registrado.');
        // Actualiza en memoria
        this.multas.update(items =>
          items.map(x => x.id_multa === m.id_multa ? { ...x, estado: 'Pagada' } : x)
        );
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo registrar el pago.');
      }
    });
  }

  apelar(m: Multa) {
    if (m.estado !== 'Pendiente') return;
    const dpi = this.session.getDpi();
    if (!dpi) return;

    const motivo = prompt('Describe el motivo de la apelación:');
    if (motivo == null) return;

    this.fines.apelarMulta(dpi, m.id_multa).subscribe({
      next: (res) => {
        alert(res.body?.mensaje || 'Apelación enviada.');
        this.multas.update(items =>
          items.map(x => x.id_multa === m.id_multa ? { ...x, estado: 'Apelada' } : x)
        );
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo enviar la apelación.');
      }
    });
  }

  // helpers UI
  estadoClass(m: Multa) {
    switch (m.estado) {
      case 'Pendiente': return 'pending';
      case 'Pagada': return 'completed';
      case 'Apelada': return 'process';
      case 'Anulada': return 'cancelled';
      default: return 'pending';
    }
  }

  // Para formatear fecha si viene tipo 'YYYY-MM-DD HH:mm:ss'
  fechaBonita(s: string) {
    // Si ya es ISO, Date la entiende; si no, reemplazamos espacio por 'T'
    const iso = s.includes('T') ? s : s.replace(' ', 'T');
    const d = new Date(iso);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString(); // puedes ajustar a es-GT si deseas
  }

  tituloVehiculo(m: Multa) {
    const p1 = m.marca || '';
    const p2 = m.modelo || '';
    const title = `${p1} ${p2}`.trim();
    return title || m.placa;
  }
}
