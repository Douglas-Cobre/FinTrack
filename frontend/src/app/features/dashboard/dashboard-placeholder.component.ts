import { CommonModule } from '@angular/common';
import { Component, HostListener, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatSidenavModule,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #menu class="sidenav" [mode]="telaPequena ? 'over' : 'side'" [opened]="!telaPequena">
        <section class="brand">
          <div class="brand-mark">F</div>
          <div>
            <strong>FinTrack</strong>
            <span>Gestao financeira</span>
          </div>
        </section>

        <mat-nav-list (click)="fecharMenu()">
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
          <a mat-list-item class="nav-link" routerLink="/financeiro" routerLinkActive="active-item">
            <span matListItemTitle>Financeiro</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/relatorios" routerLinkActive="active-item">
            <span matListItemTitle>Relatorios</span>
          </a>
          <a mat-list-item class="nav-link" routerLink="/dre" routerLinkActive="active-item">
            <span matListItemTitle>DRE</span>
          </a>
        </mat-nav-list>

      </mat-sidenav>

      <mat-sidenav-content class="workspace">
        <button *ngIf="telaPequena" mat-stroked-button class="abrir-menu" type="button" (click)="menu.toggle()"
          aria-label="Abrir menu de navegacao">Menu</button>
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

    mat-list {
      padding: 0;
    }

    @media (max-width: 1100px) {
      .sidenav {
        width: 236px;
      }
    }

    @media (max-width: 720px) {
      .abrir-menu {
        margin: 12px 20px;
      }

      .sidenav {
        width: 220px;
      }
    }
  `]
})
export class DashboardPlaceholderComponent {
  @ViewChild('menu') private menu?: MatSidenav;
  protected telaPequena = window.innerWidth <= 720;

  @HostListener('window:resize')
  protected atualizarLargura(): void {
    this.telaPequena = window.innerWidth <= 720;
  }

  protected fecharMenu(): void {
    if (this.telaPequena) void this.menu?.close();
  }
}
