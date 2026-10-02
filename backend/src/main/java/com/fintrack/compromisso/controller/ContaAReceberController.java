package com.fintrack.compromisso.controller;

import com.fintrack.compromisso.dto.ContaAReceberRequest;
import com.fintrack.compromisso.dto.ContaAReceberResponse;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.compromisso.service.ContaAReceberService;
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
@RequestMapping("/api/contas-a-receber")
public class ContaAReceberController {

    private final ContaAReceberService contaAReceberService;

    public ContaAReceberController(ContaAReceberService contaAReceberService) {
        this.contaAReceberService = contaAReceberService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContaAReceberResponse criar(@Valid @RequestBody ContaAReceberRequest request) {
        return contaAReceberService.criar(request);
    }

    @GetMapping
    public List<ContaAReceberResponse> listar() {
        return contaAReceberService.listar();
    }

    @PutMapping("/{id}")
    public ContaAReceberResponse atualizar(@PathVariable UUID id, @Valid @RequestBody ContaAReceberRequest request) {
        return contaAReceberService.atualizar(id, request);
    }

    @PostMapping("/{id}/receber")
    public ContaAReceberResponse receber(@PathVariable UUID id, @Valid @RequestBody EfetivacaoRequest request) {
        return contaAReceberService.receber(id, request);
    }

    @PostMapping("/{id}/cancelar")
    public ContaAReceberResponse cancelar(@PathVariable UUID id) {
        return contaAReceberService.cancelar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id) {
        contaAReceberService.excluir(id);
    }
}
