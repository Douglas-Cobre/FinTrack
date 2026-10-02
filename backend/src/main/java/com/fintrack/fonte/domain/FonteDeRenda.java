package com.fintrack.fonte.domain;

import com.fintrack.shared.domain.BaseEntity;
import com.fintrack.shared.domain.Periodicidade;
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
import java.util.UUID;

@Entity
@Table(name = "fontes_de_renda")
public class FonteDeRenda extends BaseEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoFonteDeRenda tipo;

    @Column(name = "valor_esperado", precision = 15, scale = 2)
    private BigDecimal valorEsperado;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Periodicidade periodicidade;

    @Column(name = "dia_previsto")
    private Integer diaPrevisto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    protected FonteDeRenda() {
    }

    public FonteDeRenda(
            String nome,
            TipoFonteDeRenda tipo,
            BigDecimal valorEsperado,
            Periodicidade periodicidade,
            Integer diaPrevisto,
            Usuario usuario
    ) {
        this.nome = nome;
        this.tipo = tipo;
        this.valorEsperado = valorEsperado;
        this.periodicidade = periodicidade;
        this.diaPrevisto = diaPrevisto;
        this.usuario = usuario;
    }

    @Override
    public UUID getId() {
        return id;
    }
}
