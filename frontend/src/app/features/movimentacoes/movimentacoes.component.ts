import { finalize } from 'rxjs';
import { ConfirmacaoService } from '../../shared/confirmacao-dialog.component';
import { mensagemErro } from '../../shared/mensagem-erro';
import { dataLocal } from '../../shared/data-local';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { Categoria, TipoMovimentacao } from '../../core/categorias/categoria.models';
import { CategoriaService } from '../../core/categorias/categoria.service';
import { ContaFinanceira } from '../../core/contas/conta-financeira.models';
import { ContaFinanceiraService } from '../../core/contas/conta-financeira.service';
import { Movimentacao } from '../../core/movimentacoes/movimentacao.models';
import { MovimentacaoService } from '../../core/movimentacoes/movimentacao.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

@Component({
  selector: 'app-movimentacoes',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    FeatureShellComponent
  ],
  template: `
    <app-feature-shell titulo="Movimentacoes">
      <section class="layout">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ movimentacaoEmEdicao ? 'Editar movimentacao' : 'Nova movimentacao' }}</mat-card-title>
            <mat-card-subtitle>Registre receitas e despesas efetivadas</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="salvar()">
              <mat-form-field appearance="outline">
                <mat-label>Descricao</mat-label>
                <input matInput formControlName="descricao">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo" (selectionChange)="carregarCategoriasPorTipo()">
                  <mat-option value="RECEITA">Receita</mat-option>
                  <mat-option value="DESPESA">Despesa</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Valor</mat-label>
                <input
                  matInput
                  type="text"
                  inputmode="decimal"
                  [value]="valorTexto"
                  (input)="atualizarValor($event)"
                  (focus)="selecionarValor($event)"
                  (blur)="formatarValor()"
                >
                <mat-hint>Ex: R$ 120,50</mat-hint>
                <mat-error>Informe um valor maior que zero</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Data</mat-label>
                <input matInput type="date" formControlName="data">
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
                  <mat-option [value]="null">Sem categoria</mat-option>
                  <mat-option *ngFor="let categoria of categorias" [value]="categoria.id">{{ categoria.nome }}</mat-option>
                </mat-select>
              </mat-form-field>

              <p role="alert" class="error" *ngIf="erro">{{ erro }}</p>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando">Salvar</button>
                <button mat-button type="button" *ngIf="movimentacaoEmEdicao" (click)="cancelar()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Movimentacoes registradas</mat-card-title>
            <mat-card-subtitle>{{ movimentacoes.length }} lancamento(s)</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state" *ngIf="movimentacoes.length === 0">
              <strong>Nenhuma movimentacao registrada</strong>
              <span>Cadastre uma conta financeira para criar receitas e despesas.</span>
            </div>

            <div role="list" *ngIf="movimentacoes.length > 0">
              <div role="listitem" class="registro" *ngFor="let movimentacao of movimentacoes">
                <span class="registro-titulo">{{ movimentacao.descricao }}</span>
                <span class="registro-detalhe" *ngIf="movimentacao.origemTipo !== 'MANUAL'">Gerada por compromisso · alteração direta bloqueada</span>
                <span class="registro-detalhe">{{ movimentacao.contaFinanceiraNome }} - {{ movimentacao.categoriaNome ?? 'Sem categoria' }} - {{ movimentacao.data | date:'dd/MM/yyyy' }}</span>
                <strong [class.receita]="movimentacao.tipo === 'RECEITA'" [class.despesa]="movimentacao.tipo === 'DESPESA'">
                  {{ movimentacao.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </strong>
                <button mat-button type="button" [disabled]="movimentacao.origemTipo !== 'MANUAL' || !!movimentacao.origemId" (click)="editar(movimentacao)">Editar</button>
                <button mat-button color="warn" type="button" [disabled]="movimentacao.origemTipo !== 'MANUAL' || !!movimentacao.origemId" (click)="excluir(movimentacao)">Excluir</button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
    </app-feature-shell>
  `,
  styles: [`
    .registro { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; padding: 16px 0; border-bottom: 1px solid #e0e8e4; }
    .registro-titulo, .registro-detalhe { width: 100%; overflow-wrap: anywhere; }
    .registro-titulo { font-weight: 600; }
    .registro-detalhe { color: #566761; font-size: 0.9rem; }
    mat-card { min-width: 0; }
    .actions, .row-actions { flex-wrap: wrap; }

    .layout {
      display: grid;
      grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
      gap: 18px;
    }

    form {
      display: grid;
      gap: 14px;
      padding-top: 20px;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .error {
      margin: 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: #fdecea;
      color: #b42318;
    }

    .empty-state {
      display: grid;
      place-items: center;
      gap: 8px;
      min-height: 220px;
      border: 1px dashed #cbd8d4;
      border-radius: 8px;
      background: #f8fbfa;
      text-align: center;
    }

    mat-list-item {
      min-height: 88px;
      border-bottom: 1px solid #edf2f0;
    }

    mat-list-item strong {
      margin-left: auto;
      margin-right: 16px;
      white-space: nowrap;
    }

    .receita {
      color: #16875d;
    }

    .despesa {
      color: #c24134;
    }

    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MovimentacoesComponent implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  protected contas: ContaFinanceira[] = [];
  protected categorias: Categoria[] = [];
  protected movimentacoes: Movimentacao[] = [];
  protected movimentacaoEmEdicao: Movimentacao | null = null;
  protected erro = '';
  protected salvando = false;
  protected valorTexto = '';

  private readonly moedaFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    descricao: ['', Validators.required],
    tipo: ['DESPESA' as TipoMovimentacao, Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    data: [dataLocal(), Validators.required],
    contaFinanceiraId: ['', Validators.required],
    categoriaId: [null as string | null]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly contaFinanceiraService: ContaFinanceiraService,
    private readonly categoriaService: CategoriaService,
    private readonly movimentacaoService: MovimentacaoService
  ) {}

  ngOnInit(): void {
    this.carregarBase();
    this.carregarMovimentacoes();
  }

  protected carregarCategoriasPorTipo(): void {
    this.categoriaService.listar(this.form.controls.tipo.value).subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.form.controls.categoriaId.setValue(null);
      },
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar categorias.')
    });
  }

  protected salvar(): void {
    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      this.formatarValor();
      return;
    }

    this.erro = '';
    this.salvando = true;
    const request = this.form.getRawValue();
    const operacao = this.movimentacaoEmEdicao
      ? this.movimentacaoService.atualizar(this.movimentacaoEmEdicao.id, request)
      : this.movimentacaoService.criar(request);

    operacao.pipe(finalize(() => this.salvando = false)).subscribe({
      next: () => {
        this.cancelar();
        this.carregarMovimentacoes();
      },
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel salvar a movimentacao.')
    });
  }

  protected editar(movimentacao: Movimentacao): void {
    this.movimentacaoEmEdicao = movimentacao;
    this.form.setValue({
      descricao: movimentacao.descricao,
      tipo: movimentacao.tipo,
      valor: movimentacao.valor,
      data: movimentacao.data,
      contaFinanceiraId: movimentacao.contaFinanceiraId,
      categoriaId: movimentacao.categoriaId
    });
    this.formatarValor();
    this.categoriaService.listar(movimentacao.tipo).subscribe((categorias) => this.categorias = categorias);
  }

  protected excluir(movimentacao: Movimentacao): void {
    this.confirmacao.executar({
      titulo: 'Excluir movimentação?',
      mensagem: `Excluir "${movimentacao.descricao}"? Esta ação não pode ser desfeita.`,
      acao: 'Excluir',
      executar: () => this.movimentacaoService.excluir(movimentacao.id)
    }).subscribe(confirmado => {
      if (confirmado) {
        this.erro = '';
        this.carregarMovimentacoes();
      }
    });
  }

  protected cancelar(): void {
    this.movimentacaoEmEdicao = null;
    this.form.reset({
      descricao: '',
      tipo: 'DESPESA',
      valor: 0,
      data: dataLocal(),
      contaFinanceiraId: '',
      categoriaId: null
    });
    this.valorTexto = '';
    this.carregarCategoriasPorTipo();
  }

  protected atualizarValor(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = this.converterCentavosParaNumero(input.value);

    this.valorTexto = valor > 0 ? this.moedaFormatter.format(valor) : '';
    input.value = this.valorTexto;
    this.form.controls.valor.setValue(valor);
    this.form.controls.valor.markAsDirty();
    this.form.controls.valor.markAsTouched();
  }

  protected selecionarValor(event: Event): void {
    const input = event.target as HTMLInputElement;

    setTimeout(() => input.select());
  }

  protected formatarValor(): void {
    const valor = this.form.controls.valor.value;
    this.valorTexto = valor > 0 ? this.moedaFormatter.format(valor) : '';
  }

  private carregarBase(): void {
    this.contaFinanceiraService.listar().subscribe((contas) => this.contas = contas);
    this.carregarCategoriasPorTipo();
  }

  private carregarMovimentacoes(): void {
    this.movimentacaoService.listar().subscribe({
      next: (movimentacoes) => this.movimentacoes = movimentacoes,
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar movimentacoes.')
    });
  }

  private converterCentavosParaNumero(valor: string): number {
    const digitos = valor.replace(/\D/g, '');

    if (!digitos) {
      return 0;
    }

    return Number(digitos) / 100;
  }
}
