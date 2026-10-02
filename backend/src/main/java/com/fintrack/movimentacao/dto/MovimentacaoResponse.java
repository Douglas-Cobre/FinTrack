package com.fintrack.movimentacao.dto;

import com.fintrack.shared.domain.TipoMovimentacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MovimentacaoResponse(
        UUID id,
        String descricao,
        BigDecimal valor,
        TipoMovimentacao tipo,
        LocalDate data,
        UUID contaFinanceiraId,
        String contaFinanceiraNome,
        UUID categoriaId,
        String categoriaNome
) {
}
