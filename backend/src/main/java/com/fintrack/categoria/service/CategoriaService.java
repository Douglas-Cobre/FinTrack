package com.fintrack.categoria.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.categoria.dto.CategoriaRequest;
import com.fintrack.categoria.dto.CategoriaResponse;
import com.fintrack.categoria.repository.CategoriaRepository;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final UsuarioService usuarioService;

    public CategoriaService(CategoriaRepository categoriaRepository, UsuarioService usuarioService) {
        this.categoriaRepository = categoriaRepository;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var nome = request.nome().trim();

        if (categoriaRepository.existsByNomeIgnoreCaseAndTipoAndUsuarioId(nome, request.tipo(), usuario.getId())) {
            throw new RegraNegocioException("Ja existe uma categoria com este nome e tipo.");
        }

        validarGrupo(request.tipo(), request.grupoDre());
        return toResponse(categoriaRepository.save(new Categoria(nome, request.tipo(), usuario, request.grupoDre())));
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(TipoMovimentacao tipo) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var categorias = tipo == null
                ? categoriaRepository.findAllByUsuarioIdOrderByNome(usuario.getId())
                : categoriaRepository.findAllByUsuarioIdAndTipoOrderByNome(usuario.getId(), tipo);

        return categorias.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoriaResponse atualizar(UUID id, CategoriaRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var categoria = obterCategoriaDoUsuario(id);
        var nome = request.nome().trim();

        if (categoriaRepository.existsByNomeIgnoreCaseAndTipoAndUsuarioIdAndIdNot(nome, request.tipo(), usuario.getId(), id)) {
            throw new RegraNegocioException("Ja existe uma categoria com este nome e tipo.");
        }

        var grupo = request.grupoDreInformado() ? request.grupoDre() : categoria.getGrupoDre();
        validarGrupo(request.tipo(), grupo);
        categoria.atualizar(nome, request.tipo(), grupo);
        return toResponse(categoria);
    }

    @Transactional
    public void excluir(UUID id) {
        var categoria = obterCategoriaDoUsuario(id);
        if (categoriaRepository.emUso(id)) {
            throw new RegraNegocioException("Nao e possivel excluir uma categoria com movimentacoes, compromissos ou parcelas vinculados.");
        }
        categoriaRepository.delete(categoria);
    }

    public Categoria obterCategoriaDoUsuario(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();

        return categoriaRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Categoria nao encontrada."));
    }

    private void validarGrupo(TipoMovimentacao tipo, GrupoDre grupo) {
        if (grupo != null && !grupo.compativelCom(tipo)) {
            throw new RegraNegocioException("O grupo da DRE deve ser compativel com o tipo da categoria.");
        }
    }

    private CategoriaResponse toResponse(Categoria categoria) {
        return new CategoriaResponse(categoria.getId(), categoria.getNome(), categoria.getTipo(), categoria.getGrupoDre());
    }
}
