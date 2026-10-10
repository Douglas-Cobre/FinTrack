package com.fintrack.configuracaofinanceira.service;

import com.fintrack.configuracaofinanceira.domain.ConfiguracaoFinanceira;
import com.fintrack.configuracaofinanceira.dto.ConfiguracaoFinanceiraRequest;
import com.fintrack.configuracaofinanceira.repository.ConfiguracaoFinanceiraRepository;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConfiguracaoFinanceiraServiceTest {

    @Mock
    private ConfiguracaoFinanceiraRepository repository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private Usuario usuario;

    private ConfiguracaoFinanceiraService service;
    private UUID usuarioId;

    @BeforeEach
    void setUp() {
        service = new ConfiguracaoFinanceiraService(repository, usuarioService);
        usuarioId = UUID.randomUUID();

        when(usuarioService.obterUsuarioAutenticado()).thenReturn(usuario);
        when(usuario.getId()).thenReturn(usuarioId);
        when(repository.save(any(ConfiguracaoFinanceira.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void deveCriarConfiguracaoPadraoQuandoUsuarioAindaNaoPossui() {
        when(repository.findByUsuarioId(usuarioId)).thenReturn(Optional.empty());

        var response = service.obter();

        assertThat(response.multaPercentual()).isEqualByComparingTo("2.00");
        assertThat(response.jurosDiaPercentual()).isEqualByComparingTo("0.03");
        assertThat(response.descontoPercentual()).isEqualByComparingTo("0");
        assertThat(response.descontoDiasAntes()).isZero();
        verify(repository).save(any(ConfiguracaoFinanceira.class));
    }

    @Test
    void deveAtualizarEDevolverConfiguracaoPersistida() {
        var configuracao = new ConfiguracaoFinanceira(usuario);
        var request = new ConfiguracaoFinanceiraRequest(
                new BigDecimal("3.50"),
                new BigDecimal("0.10"),
                new BigDecimal("8.00"),
                5
        );
        when(repository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(configuracao));

        var response = service.salvar(request);

        assertThat(response.multaPercentual()).isEqualByComparingTo("3.50");
        assertThat(response.jurosDiaPercentual()).isEqualByComparingTo("0.10");
        assertThat(response.descontoPercentual()).isEqualByComparingTo("8.00");
        assertThat(response.descontoDiasAntes()).isEqualTo(5);
        verify(repository).save(configuracao);
    }
}
