package com.fintrack.compromisso.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.compromisso.domain.ContaAPagar;
import com.fintrack.compromisso.domain.StatusContaAPagar;
import com.fintrack.compromisso.dto.ContaAPagarRequest;
import com.fintrack.compromisso.dto.ContaAPagarResponse;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.compromisso.dto.PreviaEfetivacaoResponse;
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

import java.math.BigDecimal;
import java.time.LocalDate;
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
        if (request.status() != null && request.status() != StatusContaAPagar.PENDENTE) {
            throw new RegraNegocioException("Novos compromissos devem ser criados como pendentes.");
        }
        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaDespesa(categoria);

        var contaAPagar = new ContaAPagar(
                normalizarDescricao(request.descricao()),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                usuario,
                percentual(request.multaPercentual()),
                percentual(request.jurosDiaPercentual()),
                percentual(request.descontoPercentual()),
                diasDesconto(request.descontoDiasAntes())
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

        if (contaAPagar.getMovimentacao() != null || contaAPagar.getStatus() == StatusContaAPagar.PAGA) {
            throw new RegraNegocioException("Nao e possivel editar uma conta ja paga.");
        }

        if (contaAPagar.getStatus() == StatusContaAPagar.CANCELADA) {
            throw new RegraNegocioException("Nao e possivel editar um compromisso cancelado.");
        }
        if (request.status() != null && request.status() != contaAPagar.getStatus()) {
            throw new RegraNegocioException("Use as operacoes de efetivacao ou cancelamento para alterar o status.");
        }

        var conta = obterConta(request.contaFinanceiraId(), usuario);
        var categoria = categoriaService.obterCategoriaDoUsuario(request.categoriaId());
        validarCategoriaDespesa(categoria);

        contaAPagar.atualizar(
                normalizarDescricao(request.descricao()),
                request.valor(),
                request.dataVencimento(),
                conta,
                categoria,
                contaAPagar.getStatus(),
                percentual(request.multaPercentual()),
                percentual(request.jurosDiaPercentual()),
                percentual(request.descontoPercentual()),
                diasDesconto(request.descontoDiasAntes())
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

        var previa = calcularPrevia(contaAPagar, request.data());
        CalculoEfetivacao.validarConfirmacao(previa, request.valorConfirmado());
        validarCategoriaDespesa(contaAPagar.getCategoria());

        var movimentacao = movimentacaoRepository.save(new Movimentacao(
                contaAPagar.getDescricao(),
                previa.valorAtualizado(),
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

        if (contaAPagar.getMovimentacao() != null || contaAPagar.getStatus() == StatusContaAPagar.PAGA) {
            throw new RegraNegocioException("Nao e possivel cancelar uma conta ja paga.");
        }

        contaAPagar.cancelar();
        return toResponse(contaAPagar);
    }

    @Transactional
    public void excluir(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var contaAPagar = obterContaAPagar(id, usuario);

        if (contaAPagar.getMovimentacao() != null || contaAPagar.getStatus() == StatusContaAPagar.PAGA) {
            throw new RegraNegocioException("Nao e possivel excluir uma conta ja paga.");
        }

        contaAPagarRepository.delete(contaAPagar);
    }

    private ContaAPagar obterContaAPagar(UUID id, Usuario usuario) {
        return contaAPagarRepository.buscarParaAtualizacao(id, usuario.getId())
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

    private BigDecimal percentual(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private String normalizarDescricao(String descricao) {
        return descricao == null || descricao.isBlank() ? "Conta a pagar" : descricao.trim();
    }

    private Integer diasDesconto(Integer valor) {
        return valor == null ? 0 : valor;
    }

    @Transactional(readOnly = true)
    public PreviaEfetivacaoResponse previa(UUID id, LocalDate data) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var compromisso = contaAPagarRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Compromisso nao encontrado."));
        if (compromisso.getMovimentacao() != null || compromisso.getStatus() == StatusContaAPagar.PAGA
                || compromisso.getStatus() == StatusContaAPagar.CANCELADA) {
            throw new RegraNegocioException("Este compromisso nao pode ser efetivado.");
        }
        var previa = calcularPrevia(compromisso, data);
        CalculoEfetivacao.validarConfirmacao(previa, null);
        return previa;
    }

    private PreviaEfetivacaoResponse calcularPrevia(ContaAPagar conta, LocalDate data) {
        return CalculoEfetivacao.calcular(conta.getValor(), conta.getDataVencimento(), data,
                conta.getMultaPercentual(), conta.getJurosDiaPercentual(),
                conta.getDescontoPercentual(), conta.getDescontoDiasAntes());
    }

    private ContaAPagarResponse toResponse(ContaAPagar conta) {
        return new ContaAPagarResponse(
                conta.getId(),
                conta.getDescricao(),
                conta.getValor(),
                conta.getMovimentacao() == null
                        ? calcularPrevia(conta, LocalDate.now()).valorAtualizado()
                        : conta.getMovimentacao().getValor(),
                conta.getDataVencimento(),
                conta.getStatus(),
                conta.getContaFinanceira().getId(),
                conta.getContaFinanceira().getNome(),
                conta.getCategoria().getId(),
                conta.getCategoria().getNome(),
                conta.getMultaPercentual(),
                conta.getJurosDiaPercentual(),
                conta.getDescontoPercentual(),
                conta.getDescontoDiasAntes(),
                conta.getMovimentacao() == null ? null : conta.getMovimentacao().getId()
        );
    }
}
