import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="access-shell">
      <div class="access-grain" aria-hidden="true"></div>
      <section class="access-card" aria-labelledby="access-title">
        <a class="wordmark" href="/access" aria-label="Clave, inicio">
          <span class="brand-mark">C</span><span>clave<span class="wordmark-dot">.</span></span>
        </a>
        <p class="eyebrow">TU ESPACIO PRIVADO</p>
        <h1 id="access-title">{{ loading ? 'Preparando tu bóveda' : setupMode ? 'Crea tu llave maestra' : 'Qué bueno verte' }}</h1>
        <p class="access-copy">
          {{ setupMode ? 'Una sola llave para cuidar todos tus accesos.' : 'Ingresa tu llave maestra para abrir tus accesos.' }}
        </p>

        @if (!loading) {
          <form [formGroup]="form" (ngSubmit)="submit()" class="access-form">
            <label for="master-password">Contraseña maestra</label>
            <input id="master-password" type="password" formControlName="masterPassword" autocomplete="{{ setupMode ? 'new-password' : 'current-password' }}" placeholder="Al menos 12 caracteres" required>
            @if (setupMode) {
              <label for="confirm-password">Confirma tu contraseña</label>
              <input id="confirm-password" type="password" formControlName="confirmation" autocomplete="new-password" placeholder="Vuelve a escribirla" required>
            }
            @if (errorMessage) { <p class="form-error" role="alert">{{ errorMessage }}</p> }
            <button class="primary-button" type="submit" [disabled]="form.invalid || saving">
              {{ saving ? 'Verificando…' : setupMode ? 'Crear bóveda' : 'Desbloquear bóveda' }}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
        } @else {
          <div class="loading-line" role="status">Conectando con tu bóveda…</div>
        }

        <div class="access-footnote"><span class="lock-symbol" aria-hidden="true">⌑</span> Tus credenciales solo son visibles después de autenticarte.</div>
      </section>
      <aside class="access-aside" aria-hidden="true">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <div class="aside-copy"><span>01 / PRIVACIDAD PERSONAL</span><p>Todo en su sitio.<br><em>Nada a la vista.</em></p><div class="aside-rule"></div><small>Un lugar tranquilo para todo lo que no debe perderse.</small></div>
        <div class="aside-index">C<span>—</span>01</div>
      </aside>
    </main>
  `,
  styleUrl: './access.component.css',
})
export class AccessComponent implements OnInit {
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.group({
    masterPassword: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    confirmation: [''],
  });
  loading = true;
  saving = false;
  setupMode = false;
  errorMessage = '';

  ngOnInit(): void {
    if (this.auth.hasValidToken()) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.auth.status().subscribe({
      next: ({ configured }) => { this.setupMode = !configured; this.loading = false; },
      error: () => { this.loading = false; this.errorMessage = 'No se pudo conectar con el servidor. Intenta de nuevo.'; },
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    const { masterPassword, confirmation } = this.form.getRawValue() as { masterPassword: string; confirmation: string };
    if (this.setupMode && masterPassword !== confirmation) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const request = this.setupMode ? this.auth.setup(masterPassword) : this.auth.login(masterPassword);
    request.subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (error: { error?: { error?: string } }) => {
        this.saving = false;
        this.errorMessage = error.error?.error === 'Master password is already configured'
          ? 'La llave maestra ya fue configurada. Recarga e inicia sesión.'
          : this.setupMode ? 'No se pudo crear la bóveda. Comprueba la conexión e inténtalo de nuevo.' : 'La contraseña maestra no es correcta.';
      },
    });
  }
}
