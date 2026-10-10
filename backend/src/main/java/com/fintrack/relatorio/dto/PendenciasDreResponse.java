package com.fintrack.relatorio.dto;

import java.math.BigDecimal;

public record PendenciasDreResponse(long quantidade, BigDecimal receitas, BigDecimal despesas) {}
