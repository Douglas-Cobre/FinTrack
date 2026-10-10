package com.fintrack.compromisso.service;

import com.fintrack.compromisso.dto.PreviaEfetivacaoResponse;
import com.fintrack.shared.exception.RegraNegocioException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class CalculoEfetivacao {
    private CalculoEfetivacao() {}

    public static PreviaEfetivacaoResponse calcular(BigDecimal valor, LocalDate vencimento,
            LocalDate data, BigDecimal multaPercentual, BigDecimal jurosDiaPercentual,
            BigDecimal descontoPercentual, int descontoDiasAntes) {
        if (data == null) throw new RegraNegocioException("Informe a data da efetivacao.");
        var original = valor.setScale(2, RoundingMode.HALF_UP);
        var multa = BigDecimal.ZERO.setScale(2);
        var juros = BigDecimal.ZERO.setScale(2);
        var desconto = BigDecimal.ZERO.setScale(2);
        var atraso = ChronoUnit.DAYS.between(vencimento, data);
        if (atraso > 0) {
            multa = percentual(original, multaPercentual);
            juros = percentual(original, jurosDiaPercentual.multiply(BigDecimal.valueOf(atraso)));
        } else if (-atraso <= descontoDiasAntes) {
            desconto = percentual(original, descontoPercentual).min(original);
        }
        var total = original.add(multa).add(juros).subtract(desconto);
        return new PreviaEfetivacaoResponse(data, original, multa, juros, desconto, total);
    }

    public static void validarConfirmacao(PreviaEfetivacaoResponse previa, BigDecimal valorConfirmado) {
        if (previa.valorAtualizado().signum() <= 0) {
            throw new RegraNegocioException("O valor da efetivacao deve ser maior que zero. Revise o desconto.");
        }
        if (valorConfirmado != null && previa.valorAtualizado().compareTo(valorConfirmado) != 0) {
            throw new RegraNegocioException("O valor foi alterado. Consulte a previa novamente antes de confirmar.");
        }
    }

    private static BigDecimal percentual(BigDecimal valor, BigDecimal percentual) {
        return valor.multiply(percentual).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
