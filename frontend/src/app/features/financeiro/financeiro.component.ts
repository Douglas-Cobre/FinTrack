import { ConfirmacaoService } from '../../shared/confirmacao-dialog.component';
import { mensagemErro } from '../../shared/mensagem-erro';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { dataLocal } from '../../shared/data-local';
import { EfetivacaoDialogComponent } from './efetivacao-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Categoria } from '../../core/categorias/categoria.models';
import { CategoriaService } from '../../core/categorias/categoria.service';
import {
  ContaAPagar,
  ContaAPagarRequest,
  ContaAReceber,
  ContaAReceberRequest
} from '../../core/compromissos/compromisso.models';
import { ContaAPagarService } from '../../core/compromissos/conta-a-pagar.service';
import { ContaAReceberService } from '../../core/compromissos/conta-a-receber.service';
import { ContaFinanceira } from '../../core/contas/conta-financeira.models';
import { ContaFinanceiraService } from '../../core/contas/conta-financeira.service';
import { ConfiguracaoFinanceiraService } from '../../core/configuracoes/configuracao-financeira.service';
import { DecimalMaskDirective } from '../../shared/decimal-mask.directive';
import { FeatureShellComponent } from '../shared/feature-shell.component';

type TipoCompromisso = 'PAGAR' | 'RECEBER';
type FiltroCompromisso = 'TODOS' | TipoCompromisso;
type PainelAberto = 'FORMULARIO' | 'CONFIGURACAO' | null;

type CompromissoFinanceiro = {
  id: string;
  tipo: TipoCompromisso;
  descricao: string;
  valor: number;
  valorAtualizado: number;
  dataVencimento: string;
  status: string;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
  multaPercentual: number;
  jurosDiaPercentual: number;
  descontoPercentual: number;
  descontoDiasAntes: number;
  movimentacaoId: string | null;
};

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
    MatSelectModule,
    MatTableModule,
    DecimalMaskDirective,
    FeatureShellComponent
  ],
  template: `
    <app-feature-shell titulo="Financeiro">
      <section class="page-actions">
        <mat-button-toggle-group [value]="filtro" (change)="alterarFiltro($event.value)">
          <mat-button-toggle value="TODOS">Todos</mat-button-toggle>
          <mat-button-toggle value="PAGAR">A pagar</mat-button-toggle>
          <mat-button-toggle value="RECEBER">A receber</mat-button-toggle>
        </mat-button-toggle-group>

        <div class="spacer"></div>

        <button mat-stroked-button type="button" (click)="abrirConfiguracao()">Configuracao</button>
        <button mat-flat-button color="primary" type="button" (click)="novaConta()">Novo lançamento</button>
      </section>

      <p role="alert" class="error" *ngIf="erro">{{ erro }}</p>
      <p class="success" *ngIf="mensagem">{{ mensagem }}</p>

      <mat-card class="panel-card" appearance="outlined" *ngIf="painelAberto === 'CONFIGURACAO'">
        <mat-card-header>
          <mat-card-title>Configuracao financeira</mat-card-title>
          <mat-card-subtitle>Valores aplicados como padrao nas novas contas</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form class="config-grid" [formGroup]="configForm">
            <mat-form-field appearance="outline">
              <mat-label>Multa por atraso (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="multaPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Juros ao dia (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="jurosDiaPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Desconto (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="descontoPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Dias antes do vencimento</mat-label>
              <input matInput type="text" inputmode="numeric" appDecimalMask="integer" formControlName="descontoDiasAntes">
              <mat-hint>0 aplica somente no dia do vencimento</mat-hint>
            </mat-form-field>
          </form>

          <div class="actions">
            <button mat-flat-button color="primary" type="button" [disabled]="salvandoConfiguracao" (click)="salvarConfiguracao()">
              {{ salvandoConfiguracao ? 'Salvando...' : 'Salvar configuracao' }}
            </button>
            <button mat-button type="button" (click)="fecharPainel()">Fechar</button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="panel-card" appearance="outlined" *ngIf="painelAberto === 'FORMULARIO'">
        <mat-card-header>
          <mat-card-title>{{ emEdicao ? 'Editar lançamento' : 'Novo lançamento' }}</mat-card-title>
          <mat-card-subtitle>{{ form.controls.tipo.value === 'PAGAR' ? 'Obrigacao futura' : 'Valor a receber' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="salvar()">
            <mat-form-field appearance="outline">
              <mat-label>Tipo</mat-label>
              <mat-select formControlName="tipo" (selectionChange)="carregarCategoriasPorTipo()">
                <mat-option value="PAGAR">Conta a pagar</mat-option>
                <mat-option value="RECEBER">Conta a receber</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Descricao</mat-label>
              <input matInput formControlName="descricao">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Valor</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="currency" formControlName="valor">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Vencimento</mat-label>
              <input matInput type="date" formControlName="dataVencimento">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Conta</mat-label>
              <mat-select formControlName="contaFinanceiraId">
                <mat-option *ngFor="let conta of contas" [value]="conta.id">{{ conta.nome }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoria</mat-label>
              <mat-select formControlName="categoriaId">
                <mat-option *ngFor="let categoria of categorias" [value]="categoria.id">{{ categoria.nome }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Multa por atraso (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="multaPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Juros ao dia (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="jurosDiaPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Desconto (%)</mat-label>
              <input matInput type="text" inputmode="decimal" appDecimalMask="percentage" formControlName="descontoPercentual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Dias de antecedencia do desconto</mat-label>
              <input matInput type="text" inputmode="numeric" appDecimalMask="integer" formControlName="descontoDiasAntes">
            </mat-form-field>

            <div class="actions form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
              <button mat-button type="button" (click)="fecharPainel()">Cancelar</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="list-card" appearance="outlined">
        <mat-card-header>
          <mat-card-title>Lançamentos cadastrados</mat-card-title>
          <mat-card-subtitle>{{ compromissosFiltrados.length }} item(ns)</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="empty-state" *ngIf="compromissosFiltrados.length === 0">
            <strong>Nenhum lançamento cadastrado</strong>
            <span>Use o botão Novo lançamento para criar valores a pagar ou a receber.</span>
          </div>

          <div class="table-scroll" *ngIf="compromissosFiltrados.length > 0">
            <table mat-table [dataSource]="compromissosFiltrados" [trackBy]="identificarCompromisso" class="finance-table">
              <ng-container matColumnDef="descricao">
                <th mat-header-cell *matHeaderCellDef>Descrição</th>
                <td mat-cell *matCellDef="let item">
                  <strong class="description-cell">{{ item.descricao }}</strong>
                </td>
              </ng-container>

              <ng-container matColumnDef="tipo">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let item">
                  <span class="type-badge" [class.receita-badge]="item.tipo === 'RECEBER'" [class.despesa-badge]="item.tipo === 'PAGAR'">
                    {{ item.tipo === 'PAGAR' ? 'A pagar' : 'A receber' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="conta">
                <th mat-header-cell *matHeaderCellDef>Conta</th>
                <td mat-cell *matCellDef="let item">{{ item.contaFinanceiraNome }}</td>
              </ng-container>

              <ng-container matColumnDef="categoria">
                <th mat-header-cell *matHeaderCellDef>Categoria</th>
                <td mat-cell *matCellDef="let item">{{ item.categoriaNome }}</td>
              </ng-container>

              <ng-container matColumnDef="vencimento">
                <th mat-header-cell *matHeaderCellDef>Vencimento</th>
                <td mat-cell *matCellDef="let item">{{ item.dataVencimento | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let item">
                  <span
                    class="status-badge"
                    [class.status-success]="item.status === 'PAGA' || item.status === 'RECEBIDA'"
                    [class.status-danger]="item.status === 'ATRASADA'"
                    [class.status-muted]="item.status === 'CANCELADA'">
                    {{ rotuloStatus(item.status) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="valor">
                <th mat-header-cell *matHeaderCellDef class="value-header">Valor</th>
                <td mat-cell *matCellDef="let item" class="value-cell">
                  <strong [class.receita]="item.tipo === 'RECEBER'" [class.despesa]="item.tipo === 'PAGAR'">
                    {{ item.valorAtualizado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </strong>
                  <small *ngIf="item.valorAtualizado !== item.valor">
                    Original: {{ item.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </small>
                </td>
              </ng-container>

              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef class="actions-header">Ações</th>
                <td mat-cell *matCellDef="let item">
                  <div class="row-actions">
                    <button mat-button type="button" [disabled]="bloqueado(item)" (click)="efetivar(item)">
                      {{ item.tipo === 'PAGAR' ? 'Pagar' : 'Receber' }}
                    </button>
                    <button
                      mat-icon-button
                      type="button"
                      aria-label="Mais ações"
                      title="Mais ações"
                      [matMenuTriggerFor]="actionsMenu">
                      <span class="more-icon" aria-hidden="true">⋮</span>
                    </button>
                    <mat-menu #actionsMenu="matMenu">
                      <button mat-menu-item type="button" [disabled]="bloqueado(item)" (click)="editar(item)">Editar</button>
                      <button mat-menu-item type="button" [disabled]="bloqueado(item)" (click)="cancelarConta(item)">Cancelar</button>
                      <button mat-menu-item type="button" [disabled]="!!item.movimentacaoId" (click)="excluir(item)">Excluir</button>
                    </mat-menu>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="colunasTabela"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasTabela"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </app-feature-shell>
  `,
  styles: [`
    .page-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .error {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b42318;
    }

    .success {
      margin: 0 0 14px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #e8f6ef;
      color: #146c4a;
    }

    .panel-card {
      margin-bottom: 16px;
      border-radius: 8px;
    }

    .config-grid,
    .form-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(180px, 1fr));
      gap: 14px;
      padding-top: 20px;
    }

    .form-actions {
      grid-column: 1 / -1;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }

    .list-card {
      min-height: calc(100vh - 198px);
      border-radius: 8px;
      overflow: hidden;
    }

    .list-card mat-card-content {
      padding: 16px 0 0;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 8px;
      min-height: 360px;
      border: 1px dashed #cbd8d4;
      border-radius: 8px;
      background: #f8fbfa;
      text-align: center;
    }

    .table-scroll {
      width: 100%;
      overflow-x: auto;
    }

    .finance-table {
      width: 100%;
      min-width: 1120px;
      background: transparent;
    }

    .finance-table th.mat-mdc-header-cell {
      height: 48px;
      border-top: 1px solid #e2e9e6;
      border-bottom-color: #d8e1de;
      background: #f4f7f6;
      color: #52635e;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .finance-table td.mat-mdc-cell {
      height: 72px;
      border-bottom-color: #e5ebe9;
      color: #25332f;
    }

    .finance-table tr.mat-mdc-row:hover {
      background: #f8faf9;
    }

    .description-cell {
      display: block;
      max-width: 230px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .type-badge,
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      padding: 0 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .receita-badge {
      background: #e5f5ee;
      color: #146c4a;
    }

    .despesa-badge {
      background: #fcebe8;
      color: #a63b31;
    }

    .status-badge {
      background: #edf2f0;
      color: #485953;
    }

    .status-success {
      background: #e5f5ee;
      color: #146c4a;
    }

    .status-danger {
      background: #fcebe8;
      color: #a63b31;
    }

    .status-muted {
      background: #eceeed;
      color: #6b7471;
    }

    .value-header,
    .value-cell {
      text-align: right;
    }

    .value-cell strong,
    .value-cell small {
      display: block;
      white-space: nowrap;
    }

    .value-cell small {
      margin-top: 3px;
      color: #6b7d77;
      font-size: 11px;
    }

    .actions-header {
      text-align: center;
    }

    .row-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 2px;
      min-width: 142px;
    }

    .more-icon {
      font-size: 24px;
      line-height: 1;
    }

    .mat-column-descricao {
      width: 20%;
    }

    .mat-column-valor {
      padding-right: 24px;
    }

    .mat-column-acoes {
      width: 160px;
      padding-right: 16px;
    }

    .receita {
      color: #16875d;
    }

    .despesa {
      color: #c24134;
    }

    @media (max-width: 1100px) {
      .config-grid,
      .form-grid {
        grid-template-columns: repeat(2, minmax(180px, 1fr));
      }
    }

    @media (max-width: 760px) {
      .page-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .spacer {
        display: none;
      }

      .config-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FinanceiroComponent implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  protected contas: ContaFinanceira[] = [];
  protected categorias: Categoria[] = [];
  protected contasAPagar: ContaAPagar[] = [];
  protected contasAReceber: ContaAReceber[] = [];
  protected filtro: FiltroCompromisso = 'TODOS';
  protected painelAberto: PainelAberto = null;
  protected emEdicao: CompromissoFinanceiro | null = null;
  protected erro = '';
  protected mensagem = '';
  protected salvandoConfiguracao = false;
  protected readonly colunasTabela = [
    'descricao',
    'tipo',
    'conta',
    'categoria',
    'vencimento',
    'status',
    'valor',
    'acoes'
  ];

  protected readonly configForm = this.fb.nonNullable.group({
    multaPercentual: [2, [Validators.required, Validators.min(0)]],
    jurosDiaPercentual: [0.03, [Validators.required, Validators.min(0)]],
    descontoPercentual: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    descontoDiasAntes: [0, [Validators.required, Validators.min(0)]]
  });

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['PAGAR' as TipoCompromisso, Validators.required],
    descricao: [''],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    dataVencimento: [dataLocal(), Validators.required],
    contaFinanceiraId: ['', Validators.required],
    categoriaId: ['', Validators.required],
    multaPercentual: [2, [Validators.required, Validators.min(0)]],
    jurosDiaPercentual: [0.03, [Validators.required, Validators.min(0)]],
    descontoPercentual: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    descontoDiasAntes: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialog: MatDialog,
    private readonly contaAPagarService: ContaAPagarService,
    private readonly contaAReceberService: ContaAReceberService,
    private readonly contaFinanceiraService: ContaFinanceiraService,
    private readonly categoriaService: CategoriaService,
    private readonly configuracaoFinanceiraService: ConfiguracaoFinanceiraService
  ) {}

  ngOnInit(): void {
    this.carregarBase();
    this.carregar();
  }

  protected compromissosFiltrados: CompromissoFinanceiro[] = [];

  protected readonly identificarCompromisso = (_: number, item: CompromissoFinanceiro): string => `${item.tipo}:${item.id}`;

  private atualizarLista(): void {
    this.compromissosFiltrados = this.compromissos
      .filter((item) => this.filtro === 'TODOS' || item.tipo === this.filtro)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }

  private get compromissos(): CompromissoFinanceiro[] {
    return [
      ...this.contasAPagar.map((item) => this.mapearPagar(item)),
      ...this.contasAReceber.map((item) => this.mapearReceber(item))
    ];
  }

  protected alterarFiltro(filtro: FiltroCompromisso): void {
    this.filtro = filtro;
    this.atualizarLista();
  }

  protected novaConta(): void {
    this.emEdicao = null;
    this.painelAberto = 'FORMULARIO';
    const config = this.configForm.getRawValue();

    this.form.reset({
      tipo: this.filtro === 'RECEBER' ? 'RECEBER' : 'PAGAR',
      descricao: '',
      valor: 0,
      dataVencimento: dataLocal(),
      contaFinanceiraId: '',
      categoriaId: '',
      ...config
    });
    this.carregarCategoriasPorTipo();
  }

  protected abrirConfiguracao(): void {
    this.mensagem = '';
    this.painelAberto = this.painelAberto === 'CONFIGURACAO' ? null : 'CONFIGURACAO';
  }

  protected salvarConfiguracao(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.erro = '';
    this.mensagem = '';
    this.salvandoConfiguracao = true;
    const configuracao = {
      ...this.configForm.getRawValue(),
      descontoDiasAntes: Math.trunc(this.configForm.controls.descontoDiasAntes.value)
    };

    this.configuracaoFinanceiraService.salvar(configuracao).subscribe({
      next: (salva) => {
        this.configForm.setValue(salva);
        this.form.patchValue(salva);
        this.salvandoConfiguracao = false;
        this.mensagem = 'Configuracao salva.';
      },
      error: error => {
        this.salvandoConfiguracao = false;
        this.erro = mensagemErro(error, 'Nao foi possivel salvar a configuracao.');
      }
    });
  }

  protected fecharPainel(): void {
    this.painelAberto = null;
    this.emEdicao = null;
    this.erro = '';
    this.mensagem = '';
  }

  protected carregarCategoriasPorTipo(): void {
    const tipoMovimentacao = this.form.controls.tipo.value === 'PAGAR' ? 'DESPESA' : 'RECEITA';

    this.categoriaService.listar(tipoMovimentacao).subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.form.controls.categoriaId.setValue('');
      },
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar categorias.')
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.erro = '';
    const dados = this.form.getRawValue();

    if (dados.tipo === 'PAGAR') {
      const request: ContaAPagarRequest = {
        descricao: dados.descricao,
        valor: dados.valor,
        dataVencimento: dados.dataVencimento,
        contaFinanceiraId: dados.contaFinanceiraId,
        categoriaId: dados.categoriaId,
        multaPercentual: dados.multaPercentual,
        jurosDiaPercentual: dados.jurosDiaPercentual,
        descontoPercentual: dados.descontoPercentual,
        descontoDiasAntes: Math.trunc(dados.descontoDiasAntes),
        status: this.emEdicao?.tipo === 'PAGAR' ? this.emEdicao.status as ContaAPagar['status'] : 'PENDENTE'
      };

      const operacao = this.emEdicao?.tipo === 'PAGAR'
        ? this.contaAPagarService.atualizar(this.emEdicao.id, request)
        : this.contaAPagarService.criar(request);

      operacao.subscribe({ next: () => this.finalizarSalvamento(), error: error => this.erro = mensagemErro(error, 'Nao foi possivel salvar a conta.') });
      return;
    }

    const request: ContaAReceberRequest = {
      descricao: dados.descricao,
      valor: dados.valor,
      dataVencimento: dados.dataVencimento,
      contaFinanceiraId: dados.contaFinanceiraId,
      categoriaId: dados.categoriaId,
      multaPercentual: dados.multaPercentual,
      jurosDiaPercentual: dados.jurosDiaPercentual,
      descontoPercentual: dados.descontoPercentual,
      descontoDiasAntes: Math.trunc(dados.descontoDiasAntes),
      status: this.emEdicao?.tipo === 'RECEBER' ? this.emEdicao.status as ContaAReceber['status'] : 'PENDENTE'
    };

    const operacao = this.emEdicao?.tipo === 'RECEBER'
      ? this.contaAReceberService.atualizar(this.emEdicao.id, request)
      : this.contaAReceberService.criar(request);

    operacao.subscribe({ next: () => this.finalizarSalvamento(), error: error => this.erro = mensagemErro(error, 'Nao foi possivel salvar a conta.') });
  }

  protected editar(item: CompromissoFinanceiro): void {
    this.emEdicao = item;
    this.painelAberto = 'FORMULARIO';
    this.form.setValue({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: item.valor,
      dataVencimento: item.dataVencimento,
      contaFinanceiraId: item.contaFinanceiraId,
      categoriaId: item.categoriaId,
      multaPercentual: item.multaPercentual,
      jurosDiaPercentual: item.jurosDiaPercentual,
      descontoPercentual: item.descontoPercentual,
      descontoDiasAntes: item.descontoDiasAntes
    });

    const tipoMovimentacao = item.tipo === 'PAGAR' ? 'DESPESA' : 'RECEITA';
    this.categoriaService.listar(tipoMovimentacao).subscribe((categorias) => this.categorias = categorias);
  }

  protected efetivar(item: CompromissoFinanceiro): void {
    if (this.bloqueado(item)) return;
    this.dialog.open(EfetivacaoDialogComponent, {
      data: { id: item.id, tipo: item.tipo, descricao: item.descricao, contaFinanceiraNome: item.contaFinanceiraNome },
      width: '480px', maxWidth: '95vw'
    }).afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.erro = '';
        this.mensagem = item.tipo === 'PAGAR' ? 'Pagamento registrado.' : 'Recebimento registrado.';
        this.carregar();
      }
    });
  }

  protected cancelarConta(item: CompromissoFinanceiro): void {
    this.confirmacao.executar({
      titulo: 'Cancelar compromisso?',
      mensagem: `Confirmar a operação em "${item.descricao}"? Esta ação não pode ser desfeita.`,
      acao: 'Cancelar compromisso',
      executar: () => item.tipo === 'PAGAR'
        ? this.contaAPagarService.cancelar(item.id)
        : this.contaAReceberService.cancelar(item.id)
    }).subscribe(confirmado => {
      if (confirmado) { this.erro = ''; this.carregar(); }
    });
  }

  protected excluir(item: CompromissoFinanceiro): void {
    this.confirmacao.executar({
      titulo: 'Excluir?',
      mensagem: `Confirmar a operação em "${item.descricao}"? Esta ação não pode ser desfeita.`,
      acao: 'Excluir',
      executar: () => item.tipo === 'PAGAR'
        ? this.contaAPagarService.excluir(item.id)
        : this.contaAReceberService.excluir(item.id)
    }).subscribe(confirmado => {
      if (confirmado) { this.erro = ''; this.carregar(); }
    });
  }

  protected bloqueado(item: CompromissoFinanceiro): boolean {
    return !!item.movimentacaoId || ['PAGA', 'RECEBIDA', 'CANCELADA'].includes(item.status);
  }

  protected rotuloStatus(status: string): string {
    const rotulos: Record<string, string> = {
      PENDENTE: 'Pendente',
      PAGA: 'Paga',
      RECEBIDA: 'Recebida',
      ATRASADA: 'Atrasada',
      CANCELADA: 'Cancelada'
    };

    return rotulos[status] ?? status;
  }

  private carregarBase(): void {
    this.contaFinanceiraService.listar().subscribe((contas) => this.contas = contas);
    this.configuracaoFinanceiraService.obter().subscribe({
      next: (configuracao) => this.configForm.setValue(configuracao),
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar a configuracao financeira.')
    });
    this.carregarCategoriasPorTipo();
  }

  private carregar(): void {
    forkJoin({
      contasAPagar: this.contaAPagarService.listar(),
      contasAReceber: this.contaAReceberService.listar()
    }).subscribe({
      next: ({ contasAPagar, contasAReceber }) => {
        this.contasAPagar = contasAPagar;
        this.contasAReceber = contasAReceber;
        this.atualizarLista();
      },
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar as contas.')
    });
  }

  private finalizarSalvamento(): void {
    this.fecharPainel();
    this.carregar();
  }

  private mapearPagar(item: ContaAPagar): CompromissoFinanceiro {
    return {
      ...item,
      tipo: 'PAGAR'
    };
  }

  private mapearReceber(item: ContaAReceber): CompromissoFinanceiro {
    return {
      ...item,
      tipo: 'RECEBER'
    };
  }
}
