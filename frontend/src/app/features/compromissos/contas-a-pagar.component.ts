import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { Categoria } from '../../core/categorias/categoria.models';
import { CategoriaService } from '../../core/categorias/categoria.service';
import { ContaAPagar } from '../../core/compromissos/compromisso.models';
import { ContaAPagarService } from '../../core/compromissos/conta-a-pagar.service';
import { ContaFinanceira } from '../../core/contas/conta-financeira.models';
import { ContaFinanceiraService } from '../../core/contas/conta-financeira.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

@Component({
  selector: 'app-contas-a-pagar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatListModule, MatSelectModule, FeatureShellComponent],
  template: `
    <app-feature-shell titulo="Contas a pagar" eyebrow="Fase 6">
      <section class="layout">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ emEdicao ? 'Editar conta' : 'Nova conta a pagar' }}</mat-card-title>
            <mat-card-subtitle>Ao pagar, uma movimentacao de despesa sera criada</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="salvar()">
              <mat-form-field appearance="outline"><mat-label>Descricao</mat-label><input matInput formControlName="descricao"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Valor</mat-label><input matInput type="number" min="0.01" step="0.01" formControlName="valor"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Vencimento</mat-label><input matInput type="date" formControlName="dataVencimento"></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Conta</mat-label><mat-select formControlName="contaFinanceiraId"><mat-option *ngFor="let conta of contas" [value]="conta.id">{{ conta.nome }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><mat-select formControlName="categoriaId"><mat-option *ngFor="let categoria of categorias" [value]="categoria.id">{{ categoria.nome }}</mat-option></mat-select></mat-form-field>
              <p class="error" *ngIf="erro">{{ erro }}</p>
              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
                <button mat-button type="button" *ngIf="emEdicao" (click)="cancelar()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header><mat-card-title>Contas cadastradas</mat-card-title><mat-card-subtitle>{{ contasAPagar.length }} item(ns)</mat-card-subtitle></mat-card-header>
          <mat-card-content>
            <div class="empty-state" *ngIf="contasAPagar.length === 0"><strong>Nenhuma conta a pagar</strong><span>Cadastre obrigacoes futuras para acompanhar vencimentos.</span></div>
            <mat-list *ngIf="contasAPagar.length > 0">
              <mat-list-item *ngFor="let item of contasAPagar">
                <span matListItemTitle>{{ item.descricao }}</span>
                <span matListItemLine>{{ item.categoriaNome }} - vence em {{ item.dataVencimento | date:'dd/MM/yyyy' }} - {{ item.status }}</span>
                <strong>{{ item.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong>
                <button mat-button type="button" [disabled]="!!item.movimentacaoId || item.status === 'CANCELADA'" (click)="pagar(item)">Pagar</button>
                <button mat-button type="button" [disabled]="!!item.movimentacaoId || item.status === 'CANCELADA'" (click)="editar(item)">Editar</button>
                <button mat-button type="button" [disabled]="!!item.movimentacaoId || item.status === 'CANCELADA'" (click)="cancelarConta(item)">Cancelar</button>
                <button mat-button color="warn" type="button" [disabled]="!!item.movimentacaoId" (click)="excluir(item)">Excluir</button>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    </app-feature-shell>
  `,
  styles: [`
    .layout{display:grid;grid-template-columns:minmax(320px,460px) minmax(0,1fr);gap:18px}
    form{display:grid;gap:14px;padding-top:20px}.actions{display:flex;gap:10px}.error{margin:0;padding:10px 12px;border-radius:8px;background:#fdecea;color:#b42318}
    .empty-state{display:grid;place-items:center;gap:8px;min-height:220px;border:1px dashed #cbd8d4;border-radius:8px;background:#f8fbfa;text-align:center}
    mat-list-item{min-height:92px;border-bottom:1px solid #edf2f0} mat-list-item strong{margin-left:auto;margin-right:16px;white-space:nowrap}
    @media(max-width:960px){.layout{grid-template-columns:1fr}}
  `]
})
export class ContasAPagarComponent implements OnInit {
  protected contas: ContaFinanceira[] = [];
  protected categorias: Categoria[] = [];
  protected contasAPagar: ContaAPagar[] = [];
  protected emEdicao: ContaAPagar | null = null;
  protected erro = '';
  protected readonly form = this.fb.nonNullable.group({
    descricao: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    dataVencimento: [new Date().toISOString().slice(0, 10), Validators.required],
    contaFinanceiraId: ['', Validators.required],
    categoriaId: ['', Validators.required]
  });

  constructor(private readonly fb: FormBuilder, private readonly service: ContaAPagarService, private readonly contaService: ContaFinanceiraService, private readonly categoriaService: CategoriaService) {}

  ngOnInit(): void { this.carregarBase(); this.carregar(); }

  protected salvar(): void {
    const request = { ...this.form.getRawValue(), status: this.emEdicao?.status ?? 'PENDENTE' as const };
    const operacao = this.emEdicao ? this.service.atualizar(this.emEdicao.id, request) : this.service.criar(request);
    operacao.subscribe({ next: () => { this.cancelar(); this.carregar(); }, error: () => this.erro = 'Nao foi possivel salvar.' });
  }

  protected pagar(item: ContaAPagar): void { this.service.pagar(item.id, new Date().toISOString().slice(0, 10)).subscribe({ next: () => this.carregar(), error: () => this.erro = 'Nao foi possivel pagar.' }); }
  protected cancelarConta(item: ContaAPagar): void { this.service.cancelar(item.id).subscribe({ next: () => this.carregar(), error: () => this.erro = 'Nao foi possivel cancelar.' }); }
  protected editar(item: ContaAPagar): void { this.emEdicao = item; this.form.setValue({ descricao: item.descricao, valor: item.valor, dataVencimento: item.dataVencimento, contaFinanceiraId: item.contaFinanceiraId, categoriaId: item.categoriaId }); }
  protected excluir(item: ContaAPagar): void { this.service.excluir(item.id).subscribe({ next: () => this.carregar(), error: () => this.erro = 'Nao foi possivel excluir.' }); }
  protected cancelar(): void { this.emEdicao = null; this.form.reset({ descricao: '', valor: 0, dataVencimento: new Date().toISOString().slice(0, 10), contaFinanceiraId: '', categoriaId: '' }); }
  private carregarBase(): void { this.contaService.listar().subscribe((contas) => this.contas = contas); this.categoriaService.listar('DESPESA').subscribe((categorias) => this.categorias = categorias); }
  private carregar(): void { this.service.listar().subscribe({ next: (itens) => this.contasAPagar = itens, error: () => this.erro = 'Nao foi possivel carregar.' }); }
}
