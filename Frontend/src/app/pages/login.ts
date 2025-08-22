import { Component, computed, effect, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  FormGroup,
} from '@angular/forms';
import { startWith } from 'rxjs/internal/operators/startWith';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  // UI: panel derecho (true = Crear cuenta, false = Iniciar sesión)
  rightPanel = signal<boolean>(true);

  // Stepper
  current = signal<number>(0);
  readonly totalSteps = 4;
  progressPct = computed(() => (this.current() / (this.totalSteps - 1)) * 100);

  // Formularios
  signupForm!: FormGroup;
  signinForm!: FormGroup;

  // Fuerza de contraseña
  strength = signal<'weak' | 'ok' | 'strong' | ''>('');

  constructor(private fb: FormBuilder, private destroyRef: DestroyRef) {
    // === Inicialización AQUÍ (evita el error de TS) ===
    this.signupForm = this.fb.group(
      {
        dpi: ['', [Validators.required]],
        nombre: ['', [Validators.required]],
        apellido: ['', [Validators.required]],
        genero: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telefono: [
          '',
          [Validators.required, Validators.pattern(/^[+]?[\d\s()-]{8,}$/)],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirm: ['', [Validators.required]],
        licencia: [null as File | null],
      },
      { validators: [this.passwordsIguales()] }
    );

    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

  // 🔧 Suscripción reactiva al password (en vez de effect)
  const passCtrl = this.signupForm.get('password')!;
  const confCtrl = this.signupForm.get('confirm')!;

  passCtrl.valueChanges
    .pipe(startWith(passCtrl.value ?? ''), takeUntilDestroyed(this.destroyRef))
    .subscribe((v) => {
      this.updateStrength((v as string) || '');
      // Revalida confirm para ocultar/mostrar el error al volar
      confCtrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  // === Navegación de pasos ===
  back() {
    if (this.current() > 0) this.current.set(this.current() - 1);
  }
  next() {
    if (this.validateStep(this.current())) {
      this.current.set(this.current() + 1);
    }
  }

  // Validación por paso (marca touched y verifica)
  validateStep(step: number): boolean {
    const markTouched = (ctrl: AbstractControl | null) => ctrl?.markAsTouched();
    const get = (n: string) => this.signupForm.get(n);

    if (step === 0) ['dpi', 'nombre', 'apellido', 'genero'].forEach(n => markTouched(get(n)));
    if (step === 1) ['email', 'telefono'].forEach(n => markTouched(get(n)));
    if (step === 2) ['password', 'confirm'].forEach(n => markTouched(get(n)));
    if (step === 3) {
      // Si quieres exigir archivo, descomenta:
      // markTouched(get('licencia'));
    }

    this.signupForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    const stepControls: Record<number, string[]> = {
      0: ['dpi', 'nombre', 'apellido', 'genero'],
      1: ['email', 'telefono'],
      2: ['password', 'confirm'],
      3: [], // agrega 'licencia' si decides que sea obligatoria
    };
    const names = stepControls[step] ?? [];
    return names.every(n => this.signupForm.get(n)?.valid);
  }

  // Submit de registro
  submitSignup() {
    const allOk =
      this.validateStep(0) &&
      this.validateStep(1) &&
      this.validateStep(2) &&
      this.signupForm.valid;

    if (!allOk) return;

    console.log('Signup payload:', this.signupForm.value);
    alert('✅ Cuenta creada (simulación).');
    this.signupForm.reset();
    this.current.set(0);
    this.strength.set('');
  }

  // Submit de login
  submitSignin() {
    this.signinForm.markAllAsTouched();
    if (!this.signinForm.valid) return;

    console.log('Signin payload:', this.signinForm.value);
    alert('🔐 Inicio de sesión (simulación).');
  }

  // === Fuerza de contraseña ===
  private updateStrength(v: string) {
    if (!v) {
      this.strength.set('');
      return;
    }
    const rules = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
    const score = rules.reduce((a, r) => a + (r.test(v) ? 1 : 0), 0);
    if (score <= 2) this.strength.set('weak');
    else if (score <= 4) this.strength.set('ok');
    else this.strength.set('strong');
  }

  // === Validador de confirmación ===
  private passwordsIguales() {
    return (ctrl: AbstractControl) => {
      const pass = ctrl.get('password')?.value ?? '';
      const conf = ctrl.get('confirm')?.value ?? '';
      return pass && conf && pass !== conf ? { confirmNoCoincide: true } : null;
    };
  }

  // === Helpers de UI ===
  setRightPanel(v: boolean) {
    this.rightPanel.set(v);
  }

  isInvalid(name: string) {
    const c = this.signupForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }
  hasGroupError(key: string) {
    return !!(this.signupForm.errors && this.signupForm.errors[key]);
  }

  // === Dropzone / archivo ===
  onDropzoneClick(fileInput: HTMLInputElement) {
    fileInput.click();
  }
  onDragOver(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.background = '#ffeceb';
  }
  onDragLeave(e: DragEvent) {
    const el = e.currentTarget as HTMLElement;
    el.style.background = el.classList.contains('success') ? '#ecfdf5' : '#fff8f7';
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.background = el.classList.contains('success') ? '#ecfdf5' : '#fff8f7';
    const files = e.dataTransfer?.files;
    if (files && files.length) this.handleFile(files[0], el);
  }
  onFileChange(ev: Event, host: HTMLElement) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length) this.handleFile(input.files[0], host);
  }
  private handleFile(file: File, host: HTMLElement) {
    const okTypes = ['image/jpeg', 'image/png'];
    if (!okTypes.includes(file.type)) {
      host.classList.remove('success');
      alert('Formato no permitido. Usa JPG o PNG.');
      this.signupForm.patchValue({ licencia: null });
      return;
    }
    host.classList.add('success');
    this.signupForm.patchValue({ licencia: file });
  }

  // Textos resumen (si los usas en el paso final)
  getNombreCompleto() {
    const n = (this.signupForm.get('nombre')?.value ?? '—').toString();
    const a = (this.signupForm.get('apellido')?.value ?? '').toString();
    const full = `${n} ${a}`.trim();
    return full || '—';
  }
  mapGenero(v: string | null | undefined) {
    return v === 'M' ? 'Masculino' : v === 'F' ? 'Femenino' : v === 'X' ? 'Prefiero no decir' : '—';
  }
}
