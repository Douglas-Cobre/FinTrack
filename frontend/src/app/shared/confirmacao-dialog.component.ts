import { CommonModule } from '@angular/common';
import { Component, Injectable, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, finalize } from 'rxjs';
import { mensagemErro } from './mensagem-erro';

interface ConfirmacaoData {
  titulo: string;
  mensagem: string;
  acao: string;
  executar: () => Observable<unknown>;
}

@Component({
  selector: 'app-confirmacao-dialog', standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p>{{ data.mensagem }}</p>
      <p class="erro" role="alert" *ngIf="erro">{{ erro }}</p>
      <p role="status" *ngIf="salvando">Aguarde, concluindo a operação…</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [disabled]="salvando" (click)="ref.close(false)" cdkFocusInitial>Voltar</button>
      <button mat-flat-button color="warn" [disabled]="salvando" (click)="confirmar()">{{ data.acao }}</button>
    </mat-dialog-actions>
  `,
  styles: [`p { overflow-wrap: anywhere; } .erro { color: #b42318; }`]
})
export class ConfirmacaoDialogComponent {
  readonly data = inject<ConfirmacaoData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ConfirmacaoDialogComponent, boolean>);
  salvando = false;
  erro = '';

  confirmar(): void {
    if (this.salvando) return;
    this.salvando = true;
    this.erro = '';
    this.ref.disableClose = true;
    this.data.executar().pipe(finalize(() => {
      this.salvando = false;
      this.ref.disableClose = false;
    })).subscribe({
      next: () => this.ref.close(true),
      error: error => this.erro = mensagemErro(error, 'Não foi possível concluir a operação.')
    });
  }
}

@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  private readonly dialog = inject(MatDialog);
  executar(data: ConfirmacaoData): Observable<boolean | undefined> {
    return this.dialog.open(ConfirmacaoDialogComponent, {
      data, width: '440px', maxWidth: '95vw', autoFocus: 'first-tabbable'
    }).afterClosed();
  }
}
