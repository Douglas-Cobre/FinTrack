import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
    <app-feature-shell titulo="Movimentacoes" eyebrow="Fase 5">
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
                  <mat-option *ngFor="let categoria of categorias" [value]="categoria.id">{{ categoria.nome }}</mat-option>
                </mat-select>
              </mat-form-field>

              <p class="error" *ngIf="erro">{{ erro }}</p>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
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
              <span>Cadastre contas e categorias antes de criar movimentacoes.</span>
            </div>

            <mat-list *ngIf="movimentacoes.length > 0">
              <mat-list-item *ngFor="let movimentacao of movimentacoes">
                <span matListItemTitle>{{ movimentacao.descricao }}</span>
                <span matListItemLine>{{ movimentacao.contaFinanceiraNome }} - {{ movimentacao.categoriaNome }} - {{ movimentacao.data | date:'dd/MM/yyyy' }}</span>
                <strong [class.receita]="movimentacao.tipo === 'RECEITA'" [class.despesa]="movimentacao.tipo === 'DESPESA'">
                  {{ movimentacao.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </strong>
                <button mat-button type="button" (click)="editar(movimentacao)">Editar</button>
                <button mat-button color="warn" type="button" (click)="excluir(movimentacao)">Excluir</button>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    </app-feature-shell>
  `,
  styles: [`
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
  protected contas: ContaFinanceira[] = [];
  protected categorias: Categoria[] = [];
  protected movimentacoes: Movimentacao[] = [];
  protected movimentacaoEmEdicao: Movimentacao | null = null;
  protected erro = '';
  protected valorTexto = '';

  private readonly moedaFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    descricao: ['', Validators.required],
    tipo: ['DESPESA' as TipoMovimentacao, Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    data: [new Date().toISOString().slice(0, 10), Validators.required],
    contaFinanceiraId: ['', Validators.required],
    categoriaId: ['', Validators.required]
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
        this.form.controls.categoriaId.setValue('');
      },
      error: () => this.erro = 'Nao foi possivel carregar categorias.'
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formatarValor();
      return;
    }

    this.erro = '';
    const request = this.form.getRawValue();
    const operacao = this.movimentacaoEmEdicao
      ? this.movimentacaoService.atualizar(this.movimentacaoEmEdicao.id, request)
      : this.movimentacaoService.criar(request);

    operacao.subscribe({
      next: () => {
        this.cancelar();
        this.carregarMovimentacoes();
      },
      error: () => this.erro = 'Nao foi possivel salvar a movimentacao.'
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
    this.movimentacaoService.excluir(movimentacao.id).subscribe({
      next: () => this.carregarMovimentacoes(),
      error: () => this.erro = 'Nao foi possivel excluir a movimentacao.'
    });
  }

  protected cancelar(): void {
    this.movimentacaoEmEdicao = null;
    this.form.reset({
      descricao: '',
      tipo: 'DESPESA',
      valor: 0,
      data: new Date().toISOString().slice(0, 10),
      contaFinanceiraId: '',
      categoriaId: ''
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
      error: () => this.erro = 'Nao foi possivel carregar movimentacoes.'
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
