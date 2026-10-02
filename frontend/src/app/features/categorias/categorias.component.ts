import { CommonModule } from '@angular/common';
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
    <app-feature-shell titulo="Categorias" eyebrow="Fase 4">
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

              <p class="error" *ngIf="erro">{{ erro }}</p>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Salvar</button>
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

            <mat-list *ngIf="categorias.length > 0">
              <mat-list-item *ngFor="let categoria of categorias">
                <span matListItemTitle>{{ categoria.nome }}</span>
                <span matListItemLine>{{ categoria.tipo === 'RECEITA' ? 'Receita' : 'Despesa' }}</span>
                <button mat-button type="button" (click)="editar(categoria)">Editar</button>
                <button mat-button color="warn" type="button" (click)="excluir(categoria)">Excluir</button>
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
  protected categorias: Categoria[] = [];
  protected categoriaEmEdicao: Categoria | null = null;
  protected erro = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    tipo: ['DESPESA' as TipoMovimentacao, Validators.required]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  protected salvar(): void {
    if (this.form.invalid) {
      return;
    }

    this.erro = '';
    const request = this.form.getRawValue();
    const operacao = this.categoriaEmEdicao
      ? this.categoriaService.atualizar(this.categoriaEmEdicao.id, request)
      : this.categoriaService.criar(request);

    operacao.subscribe({
      next: () => {
        this.cancelar();
        this.carregar();
      },
      error: () => this.erro = 'Nao foi possivel salvar a categoria.'
    });
  }

  protected editar(categoria: Categoria): void {
    this.categoriaEmEdicao = categoria;
    this.form.setValue({ nome: categoria.nome, tipo: categoria.tipo });
  }

  protected excluir(categoria: Categoria): void {
    this.categoriaService.excluir(categoria.id).subscribe({
      next: () => this.carregar(),
      error: () => this.erro = 'Nao foi possivel excluir a categoria.'
    });
  }

  protected cancelar(): void {
    this.categoriaEmEdicao = null;
    this.form.reset({ nome: '', tipo: 'DESPESA' });
  }

  private carregar(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias = categorias,
      error: () => this.erro = 'Nao foi possivel carregar as categorias.'
    });
  }
}
