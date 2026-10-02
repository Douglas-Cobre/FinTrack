import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, map, of, tap } from 'rxjs';
import { AuthResponse, CadastroRequest, LoginRequest, UsuarioResumo } from './auth.models';

const TOKEN_KEY = 'fintrack.token';
const USER_KEY = 'fintrack.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api';
  private readonly usuarioSignal = signal<UsuarioResumo | null>(this.carregarUsuario());

  readonly usuarioAtual = this.usuarioSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap((response) => this.salvarSessao(response))
    );
  }

  cadastrar(request: CadastroRequest) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/cadastro`, request).pipe(
      tap((response) => this.salvarSessao(response))
    );
  }

  validarSessao() {
    if (!this.obterToken()) {
      this.sair();
      return of(false);
    }

    return this.http.get<UsuarioResumo>(`${this.apiUrl}/usuarios/me`).pipe(
      tap((usuario) => {
        localStorage.setItem(USER_KEY, JSON.stringify(usuario));
        this.usuarioSignal.set(usuario);
      }),
      map(() => true),
      catchError(() => {
        this.sair();
        return of(false);
      })
    );
  }

  sair(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuarioSignal.set(null);
  }

  obterToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  estaAutenticado(): boolean {
    return Boolean(this.obterToken());
  }

  private salvarSessao(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
    this.usuarioSignal.set(response.usuario);
  }

  private carregarUsuario(): UsuarioResumo | null {
    const usuario = localStorage.getItem(USER_KEY);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as UsuarioResumo;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
