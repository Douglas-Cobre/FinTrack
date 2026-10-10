import { TipoMovimentacao } from '../categorias/categoria.models';

export type Movimentacao = {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoMovimentacao;
  data: string;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  origemTipo: 'MANUAL' | 'CONTA_A_PAGAR' | 'CONTA_A_RECEBER' | 'PARCELA';
  origemId: string | null;
};

export type MovimentacaoRequest = {
  descricao: string;
  valor: number;
  tipo: TipoMovimentacao;
  data: string;
  contaFinanceiraId: string;
  categoriaId: string | null;
};
