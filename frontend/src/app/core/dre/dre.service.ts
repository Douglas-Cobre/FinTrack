import { apiUrl } from '../api/api-url';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dre } from './dre.models';

@Injectable({ providedIn: 'root' })
export class DreService {
  private readonly apiUrl = apiUrl('relatorios/dre');
  constructor(private readonly http: HttpClient) {}

  consultar(inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<Dre>(this.apiUrl, { params });
  }
}
