package com.fintrack.categoria.domain;

import com.fintrack.shared.domain.TipoMovimentacao;

public enum GrupoDre {
    RECEITA_OPERACIONAL(TipoMovimentacao.RECEITA),
    DEDUCAO_RECEITA(TipoMovimentacao.DESPESA),
    CUSTO(TipoMovimentacao.DESPESA),
    DESPESA_OPERACIONAL(TipoMovimentacao.DESPESA),
    RECEITA_FINANCEIRA(TipoMovimentacao.RECEITA),
    DESPESA_FINANCEIRA(TipoMovimentacao.DESPESA),
    TRIBUTO_SOBRE_LUCRO(TipoMovimentacao.DESPESA),
    FORA_DRE(null);

    private final TipoMovimentacao tipo;
    GrupoDre(TipoMovimentacao tipo) { this.tipo = tipo; }
    public boolean compativelCom(TipoMovimentacao tipo) {
        return this.tipo == null || this.tipo == tipo;
    }
}
