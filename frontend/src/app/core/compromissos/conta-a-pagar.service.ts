import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContaAPagar, ContaAPagarRequest } from './compromisso.models';

@Injectable({ providedIn: 'root' })
export class ContaAPagarService {
  private readonly apiUrl = 'http://localhost:8080/api/contas-a-pagar';

  constructor(private readonly http: HttpClient) {}

  listar() {
    return this.http.get<ContaAPagar[]>(this.apiUrl);
  }

  criar(request: ContaAPagarRequest) {
    return this.http.post<ContaAPagar>(this.apiUrl, request);
  }

  atualizar(id: string, request: ContaAPagarRequest) {
    return this.http.put<ContaAPagar>(`${this.apiUrl}/${id}`, request);
  }

  pagar(id: string, data: string) {
    return this.http.post<ContaAPagar>(`${this.apiUrl}/${id}/pagar`, { data });
  }

  cancelar(id: string) {
    return this.http.post<ContaAPagar>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
