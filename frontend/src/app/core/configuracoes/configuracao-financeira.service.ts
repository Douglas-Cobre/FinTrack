import { apiUrl } from '../api/api-url';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfiguracaoFinanceira } from './configuracao-financeira.models';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoFinanceiraService {
  private readonly apiUrl = apiUrl('configuracoes-financeiras');

  constructor(private readonly http: HttpClient) {}

  obter() {
    return this.http.get<ConfiguracaoFinanceira>(this.apiUrl);
  }

  salvar(configuracao: ConfiguracaoFinanceira) {
    return this.http.put<ConfiguracaoFinanceira>(this.apiUrl, configuracao);
  }
}
