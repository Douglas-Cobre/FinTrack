package com.fintrack.compromisso.controller;

import com.fintrack.compromisso.dto.ContaAPagarRequest;
import com.fintrack.compromisso.dto.ContaAPagarResponse;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.compromisso.service.ContaAPagarService;
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
@RequestMapping("/api/contas-a-pagar")
public class ContaAPagarController {

    private final ContaAPagarService contaAPagarService;

    public ContaAPagarController(ContaAPagarService contaAPagarService) {
        this.contaAPagarService = contaAPagarService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContaAPagarResponse criar(@Valid @RequestBody ContaAPagarRequest request) {
        return contaAPagarService.criar(request);
    }

    @GetMapping
    public List<ContaAPagarResponse> listar() {
        return contaAPagarService.listar();
    }

    @PutMapping("/{id}")
    public ContaAPagarResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ContaAPagarRequest request) {
        return contaAPagarService.atualizar(id, request);
    }

    @PostMapping("/{id}/pagar")
    public ContaAPagarResponse pagar(@PathVariable UUID id, @Valid @RequestBody EfetivacaoRequest request) {
        return contaAPagarService.pagar(id, request);
    }

    @PostMapping("/{id}/cancelar")
    public ContaAPagarResponse cancelar(@PathVariable UUID id) {
        return contaAPagarService.cancelar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        contaAPagarService.excluir(id);
    }
}
