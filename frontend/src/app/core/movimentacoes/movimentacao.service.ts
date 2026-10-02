import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Movimentacao, MovimentacaoRequest } from './movimentacao.models';

@Injectable({ providedIn: 'root' })
export class MovimentacaoService {
  private readonly apiUrl = 'http://localhost:8080/api/movimentacoes';

  constructor(private readonly http: HttpClient) {}

  listar() {
    return this.http.get<Movimentacao[]>(this.apiUrl);
  }

  criar(request: MovimentacaoRequest) {
    return this.http.post<Movimentacao>(this.apiUrl, request);
  }

  atualizar(id: string, request: MovimentacaoRequest) {
    return this.http.put<Movimentacao>(`${this.apiUrl}/${id}`, request);
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
