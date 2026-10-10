package com.fintrack.relatorio.dto;

import java.time.LocalDate;
import java.util.List;

public record DreResponse(LocalDate inicio, LocalDate fim, String regime, boolean completo,
        List<LinhaDreResponse> linhas, PendenciasDreResponse pendencias, PendenciasDreResponse foraDre) {}
