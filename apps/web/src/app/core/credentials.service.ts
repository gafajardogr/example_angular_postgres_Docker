import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Credential, CredentialInput } from './models';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class CredentialsService {
  private readonly http = inject(HttpClient);

  list(): Observable<Credential[]> {
    return this.http.get<Credential[]>(`${API_BASE_URL}/credentials`);
  }

  create(value: CredentialInput): Observable<Credential> {
    return this.http.post<Credential>(`${API_BASE_URL}/credentials`, value);
  }

  update(id: string, value: CredentialInput): Observable<Credential> {
    return this.http.put<Credential>(`${API_BASE_URL}/credentials/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/credentials/${id}`);
  }
}
