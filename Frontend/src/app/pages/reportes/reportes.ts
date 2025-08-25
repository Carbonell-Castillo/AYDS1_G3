import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

type Periodo = 'diaria' | 'semanal';

interface DiaOcc { label: string; iso: string; occ: number; }
interface Sancion {
  id: string; fecha: string; placa: string; tipo: string; motivo: string;
  rol: 'Admin'|'Usuario'; estado: 'Pendiente'|'Pagada'|'Anulada'|string;
}
interface Movimiento {
  id: number; fecha: string; placa: string; evento: 'Entrada'|'Salida'; parqueo: string;
}
interface PagoUsuario {
  usuario: string; dpi: string; multas: number; pagadas: number; pendientes: number; total: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit, AfterViewInit {
  // ---- Chart ----
  @ViewChild('occChartCanvas') occChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  periodo: Periodo = 'diaria';
  fechaInicio = '';

  dias: DiaOcc[] = [];

  // ---- Sanciones ----
  sanciones: Sancion[] = [
    {id:'S1021', fecha:'2025-08-20', placa:'P-123ABC', tipo:'Mal estacionado', motivo:'Fuera de línea',   rol:'Admin',  estado:'Pendiente'},
    {id:'S1022', fecha:'2025-08-20', placa:'M-789XYZ', tipo:'Excedió tiempo', motivo:'15 min extra',      rol:'Usuario',estado:'Pagada'},
    {id:'S1023', fecha:'2025-08-21', placa:'P-456DEF', tipo:'Área exclusiva',  motivo:'PMR',               rol:'Admin',  estado:'Pendiente'},
    {id:'S1024', fecha:'2025-08-22', placa:'P-123ABC', tipo:'Bloqueo rampa',   motivo:'Salida bodega',     rol:'Admin',  estado:'Pagada'},
    {id:'S1025', fecha:'2025-08-23', placa:'M-321AAA', tipo:'Mal estacionado', motivo:'Línea amarilla',    rol:'Usuario',estado:'Pendiente'},
  ];
  buscaSancion = '';
  rolSancion: ''|'Admin'|'Usuario' = '';
  sancionDesde = '';
  sancionHasta = '';

  // ---- Movimientos ----
  movimientos: Movimiento[] = [
    {id:1, fecha:'2025-08-22T08:12:00', placa:'P-123ABC', evento:'Entrada', parqueo:'N2 · B-14'},
    {id:2, fecha:'2025-08-22T11:35:00', placa:'P-123ABC', evento:'Salida',  parqueo:'N2 · B-14'},
    {id:3, fecha:'2025-08-23T09:02:00', placa:'M-789XYZ', evento:'Entrada', parqueo:'N1 · M-03'},
    {id:4, fecha:'2025-08-23T10:25:00', placa:'P-456DEF', evento:'Entrada', parqueo:'N3 · C-21'},
    {id:5, fecha:'2025-08-23T13:40:00', placa:'M-789XYZ', evento:'Salida',  parqueo:'N1 · M-03'},
  ];
  buscaMov = '';
  movDesde = '';
  movHasta = '';

  // ---- Pagos ----
  pagosUsuarios: PagoUsuario[] = [
    {usuario:'Carlos Pérez',  dpi:'1234567890101', multas:4, pagadas:3, pendientes:1, total:350.00},
    {usuario:'Ana López',     dpi:'2234567890102', multas:2, pagadas:2, pendientes:0, total:150.00},
    {usuario:'Bruce Castillo',dpi:'3234567890103', multas:3, pagadas:1, pendientes:2, total:275.00},
  ];
  buscaPago = '';

  // ---- KPI (calculados en vivo) ----
  get kpiRecaudo() {
    const t = this.pagosUsuarios.reduce((s, r) => s + (r.total || 0), 0);
    return this.fmtQ(t);
  }
  get kpiOcupacion() {
    if (!this.dias.length) return '0%';
    const avg = this.dias.reduce((s, d) => s + d.occ, 0) / this.dias.length;
    return this.fmtPct(Math.round(avg));
  }
  get kpiMultas() { return this.sanciones.length; }

  // ---- Filtros computados ----
  get sancionesFiltradas() {
    const q = (this.buscaSancion || '').toLowerCase();
    const rol = this.rolSancion;
    const d1 = this.parseDate(this.sancionDesde);
    const d2 = this.parseDate(this.sancionHasta, true);

    return this.sanciones.filter(r => {
      const hit = r.placa.toLowerCase().includes(q) || r.motivo.toLowerCase().includes(q);
      const okRol = !rol || r.rol === rol;
      const d = this.parseDate(r.fecha);
      return hit && okRol && this.inRange(d, d1, d2);
    });
  }

  get movimientosFiltrados() {
    const q = (this.buscaMov || '').toLowerCase();
    const d1 = this.movDesde ? new Date(this.movDesde + 'T00:00:00') : null;
    const d2 = this.movHasta ? new Date(this.movHasta + 'T23:59:59') : null;
    return this.movimientos.filter(r => {
      const d = new Date(r.fecha);
      return r.placa.toLowerCase().includes(q) && this.inRange(d, d1, d2);
    });
  }

  get pagosFiltrados() {
    const q = (this.buscaPago || '').toLowerCase();
    return this.pagosUsuarios.filter(r => r.usuario.toLowerCase().includes(q) || r.dpi.includes(q));
  }

  // ---- Lifecycle ----
  ngOnInit(): void {
    // Genera últimos 14 días con ocupación aleatoria
    const hoy = new Date();
    this.dias = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - (13 - i));
      return { label: d.toLocaleDateString(), iso: this.toISODate(d), occ: 40 + Math.round(Math.random() * 55) };
    });
    this.fechaInicio = this.dias[0]?.iso ?? this.toISODate(new Date());
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  // ---- Chart handlers ----
  onAplicarChart() { this.renderChart(); }
  onPeriodoChange() { this.renderChart(); }

  private renderChart() {
    const ds = this.buildData(this.periodo, this.fechaInicio);

    const cfg: any = {
      type: this.periodo === 'diaria' ? 'line' : 'bar',
      data: {
        labels: ds.labels,
        datasets: [{
          label: 'Ocupación',
          data: ds.data,
          borderColor: '#3C91E6',
          backgroundColor: 'rgba(60,145,230,.15)',
          tension: .35,
          borderWidth: 2,
          fill: this.periodo === 'diaria'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: (v: any) => v + '%' } }
        },
        plugins: { legend: { display: false } }
      }
    };

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.occChartCanvas.nativeElement, cfg);
  }

  private buildData(periodo: Periodo, startISO?: string) {
    if (periodo === 'diaria') {
      const from = startISO ? this.parseDate(startISO) : null;
      const view = this.dias.filter(d => this.inRange(this.parseDate(d.iso), from, null));
      return {
        labels: view.map(d => d.label),
        data: view.map(d => d.occ)
      };
    } else {
      // Semanal (dos últimos bloques de 7 días como demo)
      const chunks = [this.dias.slice(0, 7), this.dias.slice(7, 14)];
      const labels = ['Semana -1', 'Semana actual'];
      const data = chunks.map(w => Math.round(w.reduce((s, r) => s + r.occ, 0) / w.length));
      return { labels, data };
    }
  }

  // ---- Acciones ----
  exportCSV() {
    const rows: (string|number)[][] = [
      ['Usuario','DPI','Multas','Pagadas','Pendientes','Monto Total']
    ];
    this.pagosFiltrados.forEach(r =>
      rows.push([r.usuario, r.dpi, r.multas, r.pagadas, r.pendientes, r.total.toFixed(2)])
    );
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pagos_multas_usuarios.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportPDF(ev: Event) {
    ev.preventDefault();
    window.print();
  }

  // ---- Utils ----
  fmtQ(n: number) { return 'Q ' + Number(n || 0).toFixed(2); }
  fmtPct(n: number) { return Number(n || 0).toFixed(0) + '%'; }
  toISODate(d: Date) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  parseDate(s?: string | null, endOfDay = false): Date | null {
    if (!s) return null;
    return endOfDay ? new Date(s + 'T23:59:59') : new Date(s + 'T00:00:00');
  }
  inRange(d: Date | null, from: Date | null, to: Date | null) {
    if (!d) return false;
    return (!from || d >= from) && (!to || d <= to);
  }

  // trackBy
  trackBySancion = (_: number, s: Sancion) => s.id;
  trackByMov     = (_: number, m: Movimiento) => m.id;
  trackByPago    = (_: number, p: PagoUsuario) => p.dpi;
}
