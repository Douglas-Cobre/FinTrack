package com.fintrack.configuracaofinanceira.dto;

import java.math.BigDecimal;

public record ConfiguracaoFinanceiraResponse(
        BigDecimal multaPercentual,
        BigDecimal jurosDiaPercentual,
        BigDecimal descontoPercentual,
        Integer descontoDiasAntes
) {
}

