import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-feature-shell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatToolbarModule],
  template: `
    <main class="page">
      <mat-toolbar class="toolbar">
        <div>
          <span class="eyebrow">{{ eyebrow }}</span>
          <h1>{{ titulo }}</h1>
        </div>
      </mat-toolbar>

      <section class="content">
        <ng-content></ng-content>
      </section>
    </main>
  `,
  styles: [`
    .page {
      min-height: 100%;
      background: #eef2f1;
    }

    .toolbar {
      min-height: 92px;
      padding: 18px 32px;
      background: rgba(238, 242, 241, 0.94);
    }

    .toolbar h1 {
      margin: 0;
      color: #17231f;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.1;
    }

    .eyebrow {
      display: block;
      margin-bottom: 6px;
      color: #2f6f63;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .content {
      padding: 0 32px 32px;
    }
  `]
})
export class FeatureShellComponent {
  @Input({ required: true }) titulo = '';
  @Input() eyebrow = 'FinTrack';
}
