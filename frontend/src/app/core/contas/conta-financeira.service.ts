import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContaFinanceira, ContaFinanceiraRequest } from './conta-financeira.models';

@Injectable({ providedIn: 'root' })
export class ContaFinanceiraService {
  private readonly apiUrl = 'http://localhost:8080/api/contas-financeiras';

  constructor(private readonly http: HttpClient) {}

  listar() {
    return this.http.get<ContaFinanceira[]>(this.apiUrl);
  }

  criar(request: ContaFinanceiraRequest) {
    return this.http.post<ContaFinanceira>(this.apiUrl, request);
  }

  atualizar(id: string, request: ContaFinanceiraRequest) {
    return this.http.put<ContaFinanceira>(`${this.apiUrl}/${id}`, request);
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
