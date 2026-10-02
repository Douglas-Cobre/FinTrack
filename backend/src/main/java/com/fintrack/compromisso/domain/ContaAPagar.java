package com.fintrack.compromisso.domain;

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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contas_a_pagar")
public class ContaAPagar extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 160)
    private String descricao;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusContaAPagar status = StatusContaAPagar.PENDENTE;

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

    protected ContaAPagar() {
    }

    public ContaAPagar(
            String descricao,
            BigDecimal valor,
            LocalDate dataVencimento,
            ContaFinanceira contaFinanceira,
            Categoria categoria,
            Usuario usuario
    ) {
        this.descricao = descricao;
        this.valor = valor;
        this.dataVencimento = dataVencimento;
        this.contaFinanceira = contaFinanceira;
        this.categoria = categoria;
        this.usuario = usuario;
    }

    public void atualizar(
            String descricao,
            BigDecimal valor,
            LocalDate dataVencimento,
            ContaFinanceira contaFinanceira,
            Categoria categoria,
            StatusContaAPagar status
    ) {
        this.descricao = descricao;
        this.valor = valor;
        this.dataVencimento = dataVencimento;
        this.contaFinanceira = contaFinanceira;
        this.categoria = categoria;
        this.status = status;
    }

    public void marcarComoPaga(Movimentacao movimentacao) {
        this.status = StatusContaAPagar.PAGA;
        this.movimentacao = movimentacao;
    }

    public void cancelar() {
        this.status = StatusContaAPagar.CANCELADA;
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

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public StatusContaAPagar getStatus() {
        return status;
    }

    public ContaFinanceira getContaFinanceira() {
        return contaFinanceira;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public Movimentacao getMovimentacao() {
        return movimentacao;
    }

    public Usuario getUsuario() {
        return usuario;
    }
}
