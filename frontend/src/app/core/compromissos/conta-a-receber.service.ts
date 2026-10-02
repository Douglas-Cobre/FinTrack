import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContaAReceber, ContaAReceberRequest } from './compromisso.models';

@Injectable({ providedIn: 'root' })
export class ContaAReceberService {
  private readonly apiUrl = 'http://localhost:8080/api/contas-a-receber';

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

  receber(id: string, data: string) {
    return this.http.post<ContaAReceber>(`${this.apiUrl}/${id}/receber`, { data });
  }

  cancelar(id: string) {
    return this.http.post<ContaAReceber>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
