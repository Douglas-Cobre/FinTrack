import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/auth/auth.service';
import { ContaAPagarService } from '../../core/compromissos/conta-a-pagar.service';
import { ContaAReceberService } from '../../core/compromissos/conta-a-receber.service';
import { ContaAPagar, ContaAReceber } from '../../core/compromissos/compromisso.models';
import { ContaFinanceira } from '../../core/contas/conta-financeira.models';
import { ContaFinanceiraService } from '../../core/contas/conta-financeira.service';
import { Movimentacao } from '../../core/movimentacoes/movimentacao.models';
import { MovimentacaoService } from '../../core/movimentacoes/movimentacao.service';
import { ResumoFinanceiro } from '../../core/relatorios/relatorio.models';
import { RelatorioService } from '../../core/relatorios/relatorio.service';

type CompromissoDashboard = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  tipo: 'PAGAR' | 'RECEBER';
};

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatToolbarModule,
    RouterLink
  ],
  template: `
    <mat-toolbar class="toolbar">
      <div>
        <span class="eyebrow">Outubro de 2026</span>
        <h1>Dashboard financeiro</h1>
      </div>

      <span class="spacer"></span>

      <button mat-stroked-button type="button">Exportar</button>
      <button mat-flat-button color="primary" type="button" routerLink="/contas">Cadastrar conta</button>
      <button mat-button type="button" (click)="sair()">Sair</button>
    </mat-toolbar>

    <main class="content">
      <section class="welcome" *ngIf="usuarioAtual() as usuario">
        <span>Ola, {{ usuario.nome }}</span>
        <strong>{{ usuario.email }}</strong>
      </section>

      <p class="error" *ngIf="erro">{{ erro }}</p>

      <section class="indicators" aria-label="Indicadores financeiros">
        <mat-card class="indicator-card" appearance="outlined">
          <mat-card-content>
            <span>Saldo atual</span>
            <strong>{{ saldoAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>{{ contas.length }} conta(s) financeira(s)</small>
          </mat-card-content>
        </mat-card>

        <mat-card class="indicator-card" appearance="outlined">
          <mat-card-content>
            <span>Receitas</span>
            <strong class="income-text">{{ (resumo?.receitas ?? 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>{{ resumo?.receitasPorCategoria?.length ?? 0 }} categoria(s)</small>
          </mat-card-content>
        </mat-card>

        <mat-card class="indicator-card" appearance="outlined">
          <mat-card-content>
            <span>Despesas</span>
            <strong class="expense-text">{{ (resumo?.despesas ?? 0) | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>{{ resumo?.despesasPorCategoria?.length ?? 0 }} categoria(s)</small>
          </mat-card-content>
        </mat-card>

        <mat-card class="indicator-card" appearance="outlined">
          <mat-card-content>
            <span>A pagar</span>
            <strong>{{ totalAPagar | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            <small>{{ proximosCompromissos.length }} compromisso(s) pendente(s)</small>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="dashboard-grid">
        <mat-card class="panel cashflow-panel" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Receitas x despesas</mat-card-title>
            <mat-card-subtitle>Comparativo mensal</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state">
              <ng-container *ngIf="resumo && (resumo.receitasPorCategoria.length > 0 || resumo.despesasPorCategoria.length > 0); else semFluxo">
                <div class="category-summary">
                  <div>
                    <strong>Receitas por categoria</strong>
                    <span *ngFor="let item of resumo.receitasPorCategoria">
                      {{ item.categoria }}
                      <b class="income-text">{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</b>
                    </span>
                  </div>

                  <div>
                    <strong>Despesas por categoria</strong>
                    <span *ngFor="let item of resumo.despesasPorCategoria">
                      {{ item.categoria }}
                      <b class="expense-text">{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</b>
                    </span>
                  </div>
                </div>
              </ng-container>

              <ng-template #semFluxo>
                <strong>Nenhuma movimentacao registrada</strong>
                <span>O grafico sera exibido quando existirem receitas e despesas reais.</span>
              </ng-template>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Saldos por conta</mat-card-title>
            <mat-card-subtitle>Atualizado agora</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state compact" *ngIf="contas.length === 0">
              <strong>Nenhuma conta cadastrada</strong>
              <span>Crie uma conta financeira para iniciar o controle de saldo.</span>
            </div>

            <mat-list *ngIf="contas.length > 0">
              <mat-list-item *ngFor="let conta of contas">
                <span matListItemTitle>{{ conta.nome }}</span>
                <span matListItemLine>{{ conta.tipo }}</span>
                <strong class="row-value">{{ conta.saldoAtual | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Ultimos lancamentos</mat-card-title>
            <mat-card-subtitle>Movimentacoes efetivadas</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state compact" *ngIf="ultimasMovimentacoes.length === 0">
              <strong>Nenhum lancamento</strong>
              <span>As movimentacoes efetivadas aparecerao aqui.</span>
            </div>

            <mat-list *ngIf="ultimasMovimentacoes.length > 0">
              <mat-list-item *ngFor="let movimentacao of ultimasMovimentacoes">
                <span matListItemTitle>{{ movimentacao.descricao }}</span>
                <span matListItemLine>{{ movimentacao.contaFinanceiraNome }} - {{ movimentacao.categoriaNome }}</span>
                <strong
                  class="row-value"
                  [class.income-text]="movimentacao.tipo === 'RECEITA'"
                  [class.expense-text]="movimentacao.tipo === 'DESPESA'"
                >
                  {{ movimentacao.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </strong>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card class="panel" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Proximos compromissos</mat-card-title>
            <mat-card-subtitle>Contas e recebiveis</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state compact" *ngIf="proximosCompromissos.length === 0">
              <strong>Nenhum compromisso futuro</strong>
              <span>Contas a pagar e receber serao listadas nesta area.</span>
            </div>

            <mat-list *ngIf="proximosCompromissos.length > 0">
              <mat-list-item *ngFor="let compromisso of proximosCompromissos">
                <span matListItemTitle>{{ compromisso.descricao }}</span>
                <span matListItemLine>{{ compromisso.tipo === 'PAGAR' ? 'A pagar' : 'A receber' }} - {{ compromisso.dataVencimento | date:'dd/MM/yyyy' }}</span>
                <strong
                  class="row-value"
                  [class.income-text]="compromisso.tipo === 'RECEBER'"
                  [class.expense-text]="compromisso.tipo === 'PAGAR'"
                >
                  {{ compromisso.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </strong>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100%;
      background: #eef2f1;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 3;
      gap: 10px;
      min-height: 88px;
      padding: 16px 28px;
      background: rgba(238, 242, 241, 0.92);
      backdrop-filter: blur(14px);
    }

    .toolbar h1 {
      margin: 0;
      color: #17231f;
      font-size: 30px;
      line-height: 1.15;
      font-weight: 800;
    }

    .eyebrow {
      display: block;
      margin-bottom: 5px;
      color: #2f6f63;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .content {
      padding: 20px 28px 32px;
    }

    .welcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 14px;
      padding: 14px 16px;
      border: 1px solid #dce5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #5c6f69;
    }

    .welcome strong {
      color: #17231f;
      font-weight: 700;
    }

    .error {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b42318;
      font-size: 14px;
    }

    .indicators {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 14px;
    }

    .indicator-card mat-card-content {
      display: grid;
      gap: 12px;
      min-height: 116px;
    }

    .indicator-card span {
      color: #5c6f69;
    }

    .indicator-card strong {
      color: #13241f;
      font-size: 26px;
      line-height: 1;
    }

    .indicator-card small {
      color: #5c6f69;
      line-height: 1.45;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
      gap: 14px;
    }

    .panel {
      border-radius: 8px;
    }

    .cashflow-panel {
      min-height: 350px;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 8px;
      min-height: 228px;
      padding: 24px;
      border: 1px dashed #cbd8d4;
      border-radius: 8px;
      background: #f8fbfa;
      text-align: center;
    }

    .empty-state.compact {
      min-height: 154px;
    }

    .empty-state strong {
      color: #17231f;
      font-size: 17px;
    }

    .empty-state span {
      color: #5c6f69;
      line-height: 1.5;
    }

    .category-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      width: 100%;
      align-self: stretch;
      text-align: left;
    }

    .category-summary div {
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 16px;
      border-radius: 8px;
      background: #ffffff;
    }

    .category-summary span {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    .income-text {
      color: #16875d;
    }

    .expense-text {
      color: #c24134;
    }

    mat-list {
      padding: 0;
    }

    mat-list-item {
      min-height: 70px;
      border-bottom: 1px solid #edf2f0;
    }

    .row-value {
      margin-left: auto;
      color: #17231f;
      white-space: nowrap;
    }

    @media (max-width: 1100px) {
      .indicators {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .toolbar {
        align-items: flex-start;
        flex-wrap: wrap;
        min-height: auto;
        padding: 16px;
      }

      .spacer {
        display: none;
      }

      .toolbar button {
        flex: 1 1 180px;
      }

      .content {
        padding: 16px;
      }

      .dashboard-grid,
      .indicators,
      .category-summary {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 560px) {
      .toolbar h1 {
        font-size: 25px;
      }

      .toolbar button {
        flex-basis: 100%;
      }
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  protected readonly usuarioAtual = this.authService.usuarioAtual;

  protected resumo: ResumoFinanceiro | null = null;
  protected contas: ContaFinanceira[] = [];
  protected movimentacoes: Movimentacao[] = [];
  protected contasAPagar: ContaAPagar[] = [];
  protected contasAReceber: ContaAReceber[] = [];
  protected carregando = true;
  protected erro = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly relatorioService: RelatorioService,
    private readonly contaFinanceiraService: ContaFinanceiraService,
    private readonly movimentacaoService: MovimentacaoService,
    private readonly contaAPagarService: ContaAPagarService,
    private readonly contaAReceberService: ContaAReceberService
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
  }

  protected sair(): void {
    this.authService.sair();
    this.router.navigateByUrl('/login');
  }

  protected get saldoAtual(): number {
    return this.contas.reduce((total, conta) => total + conta.saldoAtual, 0);
  }

  protected get totalAPagar(): number {
    return this.contasAPagar
      .filter((conta) => conta.status === 'PENDENTE' || conta.status === 'ATRASADA')
      .reduce((total, conta) => total + conta.valor, 0);
  }

  protected get ultimasMovimentacoes(): Movimentacao[] {
    return this.movimentacoes.slice(0, 5);
  }

  protected get proximosCompromissos(): CompromissoDashboard[] {
    const contasAPagar = this.contasAPagar
      .filter((conta) => conta.status === 'PENDENTE' || conta.status === 'ATRASADA')
      .map((conta) => ({
        descricao: conta.descricao,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        tipo: 'PAGAR' as const
      }));

    const contasAReceber = this.contasAReceber
      .filter((conta) => conta.status === 'PENDENTE' || conta.status === 'ATRASADA')
      .map((conta) => ({
        descricao: conta.descricao,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        tipo: 'RECEBER' as const
      }));

    return [...contasAPagar, ...contasAReceber]
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .slice(0, 5);
  }

  private carregarDashboard(): void {
    this.carregando = true;
    this.erro = '';

    forkJoin({
      resumo: this.relatorioService.resumo(),
      contas: this.contaFinanceiraService.listar(),
      movimentacoes: this.movimentacaoService.listar(),
      contasAPagar: this.contaAPagarService.listar(),
      contasAReceber: this.contaAReceberService.listar()
    }).subscribe({
      next: ({ resumo, contas, movimentacoes, contasAPagar, contasAReceber }) => {
        this.resumo = resumo;
        this.contas = contas;
        this.movimentacoes = movimentacoes;
        this.contasAPagar = contasAPagar;
        this.contasAReceber = contasAReceber;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar os dados da dashboard.';
        this.carregando = false;
      }
    });
  }
}
