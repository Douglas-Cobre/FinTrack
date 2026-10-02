package com.fintrack.relatorio.controller;

import com.fintrack.relatorio.dto.ResumoFinanceiroResponse;
import com.fintrack.relatorio.service.RelatorioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    public RelatorioController(RelatorioService relatorioService) {
        this.relatorioService = relatorioService;
    }

    @GetMapping("/resumo")
    public ResumoFinanceiroResponse resumo() {
        return relatorioService.resumo();
    }
}
