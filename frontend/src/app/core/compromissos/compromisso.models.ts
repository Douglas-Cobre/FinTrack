export type StatusContaAPagar = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'CANCELADA';
export type StatusContaAReceber = 'PENDENTE' | 'RECEBIDA' | 'ATRASADA' | 'CANCELADA';

export type ContaAPagar = {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: StatusContaAPagar;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
  movimentacaoId: string | null;
};

export type ContaAReceber = {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: StatusContaAReceber;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
  movimentacaoId: string | null;
};

export type ContaAPagarRequest = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaFinanceiraId: string;
  categoriaId: string;
  status?: StatusContaAPagar;
};

export type ContaAReceberRequest = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaFinanceiraId: string;
  categoriaId: string;
  status?: StatusContaAReceber;
};
