package com.fintrack.compromisso.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PreviaEfetivacaoResponse(
        LocalDate data,
        BigDecimal valorOriginal,
        BigDecimal multa,
        BigDecimal juros,
        BigDecimal desconto,
        BigDecimal valorAtualizado
) {
}
