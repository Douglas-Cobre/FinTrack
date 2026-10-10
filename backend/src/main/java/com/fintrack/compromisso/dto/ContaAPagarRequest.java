package com.fintrack.compromisso.dto;

import com.fintrack.compromisso.domain.StatusContaAPagar;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContaAPagarRequest(
        @Size(max = 160)
        String descricao,

        @NotNull
        @DecimalMin("0.01")
        BigDecimal valor,

        @NotNull
        LocalDate dataVencimento,

        @NotNull
        UUID contaFinanceiraId,

        @NotNull
        UUID categoriaId,

        @DecimalMin("0.00")
        BigDecimal multaPercentual,

        @DecimalMin("0.00")
        BigDecimal jurosDiaPercentual,

        @DecimalMin("0.00")
        BigDecimal descontoPercentual,

        @Min(0)
        Integer descontoDiasAntes,

        StatusContaAPagar status
) {
}
