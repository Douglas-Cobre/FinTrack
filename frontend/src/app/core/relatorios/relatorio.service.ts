import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResumoFinanceiro } from './relatorio.models';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly apiUrl = 'http://localhost:8080/api/relatorios';

  constructor(private readonly http: HttpClient) {}

  resumo() {
    return this.http.get<ResumoFinanceiro>(`${this.apiUrl}/resumo`);
  }
}
