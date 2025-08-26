import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ReportsService, Periodo, SancionRow, MovimientoRow, PagoUsuarioRow } from '../../services/reports';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit, AfterViewInit {
  @ViewChild('occChartCanvas') occChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  periodo: Periodo = 'diaria';
  fechaInicio = '';                      // ISO date (YYYY-MM-DD)
  dias: { label: string; iso: string; occ: number; }[] = [];

  // Tablas
  sanciones: SancionRow[] = [];
  movimientos: MovimientoRow[] = [];
  pagosUsuarios: PagoUsuarioRow[] = [];

  // Filtros
  buscaSancion = '';
  rolSancion: ''|'Admin'|'Usuario' = '';
  sancionDesde = '';
  sancionHasta = '';

  buscaMov = '';
  movDesde = '';
  movHasta = '';

  buscaPago = '';

  constructor(private reports: ReportsService) {}

  // ---- KPI (calculados en vivo) ----
  get kpiRecaudo() {
    // si deseas KPI real de ingresos: usa reports.getRecaudoMensual('2025-08')
    const t = this.pagosUsuarios.reduce((s, r) => s + (r.total || 0), 0);
    return this.fmtQ(t);
  }
  get kpiOcupacion() {
    if (!this.dias.length) return '0%';
    const avg = this.dias.reduce((s, d) => s + d.occ, 0) / this.dias.length;
    return this.fmtPct(Math.round(avg));
  }
  get kpiMultas() { return this.sanciones.length; }

  // ---- Computados UI ----
  get sancionesFiltradas() {
    const q = (this.buscaSancion || '').toLowerCase();
    const rol = this.rolSancion;
    const d1 = this.parseDate(this.sancionDesde);
    const d2 = this.parseDate(this.sancionHasta, true);

    return this.sanciones.filter(r => {
      const hit = r.placa.toLowerCase().includes(q) || (r.motivo || '').toLowerCase().includes(q);
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
    // fechaInicio: hoy - 13 días
    const hoy = new Date();
    const start = new Date(hoy); start.setDate(hoy.getDate() - 13);
    this.fechaInicio = this.toISODate(start);

    // Cargar todo
    this.loadOcupacion();
    this.loadSanciones();
    this.loadMovimientos();
    this.loadPagosUsuarios();
  }

  ngAfterViewInit(): void { this.renderChart(); }

  // ---- Llamadas API ----
  loadOcupacion() {
    this.reports.getOcupacion(this.periodo, this.fechaInicio).subscribe({
      next: rows => {
        this.dias = rows.map(r => ({
          label: new Date(r.fecha).toLocaleDateString(),
          iso: r.fecha,
          occ: Math.max(0, Math.min(100, Math.round(r.porcentaje)))
        }));
        this.renderChart();
      },
      error: err => { console.error(err); this.dias = []; this.renderChart(); }
    });
  }

  loadSanciones() {
    this.reports.getSanciones({
      q: this.buscaSancion || undefined,
      desde: this.sancionDesde || undefined,
      hasta: this.sancionHasta || undefined,
      rol: this.rolSancion || undefined
    }).subscribe({
      next: rows => { this.sanciones = rows || []; },
      error: err => { console.error(err); this.sanciones = []; }
    });
  }

  loadMovimientos() {
    this.reports.getMovimientos({
      q: this.buscaMov || undefined,
      desde: this.movDesde || undefined,
      hasta: this.movHasta || undefined
    }).subscribe({
      next: rows => { this.movimientos = rows || []; },
      error: err => { console.error(err); this.movimientos = []; }
    });
  }

  loadPagosUsuarios() {
    this.reports.getPagosUsuarios({}).subscribe({
      next: rows => { this.pagosUsuarios = rows || []; },
      error: err => { console.error(err); this.pagosUsuarios = []; }
    });
  }

  // ---- Chart handlers ----
  onAplicarChart() { this.loadOcupacion(); }
  onPeriodoChange() { this.loadOcupacion(); }

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
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v:any)=> v + '%' } } },
        plugins: { legend: { display: false } }
      }
    };

    if (this.chart) this.chart.destroy();
    if (this.occChartCanvas) this.chart = new Chart(this.occChartCanvas.nativeElement, cfg);
  }

  private buildData(periodo: Periodo, startISO?: string) {
    if (periodo === 'diaria') {
      const from = startISO ? this.parseDate(startISO) : null;
      const view = this.dias.filter(d => this.inRange(this.parseDate(d.iso), from, null));
      return { labels: view.map(d => d.label), data: view.map(d => d.occ) };
    } else {
      // Semanal: promedios por semana (simple)
      if (!this.dias.length) return { labels: [], data: [] };
      const weeks: { [wk:string]: number[] } = {};
      this.dias.forEach(d => {
        const dt = new Date(d.iso);
        const wk = this.weekKey(dt);
        (weeks[wk] ||= []).push(d.occ);
      });
      const labels = Object.keys(weeks);
      const data = labels.map(k => Math.round(weeks[k].reduce((s,n)=>s+n,0)/weeks[k].length));
      return { labels, data };
    }
  }

  // ---- Acciones ----
  exportCSV() {
    const rows: (string|number)[][] = [['Usuario','DPI','Multas','Pagadas','Pendientes','Monto Total']];
    this.pagosFiltrados.forEach(r => rows.push([r.usuario, r.dpi, r.multas, r.pagadas, r.pendientes, r.total.toFixed(2)]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pagos_multas_usuarios.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  exportPDF(ev: Event) { ev.preventDefault(); window.print(); }

  // ---- Utils ----
  fmtQ(n: number) { return 'Q ' + Number(n || 0).toFixed(2); }
  fmtPct(n: number) { return Number(n || 0).toFixed(0) + '%'; }
  toISODate(d: Date) { return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
  parseDate(s?: string | null, endOfDay = false): Date | null { if (!s) return null; return new Date(s + (endOfDay ? 'T23:59:59' : 'T00:00:00')); }
  inRange(d: Date | null, from: Date | null, to: Date | null) { if (!d) return false; return (!from || d >= from) && (!to || d <= to); }
  weekKey(d: Date) { const onejan = new Date(d.getFullYear(),0,1); const diff = d.getTime() - onejan.getTime(); const wk = Math.ceil((((diff/86400000)+onejan.getDay()+1)/7)); return `Sem ${wk}`; }

  // trackBy
  trackBySancion = (_: number, s: SancionRow) => s.id;
  trackByMov     = (_: number, m: MovimientoRow) => m.id;
  trackByPago    = (_: number, p: PagoUsuarioRow) => p.dpi;
}
