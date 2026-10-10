import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ResumoFinanceiro, TotalPorCategoria } from '../../core/relatorios/relatorio.models';
import { RelatorioService } from '../../core/relatorios/relatorio.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

type LinhaCategoria = TotalPorCategoria & {
  percentual: number;
};

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    BaseChartDirective,
    FeatureShellComponent
  ],
  template: `
    <app-feature-shell titulo="Relatórios">
      <mat-progress-bar *ngIf="carregando" mode="indeterminate"></mat-progress-bar>

      <section class="error-state" *ngIf="erro">
        <strong>Não foi possível carregar os relatórios.</strong>
        <button mat-stroked-button type="button" (click)="carregar()">Tentar novamente</button>
      </section>

      <ng-container *ngIf="resumo && !erro">
        <section class="summary-grid" aria-label="Resumo financeiro">
          <mat-card appearance="outlined" class="summary-card">
            <mat-card-content>
              <span>Receitas</span>
              <strong class="receita">{{ resumo.receitas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined" class="summary-card">
            <mat-card-content>
              <span>Despesas</span>
              <strong class="despesa">{{ resumo.despesas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined" class="summary-card">
            <mat-card-content>
              <span>Resultado</span>
              <strong [class.receita]="resumo.resultado >= 0" [class.despesa]="resumo.resultado < 0">
                {{ resumo.resultado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </strong>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="charts-grid" aria-label="Gráficos por categoria">
          <mat-card appearance="outlined" class="report-card">
            <mat-card-header>
              <mat-card-title>Distribuição das receitas</mat-card-title>
              <mat-card-subtitle>Participação de cada categoria</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container" *ngIf="receitasDataSource.data.length; else semReceitas">
                <canvas
                  baseChart
                  type="doughnut"
                  [data]="receitasChartData"
                  [options]="chartOptions"
                  role="img"
                  aria-label="Gráfico de receitas por categoria">
                </canvas>
              </div>
              <ng-template #semReceitas>
                <div class="empty-state">Sem receitas registradas.</div>
              </ng-template>
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined" class="report-card">
            <mat-card-header>
              <mat-card-title>Distribuição das despesas</mat-card-title>
              <mat-card-subtitle>Participação de cada categoria</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container" *ngIf="despesasDataSource.data.length; else semDespesas">
                <canvas
                  baseChart
                  type="doughnut"
                  [data]="despesasChartData"
                  [options]="chartOptions"
                  role="img"
                  aria-label="Gráfico de despesas por categoria">
                </canvas>
              </div>
              <ng-template #semDespesas>
                <div class="empty-state">Sem despesas registradas.</div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="tables-grid" aria-label="Detalhamento por categoria">
          <mat-card appearance="outlined" class="report-card table-card">
            <mat-card-header>
              <mat-card-title>Receitas por categoria</mat-card-title>
              <mat-card-subtitle>{{ receitasDataSource.data.length }} categoria(s)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="table-scroll" *ngIf="receitasDataSource.data.length; else tabelaReceitasVazia">
                <table mat-table [dataSource]="receitasDataSource" matSort #receitasSort="matSort" class="report-table">
                  <ng-container matColumnDef="categoria">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Categoria</th>
                    <td mat-cell *matCellDef="let item">{{ item.categoria }}</td>
                    <td mat-footer-cell *matFooterCellDef>Total</td>
                  </ng-container>

                  <ng-container matColumnDef="percentual">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Participação</th>
                    <td mat-cell *matCellDef="let item">{{ item.percentual / 100 | percent:'1.1-1':'pt-BR' }}</td>
                    <td mat-footer-cell *matFooterCellDef>100%</td>
                  </ng-container>

                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header class="value-header">Valor</th>
                    <td mat-cell *matCellDef="let item" class="value-cell receita">
                      {{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </td>
                    <td mat-footer-cell *matFooterCellDef class="value-cell receita">
                      {{ resumo.receitas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="colunasTabela"></tr>
                  <tr mat-row *matRowDef="let row; columns: colunasTabela"></tr>
                  <tr mat-footer-row *matFooterRowDef="colunasTabela"></tr>
                </table>
              </div>
              <ng-template #tabelaReceitasVazia>
                <div class="empty-state">Sem receitas para detalhar.</div>
              </ng-template>
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined" class="report-card table-card">
            <mat-card-header>
              <mat-card-title>Despesas por categoria</mat-card-title>
              <mat-card-subtitle>{{ despesasDataSource.data.length }} categoria(s)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="table-scroll" *ngIf="despesasDataSource.data.length; else tabelaDespesasVazia">
                <table mat-table [dataSource]="despesasDataSource" matSort #despesasSort="matSort" class="report-table">
                  <ng-container matColumnDef="categoria">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Categoria</th>
                    <td mat-cell *matCellDef="let item">{{ item.categoria }}</td>
                    <td mat-footer-cell *matFooterCellDef>Total</td>
                  </ng-container>

                  <ng-container matColumnDef="percentual">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Participação</th>
                    <td mat-cell *matCellDef="let item">{{ item.percentual / 100 | percent:'1.1-1':'pt-BR' }}</td>
                    <td mat-footer-cell *matFooterCellDef>100%</td>
                  </ng-container>

                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header class="value-header">Valor</th>
                    <td mat-cell *matCellDef="let item" class="value-cell despesa">
                      {{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </td>
                    <td mat-footer-cell *matFooterCellDef class="value-cell despesa">
                      {{ resumo.despesas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="colunasTabela"></tr>
                  <tr mat-row *matRowDef="let row; columns: colunasTabela"></tr>
                  <tr mat-footer-row *matFooterRowDef="colunasTabela"></tr>
                </table>
              </div>
              <ng-template #tabelaDespesasVazia>
                <div class="empty-state">Sem despesas para detalhar.</div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </section>
      </ng-container>
    </app-feature-shell>
  `,
  styles: [`
    :host {
      display: block;
    }

    mat-progress-bar {
      margin-bottom: 18px;
    }

    .summary-grid,
    .charts-grid,
    .tables-grid {
      display: grid;
      gap: 16px;
    }

    .summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-bottom: 16px;
    }

    .charts-grid,
    .tables-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-bottom: 16px;
    }

    mat-card {
      border-radius: 8px;
    }

    .summary-card mat-card-content {
      display: grid;
      gap: 8px;
      padding: 18px 20px;
    }

    .summary-card span {
      color: #5c6f69;
      font-size: 14px;
    }

    .summary-card strong {
      font-size: 28px;
      line-height: 1.15;
      white-space: nowrap;
    }

    .report-card mat-card-content {
      padding-top: 16px;
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
    }

    .table-card {
      overflow: hidden;
    }

    .table-card mat-card-content {
      padding: 16px 0 0;
    }

    .table-scroll {
      width: 100%;
      overflow-x: auto;
    }

    .report-table {
      width: 100%;
      min-width: 520px;
      background: transparent;
    }

    .report-table th.mat-mdc-header-cell {
      height: 46px;
      border-top: 1px solid #e2e9e6;
      border-bottom-color: #d8e1de;
      background: #f4f7f6;
      color: #52635e;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .report-table td.mat-mdc-cell {
      height: 54px;
      border-bottom-color: #e5ebe9;
    }

    .report-table tr.mat-mdc-row:hover {
      background: #f8faf9;
    }

    .report-table td.mat-mdc-footer-cell {
      height: 54px;
      border-top: 1px solid #d8e1de;
      border-bottom: 0;
      background: #f8faf9;
      font-weight: 800;
    }

    .mat-column-categoria {
      width: 46%;
    }

    .mat-column-percentual {
      width: 24%;
      white-space: nowrap;
    }

    .value-header,
    .value-cell {
      text-align: right;
      white-space: nowrap;
    }

    .receita {
      color: #16875d;
    }

    .despesa {
      color: #c24134;
    }

    .empty-state,
    .error-state {
      display: grid;
      place-items: center;
      gap: 12px;
      min-height: 220px;
      border: 1px dashed #cbd8d4;
      border-radius: 8px;
      color: #5c6f69;
      text-align: center;
    }

    .error-state {
      min-height: 180px;
      border-color: #e3b7b1;
      background: #fff8f7;
      color: #9c332a;
    }

    @media (max-width: 1050px) {
      .charts-grid,
      .tables-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 760px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }

      .summary-card strong {
        font-size: 24px;
      }

      .chart-container {
        height: 260px;
      }
    }
  `]
})
export class RelatoriosComponent implements OnInit {
  protected resumo: ResumoFinanceiro | null = null;
  protected carregando = false;
  protected erro = false;
  protected readonly colunasTabela = ['categoria', 'percentual', 'total'];
  protected readonly receitasDataSource = new MatTableDataSource<LinhaCategoria>();
  protected readonly despesasDataSource = new MatTableDataSource<LinhaCategoria>();

  protected receitasChartData: ChartConfiguration<'doughnut'>['data'] = this.criarChartData([], []);
  protected despesasChartData: ChartConfiguration<'doughnut'>['data'] = this.criarChartData([], []);

  protected readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 18,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const valor = Number(context.raw ?? 0);
            return `${context.label}: ${this.formatadorMoeda.format(valor)}`;
          }
        }
      }
    }
  };

  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  private readonly coresReceitas = ['#16875d', '#2f6f63', '#2f75b5', '#d9a441', '#7a6b9d', '#53917e'];
  private readonly coresDespesas = ['#c24134', '#d97736', '#b55f7a', '#7a6b9d', '#58768a', '#c09a3e'];

  constructor(private readonly relatorioService: RelatorioService) {}

  @ViewChild('receitasSort')
  set receitasSort(sort: MatSort | undefined) {
    if (sort) {
      this.receitasDataSource.sort = sort;
    }
  }

  @ViewChild('despesasSort')
  set despesasSort(sort: MatSort | undefined) {
    if (sort) {
      this.despesasDataSource.sort = sort;
    }
  }

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando = true;
    this.erro = false;

    this.relatorioService.resumo().subscribe({
      next: (resumo) => {
        this.resumo = resumo;
        this.atualizarVisualizacoes(resumo);
        this.carregando = false;
      },
      error: () => {
        this.erro = true;
        this.carregando = false;
      }
    });
  }

  private atualizarVisualizacoes(resumo: ResumoFinanceiro): void {
    this.receitasDataSource.data = this.criarLinhas(resumo.receitasPorCategoria, resumo.receitas);
    this.despesasDataSource.data = this.criarLinhas(resumo.despesasPorCategoria, resumo.despesas);
    this.receitasChartData = this.criarChartData(resumo.receitasPorCategoria, this.coresReceitas);
    this.despesasChartData = this.criarChartData(resumo.despesasPorCategoria, this.coresDespesas);
  }

  private criarLinhas(itens: TotalPorCategoria[], total: number): LinhaCategoria[] {
    return itens.map((item) => ({
      ...item,
      percentual: total > 0 ? item.total / total * 100 : 0
    }));
  }

  private criarChartData(
    itens: TotalPorCategoria[],
    cores: string[]
  ): ChartConfiguration<'doughnut'>['data'] {
    return {
      labels: itens.map((item) => item.categoria),
      datasets: [
        {
          data: itens.map((item) => item.total),
          backgroundColor: itens.map((_, index) => cores[index % cores.length]),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 5
        }
      ]
    };
  }
}
