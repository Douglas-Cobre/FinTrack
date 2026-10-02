package com.fintrack.movimentacao.domain;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.shared.domain.BaseEntity;
import com.fintrack.shared.domain.TipoMovimentacao;
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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "movimentacoes")
public class Movimentacao extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 160)
    private String descricao;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Column(nullable = false)
    private LocalDate data;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conta_financeira_id", nullable = false)
    private ContaFinanceira contaFinanceira;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem_tipo", nullable = false, length = 30)
    private OrigemMovimentacaoTipo origemTipo = OrigemMovimentacaoTipo.MANUAL;

    @Column(name = "origem_id")
    private UUID origemId;

    protected Movimentacao() {
    }

    public Movimentacao(
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate data,
            ContaFinanceira contaFinanceira,
            Categoria categoria,
            Usuario usuario,
            OrigemMovimentacaoTipo origemTipo,
            UUID origemId
    ) {
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.data = data;
        this.contaFinanceira = contaFinanceira;
        this.categoria = categoria;
        this.usuario = usuario;
        this.origemTipo = origemTipo;
        this.origemId = origemId;
    }

    public void atualizar(
            String descricao,
            BigDecimal valor,
            TipoMovimentacao tipo,
            LocalDate data,
            ContaFinanceira contaFinanceira,
            Categoria categoria
    ) {
        this.descricao = descricao;
        this.valor = valor;
        this.tipo = tipo;
        this.data = data;
        this.contaFinanceira = contaFinanceira;
        this.categoria = categoria;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public LocalDate getData() {
        return data;
    }

    public ContaFinanceira getContaFinanceira() {
        return contaFinanceira;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public Usuario getUsuario() {
        return usuario;
    }
}
