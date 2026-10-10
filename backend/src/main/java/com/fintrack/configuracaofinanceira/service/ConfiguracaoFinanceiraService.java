package com.fintrack.configuracaofinanceira.service;

import com.fintrack.configuracaofinanceira.domain.ConfiguracaoFinanceira;
import com.fintrack.configuracaofinanceira.dto.ConfiguracaoFinanceiraRequest;
import com.fintrack.configuracaofinanceira.dto.ConfiguracaoFinanceiraResponse;
import com.fintrack.configuracaofinanceira.repository.ConfiguracaoFinanceiraRepository;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoFinanceiraService {

    private final ConfiguracaoFinanceiraRepository repository;
    private final UsuarioService usuarioService;

    public ConfiguracaoFinanceiraService(
            ConfiguracaoFinanceiraRepository repository,
            UsuarioService usuarioService
    ) {
        this.repository = repository;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ConfiguracaoFinanceiraResponse obter() {
        var usuario = usuarioService.obterUsuarioAutenticado();
        return toResponse(obterOuCriar(usuario));
    }

    @Transactional
    public ConfiguracaoFinanceiraResponse salvar(ConfiguracaoFinanceiraRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var configuracao = obterOuCriar(usuario);

        configuracao.atualizar(
                request.multaPercentual(),
                request.jurosDiaPercentual(),
                request.descontoPercentual(),
                request.descontoDiasAntes()
        );

        return toResponse(repository.save(configuracao));
    }

    private ConfiguracaoFinanceira obterOuCriar(Usuario usuario) {
        return repository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> repository.save(new ConfiguracaoFinanceira(usuario)));
    }

    private ConfiguracaoFinanceiraResponse toResponse(ConfiguracaoFinanceira configuracao) {
        return new ConfiguracaoFinanceiraResponse(
                configuracao.getMultaPercentual(),
                configuracao.getJurosDiaPercentual(),
                configuracao.getDescontoPercentual(),
                configuracao.getDescontoDiasAntes()
        );
    }
}

