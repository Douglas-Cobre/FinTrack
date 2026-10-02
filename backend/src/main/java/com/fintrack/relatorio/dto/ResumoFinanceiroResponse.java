package com.fintrack.relatorio.dto;

import java.math.BigDecimal;
import java.util.List;

public record ResumoFinanceiroResponse(
        BigDecimal receitas,
        BigDecimal despesas,
        BigDecimal resultado,
        List<TotalPorCategoriaResponse> despesasPorCategoria,
        List<TotalPorCategoriaResponse> receitasPorCategoria
) {
}
