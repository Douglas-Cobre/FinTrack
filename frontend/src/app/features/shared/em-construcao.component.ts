import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { FeatureShellComponent } from './feature-shell.component';

@Component({
  selector: 'app-em-construcao',
  standalone: true,
  imports: [MatCardModule, FeatureShellComponent],
  template: `
    <app-feature-shell [titulo]="titulo" eyebrow="Proxima fase">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Funcionalidade ainda nao implementada</mat-card-title>
          <mat-card-subtitle>{{ detalhe }}</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </app-feature-shell>
  `
})
export class EmConstrucaoComponent {
  @Input() titulo = 'Em construcao';
  @Input() detalhe = 'Ainda faltam os metodos de dominio e API desta fase.';

  constructor(route: ActivatedRoute) {
    this.titulo = route.snapshot.data['titulo'] ?? this.titulo;
    this.detalhe = route.snapshot.data['detalhe'] ?? this.detalhe;
  }
}
