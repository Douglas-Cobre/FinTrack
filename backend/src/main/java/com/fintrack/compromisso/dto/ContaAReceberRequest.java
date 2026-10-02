package com.fintrack.compromisso.dto;

import com.fintrack.compromisso.domain.StatusContaAReceber;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContaAReceberRequest(
        @NotBlank
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

        StatusContaAReceber status
) {
}
