package com.fintrack.relatorio.service;

import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.relatorio.dto.ResumoFinanceiroResponse;
import com.fintrack.relatorio.dto.TotalPorCategoriaResponse;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class RelatorioService {

    private final MovimentacaoRepository movimentacaoRepository;
    private final UsuarioService usuarioService;

    public RelatorioService(MovimentacaoRepository movimentacaoRepository, UsuarioService usuarioService) {
        this.movimentacaoRepository = movimentacaoRepository;
        this.usuarioService = usuarioService;
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroResponse resumo() {
        var usuario = usuarioService.obterUsuarioAutenticado();
        var usuarioId = usuario.getId();
        var receitas = movimentacaoRepository.somarPorUsuarioETipo(usuarioId, TipoMovimentacao.RECEITA);
        var despesas = movimentacaoRepository.somarPorUsuarioETipo(usuarioId, TipoMovimentacao.DESPESA);
        var receitasPorCategoria = movimentacaoRepository.somarPorCategoria(usuarioId, TipoMovimentacao.RECEITA)
                .stream()
                .map(item -> new TotalPorCategoriaResponse((String) item[0], (BigDecimal) item[1]))
                .toList();
        var despesasPorCategoria = movimentacaoRepository.somarPorCategoria(usuarioId, TipoMovimentacao.DESPESA)
                .stream()
                .map(item -> new TotalPorCategoriaResponse((String) item[0], (BigDecimal) item[1]))
                .toList();

        return new ResumoFinanceiroResponse(
                receitas,
                despesas,
                receitas.subtract(despesas),
                despesasPorCategoria,
                receitasPorCategoria
        );
    }
}
