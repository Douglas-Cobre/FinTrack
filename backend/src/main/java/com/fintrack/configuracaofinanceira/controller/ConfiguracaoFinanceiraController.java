package com.fintrack.configuracaofinanceira.controller;

import com.fintrack.configuracaofinanceira.dto.ConfiguracaoFinanceiraRequest;
import com.fintrack.configuracaofinanceira.dto.ConfiguracaoFinanceiraResponse;
import com.fintrack.configuracaofinanceira.service.ConfiguracaoFinanceiraService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes-financeiras")
public class ConfiguracaoFinanceiraController {

    private final ConfiguracaoFinanceiraService service;

    public ConfiguracaoFinanceiraController(ConfiguracaoFinanceiraService service) {
        this.service = service;
    }

    @GetMapping
    public ConfiguracaoFinanceiraResponse obter() {
        return service.obter();
    }

    @PutMapping
    public ConfiguracaoFinanceiraResponse salvar(@Valid @RequestBody ConfiguracaoFinanceiraRequest request) {
        return service.salvar(request);
    }
}

