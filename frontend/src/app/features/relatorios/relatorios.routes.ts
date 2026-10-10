import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { RelatoriosComponent } from './relatorios.component';

export const RELATORIOS_ROUTES: Routes = [
  {
    path: '',
    component: RelatoriosComponent,
    providers: [provideCharts(withDefaultRegisterables())]
  }
];
