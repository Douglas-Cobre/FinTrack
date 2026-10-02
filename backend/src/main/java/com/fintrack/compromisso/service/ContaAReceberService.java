package com.fintrack.compromisso.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.compromisso.domain.ContaAReceber;
import com.fintrack.compromisso.domain.StatusContaAReceber;
import com.fintrack.compromisso.dto.ContaAReceberRequest;
import com.fintrack.compromisso.dto.ContaAReceberResponse;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.compromisso.repository.ContaAReceberRepository;
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
public class ContaAReceberService {

    private final ContaAReceberRepository contaAReceberRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final CategoriaService categoriaService;
    private final UsuarioService usuarioService;

    public ContaAReceberService(
            ContaAReceberRepository contaAReceberRepository,
            ContaFinanceiraRepository contaFinanceiraRepository,
            MovimentacaoRepository movimentacaoRepository,
            CategoriaService categoriaService,
            UsuarioService usuarioService
    ) {
        this.contaAReceberRepository = contaAReceberRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.categoriaService = categoriaService;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ContaAReceberResponse criar(ContaAReceberRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaReceita(categoria);

        var contaAReceber = new ContaAReceber(
                request.descricao().trim(),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                null,
                usuario
        );

        return toResponse(contaAReceberRepository.save(contaAReceber));
    }

    @Transactional(readOnly = true)
    public List<ContaAReceberResponse> listar() {
        var usuario = usuarioService.obterUsuarioAutenticado();
        return contaAReceberRepository.findAllByUsuarioIdOrderByDataVencimentoAsc(usuario.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ContaAReceberResponse atualizar(UUID id, ContaAReceberRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAReceber = obterContaAReceber(id, usuario);

        if (contaAReceber.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel editar uma conta ja recebida.");
        }

        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaReceita(categoria);

        contaAReceber.atualizar(
                request.descricao().trim(),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                null,
                request.status() == null ? StatusContaAReceber.PENDENTE : request.status()
        );

        return toResponse(contaAReceber);
    }

    @Transactional
    public ContaAReceberResponse receber(UUID id, EfetivacaoRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAReceber = obterContaAReceber(id, usuario);

        if (contaAReceber.getMovimentacao() != null || contaAReceber.getStatus() == StatusContaAReceber.RECEBIDA) {
            throw new RegraNegocioException("Esta conta a receber ja foi efetivada.");
        }

        if (contaAReceber.getStatus() == StatusContaAReceber.CANCELADA) {
            throw new RegraNegocioException("Nao e possivel receber uma conta cancelada.");
        }

        var movimentacao = movimentacaoRepository.save(new Movimentacao(
                contaAReceber.getDescricao(),
                contaAReceber.getValor(),
                TipoMovimentacao.RECEITA,
                request.data(),
                contaAReceber.getContaFinanceira(),
                contaAReceber.getCategoria(),
                usuario,
                OrigemMovimentacaoTipo.CONTA_A_RECEBER,
                contaAReceber.getId()
        ));

        contaAReceber.marcarComoRecebida(movimentacao);
        return toResponse(contaAReceber);
    }

    @Transactional
    public ContaAReceberResponse cancelar(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAReceber = obterContaAReceber(id, usuario);

        if (contaAReceber.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel cancelar uma conta ja recebida.");
        }

        contaAReceber.cancelar();
        return toResponse(contaAReceber);
    }

    @Transactional
    public void excluir(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAReceber = obterContaAReceber(id, usuario);

        if (contaAReceber.getMovimentacao() != null) {
            throw new RegraNegocioException("Nao e possivel excluir uma conta ja recebida.");
        }

        contaAReceberRepository.delete(contaAReceber);
    }

    private ContaAReceber obterContaAReceber(UUID id, Usuario usuario) {
        return contaAReceberRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta a receber nao encontrada."));
    }

    private ContaFinanceira obterConta(UUID id, Usuario usuario) {
        return contaFinanceiraRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta financeira nao encontrada."));
    }

    private void validarCategoriaReceita(Categoria categoria) {
        if (categoria.getTipo() != TipoMovimentacao.RECEITA) {
            throw new RegraNegocioException("Conta a receber deve usar categoria de receita.");
        }
    }

    private ContaAReceberResponse toResponse(ContaAReceber conta) {
        return new ContaAReceberResponse(
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
