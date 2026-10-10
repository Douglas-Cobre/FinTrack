import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { Dre, LinhaDre } from '../../core/dre/dre.models';
import { DreService } from '../../core/dre/dre.service';
import { FeatureShellComponent } from '../shared/feature-shell.component';

type EstadoDre = { carregando: boolean; resultado: Dre | null; erro: string };

@Component({
  selector: 'app-dre',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, MatTableModule, FeatureShellComponent],
  templateUrl: './dre.component.html',
  styleUrl: './dre.component.scss'
})
export class DreComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas = new Subject<{ inicio: string; fim: string } | null>();
  private readonly hoje = new Date();
  protected estado: EstadoDre = { carregando: false, resultado: null, erro: '' };
  protected readonly colunas = ['descricao', 'valor'];
  protected readonly expandidos = new Set<string>();
  protected readonly form = this.formBuilder.nonNullable.group({
    inicio: [this.dataLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1)), Validators.required],
    fim: [this.dataLocal(new Date(this.hoje.getFullYear(), this.hoje.getMonth() + 1, 0)), Validators.required]
  }, { validators: control => {
    const { inicio, fim } = control.value;
    return inicio && fim && inicio > fim ? { periodoInvalido: true } : null;
  }});

  constructor(private readonly formBuilder: FormBuilder, private readonly dreService: DreService) {}

  ngOnInit(): void {
    this.consultas.pipe(
      switchMap(periodo => {
        this.expandidos.clear();
        if (!periodo) return of<EstadoDre>({ carregando: false, resultado: null, erro: '' });
        return this.dreService.consultar(periodo.inicio, periodo.fim).pipe(
          map(resultado => ({ carregando: false, resultado, erro: '' } as EstadoDre)),
          catchError(() => of<EstadoDre>({ carregando: false, resultado: null,
            erro: 'Nao foi possivel consultar a DRE. Tente novamente.' })),
          startWith<EstadoDre>({ carregando: true, resultado: null, erro: '' })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(estado => this.estado = estado);
    // Editing dates cancels an old request and clears results for the previous period.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.consultas.next(null));
    this.consultar();
  }

  protected consultar(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) this.consultas.next(this.form.getRawValue());
  }

  protected alternar(linha: LinhaDre): void {
    if (this.expandidos.has(linha.codigo)) this.expandidos.delete(linha.codigo);
    else this.expandidos.add(linha.codigo);
  }

  protected sinal(linha: LinhaDre): string {
    if (linha.tipo === 'SUBTOTAL') return '(=)';
    return ['RECEITA_OPERACIONAL', 'RECEITA_FINANCEIRA'].includes(linha.codigo) ? '(+)' : '(-)';
  }

  protected vazio(resultado: Dre): boolean {
    return resultado.pendencias.quantidade === 0 && resultado.foraDre.quantidade === 0
      && resultado.linhas.every(linha => linha.valor === 0);
  }

  private dataLocal(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }
}
