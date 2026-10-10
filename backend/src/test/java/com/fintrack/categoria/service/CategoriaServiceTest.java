package com.fintrack.categoria.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.categoria.dto.CategoriaRequest;
import com.fintrack.categoria.repository.CategoriaRepository;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {
    @Mock CategoriaRepository repository;
    @Mock UsuarioService usuarioService;
    @Mock Usuario usuario;
    private CategoriaService service;
    private final UUID usuarioId = UUID.randomUUID();
    private final UUID categoriaId = UUID.randomUUID();
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void preparar() {
        service = new CategoriaService(repository, usuarioService);
        when(usuarioService.obterUsuarioAutenticado()).thenReturn(usuario);
        when(usuario.getId()).thenReturn(usuarioId);
    }

    @Test
    void distingueGrupoOmitidoDeRemocaoExplicitaNaAtualizacao() throws Exception {
        var categoria = new Categoria("Salario", TipoMovimentacao.RECEITA, usuario, GrupoDre.RECEITA_OPERACIONAL);
        when(repository.findByIdAndUsuarioId(categoriaId, usuarioId)).thenReturn(Optional.of(categoria));
        var omitido = mapper.readValue("{\"nome\":\"Salario\",\"tipo\":\"RECEITA\"}", CategoriaRequest.class);
        assertThat(omitido.grupoDreInformado()).isFalse();
        assertThat(service.atualizar(categoriaId, omitido).grupoDre()).isEqualTo(GrupoDre.RECEITA_OPERACIONAL);
        var nulo = mapper.readValue("{\"nome\":\"Salario\",\"tipo\":\"RECEITA\",\"grupoDre\":null}", CategoriaRequest.class);
        assertThat(nulo.grupoDreInformado()).isTrue();
        assertThat(service.atualizar(categoriaId, nulo).grupoDre()).isNull();
    }

    @Test
    void persisteClassificacaoExplicitaEPermiteCategoriaLegada() throws Exception {
        when(repository.save(any(Categoria.class))).thenAnswer(i -> i.getArgument(0));
        var request = mapper.readValue("{\"nome\":\"Rendimentos\",\"tipo\":\"RECEITA\",\"grupoDre\":\"RECEITA_FINANCEIRA\"}", CategoriaRequest.class);
        assertThat(service.criar(request).grupoDre()).isEqualTo(GrupoDre.RECEITA_FINANCEIRA);
        assertThat(service.criar(new CategoriaRequest("Outra", TipoMovimentacao.RECEITA)).grupoDre()).isNull();
    }

    @Test
    void rejeitaClassificacaoIncompativelNaCriacaoENaMudancaDeTipo() {
        var request = new CategoriaRequest("Despesa", TipoMovimentacao.DESPESA);
        request.setGrupoDre(GrupoDre.RECEITA_OPERACIONAL);
        assertThatThrownBy(() -> service.criar(request)).isInstanceOf(RegraNegocioException.class);
        verify(repository, never()).save(any());
        var categoria = new Categoria("Receita", TipoMovimentacao.RECEITA, usuario, GrupoDre.RECEITA_OPERACIONAL);
        when(repository.findByIdAndUsuarioId(categoriaId, usuarioId)).thenReturn(Optional.of(categoria));
        assertThatThrownBy(() -> service.atualizar(categoriaId, new CategoriaRequest("Receita", TipoMovimentacao.DESPESA)))
                .isInstanceOf(RegraNegocioException.class);
        assertThat(categoria.getTipo()).isEqualTo(TipoMovimentacao.RECEITA);
    }

    @Test
    void permiteForaDreParaAmbosOsTipos() {
        when(repository.save(any(Categoria.class))).thenAnswer(i -> i.getArgument(0));
        for (var tipo : TipoMovimentacao.values()) {
            var request = new CategoriaRequest("Principal " + tipo, tipo);
            request.setGrupoDre(GrupoDre.FORA_DRE);
            assertThat(service.criar(request).grupoDre()).isEqualTo(GrupoDre.FORA_DRE);
        }
    }

    @Test
    void naoAtualizaCategoriaDeOutroUsuario() {
        when(repository.findByIdAndUsuarioId(categoriaId, usuarioId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.atualizar(categoriaId, new CategoriaRequest("Privada", TipoMovimentacao.RECEITA)))
                .isInstanceOf(RegraNegocioException.class);
        verify(repository).findByIdAndUsuarioId(categoriaId, usuarioId);
    }
}
