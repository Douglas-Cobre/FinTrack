export type TotalPorCategoria = {
  categoria: string;
  total: number;
};

export type ResumoFinanceiro = {
  receitas: number;
  despesas: number;
  resultado: number;
  despesasPorCategoria: TotalPorCategoria[];
  receitasPorCategoria: TotalPorCategoria[];
};
