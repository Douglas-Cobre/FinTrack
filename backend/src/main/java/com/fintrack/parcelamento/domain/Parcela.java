package com.fintrack.parcelamento.domain;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.shared.domain.BaseEntity;
import com.fintrack.usuario.domain.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "parcelas",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_parcela_numero_por_parcelamento",
                columnNames = {"parcelamento_id", "numero"}
        )
)
public class Parcela extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "parcelamento_id", nullable = false)
    private Parcelamento parcelamento;

    @Column(nullable = false)
    private Integer numero;

    @Column(name = "quantidade_total", nullable = false)
    private Integer quantidadeTotal;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusParcela status = StatusParcela.PENDENTE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conta_financeira_id", nullable = false)
    private ContaFinanceira contaFinanceira;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimentacao_id", unique = true)
    private Movimentacao movimentacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    protected Parcela() {
    }

    @Override
    public UUID getId() {
        return id;
    }
}
