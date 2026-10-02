import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ContaFinanceira, TipoContaFinanceira } from '../../core/contas/conta-financeira.models';
import { ContaFinanceiraService } from '../../core/contas/conta-financeira.service';

type TipoOpcao = {
  valor: TipoContaFinanceira;
  rotulo: string;
};

@Component({
  selector: 'app-contas-financeiras',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatToolbarModule
  ],
  template: `
    <main class="page">
      <mat-toolbar class="toolbar">
        <div>
          <span class="eyebrow">Fase 3</span>
          <h1>Contas financeiras</h1>
        </div>
      </mat-toolbar>

      <section class="layout">
        <mat-card class="form-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ contaEmEdicao ? 'Editar conta' : 'Nova conta' }}</mat-card-title>
            <mat-card-subtitle>O saldo atual sera calculado pelo backend</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="salvar()">
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="nome">
                <mat-error>Informe o nome da conta</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo">
                  <mat-option *ngFor="let tipo of tipos" [value]="tipo.valor">
                    {{ tipo.rotulo }}
                  </mat-option>
                </mat-select>
                <mat-error>Selecione o tipo</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Saldo inicial</mat-label>
                <input matInput type="number" min="0" step="0.01" formControlName="saldoInicial">
                <mat-error>Informe um valor valido</mat-error>
              </mat-form-field>

              <p class="error" *ngIf="erro">{{ erro }}</p>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || carregando">
                  {{ contaEmEdicao ? 'Salvar alteracoes' : 'Criar conta' }}
                </button>
                <button mat-button type="button" *ngIf="contaEmEdicao" (click)="cancelarEdicao()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="list-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Minhas contas</mat-card-title>
            <mat-card-subtitle>{{ contas.length }} cadastrada(s)</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state" *ngIf="!carregando && contas.length === 0">
              <strong>Nenhuma conta cadastrada</strong>
              <span>Cadastre sua primeira conta para iniciar o controle financeiro.</span>
            </div>

            <mat-list *ngIf="contas.length > 0">
              <mat-list-item *ngFor="let conta of contas">
                <span matListItemTitle>{{ conta.nome }}</span>
                <span matListItemLine>{{ formatarTipo(conta.tipo) }}</span>

                <div class="account-values">
                  <span>Inicial: {{ conta.saldoInicial | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</span>
                  <strong>Atual: {{ conta.saldoAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                </div>

                <div class="row-actions">
                  <button mat-button type="button" (click)="editar(conta)">Editar</button>
                  <button mat-button color="warn" type="button" (click)="excluir(conta)">Excluir</button>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    </main>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #eef2f1;
    }

    .toolbar {
      min-height: 92px;
      padding: 18px 32px;
      background: rgba(238, 242, 241, 0.94);
    }

    .toolbar h1 {
      margin: 0;
      color: #17231f;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.1;
    }

    .eyebrow {
      display: block;
      margin-bottom: 6px;
      color: #2f6f63;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
      gap: 18px;
      padding: 0 32px 32px;
    }

    mat-card {
      border-radius: 8px;
    }

    form {
      display: grid;
      gap: 14px;
      padding-top: 20px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .error {
      margin: 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b42318;
      font-size: 14px;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 8px;
      min-height: 220px;
      padding: 24px;
      border: 1px dashed #cbd8d4;
      border-radius: 8px;
      background: #f8fbfa;
      text-align: center;
    }

    .empty-state strong {
      color: #17231f;
      font-size: 18px;
    }

    .empty-state span,
    .account-values span {
      color: #5c6f69;
    }

    mat-list-item {
      min-height: 92px;
      border-bottom: 1px solid #edf2f0;
    }

    .account-values {
      display: grid;
      gap: 4px;
      margin-left: auto;
      text-align: right;
      white-space: nowrap;
    }

    .account-values strong {
      color: #17231f;
    }

    .row-actions {
      display: flex;
      gap: 4px;
      margin-left: 18px;
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
        padding: 0 18px 24px;
      }

      .toolbar {
        padding: 16px 18px;
      }

      mat-list-item {
        height: auto;
        padding: 14px 0;
      }

      .account-values,
      .row-actions {
        margin-left: 0;
        text-align: left;
      }
    }
  `]
})
export class ContasFinanceirasComponent implements OnInit {
  protected contas: ContaFinanceira[] = [];
  protected carregando = false;
  protected erro = '';
  protected contaEmEdicao: ContaFinanceira | null = null;

  protected readonly tipos: TipoOpcao[] = [
    { valor: 'CONTA_CORRENTE', rotulo: 'Conta corrente' },
    { valor: 'POUPANCA', rotulo: 'Poupanca' },
    { valor: 'DINHEIRO', rotulo: 'Dinheiro' },
    { valor: 'INVESTIMENTO', rotulo: 'Investimento' },
    { valor: 'OUTRA', rotulo: 'Outra' }
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    tipo: ['CONTA_CORRENTE' as TipoContaFinanceira, Validators.required],
    saldoInicial: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly contaFinanceiraService: ContaFinanceiraService
  ) {}

  ngOnInit(): void {
    this.carregarContas();
  }

  protected salvar(): void {
    if (this.form.invalid) {
      return;
    }

    this.carregando = true;
    this.erro = '';

    const request = this.form.getRawValue();
    const operacao = this.contaEmEdicao
      ? this.contaFinanceiraService.atualizar(this.contaEmEdicao.id, request)
      : this.contaFinanceiraService.criar(request);

    operacao.subscribe({
      next: () => {
        this.cancelarEdicao();
        this.carregarContas();
      },
      error: () => {
        this.erro = 'Nao foi possivel salvar a conta financeira.';
        this.carregando = false;
      }
    });
  }

  protected editar(conta: ContaFinanceira): void {
    this.contaEmEdicao = conta;
    this.form.setValue({
      nome: conta.nome,
      tipo: conta.tipo,
      saldoInicial: conta.saldoInicial
    });
  }

  protected excluir(conta: ContaFinanceira): void {
    this.carregando = true;
    this.erro = '';

    this.contaFinanceiraService.excluir(conta.id).subscribe({
      next: () => this.carregarContas(),
      error: () => {
        this.erro = 'Nao foi possivel excluir a conta financeira.';
        this.carregando = false;
      }
    });
  }

  protected cancelarEdicao(): void {
    this.contaEmEdicao = null;
    this.form.reset({
      nome: '',
      tipo: 'CONTA_CORRENTE',
      saldoInicial: 0
    });
  }

  protected formatarTipo(tipo: TipoContaFinanceira): string {
    return this.tipos.find((item) => item.valor === tipo)?.rotulo ?? tipo;
  }

  private carregarContas(): void {
    this.carregando = true;

    this.contaFinanceiraService.listar().subscribe({
      next: (contas) => {
        this.contas = contas;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar as contas financeiras.';
        this.carregando = false;
      }
    });
  }
}
