package com.fintrack.movimentacao.repository;

import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.shared.domain.TipoMovimentacao;
import java.math.BigDecimal;
import java.util.UUID;

public record TotalDrePorCategoria(TipoMovimentacao tipo, GrupoDre grupo,
        UUID categoriaId, String categoriaNome, BigDecimal valor, Long quantidade) {}
