package com.fintrack.relatorio.controller;

import com.fintrack.relatorio.dto.DreResponse;
import com.fintrack.relatorio.dto.PendenciasDreResponse;
import com.fintrack.relatorio.dto.ResumoFinanceiroResponse;
import com.fintrack.relatorio.service.DreService;
import com.fintrack.relatorio.service.PeriodoDreInvalidoException;
import com.fintrack.relatorio.service.RelatorioService;
import com.fintrack.shared.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RelatorioControllerTest {
    private final DreService dreService = mock(DreService.class);
    private final RelatorioService relatorioService = mock(RelatorioService.class);
    private MockMvc mvc;
    private final LocalDate inicio = LocalDate.of(2026, 9, 1);
    private final LocalDate fim = LocalDate.of(2026, 9, 30);

    @BeforeEach
    void preparar() {
        mvc = MockMvcBuilders.standaloneSetup(new RelatorioController(relatorioService, dreService))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void parametrosInvalidosOuAusentesRetornam400Legivel() throws Exception {
        mvc.perform(get("/api/relatorios/dre")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").isNotEmpty());
        mvc.perform(get("/api/relatorios/dre").param("inicio", "2026-02-30").param("fim", "2026-09-30"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/relatorios/dre").param("inicio", "nao-data").param("fim", "2026-09-30"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(dreService);
    }

    @Test
    void periodoInvertidoRetorna400() throws Exception {
        when(dreService.consultar(fim, inicio)).thenThrow(new PeriodoDreInvalidoException());
        mvc.perform(get("/api/relatorios/dre").param("inicio", "2026-09-30").param("fim", "2026-09-01"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").isNotEmpty());
    }

    @Test
    void contratoDreNaoRecebeUsuarioDoCliente() throws Exception {
        var totais = new PendenciasDreResponse(0, BigDecimal.ZERO, BigDecimal.ZERO);
        when(dreService.consultar(inicio, fim)).thenReturn(new DreResponse(inicio, fim, "CAIXA", true, List.of(), totais, totais));
        mvc.perform(get("/api/relatorios/dre").param("inicio", "2026-09-01").param("fim", "2026-09-30").param("usuarioId", "outro"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.regime").value("CAIXA"))
                .andExpect(jsonPath("$.completo").value(true)).andExpect(jsonPath("$.pendencias.receitas").value(0));
        verify(dreService).consultar(inicio, fim);
    }

    @Test
    void preservaContratoDoResumo() throws Exception {
        when(relatorioService.resumo()).thenReturn(new ResumoFinanceiroResponse(new BigDecimal("10"), new BigDecimal("4"),
                new BigDecimal("6"), List.of(), List.of()));
        mvc.perform(get("/api/relatorios/resumo")).andExpect(status().isOk())
                .andExpect(jsonPath("$.receitas").value(10)).andExpect(jsonPath("$.despesas").value(4))
                .andExpect(jsonPath("$.resultado").value(6)).andExpect(jsonPath("$.despesasPorCategoria").isArray())
                .andExpect(jsonPath("$.receitasPorCategoria").isArray()).andExpect(jsonPath("$.regime").doesNotExist());
        verifyNoInteractions(dreService);
    }
}
