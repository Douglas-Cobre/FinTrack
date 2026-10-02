import { TipoMovimentacao } from '../categorias/categoria.models';

export type Movimentacao = {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoMovimentacao;
  data: string;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
};

export type MovimentacaoRequest = {
  descricao: string;
  valor: number;
  tipo: TipoMovimentacao;
  data: string;
  contaFinanceiraId: string;
  categoriaId: string;
};
