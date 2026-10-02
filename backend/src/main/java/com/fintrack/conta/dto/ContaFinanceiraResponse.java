package com.fintrack.conta.dto;

import com.fintrack.conta.domain.TipoContaFinanceira;

import java.math.BigDecimal;
import java.util.UUID;

public record ContaFinanceiraResponse(
        UUID id,
        String nome,
        TipoContaFinanceira tipo,
        BigDecimal saldoInicial,
        BigDecimal saldoAtual
) {
}
