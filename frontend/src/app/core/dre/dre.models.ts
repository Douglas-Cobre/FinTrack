import { TipoMovimentacao } from '../categorias/categoria.models';

export type CategoriaDre = {
  categoriaId: string;
  categoriaNome: string;
  tipoMovimentacao: TipoMovimentacao;
  valor: number;
};
export type LinhaDre = {
  codigo: string;
  descricao: string;
  tipo: 'GRUPO' | 'SUBTOTAL';
  valor: number;
  categorias: CategoriaDre[];
};
export type TotaisDre = { quantidade: number; receitas: number; despesas: number };
export type Dre = {
  inicio: string;
  fim: string;
  regime: 'CAIXA';
  completo: boolean;
  linhas: LinhaDre[];
  pendencias: TotaisDre;
  foraDre: TotaisDre;
};
