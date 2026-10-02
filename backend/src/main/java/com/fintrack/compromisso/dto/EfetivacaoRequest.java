package com.fintrack.compromisso.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record EfetivacaoRequest(
        @NotNull
        LocalDate data
) {
}
