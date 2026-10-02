import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { ResumoFinanceiro } from '../../core/relatorios/relatorio.models';
import { RelatorioService } from '../../core/relatorios/relatorio.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatListModule, FeatureShellComponent],
  template: `
    <app-feature-shell titulo="Relatorios" eyebrow="Fase 10">
      <section class="summary-grid" *ngIf="resumo">
        <mat-card appearance="outlined">
          <mat-card-content>
            <span>Receitas</span>
            <strong class="receita">{{ resumo.receitas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content>
            <span>Despesas</span>
            <strong class="despesa">{{ resumo.despesas | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content>
            <span>Resultado</span>
            <strong>{{ resumo.resultado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
          </mat-card-content>
        </mat-card>
      </section>

      <section class="layout" *ngIf="resumo">
        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Receitas por categoria</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="empty" *ngIf="resumo.receitasPorCategoria.length === 0">Sem receitas registradas.</div>
            <mat-list *ngIf="resumo.receitasPorCategoria.length > 0">
              <mat-list-item *ngFor="let item of resumo.receitasPorCategoria">
                <span matListItemTitle>{{ item.categoria }}</span>
                <strong>{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Despesas por categoria</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="empty" *ngIf="resumo.despesasPorCategoria.length === 0">Sem despesas registradas.</div>
            <mat-list *ngIf="resumo.despesasPorCategoria.length > 0">
              <mat-list-item *ngFor="let item of resumo.despesasPorCategoria">
                <span matListItemTitle>{{ item.categoria }}</span>
                <strong>{{ item.total | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    </app-feature-shell>
  `,
  styles: [`
    .summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}
    mat-card-content{display:grid;gap:10px} mat-card-content span{color:#5c6f69} mat-card-content strong{font-size:26px}
    .layout{display:grid;grid-template-columns:1fr 1fr;gap:18px}.receita{color:#16875d}.despesa{color:#c24134}
    mat-list-item strong{margin-left:auto}.empty{padding:24px;border:1px dashed #cbd8d4;border-radius:8px;text-align:center;color:#5c6f69}
    @media(max-width:900px){.summary-grid,.layout{grid-template-columns:1fr}}
  `]
})
export class RelatoriosComponent implements OnInit {
  protected resumo: ResumoFinanceiro | null = null;

  constructor(private readonly relatorioService: RelatorioService) {}

  ngOnInit(): void {
    this.relatorioService.resumo().subscribe((resumo) => this.resumo = resumo);
  }
}
