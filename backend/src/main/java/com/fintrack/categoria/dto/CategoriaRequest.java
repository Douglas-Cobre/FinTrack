package com.fintrack.categoria.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.shared.domain.TipoMovimentacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CategoriaRequest {
    @NotBlank
    @Size(max = 120)
    private String nome;
    @NotNull
    private TipoMovimentacao tipo;
    private GrupoDre grupoDre;
    private boolean grupoDreInformado;

    public CategoriaRequest() {}
    public CategoriaRequest(String nome, TipoMovimentacao tipo) {
        this.nome = nome;
        this.tipo = tipo;
    }
    public String nome() { return nome; }
    public TipoMovimentacao tipo() { return tipo; }
    public GrupoDre grupoDre() { return grupoDre; }
    public boolean grupoDreInformado() { return grupoDreInformado; }

    @JsonSetter("nome")
    public void setNome(String nome) { this.nome = nome; }
    @JsonSetter("tipo")
    public void setTipo(TipoMovimentacao tipo) { this.tipo = tipo; }
    // An explicit null invokes the setter; an omitted field preserves the old group.
    @JsonSetter("grupoDre")
    public void setGrupoDre(GrupoDre grupoDre) {
        this.grupoDre = grupoDre;
        this.grupoDreInformado = true;
    }
}
