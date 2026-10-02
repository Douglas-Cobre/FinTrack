package com.fintrack.movimentacao.controller;

import com.fintrack.movimentacao.dto.MovimentacaoRequest;
import com.fintrack.movimentacao.dto.MovimentacaoResponse;
import com.fintrack.movimentacao.service.MovimentacaoService;
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
@RequestMapping("/api/movimentacoes")
public class MovimentacaoController {

    private final MovimentacaoService movimentacaoService;

    public MovimentacaoController(MovimentacaoService movimentacaoService) {
        this.movimentacaoService = movimentacaoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentacaoResponse criar(@Valid @RequestBody MovimentacaoRequest request) {
        return movimentacaoService.criar(request);
    }

    @GetMapping
    public List<MovimentacaoResponse> listar() {
        return movimentacaoService.listar();
    }

    @PutMapping("/{id}")
    public MovimentacaoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody MovimentacaoRequest request) {
        return movimentacaoService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        movimentacaoService.excluir(id);
    }
}
