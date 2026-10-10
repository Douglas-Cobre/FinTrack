package com.fintrack.configuracaofinanceira.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ConfiguracaoFinanceiraRequest(
        @NotNull
        @DecimalMin("0.00")
        BigDecimal multaPercentual,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal jurosDiaPercentual,

        @NotNull
        @DecimalMin("0.00")
        @DecimalMax("100.00")
        BigDecimal descontoPercentual,

        @NotNull
        @Min(0)
        Integer descontoDiasAntes
) {
}

