package com.fintrack.relatorio.dto;

import java.math.BigDecimal;
import java.util.List;

public record LinhaDreResponse(String codigo, String descricao, TipoLinhaDre tipo,
        BigDecimal valor, List<CategoriaDreResponse> categorias) {
    public enum TipoLinhaDre { GRUPO, SUBTOTAL }
}
