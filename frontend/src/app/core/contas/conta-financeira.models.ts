export type TipoContaFinanceira =
  | 'CONTA_CORRENTE'
  | 'POUPANCA'
  | 'DINHEIRO'
  | 'INVESTIMENTO'
  | 'OUTRA';

export type ContaFinanceira = {
  id: string;
  nome: string;
  tipo: TipoContaFinanceira;
  saldoInicial: number;
  saldoAtual: number;
};

export type ContaFinanceiraRequest = {
  nome: string;
  tipo: TipoContaFinanceira;
  saldoInicial: number;
};
