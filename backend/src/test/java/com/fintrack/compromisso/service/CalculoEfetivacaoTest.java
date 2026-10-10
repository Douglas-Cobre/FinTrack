package com.fintrack.compromisso.service;

import com.fintrack.shared.exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.assertj.core.api.Assertions.*;

class CalculoEfetivacaoTest {
    private final LocalDate vencimento = LocalDate.of(2026, 9, 10);

    @Test
    void janelaDoDescontoIncluiLimitesMasNaoDatasAnteriores() {
        assertThat(calcular(vencimento.minusDays(3), 3, "10").desconto()).isEqualByComparingTo("10");
        assertThat(calcular(vencimento.minusDays(4), 3, "10").desconto()).isZero();
        assertThat(calcular(vencimento, 0, "10").desconto()).isEqualByComparingTo("10");
        assertThat(calcular(vencimento.minusDays(1), 0, "10").desconto()).isZero();
        assertThat(calcular(vencimento.plusDays(1), 3, "10").desconto()).isZero();
    }

    @Test
    void arredondaComponentesEmCentavosEReconciliaOTotal() {
        var previa = CalculoEfetivacao.calcular(new BigDecimal("10.01"), vencimento, vencimento.plusDays(2),
                new BigDecimal("0.05"), new BigDecimal("0.025"), BigDecimal.ZERO, 0);
        assertThat(previa.multa()).isEqualByComparingTo("0.01");
        assertThat(previa.juros()).isEqualByComparingTo("0.01");
        assertThat(previa.valorAtualizado()).isEqualByComparingTo("10.03");
        assertThat(previa.valorOriginal().add(previa.multa()).add(previa.juros()).subtract(previa.desconto()))
                .isEqualByComparingTo(previa.valorAtualizado());
    }

    @Test
    void descontoNaoPodeGerarEfetivacaoComValorZeroOuNegativo() {
        for (var desconto : new String[]{"100", "110"}) {
            assertThatThrownBy(() -> CalculoEfetivacao.validarConfirmacao(calcular(vencimento, 0, desconto), null))
                    .isInstanceOf(RegraNegocioException.class).hasMessageContaining("maior que zero");
        }
    }

    private com.fintrack.compromisso.dto.PreviaEfetivacaoResponse calcular(LocalDate data, int dias, String desconto) {
        return CalculoEfetivacao.calcular(new BigDecimal("100"), vencimento, data,
                new BigDecimal("2"), new BigDecimal("0.5"), new BigDecimal(desconto), dias);
    }
}
