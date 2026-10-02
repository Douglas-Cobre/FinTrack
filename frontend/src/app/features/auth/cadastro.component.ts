import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <main class="auth-page">
      <section class="brand-panel">
        <span class="eyebrow">Comece agora</span>
        <h1>Crie sua conta e monte sua base financeira.</h1>
        <p>O cadastro ja separa seus dados para manter contas, categorias e movimentacoes isoladas por usuario.</p>
      </section>

      <mat-card class="auth-card" appearance="outlined">
        <mat-card-header>
          <mat-card-title>Criar cadastro</mat-card-title>
          <mat-card-subtitle>Use um email valido e uma senha segura</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="cadastrar()">
            <mat-form-field appearance="outline">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="nome" autocomplete="name">
              <mat-error>Informe seu nome</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-error>Email invalido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="senha" autocomplete="new-password">
              <mat-error>A senha deve ter pelo menos 8 caracteres</mat-error>
            </mat-form-field>

            <p class="error" *ngIf="erro">{{ erro }}</p>

            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || carregando">
              <mat-spinner *ngIf="carregando" diameter="18"></mat-spinner>
              <span *ngIf="!carregando">Criar conta</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <span>Ja tem conta?</span>
          <a mat-button routerLink="/login">Entrar</a>
        </mat-card-actions>
      </mat-card>
    </main>
  `,
  styles: [`
    .auth-page {
      display: grid;
      grid-template-columns: minmax(360px, 1fr) minmax(420px, 480px);
      gap: 56px;
      align-items: center;
      min-height: 100vh;
      width: min(1120px, 100%);
      margin: 0 auto;
      padding: 48px 32px;
      background: #eef2f1;
    }

    .brand-panel {
      max-width: 620px;
    }

    .eyebrow {
      color: #2f6f63;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    h1 {
      margin: 14px 0 16px;
      color: #13241f;
      font-size: 44px;
      line-height: 1.08;
    }

    p {
      margin: 0;
      color: #5c6f69;
      font-size: 18px;
      line-height: 1.6;
    }

    .auth-card {
      width: 100%;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 18px 45px rgba(20, 41, 35, 0.08);
    }

    .auth-card mat-card-header,
    .auth-card mat-card-content {
      padding-left: 28px;
      padding-right: 28px;
    }

    .auth-card mat-card-header {
      padding-top: 28px;
    }

    mat-card-title {
      font-size: 24px;
      font-weight: 800;
    }

    mat-card-subtitle {
      font-size: 14px;
    }

    form {
      display: grid;
      gap: 16px;
      padding-top: 24px;
    }

    button[type="submit"] {
      min-height: 48px;
      font-weight: 800;
    }

    .error {
      padding: 10px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b42318;
      font-size: 14px;
    }

    mat-card-actions {
      display: flex;
      justify-content: center;
      gap: 4px;
      padding: 4px 28px 24px;
      color: #5c6f69;
    }

    @media (max-width: 860px) {
      .auth-page {
        grid-template-columns: 1fr;
        gap: 24px;
        width: 100%;
        padding: 24px;
      }

      h1 {
        font-size: 32px;
      }
    }

    @media (max-width: 520px) {
      .auth-page {
        padding: 16px;
      }

      .auth-card mat-card-header,
      .auth-card mat-card-content {
        padding-left: 20px;
        padding-right: 20px;
      }

      mat-card-actions {
        align-items: center;
        flex-direction: column;
        padding-left: 20px;
        padding-right: 20px;
      }
    }
  `]
})
export class CadastroComponent {
  protected carregando = false;
  protected erro = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  protected cadastrar(): void {
    if (this.form.invalid) {
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.authService.cadastrar(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.erro = 'Nao foi possivel criar a conta. Verifique os dados e tente novamente.';
        this.carregando = false;
      }
    });
  }
}
