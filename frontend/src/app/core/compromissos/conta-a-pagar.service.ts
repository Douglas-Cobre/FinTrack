import { apiUrl } from '../api/api-url';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContaAPagar, ContaAPagarRequest, PreviaEfetivacao } from './compromisso.models';

@Injectable({ providedIn: 'root' })
export class ContaAPagarService {
  private readonly apiUrl = apiUrl('contas-a-pagar');

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

  previa(id: string, data: string) {
    return this.http.get<PreviaEfetivacao>(`${this.apiUrl}/${id}/previa`, { params: { data } });
  }

  pagar(id: string, data: string, valorConfirmado?: number) {
    return this.http.post<ContaAPagar>(`${this.apiUrl}/${id}/pagar`, { data, valorConfirmado });
  }

  cancelar(id: string) {
    return this.http.post<ContaAPagar>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
