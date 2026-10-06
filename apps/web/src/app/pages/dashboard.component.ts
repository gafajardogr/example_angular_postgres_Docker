import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, UntypedFormArray, UntypedFormBuilder, Validators } from '@angular/forms';
import { CredentialsService } from '../core/credentials.service';
import { Credential, CredentialInput } from '../core/models';
import { MainNavComponent } from './main-nav.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainNavComponent],
  template: `
    <div class="dashboard-shell">
      <vault-main-nav />
      <main class="dashboard-main">
        <div class="page-heading">
          <div><p class="eyebrow">TU ESPACIO PERSONAL <span>/</span> ACCESOS</p><h1>Credenciales</h1><p class="subtitle">Todas tus llaves, ordenadas y a mano.</p></div>
          <button class="add-button" type="button" (click)="openCreate()"><span aria-hidden="true">＋</span> Nueva credencial</button>
        </div>
        <section class="summary-strip" aria-label="Resumen de credenciales">
          <div class="summary-item"><span class="summary-value">{{ credentials.length.toString().padStart(2, '0') }}</span><span class="summary-label">ACCESOS GUARDADOS</span></div>
          <div class="summary-divider"></div>
          <div class="summary-item"><span class="summary-value summary-date">{{ lastUpdated ? (lastUpdated | date:'d MMM y') : '—' }}</span><span class="summary-label">ÚLTIMA ACTUALIZACIÓN</span></div>
          <div class="summary-note"><span class="summary-spark">✳</span> Tu bóveda está lista</div>
        </section>
        <section class="list-section" aria-label="Lista de accesos">
          <div class="list-toolbar"><div class="section-title"><h2>Todos los accesos</h2><span class="count-pill">{{ filteredCredentials.length }}</span></div>
            <label class="search-box"><span aria-hidden="true">⌕</span><input type="search" [value]="searchTerm" (input)="setSearch($event)" placeholder="Buscar acceso…" aria-label="Buscar credenciales"></label>
          </div>
          @if (errorMessage) { <p class="notice-error" role="alert">{{ errorMessage }}</p> }
          @if (loading) { <div class="empty-state" role="status"><span class="loading-dot"></span> Cargando tus accesos…</div> }
          @else if (!credentials.length) {
            <div class="empty-state"><span class="empty-mark">＋</span><h3>Aún no hay accesos</h3><p>Guarda tu primera credencial para tenerla siempre a mano.</p><button class="text-action" type="button" (click)="openCreate()">Añadir credencial <span aria-hidden="true">↗</span></button></div>
          } @else if (!filteredCredentials.length) {
            <div class="empty-state"><h3>No encontramos coincidencias</h3><p>Prueba con otro nombre, usuario o aplicación.</p><button class="text-action" type="button" (click)="searchTerm = ''">Limpiar búsqueda</button></div>
          } @else {
            <div class="table-scroll"><table><thead><tr><th>SERVICIO</th><th>USUARIO</th><th>CONTRASEÑA</th><th>DETALLES</th><th><span class="sr-only">Acciones</span></th></tr></thead>
              <tbody>@for (item of filteredCredentials; track item.id) {
                <tr>
                  <td><div class="service-cell"><span class="service-monogram">{{ monogram(item.nombre_pagina) }}</span><div class="service-meta"><strong>{{ item.nombre_pagina }}</strong>@if (item.url) { <a [href]="item.url" target="_blank" rel="noopener noreferrer">{{ displayUrl(item.url) }} <span aria-hidden="true">↗</span></a> } @else if (item.aplicacion) { <span>{{ item.aplicacion }}</span> }</div></div></td>
                  <td><span class="username">{{ item.usuario }}</span></td>
                  <td><div class="password-cell"><input [type]="revealed.has(item.id) ? 'text' : 'password'" [value]="item.password" readonly [attr.aria-label]="revealed.has(item.id) ? 'Contraseña visible' : 'Contraseña oculta'"><button type="button" class="reveal-button" (click)="togglePassword(item.id)" [attr.aria-label]="revealed.has(item.id) ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ revealed.has(item.id) ? 'Ocultar' : 'Mostrar' }}</button></div></td>
                  <td><div class="detail-cell">@if (item.base_datos) { <span>{{ item.base_datos }}</span> } @if (item.puerto) { <span class="detail-muted">Puerto {{ item.puerto }}</span> } @for (entry of attributeEntries(item); track entry[0]) { <span class="detail-muted">{{ entry[0] }}: {{ entry[1] }}</span> } @if (!item.base_datos && !item.puerto && !attributeEntries(item).length) { <span class="detail-muted">—</span> }</div></td>
                  <td><div class="row-actions"><button type="button" (click)="openEdit(item)" [attr.aria-label]="'Editar ' + item.nombre_pagina" title="Editar">Editar</button><button type="button" class="delete-action" (click)="remove(item)" [attr.aria-label]="'Eliminar ' + item.nombre_pagina" title="Eliminar">Eliminar</button></div></td>
                </tr>
              }</tbody>
            </table></div>
          }
        </section>
        <footer class="page-footer"><span><i></i> SESIÓN CIFRADA EN TRÁNSITO</span><span>CLAVE <b>·</b> TU ESPACIO PRIVADO</span></footer>
      </main>

      <dialog #editor class="editor-dialog" (click)="closeOnBackdrop($event)">
        <section class="editor-panel" aria-labelledby="editor-title">
          <header class="editor-heading"><div><p class="eyebrow">{{ editing ? 'ACTUALIZA TU ACCESO' : 'GUARDA UN NUEVO ACCESO' }}</p><h2 id="editor-title">{{ editing ? 'Editar credencial' : 'Nueva credencial' }}</h2></div><button class="close-button" type="button" (click)="closeEditor()" aria-label="Cerrar">×</button></header>
          <form [formGroup]="form" (ngSubmit)="save()" class="credential-form">
            <div class="form-grid"><label class="wide-field">Nombre del servicio<input formControlName="nombre_pagina" placeholder="Por ejemplo, Correo personal" required maxlength="200"></label>
              <label>URL<input formControlName="url" type="url" placeholder="https://ejemplo.com"></label><label>Aplicación<input formControlName="aplicacion" placeholder="Aplicación o cliente"></label>
              <label>Usuario<input formControlName="usuario" autocomplete="off" required maxlength="500"></label><label>Contraseña<input formControlName="password" autocomplete="new-password" required maxlength="2000"></label>
              <label>Base de datos<input formControlName="base_datos" placeholder="Opcional"></label><label>Puerto<input formControlName="puerto" type="number" min="1" max="65535" placeholder="5432"></label>
            </div>
            <div class="attributes-heading"><div><h3>Otros atributos</h3><p>Campos personalizados de texto para este acceso.</p></div><button type="button" class="add-attribute" (click)="addAttribute()">＋ Añadir campo</button></div>
            <div formArrayName="attributes" class="attributes-list">@for (attribute of attributes.controls; track $index; let index = $index) {
              <div class="attribute-row" [formGroupName]="index"><input formControlName="key" placeholder="Nombre del campo" aria-label="Nombre del atributo"><input formControlName="value" placeholder="Valor" [attr.aria-label]="'Valor del atributo ' + (index + 1)"><button type="button" (click)="removeAttribute(index)" [attr.aria-label]="'Eliminar atributo ' + (index + 1)">×</button></div>
            }</div>
            @if (formError) { <p class="form-error" role="alert">{{ formError }}</p> }
            <footer class="dialog-actions"><button type="button" class="cancel-button" (click)="closeEditor()">Cancelar</button><button type="submit" class="save-button" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar credencial' }} <span aria-hidden="true">↗</span></button></footer>
          </form>
        </section>
      </dialog>
    </div>
  `,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly credentialService = inject(CredentialsService);

  @ViewChild('editor') private editor!: ElementRef<HTMLDialogElement>;
  credentials: Credential[] = [];
  revealed = new Set<string>();
  searchTerm = '';
  loading = true;
  saving = false;
  editing: Credential | null = null;
  errorMessage = '';
  formError = '';

  readonly form = this.formBuilder.group({
    nombre_pagina: ['', [Validators.required, Validators.maxLength(200)]],
    url: [''], aplicacion: [''], usuario: ['', Validators.required], password: ['', Validators.required],
    base_datos: [''], puerto: [''], attributes: this.formBuilder.array([]),
  });

  get attributes(): UntypedFormArray {
    return this.form.get('attributes') as UntypedFormArray;
  }

  get filteredCredentials(): Credential[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    if (!query) return this.credentials;
    return this.credentials.filter((item) => [item.nombre_pagina, item.url, item.aplicacion, item.usuario, item.base_datos,
      ...Object.entries(item.otros_atributos ?? {}).flat()].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)));
  }

  get lastUpdated(): Date | null {
    const latest = this.credentials.reduce((value, item) => Math.max(value, Date.parse(item.updated_at)), 0);
    return latest ? new Date(latest) : null;
  }

  ngOnInit(): void {
    this.loadCredentials();
  }

  setSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  monogram(name: string): string {
    return name.trim().slice(0, 1).toLocaleUpperCase() || '·';
  }

  displayUrl(value: string): string {
    return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  attributeEntries(item: Credential): [string, string][] {
    return Object.entries(item.otros_atributos ?? {});
  }

  togglePassword(id: string): void {
    this.revealed.has(id) ? this.revealed.delete(id) : this.revealed.add(id);
  }

  openCreate(): void {
    this.editing = null;
    this.formError = '';
    this.form.reset({ nombre_pagina: '', url: '', aplicacion: '', usuario: '', password: '', base_datos: '', puerto: '' });
    this.attributes.clear();
    this.editor.nativeElement.showModal();
  }

  openEdit(item: Credential): void {
    this.editing = item;
    this.formError = '';
    this.form.patchValue({ nombre_pagina: item.nombre_pagina, url: item.url ?? '', aplicacion: item.aplicacion ?? '',
      usuario: item.usuario, password: item.password, base_datos: item.base_datos ?? '', puerto: item.puerto?.toString() ?? '' });
    this.attributes.clear();
    for (const [key, value] of Object.entries(item.otros_atributos ?? {})) this.addAttribute(key, value);
    this.editor.nativeElement.showModal();
  }

  addAttribute(key = '', value = ''): void {
    this.attributes.push(this.formBuilder.group({ key: [key], value: [value] }));
  }

  removeAttribute(index: number): void {
    this.attributes.removeAt(index);
  }

  closeEditor(): void {
    this.editor.nativeElement.close();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.editor.nativeElement) this.closeEditor();
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    const value = this.form.getRawValue();
    const attributes = Object.fromEntries((value.attributes as { key: string; value: string }[])
      .filter((item) => item.key.trim()).map((item) => [item.key.trim(), item.value]));
    const input: CredentialInput = {
      nombre_pagina: String(value.nombre_pagina).trim(),
      url: String(value.url ?? '').trim() || null,
      aplicacion: String(value.aplicacion ?? '').trim() || null,
      usuario: String(value.usuario).trim(),
      password: String(value.password),
      base_datos: String(value.base_datos ?? '').trim() || null,
      puerto: value.puerto ? Number(value.puerto) : null,
      otros_atributos: attributes,
    };
    this.saving = true;
    this.formError = '';
    const request = this.editing
      ? this.credentialService.update(this.editing.id, input)
      : this.credentialService.create(input);
    request.subscribe({
      next: () => { this.saving = false; this.closeEditor(); this.loadCredentials(); },
      error: () => { this.saving = false; this.formError = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'; },
    });
  }

  remove(item: Credential): void {
    if (!window.confirm(`¿Eliminar el acceso de ${item.nombre_pagina}? Esta acción no se puede deshacer.`)) return;
    this.credentialService.delete(item.id).subscribe({
      next: () => { this.revealed.delete(item.id); this.loadCredentials(); },
      error: () => { this.errorMessage = 'No se pudo eliminar la credencial.'; },
    });
  }

  private loadCredentials(): void {
    this.loading = true;
    this.errorMessage = '';
    this.credentialService.list().subscribe({
      next: (items) => { this.credentials = items; this.loading = false; },
      error: () => { this.loading = false; this.errorMessage = 'No se pudieron cargar las credenciales.'; },
    });
  }
}
