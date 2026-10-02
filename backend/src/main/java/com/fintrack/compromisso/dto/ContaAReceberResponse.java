package com.fintrack.compromisso.dto;

import com.fintrack.compromisso.domain.StatusContaAReceber;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContaAReceberResponse(
        UUID id,
        String descricao,
        BigDecimal valor,
        LocalDate dataVencimento,
        StatusContaAReceber status,
        UUID contaFinanceiraId,
        String contaFinanceiraNome,
        UUID categoriaId,
        String categoriaNome,
        UUID movimentacaoId
) {
}
