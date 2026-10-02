import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { CadastroComponent } from './features/auth/cadastro.component';
import { LoginComponent } from './features/auth/login.component';
import { CategoriasComponent } from './features/categorias/categorias.component';
import { ContasFinanceirasComponent } from './features/contas/contas-financeiras.component';
import { DashboardHomeComponent } from './features/dashboard/dashboard-home.component';
import { DashboardPlaceholderComponent } from './features/dashboard/dashboard-placeholder.component';
import { MovimentacoesComponent } from './features/movimentacoes/movimentacoes.component';
import { ContasAPagarComponent } from './features/compromissos/contas-a-pagar.component';
import { ContasAReceberComponent } from './features/compromissos/contas-a-receber.component';
import { RelatoriosComponent } from './features/relatorios/relatorios.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: DashboardPlaceholderComponent,
    children: [
      {
        path: '',
        component: DashboardHomeComponent
      },
      {
        path: 'contas',
        component: ContasFinanceirasComponent
      },
      {
        path: 'movimentacoes',
        component: MovimentacoesComponent
      },
      {
        path: 'categorias',
        component: CategoriasComponent
      },
      {
        path: 'contas-a-pagar',
        component: ContasAPagarComponent
      },
      {
        path: 'contas-a-receber',
        component: ContasAReceberComponent
      },
      {
        path: 'relatorios',
        component: RelatoriosComponent
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'cadastro',
    component: CadastroComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
