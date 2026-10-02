import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav class="sidenav" mode="side" opened>
        <section class="brand">
          <div class="brand-mark">F</div>
          <div>
            <strong>FinTrack</strong>
            <span>Gestao financeira</span>
          </div>
        </section>

        <mat-nav-list>
          <a
            mat-list-item
            class="nav-link"
            routerLink="/"
            routerLinkActive="active-item"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/contas" routerLinkActive="active-item">
            <span matListItemTitle>Contas financeiras</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/movimentacoes" routerLinkActive="active-item">
            <span matListItemTitle>Movimentacoes</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/categorias" routerLinkActive="active-item">
            <span matListItemTitle>Categorias</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/contas-a-pagar" routerLinkActive="active-item">
            <span matListItemTitle>Contas a pagar</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/contas-a-receber" routerLinkActive="active-item">
            <span matListItemTitle>Contas a receber</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/relatorios" routerLinkActive="active-item">
            <span matListItemTitle>Relatorios</span>
          </a>
        </mat-nav-list>

        <mat-card class="projection-card" appearance="outlined">
          <mat-card-header>
            <mat-card-title>Saldo projetado</mat-card-title>
            <mat-card-subtitle>Aguardando dados reais</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Cadastre contas e movimentacoes para calcular esta informacao.</p>
          </mat-card-content>
        </mat-card>
      </mat-sidenav>

      <mat-sidenav-content class="workspace">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #eef2f1;
    }

    .shell {
      min-height: 100vh;
      background: #eef2f1;
    }

    .sidenav {
      width: 292px;
      padding: 20px 16px;
      border-right: 0;
      background: #0f211d;
      color: #f8fbfa;
    }

    .workspace {
      min-height: 100vh;
      background: #eef2f1;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px 24px;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: #36b37e;
      color: #10201d;
      font-weight: 800;
    }

    .brand strong,
    .brand span {
      display: block;
    }

    .brand span {
      color: #a8bab4;
      font-size: 13px;
    }

    .sidenav .nav-link {
      --mdc-list-list-item-label-text-color: #dce9e5;
      --mdc-list-list-item-supporting-text-color: #b7c9c3;
      --mdc-list-list-item-hover-label-text-color: #ffffff;
      --mdc-list-list-item-focus-label-text-color: #ffffff;
      --mdc-list-list-item-hover-state-layer-color: #ffffff;
      --mdc-list-list-item-focus-state-layer-color: #ffffff;
      --mdc-list-list-item-hover-state-layer-opacity: 0.08;
      --mdc-list-list-item-focus-state-layer-opacity: 0.1;
      --mdc-list-list-item-one-line-container-height: 48px;
      margin-bottom: 4px;
      border-radius: 8px;
      color: #dce9e5;
      font-weight: 700;
    }

    .sidenav .nav-link.active-item,
    .sidenav .nav-link:hover {
      background: #25483f;
      color: #ffffff;
    }

    .sidenav .nav-link.active-item {
      box-shadow: inset 3px 0 0 #36b37e;
    }

    .sidenav .nav-link span {
      color: inherit;
    }

    .projection-card {
      margin-top: 28px;
      background: #1c332e;
      color: #ffffff;
      border-color: #38544c;
    }

    .projection-card mat-card-title {
      color: #ffffff;
    }

    .projection-card mat-card-subtitle {
      color: #b9cbc5;
    }

    .projection-card p {
      display: block;
      margin: 18px 0 16px;
      color: #c9d8d3;
      line-height: 1.5;
    }

    mat-list {
      padding: 0;
    }

    @media (max-width: 1100px) {
      .sidenav {
        width: 236px;
      }
    }

    @media (max-width: 720px) {
      .shell {
        min-width: 900px;
      }

      .sidenav {
        width: 220px;
      }
    }
  `]
})
export class DashboardPlaceholderComponent {}
