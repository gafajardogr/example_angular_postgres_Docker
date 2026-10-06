export interface Credential {
  id: string;
  nombre_pagina: string;
  url: string | null;
  aplicacion: string | null;
  usuario: string;
  password: string;
  puerto: number | null;
  base_datos: string | null;
  otros_atributos: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CredentialInput {
  nombre_pagina: string;
  url?: string | null;
  aplicacion?: string | null;
  usuario: string;
  password: string;
  puerto?: number | null;
  base_datos?: string | null;
  otros_atributos: Record<string, string>;
}
