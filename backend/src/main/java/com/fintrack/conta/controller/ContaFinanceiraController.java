package com.fintrack.conta.controller;

import com.fintrack.conta.dto.ContaFinanceiraRequest;
import com.fintrack.conta.dto.ContaFinanceiraResponse;
import com.fintrack.conta.service.ContaFinanceiraService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contas-financeiras")
public class ContaFinanceiraController {

    private final ContaFinanceiraService contaFinanceiraService;

    public ContaFinanceiraController(ContaFinanceiraService contaFinanceiraService) {
        this.contaFinanceiraService = contaFinanceiraService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContaFinanceiraResponse criar(@Valid @RequestBody ContaFinanceiraRequest request) {
        return contaFinanceiraService.criar(request);
    }

    @GetMapping
    public List<ContaFinanceiraResponse> listar() {
        return contaFinanceiraService.listar();
    }

    @GetMapping("/{id}")
    public ContaFinanceiraResponse buscar(@PathVariable UUID id) {
        return contaFinanceiraService.buscar(id);
    }

    @PutMapping("/{id}")
    public ContaFinanceiraResponse atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody ContaFinanceiraRequest request
    ) {
        return contaFinanceiraService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        contaFinanceiraService.excluir(id);
    }
}
