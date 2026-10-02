export type TipoMovimentacao = 'RECEITA' | 'DESPESA';

export type Categoria = {
  id: string;
  nome: string;
  tipo: TipoMovimentacao;
};

export type CategoriaRequest = {
  nome: string;
  tipo: TipoMovimentacao;
};
