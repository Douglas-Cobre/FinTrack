package com.fintrack.relatorio.dto;

import java.math.BigDecimal;

public record TotalPorCategoriaResponse(
        String categoria,
        BigDecimal total
) {
}
