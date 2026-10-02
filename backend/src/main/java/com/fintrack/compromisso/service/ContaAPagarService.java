package com.fintrack.compromisso.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.compromisso.domain.ContaAPagar;
import com.fintrack.compromisso.domain.StatusContaAPagar;
import com.fintrack.compromisso.dto.ContaAPagarRequest;
import com.fintrack.compromisso.dto.ContaAPagarResponse;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.compromisso.repository.ContaAPagarRepository;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.repository.ContaFinanceiraRepository;
import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.movimentacao.domain.OrigemMovimentacaoTipo;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ContaAPagarService {

    private final ContaAPagarRepository contaAPagarRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final CategoriaService categoriaService;
    private final UsuarioService usuarioService;

    public ContaAPagarService(
            ContaAPagarRepository contaAPagarRepository,
            ContaFinanceiraRepository contaFinanceiraRepository,
            MovimentacaoRepository movimentacaoRepository,
            CategoriaService categoriaService,
            UsuarioService usuarioService
    ) {
        this.contaAPagarRepository = contaAPagarRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.categoriaService = categoriaService;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ContaAPagarResponse criar(ContaAPagarRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaDespesa(categoria);

        var contaAPagar = new ContaAPagar(
                request.descricao().trim(),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                usuario
        );

        return toResponse(contaAPagarRepository.save(contaAPagar));
    }

    @Transactional(readOnly = true)
    public List<ContaAPagarResponse> listar() {
        var usuario = usuarioService.obterUsuarioAutenticado();
        return contaAPagarRepository.findAllByUsuarioIdOrderByDataVencimentoAsc(usuario.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ContaAPagarResponse atualizar(UUID id, ContaAPagarRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAPagar = obterContaAPagar(id, usuario);

        if (contaAPagar.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel editar uma conta ja paga.");
        }

        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaDespesa(categoria);

        contaAPagar.atualizar(
                request.descricao().trim(),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                request.status() == null ? StatusContaAPagar.PENDENTE : request.status()
        );

        return toResponse(contaAPagar);
    }

    @Transactional
    public ContaAPagarResponse pagar(UUID id, EfetivacaoRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAPagar = obterContaAPagar(id, usuario);

        if (contaAPagar.getMovimentacao() != null || contaAPagar.getStatus() == StatusContaAPagar.PAGA) {
            throw new RegraNegocioException("Esta conta a pagar ja foi efetivada.");
        }

        if (contaAPagar.getStatus() == StatusContaAPagar.CANCELADA) {
            throw new RegraNegocioException("Nao e possivel pagar uma conta cancelada.");
        }

        var movimentacao = movimentacaoRepository.save(new Movimentacao(
                contaAPagar.getDescricao(),
                contaAPagar.getValor(),
                TipoMovimentacao.DESPESA,
                request.data(),
                contaAPagar.getContaFinanceira(),
                contaAPagar.getCategoria(),
                usuario,
                OrigemMovimentacaoTipo.CONTA_A_PAGAR,
                contaAPagar.getId()
        ));

        contaAPagar.marcarComoPaga(movimentacao);
        return toResponse(contaAPagar);
    }

    @Transactional
    public ContaAPagarResponse cancelar(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAPagar = obterContaAPagar(id, usuario);

        if (contaAPagar.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel cancelar uma conta ja paga.");
        }

        contaAPagar.cancelar();
        return toResponse(contaAPagar);
    }

    @Transactional
    public void excluir(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAPagar = obterContaAPagar(id, usuario);

        if (contaAPagar.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel excluir uma conta ja paga.");
        }

        contaAPagarRepository.delete(contaAPagar);
    }

    private ContaAPagar obterContaAPagar(UUID id, Usuario usuario) {
        return contaAPagarRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta a pagar nao encontrada."));
    }

    private ContaFinanceira obterConta(UUID id, Usuario usuario) {
        return contaFinanceiraRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta financeira nao encontrada."));
    }

    private void validarCategoriaDespesa(Categoria categoria) {
        if (categoria.getTipo() != TipoMovimentacao.DESPESA) {
            throw new RegraNegocioException("Conta a pagar deve usar categoria de despesa.");
        }
    }

    private ContaAPagarResponse toResponse(ContaAPagar conta) {
        return new ContaAPagarResponse(
                conta.getId(),
                conta.getDescricao(),
                conta.getValor(),
                conta.getDataVencimento(),
                conta.getStatus(),
                conta.getContaFinanceira().getId(),
                conta.getContaFinanceira().getNome(),
                conta.getCategoria().getId(),
                conta.getCategoria().getNome(),
                conta.getMovimentacao() == null ? null : conta.getMovimentacao().getId()
        );
    }
}
