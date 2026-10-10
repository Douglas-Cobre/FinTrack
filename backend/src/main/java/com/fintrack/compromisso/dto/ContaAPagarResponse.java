package com.fintrack.compromisso.dto;

import com.fintrack.compromisso.domain.StatusContaAPagar;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContaAPagarResponse(
        UUID id,
        String descricao,
        BigDecimal valor,
        BigDecimal valorAtualizado,
        LocalDate dataVencimento,
        StatusContaAPagar status,
        UUID contaFinanceiraId,
        String contaFinanceiraNome,
        UUID categoriaId,
        String categoriaNome,
        BigDecimal multaPercentual,
        BigDecimal jurosDiaPercentual,
        BigDecimal descontoPercentual,
        Integer descontoDiasAntes,
        UUID movimentacaoId
) {
}
