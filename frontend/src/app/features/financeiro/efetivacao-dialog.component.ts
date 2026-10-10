import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, catchError, map, of, startWith, switchMap } from 'rxjs';
import { ContaAPagar, ContaAReceber, PreviaEfetivacao } from '../../core/compromissos/compromisso.models';
import { ContaAPagarService } from '../../core/compromissos/conta-a-pagar.service';
import { ContaAReceberService } from '../../core/compromissos/conta-a-receber.service';
import { dataLocal } from '../../shared/data-local';

export type DadosEfetivacao = { id: string; tipo: 'PAGAR' | 'RECEBER'; descricao: string; contaFinanceiraNome: string };
type EstadoPrevia = { carregando: boolean; previa: PreviaEfetivacao | null; erro: string };

@Component({
  selector: 'app-efetivacao-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ dados.tipo === 'PAGAR' ? 'Confirmar pagamento' : 'Confirmar recebimento' }}</h2>
    <mat-dialog-content>
      <p><strong>{{ dados.descricao }}</strong><br>Conta: {{ dados.contaFinanceiraNome }}</p>
      <mat-form-field appearance="outline">
        <mat-label>{{ dados.tipo === 'PAGAR' ? 'Data do pagamento' : 'Data do recebimento' }}</mat-label>
        <input matInput type="date" [formControl]="data">
        <mat-error>Informe uma data válida.</mat-error>
      </mat-form-field>
      <p role="status" *ngIf="estado.carregando">Calculando o valor para a data escolhida...</p>
      <p role="alert" class="erro" *ngIf="estado.erro">{{ estado.erro }}</p>
      <p role="alert" class="erro" *ngIf="erro">{{ erro }}</p>
      <button mat-button type="button" *ngIf="estado.erro || erro" [disabled]="salvando" (click)="reconsultar()">Consultar novamente</button>
      <dl *ngIf="estado.previa as previa" aria-label="Conferência do valor">
        <div><dt>Valor original</dt><dd>{{ previa.valorOriginal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
        <div><dt>Multa</dt><dd>+ {{ previa.multa | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
        <div><dt>Juros</dt><dd>+ {{ previa.juros | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
        <div><dt>Desconto</dt><dd>− {{ previa.desconto | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
        <div class="total"><dt>Total {{ dados.tipo === 'PAGAR' ? 'a pagar' : 'a receber' }}</dt><dd>{{ previa.valorAtualizado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</dd></div>
      </dl>
      <p class="ajuda">Ao confirmar, o valor será registrado na conta e nos relatórios na data escolhida.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [disabled]="salvando" (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="primary" type="button"
        [disabled]="salvando || estado.carregando || !estado.previa || data.invalid"
        (click)="confirmar()">{{ salvando ? 'Registrando...' : dados.tipo === 'PAGAR' ? 'Confirmar pagamento' : 'Confirmar recebimento' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field { width: 100%; margin-top: 8px; }
    dl { margin: 12px 0; }
    dl div { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; }
    dd { margin: 0; white-space: nowrap; }
    .total { border-top: 1px solid #d8e1de; font-weight: 700; margin-top: 6px; }
    .erro { color: #b42318; }
    .ajuda { color: #52635e; font-size: 13px; }
  `]
})
export class EfetivacaoDialogComponent implements OnInit {
  protected readonly dados = inject<DadosEfetivacao>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EfetivacaoDialogComponent, boolean>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pagarService = inject(ContaAPagarService);
  private readonly receberService = inject(ContaAReceberService);
  protected readonly data = new FormControl(dataLocal(), { nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)] });
  protected estado: EstadoPrevia = { carregando: false, previa: null, erro: '' };
  protected erro = '';
  protected salvando = false;

  ngOnInit(): void {
    this.data.valueChanges.pipe(
      startWith(this.data.value),
      switchMap(data => {
        this.erro = '';
        if (this.data.invalid) return of<EstadoPrevia>({ carregando: false, previa: null, erro: '' });
        const consulta = this.dados.tipo === 'PAGAR'
          ? this.pagarService.previa(this.dados.id, data) : this.receberService.previa(this.dados.id, data);
        return consulta.pipe(
          map(previa => ({ carregando: false, previa, erro: '' } as EstadoPrevia)),
          catchError(error => of<EstadoPrevia>({ carregando: false, previa: null,
            erro: error.error?.mensagem ?? 'Não foi possível calcular o valor. Tente novamente.' })),
          startWith<EstadoPrevia>({ carregando: true, previa: null, erro: '' })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(estado => this.estado = estado);
  }

  protected reconsultar(): void {
    this.data.setValue(this.data.value);
  }

  protected confirmar(): void {
    const previa = this.estado.previa;
    if (this.salvando || this.estado.carregando || this.data.invalid || !previa || previa.data !== this.data.value) return;
    this.salvando = true;
    this.erro = '';
    this.dialogRef.disableClose = true;
    this.data.disable({ emitEvent: false });
    const operacao: Observable<ContaAPagar | ContaAReceber> = this.dados.tipo === 'PAGAR'
      ? this.pagarService.pagar(this.dados.id, previa.data, previa.valorAtualizado)
      : this.receberService.receber(this.dados.id, previa.data, previa.valorAtualizado);
    operacao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.dialogRef.close(true),
      error: error => {
        this.salvando = false;
        this.dialogRef.disableClose = false;
        this.data.enable({ emitEvent: false });
        this.estado = { carregando: false, previa: null, erro: '' };
        this.erro = error.error?.mensagem ?? 'Não foi possível registrar. Consulte novamente antes de tentar outra vez.';
      }
    });
  }
}
