package com.fintrack.categoria.service;

import com.fintrack.categoria.domain.Categoria;
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

        return toResponse(categoriaRepository.save(new Categoria(nome, request.tipo(), usuario)));
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

        categoria.atualizar(nome, request.tipo());
        return toResponse(categoria);
    }

    @Transactional
    public void excluir(UUID id) {
        categoriaRepository.delete(obterCategoriaDoUsuario(id));
    }

    public Categoria obterCategoriaDoUsuario(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();

        return categoriaRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Categoria nao encontrada."));
    }

    private CategoriaResponse toResponse(Categoria categoria) {
        return new CategoriaResponse(categoria.getId(), categoria.getNome(), categoria.getTipo());
    }
}
