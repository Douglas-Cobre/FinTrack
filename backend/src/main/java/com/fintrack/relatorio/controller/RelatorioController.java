package com.fintrack.relatorio.controller;

import com.fintrack.relatorio.dto.ResumoFinanceiroResponse;
import com.fintrack.relatorio.dto.DreResponse;
import com.fintrack.relatorio.service.DreService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDate;
import com.fintrack.relatorio.service.RelatorioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    private final DreService dreService;

    public RelatorioController(RelatorioService relatorioService, DreService dreService) {
        this.dreService = dreService;
        this.relatorioService = relatorioService;
    }

    @GetMapping("/dre")
    public DreResponse dre(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        return dreService.consultar(inicio, fim);
    }

    @GetMapping("/resumo")
    public ResumoFinanceiroResponse resumo() {
        return relatorioService.resumo();
    }
}
