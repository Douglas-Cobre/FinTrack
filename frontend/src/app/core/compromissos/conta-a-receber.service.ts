import { apiUrl } from '../api/api-url';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContaAReceber, ContaAReceberRequest, PreviaEfetivacao } from './compromisso.models';

@Injectable({ providedIn: 'root' })
export class ContaAReceberService {
  private readonly apiUrl = apiUrl('contas-a-receber');

  constructor(private readonly http: HttpClient) {}

  listar() {
    return this.http.get<ContaAReceber[]>(this.apiUrl);
  }

  criar(request: ContaAReceberRequest) {
    return this.http.post<ContaAReceber>(this.apiUrl, request);
  }

  atualizar(id: string, request: ContaAReceberRequest) {
    return this.http.put<ContaAReceber>(`${this.apiUrl}/${id}`, request);
  }

  previa(id: string, data: string) {
    return this.http.get<PreviaEfetivacao>(`${this.apiUrl}/${id}/previa`, { params: { data } });
  }

  receber(id: string, data: string, valorConfirmado?: number) {
    return this.http.post<ContaAReceber>(`${this.apiUrl}/${id}/receber`, { data, valorConfirmado });
  }

  cancelar(id: string) {
    return this.http.post<ContaAReceber>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
