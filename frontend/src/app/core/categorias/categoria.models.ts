export type TipoMovimentacao = 'RECEITA' | 'DESPESA';
export type GrupoDre = 'RECEITA_OPERACIONAL' | 'DEDUCAO_RECEITA' | 'CUSTO'
  | 'DESPESA_OPERACIONAL' | 'RECEITA_FINANCEIRA' | 'DESPESA_FINANCEIRA'
  | 'TRIBUTO_SOBRE_LUCRO' | 'FORA_DRE';

export const GRUPOS_DRE: { codigo: GrupoDre; descricao: string; tipo: TipoMovimentacao | null }[] = [
  { codigo: 'RECEITA_OPERACIONAL', descricao: 'Receita operacional', tipo: 'RECEITA' },
  { codigo: 'DEDUCAO_RECEITA', descricao: 'Deducoes da receita', tipo: 'DESPESA' },
  { codigo: 'CUSTO', descricao: 'Custos', tipo: 'DESPESA' },
  { codigo: 'DESPESA_OPERACIONAL', descricao: 'Despesas operacionais', tipo: 'DESPESA' },
  { codigo: 'RECEITA_FINANCEIRA', descricao: 'Receitas financeiras', tipo: 'RECEITA' },
  { codigo: 'DESPESA_FINANCEIRA', descricao: 'Despesas financeiras', tipo: 'DESPESA' },
  { codigo: 'TRIBUTO_SOBRE_LUCRO', descricao: 'Tributos sobre o lucro', tipo: 'DESPESA' },
  { codigo: 'FORA_DRE', descricao: 'Fora da DRE (exclusao intencional)', tipo: null }
];

export type Categoria = {
  id: string;
  nome: string;
  tipo: TipoMovimentacao;
  grupoDre: GrupoDre | null;
};

export type CategoriaRequest = {
  nome: string;
  tipo: TipoMovimentacao;
  grupoDre?: GrupoDre | null;
};
