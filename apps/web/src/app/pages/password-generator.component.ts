import { Component, inject } from '@angular/core';
import { MainNavComponent } from './main-nav.component';

type CharacterGroup = 'uppercase' | 'lowercase' | 'special' | 'numbers';

interface CharacterSetting {
  key: CharacterGroup;
  label: string;
  description: string;
  characters: string;
}

@Component({
  standalone: true,
  imports: [MainNavComponent],
  template: `
    <div class="generator-shell">
      <vault-main-nav />
      <main class="generator-main">
        <div class="page-heading">
          <div>
            <p class="eyebrow">TU ESPACIO PERSONAL <span>/</span> HERRAMIENTAS</p>
            <h1>Genera password</h1>
            <p class="subtitle">Crea una contraseña aleatoria según tus preferencias.</p>
          </div>
        </div>

        <div class="generator-workspace">
          <section class="generator-settings" aria-labelledby="settings-title">
            <div class="section-heading">
              <span class="section-index">01</span>
              <div><h2 id="settings-title">Configura tu password</h2><p>Elige longitud y caracteres a incluir.</p></div>
            </div>

            <label class="length-control" for="password-length">
              <span>Longitud</span>
              <span class="length-input-wrap"><input id="password-length" type="number" min="1" max="128" step="1" [value]="length" (input)="updateLength($event)"><span>caracteres</span></span>
            </label>

            <div class="options-heading"><h3>Tipos de caracteres</h3><span>Selecciona Sí o No</span></div>
            <div class="settings-list">
              @for (setting of settings; track setting.key) {
                <div class="setting-row">
                  <div class="setting-copy"><strong>{{ setting.label }}</strong><span>{{ setting.description }}</span></div>
                  <button class="binary-toggle" type="button" role="switch" [attr.aria-checked]="enabled[setting.key]" [attr.aria-label]="setting.label + ': ' + (enabled[setting.key] ? 'Sí' : 'No')" (click)="toggleOption(setting.key)">
                    <span>{{ enabled[setting.key] ? 'Sí' : 'No' }}</span><span class="toggle-track" aria-hidden="true"><span></span></span>
                  </button>
                </div>
              }
            </div>
            @if (validationMessage) { <p class="validation-message" role="status">{{ validationMessage }}</p> }
            <button class="generate-button" type="button" [disabled]="!!validationMessage" (click)="generatePassword()">Generar password <span aria-hidden="true">↗</span></button>
          </section>

          <section class="result-panel" aria-labelledby="result-title" aria-live="polite">
            <div class="result-heading"><span class="result-mark" aria-hidden="true">✳</span><div><p class="result-kicker">RESULTADO</p><h2 id="result-title">Tu password</h2></div></div>
            @if (password) {
              <div class="password-output"><input type="text" [value]="password" readonly aria-label="Password generada"><button type="button" class="copy-button" (click)="copyPassword()">Copiar</button></div>
              <p class="copy-status" role="status">{{ copyMessage }}</p>
              <p class="result-note">{{ password.length }} caracteres <span>·</span> generado en este dispositivo</p>
            } @else {
              <div class="result-placeholder"><span aria-hidden="true">••••••••••••</span><p>Tu contraseña aparecerá aquí.</p></div>
            }
          </section>
        </div>
        <footer class="page-footer"><span><i></i> GENERACIÓN LOCAL CON CRYPTO WEB API</span><span>CLAVE <b>·</b> TU ESPACIO PRIVADO</span></footer>
      </main>
    </div>
  `,
  styleUrl: './password-generator.component.css',
})
export class PasswordGeneratorComponent {
  readonly settings: CharacterSetting[] = [
    { key: 'uppercase', label: 'Mayúsculas', description: 'Letras de la A a la Z', characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { key: 'lowercase', label: 'Minúsculas', description: 'Letras de la a a la z', characters: 'abcdefghijklmnopqrstuvwxyz' },
    { key: 'special', label: 'Caracteres especiales', description: 'Símbolos como !, #, % y &', characters: '!#$%&()*+,-./:;=?@[]^_{|}~' },
    { key: 'numbers', label: 'Números', description: 'Dígitos del 0 al 9', characters: '0123456789' },
  ];

  enabled: Record<CharacterGroup, boolean> = {
    uppercase: true,
    lowercase: true,
    special: true,
    numbers: true,
  };
  length = 16;
  password = '';
  copyMessage = '';

  get validationMessage(): string {
    const selectedCount = this.settings.filter((setting) => this.enabled[setting.key]).length;
    if (!selectedCount) return 'Activa al menos un tipo de carácter.';
    if (!Number.isInteger(this.length) || this.length < 1 || this.length > 128) return 'La longitud debe estar entre 1 y 128.';
    if (this.length < selectedCount) return `La longitud debe ser de al menos ${selectedCount} para incluir todos los tipos seleccionados.`;
    return '';
  }

  updateLength(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.length = Number.isFinite(value) ? value : 0;
    this.clearResult();
  }

  toggleOption(key: CharacterGroup): void {
    this.enabled[key] = !this.enabled[key];
    this.clearResult();
  }

  generatePassword(): void {
    if (this.validationMessage) return;

    const selectedSettings = this.settings.filter((setting) => this.enabled[setting.key]);
    const characters = selectedSettings.map((setting) => this.pickCharacter(setting.characters));
    const pool = selectedSettings.map((setting) => setting.characters).join('');
    while (characters.length < this.length) characters.push(this.pickCharacter(pool));

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const otherIndex = this.randomIndex(index + 1);
      [characters[index], characters[otherIndex]] = [characters[otherIndex], characters[index]];
    }

    this.password = characters.join('');
    this.copyMessage = '';
  }

  async copyPassword(): Promise<void> {
    if (!this.password) return;
    try {
      await navigator.clipboard.writeText(this.password);
      this.copyMessage = 'Password copiado.';
    } catch {
      this.copyMessage = 'No se pudo copiar. Selecciona el texto para copiarlo.';
    }
  }

  private pickCharacter(characters: string): string {
    return characters[this.randomIndex(characters.length)];
  }

  private randomIndex(maximum: number): number {
    const randomByte = new Uint8Array(1);
    const cutoff = Math.floor(256 / maximum) * maximum;
    do {
      crypto.getRandomValues(randomByte);
    } while (randomByte[0] >= cutoff);
    return randomByte[0] % maximum;
  }

  private clearResult(): void {
    this.password = '';
    this.copyMessage = '';
  }
}