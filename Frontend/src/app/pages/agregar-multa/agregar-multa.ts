import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';
import { MultasService, TIPOS_MULTA_MAP } from '../../services/multas';
import { SessionService } from '../../services/session';

type EstadoMulta = 'pendiente' | 'anulada' | 'correcta';

interface Evidence {
  name: string;
  dataUrl: string | ArrayBuffer | null;
}
interface Multa {
  id: string;
  tipo: string;
  vehiculo: string;
  monto: number;
  fecha: string;       
  ubicacion?: string;
  motivo?: string;
  evidencias: Evidence[];
  estado: EstadoMulta;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-agregar-multa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-multa.html',
  styleUrls: ['./agregar-multa.css'],
})
export class AgregarMultaComponent implements OnInit {
  form!: FormGroup;
  motivoCount = 0;

  evidencias: Evidence[] = [];
  uploaderDragover = false;

  multas: Multa[] = [];         
  editId: string | null = null; 

 
  showAnularModal = false;
  anularTargetId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private multasSvc: MultasService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['', Validators.required],      
      vehiculo: ['', Validators.required],  
      monto: [null, [Validators.required, Validators.min(0)]],
      fecha: [this.nowLocal(), Validators.required],
      ubicacion: [''],
      motivo: [''],
    });

   
    this.form.get('motivo')!.valueChanges.subscribe((v: string) => {
      const max = 280;
      if (v && v.length > max) {
        this.form.get('motivo')!.setValue(v.slice(0, max), { emitEvent: false });
        this.motivoCount = max;
      } else {
        this.motivoCount = v ? v.length : 0;
      }
    });

   
    const dpi = this.session.getDpi();
    if (dpi) this.loadMultasByDpi(dpi);
  }

  /** ===== Crear / Editar ===== */
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Completa los campos obligatorios (*).');
      return;
    }
    const v = this.form.value;
    const now = new Date().toISOString();

    if (this.editId) {
     
      const idNum = Number(this.editId);
      this.multasSvc.actualizarMulta(idNum, {
        monto: Number(v.monto || 0),
        motivo: (v.motivo || '').trim()
      }).subscribe({
        next: () => {
          const idx = this.multas.findIndex(m => m.id === this.editId);
          if (idx >= 0) {
            const prev = this.multas[idx];
            this.multas[idx] = {
              ...prev,
              tipo: (v.tipo || '').trim(),
              vehiculo: (v.vehiculo || '').trim().toUpperCase(),
              monto: Number(v.monto || 0),
              fecha: v.fecha,
              ubicacion: (v.ubicacion || '').trim(),
              motivo: (v.motivo || '').trim(),
              evidencias: [...this.evidencias],
              updatedAt: now,
            };
          }
          alert('Cambios guardados.');
          this.resetForm();
        },
        error: err => {
          console.error(err);
          alert('❌ No se pudo actualizar la multa.');
        }
      });
    } else {
     
      const tipoTxt: string = (v.tipo || '').trim();
      if (!TIPOS_MULTA_MAP[tipoTxt as keyof typeof TIPOS_MULTA_MAP]) {
        alert('Selecciona un "Tipo de infracción" válido del listado.');
        return;
      }

      this.multasSvc.crearMulta({
        placa: (v.vehiculo || '').trim().toUpperCase(),
        tipo: tipoTxt as any,
        monto: Number(v.monto || 0),
        fechaISO: v.fecha,
        ubicacion: (v.ubicacion || '').trim(),
        motivo: (v.motivo || '').trim()
      }).subscribe({
        next: (res) => {
         
          const nueva: Multa = {
            id: String(res.body?.insertId || this.generateId()),
            tipo: tipoTxt,
            vehiculo: (v.vehiculo || '').trim().toUpperCase(),
            monto: Number(v.monto || 0),
            fecha: v.fecha,
            ubicacion: (v.ubicacion || '').trim(),
            motivo: (v.motivo || '').trim(),
            evidencias: [...this.evidencias],
            estado: 'pendiente',
            createdAt: now,
            updatedAt: now,
          };
          this.multas.unshift(nueva);
          alert(res.body?.mensaje || 'Multa guardada correctamente.');
          this.resetForm();
        },
        error: err => {
          console.error(err);
          alert('❌ No se pudo guardar la multa.');
        }
      });
    }
  }

  /** ===== Cargar historial del usuario (tabla) ===== */
  private loadMultasByDpi(dpi: string) {
    this.multasSvc.listarPorDpi(dpi).subscribe({
      next: rows => {
        this.multas = rows.map(r => ({
          id: String(r.id_multa_sancion),
          tipo: r.tipo_descripcion || '—',
          vehiculo: r.placa_vehiculo,
          monto: Number(r.monto || 0),
          fecha: this.mysqlToLocalInput(r.fecha),
          ubicacion: undefined,
          motivo: r.descripcion || '',
          evidencias: [],
          estado: r.anulada ? 'anulada' : (r.pagada ? 'correcta' : 'pendiente'),
          createdAt: r.fecha,
          updatedAt: r.fecha,
        }));
      },
      error: err => console.error(err)
    });
  }

  /** ===== Evidencias (uploader) solo UI ===== */
  onUploaderClick(input: HTMLInputElement) { input.click(); }
  onDragOver(e: DragEvent) { e.preventDefault(); this.uploaderDragover = true; }
  onDragLeave() { this.uploaderDragover = false; }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.uploaderDragover = false;
    const files = e.dataTransfer?.files;
    if (files && files.length) this.handleFiles(files);
  }
  onFileInputChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length) this.handleFiles(input.files);
  }
  private handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList || []);
    const remaining = Math.max(0, 6 - this.evidencias.length);
    files.slice(0, remaining).forEach(f => {
      if (!f.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => this.evidencias.push({ name: f.name, dataUrl: reader.result });
      reader.readAsDataURL(f);
    });
  }
  removeEvidence(idx: number) { this.evidencias.splice(idx, 1); }

  /** ===== Acciones tabla ===== */
  startEdit(m: Multa) {
    this.form.patchValue({
      tipo: m.tipo,
      vehiculo: m.vehiculo,
      monto: m.monto,
      fecha: m.fecha,
      ubicacion: m.ubicacion || '',
      motivo: m.motivo || '',
    });
    this.evidencias = [...m.evidencias];
    this.editId = m.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAnular(id: string) {
    this.anularTargetId = id;
    this.showAnularModal = true;
  }

  confirmAnular() {
    if (!this.anularTargetId) return;
    const idNum = Number(this.anularTargetId);

    this.multasSvc.anularMulta(idNum).subscribe({
      next: () => {
        const idx = this.multas.findIndex(m => m.id === this.anularTargetId);
        if (idx >= 0) {
          this.multas[idx] = {
            ...this.multas[idx],
            estado: 'anulada',
            updatedAt: new Date().toISOString(),
          };
        }
        this.closeModal();
        alert('Multa anulada.');
      },
      error: err => {
        console.error(err);
        alert('❌ No se pudo anular la multa.');
      }
    });
  }

  closeModal() { this.showAnularModal = false; this.anularTargetId = null; }

  ver(m: Multa) {
    const info =
`ID: #${m.id}
Tipo: ${m.tipo}
Vehículo: ${m.vehiculo}
Monto: Q ${m.monto.toFixed(2)}
Fecha/Hora: ${this.formatDate(m.fecha)}
Ubicación: ${m.ubicacion || '-'}
Motivo: ${m.motivo || '-'}
Evidencias: ${m.evidencias.length}`;
    alert(info);
  }

  /** ===== Helpers ===== */
  resetForm() {
    this.form.reset({ fecha: this.nowLocal() });
    this.motivoCount = 0;
    this.evidencias = [];
    this.editId = null;
  }
  get isEditing() { return !!this.editId; }

  formatDate(iso: string) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }
  statusClass(s: EstadoMulta) {
    return {
      'status-badge': true,
      'status-pendiente': s === 'pendiente',
      'status-anulada': s === 'anulada',
      'status-correcta': s === 'correcta',
    };
  }
  trackByMultaId = (_: number, m: Multa) => m.id;
  trackByEvidence = (i: number, _ev: Evidence) => i;

  private generateId() { return Math.floor(Math.random() * 900000 + 100000).toString(); }

  /** datetime-local default (YYYY-MM-DDTHH:mm) */
  private nowLocal() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }

  /** MySQL 'YYYY-MM-DD HH:mm:ss' -> input datetime-local */
  private mysqlToLocalInput(mysql: string) {
    if (!mysql) return '';
    return mysql.replace(' ', 'T').slice(0,16);
  }
}
