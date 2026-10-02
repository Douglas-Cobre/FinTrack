package com.fintrack.categoria.dto;

import com.fintrack.shared.domain.TipoMovimentacao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoriaRequest(
        @NotBlank
        @Size(max = 120)
        String nome,

        @NotNull
        TipoMovimentacao tipo
) {
}
