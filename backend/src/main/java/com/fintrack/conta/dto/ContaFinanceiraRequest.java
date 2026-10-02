package com.fintrack.conta.dto;

import com.fintrack.conta.domain.TipoContaFinanceira;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ContaFinanceiraRequest(
        @NotBlank
        @Size(max = 120)
        String nome,

        @NotNull
        TipoContaFinanceira tipo,

        @NotNull
        @DecimalMin(value = "0.00")
        BigDecimal saldoInicial
) {
}
