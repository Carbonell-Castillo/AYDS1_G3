import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
} from '@angular/forms';

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
  fecha: string;        // value de <input type="datetime-local">
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

  multas: Multa[] = [];          // ← Estado en memoria
  editId: string | null = null;  // ← null = creando; string = editando

  // Modal anular
  showAnularModal = false;
  anularTargetId: string | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['', Validators.required],
      vehiculo: ['', Validators.required],
      monto: [null, [Validators.required]],
      fecha: ['', Validators.required],
      ubicacion: [''],
      motivo: [''],
    });

    // Límite y contador del motivo (280)
    this.form.get('motivo')!.valueChanges.subscribe((v: string) => {
      const max = 280;
      if (v && v.length > max) {
        this.form.get('motivo')!.setValue(v.slice(0, max), { emitEvent: false });
        this.motivoCount = max;
      } else {
        this.motivoCount = v ? v.length : 0;
      }
    });
  }

  // ===== Submit (crear / actualizar) =====
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Completa los campos obligatorios (*).');
      return;
    }
    const v = this.form.value;
    const now = new Date().toISOString();

    if (this.editId) {
      // Actualizar
      const idx = this.multas.findIndex(m => m.id === this.editId);
      if (idx >= 0) {
        const prev = this.multas[idx];
        this.multas[idx] = {
          ...prev,
          tipo: (v.tipo || '').trim(),
          vehiculo: (v.vehiculo || '').trim(),
          monto: Number(v.monto || 0),
          fecha: v.fecha,
          ubicacion: (v.ubicacion || '').trim(),
          motivo: (v.motivo || '').trim(),
          evidencias: [...this.evidencias],
          updatedAt: now,
        };
        alert('Cambios guardados.');
      }
    } else {
      // Crear
      const nueva: Multa = {
        id: this.generateId(),
        tipo: (v.tipo || '').trim(),
        vehiculo: (v.vehiculo || '').trim(),
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
      alert('Multa guardada correctamente.');
    }

    this.resetForm();
  }

  // ===== Evidencias (uploader) =====
  onUploaderClick(input: HTMLInputElement) {
    input.click();
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.uploaderDragover = true;
  }
  onDragLeave() {
    this.uploaderDragover = false;
  }
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
      reader.onload = () => {
        this.evidencias.push({ name: f.name, dataUrl: reader.result });
      };
      reader.readAsDataURL(f);
    });
  }

  removeEvidence(idx: number) {
    this.evidencias.splice(idx, 1);
  }

  // ===== Tabla acciones =====
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
    const idx = this.multas.findIndex(m => m.id === this.anularTargetId);
    if (idx >= 0) {
      this.multas[idx] = {
        ...this.multas[idx],
        estado: 'anulada',
        updatedAt: new Date().toISOString(),
      };
    }
    this.closeModal();
  }

  closeModal() {
    this.showAnularModal = false;
    this.anularTargetId = null;
  }

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

  // ===== Helpers =====
  resetForm() {
    this.form.reset();
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
  
// Para la tabla de multas
trackByMultaId = (_: number, m: Multa) => m.id;

// Para el grid de evidencias (usa el índice; simple y seguro)
trackByEvidence = (i: number, _ev: Evidence) => i;


  private generateId() {
    return Math.floor(Math.random() * 900000 + 100000).toString();
  }
}
