package com.fintrack.configuracaofinanceira.domain;

import com.fintrack.shared.domain.BaseEntity;
import com.fintrack.usuario.domain.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "configuracoes_financeiras")
public class ConfiguracaoFinanceira extends BaseEntity {

    public static final BigDecimal MULTA_PADRAO = new BigDecimal("2.00");
    public static final BigDecimal JUROS_DIA_PADRAO = new BigDecimal("0.03");
    public static final BigDecimal DESCONTO_PADRAO = BigDecimal.ZERO;
    public static final int DESCONTO_DIAS_PADRAO = 0;

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "multa_percentual", nullable = false, precision = 7, scale = 4)
    private BigDecimal multaPercentual;

    @Column(name = "juros_dia_percentual", nullable = false, precision = 7, scale = 4)
    private BigDecimal jurosDiaPercentual;

    @Column(name = "desconto_percentual", nullable = false, precision = 7, scale = 4)
    private BigDecimal descontoPercentual;

    @Column(name = "desconto_dias_antes", nullable = false)
    private Integer descontoDiasAntes;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    protected ConfiguracaoFinanceira() {
    }

    public ConfiguracaoFinanceira(Usuario usuario) {
        this.usuario = usuario;
        this.multaPercentual = MULTA_PADRAO;
        this.jurosDiaPercentual = JUROS_DIA_PADRAO;
        this.descontoPercentual = DESCONTO_PADRAO;
        this.descontoDiasAntes = DESCONTO_DIAS_PADRAO;
    }

    public void atualizar(
            BigDecimal multaPercentual,
            BigDecimal jurosDiaPercentual,
            BigDecimal descontoPercentual,
            Integer descontoDiasAntes
    ) {
        this.multaPercentual = multaPercentual;
        this.jurosDiaPercentual = jurosDiaPercentual;
        this.descontoPercentual = descontoPercentual;
        this.descontoDiasAntes = descontoDiasAntes;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public BigDecimal getMultaPercentual() {
        return multaPercentual;
    }

    public BigDecimal getJurosDiaPercentual() {
        return jurosDiaPercentual;
    }

    public BigDecimal getDescontoPercentual() {
        return descontoPercentual;
    }

    public Integer getDescontoDiasAntes() {
        return descontoDiasAntes;
    }
}

