package com.fintrack.compromisso.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EfetivacaoRequest(
        @NotNull
        LocalDate data,
        @DecimalMin("0.01")
        BigDecimal valorConfirmado
) {
    public EfetivacaoRequest(LocalDate data) {
        this(data, null);
    }
}
