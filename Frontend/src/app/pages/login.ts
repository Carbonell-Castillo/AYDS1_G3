import { Component, computed, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../services/session'; //
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  // Panel de la UI (izq/der)
  rightPanel = signal<boolean>(true);

  // Stepper de registro
  current = signal<number>(0);
  readonly totalSteps = 4;
  progressPct = computed(() => (this.current() / (this.totalSteps - 1)) * 100);

  // Formularios
  signupForm!: FormGroup;
  signinForm!: FormGroup;

  // Estado UI
  strength = signal<'weak' | 'ok' | 'strong' | ''>('');
  loading = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private destroyRef: DestroyRef,
    private auth: AuthService,
    private router: Router,
    private session: SessionService
  ) {
  
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

    //  Login (email o DPI) 
    this.signinForm = this.fb.group({
      usuario: ['', [Validators.required, this.emailOrDpiValidator()]],
      password: ['', [Validators.required]],
    });

    // Fuerza de contraseña
    const passCtrl = this.signupForm.get('password')!;
    const confCtrl = this.signupForm.get('confirm')!;
    passCtrl.valueChanges
      .pipe(startWith(passCtrl.value ?? ''), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this.updateStrength((v as string) || '');
        confCtrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      });
  }

  
  back() { if (this.current() > 0) this.current.set(this.current() - 1); }
  next() { if (this.validateStep(this.current())) this.current.set(this.current() + 1); }

  // Validación por paso (registro)
  validateStep(step: number): boolean {
    const markTouched = (ctrl: AbstractControl | null) => ctrl?.markAsTouched();
    const get = (n: string) => this.signupForm.get(n);

    if (step === 0) ['dpi', 'nombre', 'apellido', 'genero'].forEach(n => markTouched(get(n)));
    if (step === 1) ['email', 'telefono'].forEach(n => markTouched(get(n)));
    if (step === 2) ['password', 'confirm'].forEach(n => markTouched(get(n)));
    if (step === 3) markTouched(get('licencia'));

    this.signupForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    const stepControls: Record<number, string[]> = {
      0: ['dpi', 'nombre', 'apellido', 'genero'],
      1: ['email', 'telefono'],
      2: ['password', 'confirm'],
      3: ['licencia'],
    };
    const names = stepControls[step] ?? [];
    return names.every(n => this.signupForm.get(n)?.valid);
  }

  
  submitSignup() {
    const allOk =
      this.validateStep(0) &&
      this.validateStep(1) &&
      this.validateStep(2) &&
      this.signupForm.valid;
    if (!allOk) return;

    const v = this.signupForm.value as any;
    const file: File | null = v.licencia ?? null;

    this.loading.set(true);

    of<string | null>(null)
      .pipe(
        switchMap((pathOrNull) =>
          this.auth.register({
            dpi: v.dpi,
            password: v.password,
            nombre: v.nombre,
            apellido: v.apellido,
            genero: v.genero,
            email: v.email,
            telefono: v.telefono,
            licencia_path: pathOrNull ?? (file ? file.name : null),
          })
        )
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          alert(res.body.mensaje || 'Usuario creado');
          this.signupForm.reset();
          this.current.set(0);
          this.strength.set('');
          this.setRightPanel(false); // Cambia a panel de login
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
          alert('❌ No se pudo registrar');
        },
      });
  }


  submitSignin() {
    this.signinForm.markAllAsTouched();
    if (!this.signinForm.valid) {
      return;
    }

    const { usuario, password } = this.signinForm.value as any;
    this.loading.set(true);

    this.auth.login(usuario, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        const body = res.body;
        if (body?.autenticado) {
          // Guarda info de usuario en sesión
          this.session.setUser(body.user);
          alert(`Bienvenido, ${body.user?.nombre || 'usuario'}!`);
          // Navega al dashboard
          this.router.navigateByUrl('/app');
        } else {
          alert('Credenciales inválidas');
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        alert('Error al iniciar sesión');
      },
    });
  }


  private emailOrDpiValidator(): ValidatorFn {
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const dpiRegex =
      /^(?:\d{13}|\d{4}-\d{5}-\d{4})$/; // 1234567890123 o 1234-12345-1234
    return (ctrl: AbstractControl) => {
      const v = (ctrl.value ?? '').toString().trim();
      if (!v) return { requerido: true };
      const isEmail = emailRegex.test(v);
      const isDpi = dpiRegex.test(v);
      return isEmail || isDpi ? null : { emailOrDpi: true };
    };
  }

 
  private updateStrength(v: string) {
    if (!v) { this.strength.set(''); return; }
    const rules = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
    const score = rules.reduce((a, r) => a + (r.test(v) ? 1 : 0), 0);
    if (score <= 2) this.strength.set('weak');
    else if (score <= 4) this.strength.set('ok');
    else this.strength.set('strong');
  }


  private passwordsIguales() {
    return (ctrl: AbstractControl) => {
      const pass = ctrl.get('password')?.value ?? '';
      const conf = ctrl.get('confirm')?.value ?? '';
      return pass && conf && pass !== conf ? { confirmNoCoincide: true } : null;
    };
  }


  setRightPanel(v: boolean) { this.rightPanel.set(v); }
  isInvalid(name: string) {
    const c = this.signupForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }
  hasGroupError(key: string) {
    return !!(this.signupForm.errors && this.signupForm.errors[key]);
  }


  onDropzoneClick(fileInput: HTMLInputElement) { fileInput.click(); }
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

  getNombreCompleto() {
    const n = (this.signupForm.get('nombre')?.value ?? '—').toString();
    const a = (this.signupForm.get('apellido')?.value ?? '').toString();
    const full = `${n} ${a}`.trim();
    return full || '—';
  }
  mapGenero(v: string | null | undefined) {
    return v === 'M' ? 'Masculino'
      : v === 'F' ? 'Femenino'
      : v === 'X' ? 'Prefiero no decir'
      : '—';
  }
}
