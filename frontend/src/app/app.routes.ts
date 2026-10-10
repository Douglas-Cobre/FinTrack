import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard-placeholder.component').then(m => m.DashboardPlaceholderComponent),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard-home.component').then(m => m.DashboardHomeComponent) },
      { path: 'contas', loadComponent: () => import('./features/contas/contas-financeiras.component').then(m => m.ContasFinanceirasComponent) },
      { path: 'movimentacoes', loadComponent: () => import('./features/movimentacoes/movimentacoes.component').then(m => m.MovimentacoesComponent) },
      { path: 'categorias', loadComponent: () => import('./features/categorias/categorias.component').then(m => m.CategoriasComponent) },
      { path: 'financeiro', loadComponent: () => import('./features/financeiro/financeiro.component').then(m => m.FinanceiroComponent) },
      { path: 'contas-a-receber', redirectTo: 'financeiro' },
      { path: 'contas-a-pagar', redirectTo: 'financeiro' },
      { path: 'dre', loadChildren: () => import('./features/dre/dre.routes').then(m => m.DRE_ROUTES) },
      { path: 'relatorios', loadChildren: () => import('./features/relatorios/relatorios.routes').then(m => m.RELATORIOS_ROUTES) }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'cadastro', loadComponent: () => import('./features/auth/cadastro.component').then(m => m.CadastroComponent) },
  { path: '**', redirectTo: '' }
];
