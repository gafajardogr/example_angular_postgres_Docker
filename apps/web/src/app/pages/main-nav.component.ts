import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'vault-main-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a class="wordmark" routerLink="/" aria-label="Clave, inicio">
        <span class="brand-mark">C</span><span>clave<span class="wordmark-dot">.</span></span>
      </a>
      <nav class="main-menu" aria-label="Menú principal">
        <a routerLink="/generate-password" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Genera password</a>
        <a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Administrar Credenciales</a>
      </nav>
      <button class="logout-button" type="button" (click)="logout()">Salir <span aria-hidden="true">↗</span></button>
    </header>
  `,
  styleUrl: './main-nav.component.css',
})
export class MainNavComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/access');
  }
}