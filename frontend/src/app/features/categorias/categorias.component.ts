import { finalize } from 'rxjs';
import { ConfirmacaoService } from '../../shared/confirmacao-dialog.component';
import { mensagemErro } from '../../shared/mensagem-erro';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { Categoria, TipoMovimentacao, GrupoDre, GRUPOS_DRE } from '../../core/categorias/categoria.models';
import { CategoriaService } from '../../core/categorias/categoria.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
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
    <app-feature-shell titulo="Categorias">
      <section class="layout">
        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>{{ categoriaEmEdicao ? 'Editar categoria' : 'Nova categoria' }}</mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="salvar()">
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="nome">
                <mat-error>Informe o nome</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="tipo">
                  <mat-option value="RECEITA">Receita</mat-option>
                  <mat-option value="DESPESA">Despesa</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Grupo da DRE</mat-label>
                <mat-select formControlName="grupoDre">
                  <mat-option [value]="null">Sem classificacao</mat-option>
                  <mat-option *ngFor="let grupo of gruposDisponiveis" [value]="grupo.codigo">{{ grupo.descricao }}</mat-option>
                </mat-select>
              </mat-form-field>
              <p *ngIf="categoriaEmEdicao">Alterar a classificacao modifica tambem a DRE de periodos anteriores.</p>

              <p role="alert" class="error" *ngIf="erro">{{ erro }}</p>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando">Salvar</button>
                <button mat-button type="button" *ngIf="categoriaEmEdicao" (click)="cancelar()">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-header>
            <mat-card-title>Categorias cadastradas</mat-card-title>
            <mat-card-subtitle>{{ categorias.length }} item(ns)</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="empty-state" *ngIf="categorias.length === 0">
              <strong>Nenhuma categoria cadastrada</strong>
              <span>Crie categorias de receita e despesa para classificar movimentacoes.</span>
            </div>

            <div role="list" *ngIf="categorias.length > 0">
              <div role="listitem" class="registro" *ngFor="let categoria of categorias">
                <span class="registro-titulo">{{ categoria.nome }}</span>
                <span class="registro-detalhe">{{ categoria.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }} · {{ descricaoGrupo(categoria.grupoDre) }}</span>
                <button mat-button type="button" (click)="editar(categoria)">Editar</button>
                <button mat-button color="warn" type="button" (click)="excluir(categoria)">Excluir</button>
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
      grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
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

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoriasComponent implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly destroyRef = inject(DestroyRef);
  protected categorias: Categoria[] = [];
  protected categoriaEmEdicao: Categoria | null = null;
  protected erro = '';
  protected salvando = false;

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    tipo: ['DESPESA' as TipoMovimentacao, Validators.required],
    grupoDre: this.formBuilder.control<GrupoDre | null>(null)
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.carregar();
    this.form.controls.tipo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tipo => {
      const grupo = this.form.controls.grupoDre.value;
      if (grupo && !GRUPOS_DRE.some(item => item.codigo === grupo && (!item.tipo || item.tipo === tipo))) {
        this.form.controls.grupoDre.setValue(null);
      }
    });
  }

  protected get gruposDisponiveis() {
    return GRUPOS_DRE.filter(item => !item.tipo || item.tipo === this.form.controls.tipo.value);
  }

  protected descricaoGrupo(grupo: GrupoDre | null): string {
    return GRUPOS_DRE.find(item => item.codigo === grupo)?.descricao ?? 'Nao classificada na DRE';
  }

  protected salvar(): void {
    if (this.form.invalid || this.salvando) {
      return;
    }

    this.erro = '';
    this.salvando = true;
    const request = this.form.getRawValue();
    const operacao = this.categoriaEmEdicao
      ? this.categoriaService.atualizar(this.categoriaEmEdicao.id, request)
      : this.categoriaService.criar(request);

    operacao.pipe(finalize(() => this.salvando = false)).subscribe({
      next: () => {
        this.cancelar();
        this.carregar();
      },
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel salvar a categoria.')
    });
  }

  protected editar(categoria: Categoria): void {
    this.categoriaEmEdicao = categoria;
    this.form.setValue({ nome: categoria.nome, tipo: categoria.tipo, grupoDre: categoria.grupoDre }, { emitEvent: false });
  }

  protected excluir(categoria: Categoria): void {
    this.confirmacao.executar({
      titulo: 'Excluir categoria?',
      mensagem: `Excluir "${categoria.nome}"? Esta ação não pode ser desfeita.`,
      acao: 'Excluir',
      executar: () => this.categoriaService.excluir(categoria.id)
    }).subscribe(confirmado => {
      if (confirmado) {
        this.erro = '';
        this.carregar();
      }
    });
  }

  protected cancelar(): void {
    this.categoriaEmEdicao = null;
    this.form.reset({ nome: '', tipo: 'DESPESA', grupoDre: null });
  }

  private carregar(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias = categorias,
      error: error => this.erro = mensagemErro(error, 'Nao foi possivel carregar as categorias.')
    });
  }
}
