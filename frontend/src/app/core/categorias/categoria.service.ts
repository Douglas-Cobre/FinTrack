import { apiUrl } from '../api/api-url';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Categoria, CategoriaRequest, TipoMovimentacao } from './categoria.models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly apiUrl = apiUrl('categorias');

  constructor(private readonly http: HttpClient) {}

  listar(tipo?: TipoMovimentacao) {
    const params = tipo ? new HttpParams().set('tipo', tipo) : undefined;
    return this.http.get<Categoria[]>(this.apiUrl, { params });
  }

  criar(request: CategoriaRequest) {
    return this.http.post<Categoria>(this.apiUrl, request);
  }

  atualizar(id: string, request: CategoriaRequest) {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, request);
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
