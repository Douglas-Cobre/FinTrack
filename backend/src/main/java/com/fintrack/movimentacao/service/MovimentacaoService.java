package com.fintrack.movimentacao.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.repository.ContaFinanceiraRepository;
import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.movimentacao.domain.OrigemMovimentacaoTipo;
import com.fintrack.movimentacao.dto.MovimentacaoRequest;
import com.fintrack.movimentacao.dto.MovimentacaoResponse;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MovimentacaoService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;
    private final CategoriaService categoriaService;
    private final UsuarioService usuarioService;

    public MovimentacaoService(
            MovimentacaoRepository movimentacaoRepository,
            ContaFinanceiraRepository contaFinanceiraRepository,
            CategoriaService categoriaService,
            UsuarioService usuarioService
    ) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
        this.categoriaService = categoriaService;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public MovimentacaoResponse criar(MovimentacaoRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var conta = obterContaDoUsuario(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoria(request, categoria);

        var movimentacao = new Movimentacao(
                request.descricao().trim(),
                request.valor(),
                request.tipo(),
                request.data(),
                conta,
                categoria,
                usuario,
                OrigemMovimentacaoTipo.MANUAL,
                null
        );

        return toResponse(movimentacaoRepository.save(movimentacao));
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listar() {
        var usuario = usuarioService.obterUsuarioAutenticado();

        return movimentacaoRepository.findAllByUsuarioIdOrderByDataDescCreatedAtDesc(usuario.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MovimentacaoResponse atualizar(UUID id, MovimentacaoRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var movimentacao = obterMovimentacaoDoUsuario(id, usuario);
        var conta = obterContaDoUsuario(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoria(request, categoria);

        movimentacao.atualizar(
                request.descricao().trim(),
                request.valor(),
                request.tipo(),
                request.data(),
                conta,
                categoria
        );

        return toResponse(movimentacao);
    }

    @Transactional
    public void excluir(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        movimentacaoRepository.delete(obterMovimentacaoDoUsuario(id, usuario));
    }

    private Movimentacao obterMovimentacaoDoUsuario(UUID id, Usuario usuario) {
        return movimentacaoRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Movimentacao nao encontrada."));
    }

    private ContaFinanceira obterContaDoUsuario(UUID id, Usuario usuario) {
        return contaFinanceiraRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta financeira nao encontrada."));
    }

    private void validarCategoria(MovimentacaoRequest request, Categoria categoria) {
        if (categoria.getTipo() != request.tipo()) {
            throw new RegraNegocioException("A categoria deve ser compativel com o tipo da movimentacao.");
        }
    }

    private MovimentacaoResponse toResponse(Movimentacao movimentacao) {
        return new MovimentacaoResponse(
                movimentacao.getId(),
                movimentacao.getDescricao(),
                movimentacao.getValor(),
                movimentacao.getTipo(),
                movimentacao.getData(),
                movimentacao.getContaFinanceira().getId(),
                movimentacao.getContaFinanceira().getNome(),
                movimentacao.getCategoria().getId(),
                movimentacao.getCategoria().getNome()
        );
    }
}
