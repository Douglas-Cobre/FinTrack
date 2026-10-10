package com.fintrack.relatorio.dto;

import com.fintrack.shared.domain.TipoMovimentacao;
import java.math.BigDecimal;
import java.util.UUID;

public record CategoriaDreResponse(UUID categoriaId, String categoriaNome,
        TipoMovimentacao tipoMovimentacao, BigDecimal valor) {}
