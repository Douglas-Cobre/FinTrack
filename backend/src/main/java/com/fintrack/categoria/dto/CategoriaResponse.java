package com.fintrack.categoria.dto;

import com.fintrack.shared.domain.TipoMovimentacao;

import java.util.UUID;

public record CategoriaResponse(
        UUID id,
        String nome,
        TipoMovimentacao tipo
) {
}
