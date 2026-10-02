package com.fintrack.conta.service;

import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.dto.ContaFinanceiraRequest;
import com.fintrack.conta.dto.ContaFinanceiraResponse;
import com.fintrack.conta.repository.ContaFinanceiraRepository;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class ContaFinanceiraService {

    private final ContaFinanceiraRepository contaFinanceiraRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final UsuarioService usuarioService;

    public ContaFinanceiraService(
            ContaFinanceiraRepository contaFinanceiraRepository,
            MovimentacaoRepository movimentacaoRepository,
            UsuarioService usuarioService
    ) {
        this.contaFinanceiraRepository = contaFinanceiraRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public ContaFinanceiraResponse criar(ContaFinanceiraRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var nome = request.nome().trim();

        if (contaFinanceiraRepository.existsByNomeIgnoreCaseAndUsuarioId(nome, usuario.getId())) {
            throw new RegraNegocioException("Ja existe uma conta financeira com este nome.");
        }

        var conta = new ContaFinanceira(nome, request.tipo(), request.saldoInicial(), usuario);
        return toResponse(contaFinanceiraRepository.save(conta));
    }

    @Transactional(readOnly = true)
    public List<ContaFinanceiraResponse> listar() {
        var usuario = usuarioService.obterUsuarioAutenticado();

        return contaFinanceiraRepository.findAllByUsuarioIdOrderByNome(usuario.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContaFinanceiraResponse buscar(UUID id) {
        return toResponse(obterContaDoUsuario(id));
    }

    @Transactional
    public ContaFinanceiraResponse atualizar(UUID id, ContaFinanceiraRequest request) {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var conta = obterContaDoUsuario(id);
        var nome = request.nome().trim();

        if (contaFinanceiraRepository.existsByNomeIgnoreCaseAndUsuarioIdAndIdNot(nome, usuario.getId(), id)) {
            throw new RegraNegocioException("Ja existe uma conta financeira com este nome.");
        }

        conta.atualizar(nome, request.tipo(), request.saldoInicial());
        return toResponse(conta);
    }

    @Transactional
    public void excluir(UUID id) {
        var conta = obterContaDoUsuario(id);
        contaFinanceiraRepository.delete(conta);
    }

    private ContaFinanceira obterContaDoUsuario(UUID id) {
        var usuario = usuarioService.obterUsuarioAutenticado();

        return contaFinanceiraRepository.findByIdAndUsuarioId(id, usuario.getId())
                .orElseThrow(() -> new RegraNegocioException("Conta financeira nao encontrada."));
    }

    private ContaFinanceiraResponse toResponse(ContaFinanceira conta) {
        var saldoAtual = calcularSaldoAtual(conta);

        return new ContaFinanceiraResponse(
                conta.getId(),
                conta.getNome(),
                conta.getTipo(),
                conta.getSaldoInicial(),
                saldoAtual
        );
    }

    private BigDecimal calcularSaldoAtual(ContaFinanceira conta) {
        var usuarioId = conta.getUsuario().getId();
        var contaId = conta.getId();
        var receitas = movimentacaoRepository.somarPorContaUsuarioETipo(contaId, usuarioId, TipoMovimentacao.RECEITA);
        var despesas = movimentacaoRepository.somarPorContaUsuarioETipo(contaId, usuarioId, TipoMovimentacao.DESPESA);

        return conta.getSaldoInicial().add(receitas).subtract(despesas);
    }
}
