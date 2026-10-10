export type StatusContaAPagar = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'CANCELADA';
export type PreviaEfetivacao = {
  data: string;
  valorOriginal: number;
  multa: number;
  juros: number;
  desconto: number;
  valorAtualizado: number;
};
export type StatusContaAReceber = 'PENDENTE' | 'RECEBIDA' | 'ATRASADA' | 'CANCELADA';

export type ContaAPagar = {
  id: string;
  descricao: string;
  valor: number;
  valorAtualizado: number;
  dataVencimento: string;
  status: StatusContaAPagar;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
  multaPercentual: number;
  jurosDiaPercentual: number;
  descontoPercentual: number;
  descontoDiasAntes: number;
  movimentacaoId: string | null;
};

export type ContaAReceber = {
  id: string;
  descricao: string;
  valor: number;
  valorAtualizado: number;
  dataVencimento: string;
  status: StatusContaAReceber;
  contaFinanceiraId: string;
  contaFinanceiraNome: string;
  categoriaId: string;
  categoriaNome: string;
  multaPercentual: number;
  jurosDiaPercentual: number;
  descontoPercentual: number;
  descontoDiasAntes: number;
  movimentacaoId: string | null;
};

export type ContaAPagarRequest = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaFinanceiraId: string;
  categoriaId: string;
  multaPercentual: number;
  jurosDiaPercentual: number;
  descontoPercentual: number;
  descontoDiasAntes: number;
  status?: StatusContaAPagar;
};

export type ContaAReceberRequest = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  contaFinanceiraId: string;
  categoriaId: string;
  multaPercentual: number;
  jurosDiaPercentual: number;
  descontoPercentual: number;
  descontoDiasAntes: number;
  status?: StatusContaAReceber;
};
