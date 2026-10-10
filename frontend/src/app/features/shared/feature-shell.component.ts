import { Component, Input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-feature-shell',
  standalone: true,
  imports: [MatToolbarModule],
  template: `
    <main class="page">
      <mat-toolbar class="toolbar">
        <div>
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
      min-height: 72px;
      padding: 12px 32px;
      background: rgba(238, 242, 241, 0.94);
    }

    .toolbar { white-space: normal; }

    .toolbar h1 {
      margin: 0;
      color: #17231f;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.1;
    }

    .content {
      padding: 0 32px 32px;
      min-width: 0;
    }

    @media (max-width: 720px) {
      .toolbar { padding: 12px 20px; }
      .toolbar h1 { font-size: 28px; }
      .content { padding: 0 20px 24px; }
    }
  `]
})
export class FeatureShellComponent {
  @Input({ required: true }) titulo = '';
}
