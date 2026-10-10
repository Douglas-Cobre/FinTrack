package com.fintrack.relatorio.service;

import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.relatorio.dto.*;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;

import static com.fintrack.categoria.domain.GrupoDre.*;
import static com.fintrack.relatorio.dto.LinhaDreResponse.TipoLinhaDre.*;

@Service
public class DreService {
    private final MovimentacaoRepository repository;
    private final UsuarioService usuarioService;

    public DreService(MovimentacaoRepository repository, UsuarioService usuarioService) {
        this.repository = repository;
        this.usuarioService = usuarioService;
    }

    @Transactional(readOnly = true)
    public DreResponse consultar(LocalDate inicio, LocalDate fim) {
        if (inicio == null || fim == null || inicio.isAfter(fim)) {
            throw new PeriodoDreInvalidoException();
        }
        var usuario = usuarioService.obterUsuarioAutenticado();
        var grupos = new EnumMap<GrupoDre, List<CategoriaDreResponse>>(GrupoDre.class);
        for (var grupo : GrupoDre.values()) grupos.put(grupo, new ArrayList<>());
        var pendencias = new Totais();
        var foraDre = new Totais();

        for (var item : repository.somarParaDre(usuario.getId(), inicio, fim)) {
            if (item.grupo() == null || !item.grupo().compativelCom(item.tipo())) {
                // A category type can be edited after movements were recorded.
                // Treat incompatible historic movements as pending, never change their financial type.
                pendencias.adicionar(item.tipo(), item.valor(), item.quantidade());
            } else if (item.grupo() == FORA_DRE) {
                foraDre.adicionar(item.tipo(), item.valor(), item.quantidade());
            } else {
                grupos.get(item.grupo()).add(new CategoriaDreResponse(
                        item.categoriaId(), item.categoriaNome(), item.tipo(), item.valor()));
            }
        }

        var linhas = new ArrayList<LinhaDreResponse>();
        var resultado = grupo(linhas, grupos, RECEITA_OPERACIONAL, "Receita operacional");
        resultado = resultado.subtract(grupo(linhas, grupos, DEDUCAO_RECEITA, "Deducoes da receita"));
        subtotal(linhas, "RECEITA_LIQUIDA", "Receita liquida", resultado);
        resultado = resultado.subtract(grupo(linhas, grupos, CUSTO, "Custos"));
        subtotal(linhas, "RESULTADO_BRUTO", "Resultado bruto", resultado);
        resultado = resultado.subtract(grupo(linhas, grupos, DESPESA_OPERACIONAL, "Despesas operacionais"));
        subtotal(linhas, "RESULTADO_OPERACIONAL", "Resultado operacional", resultado);
        resultado = resultado.add(grupo(linhas, grupos, RECEITA_FINANCEIRA, "Receitas financeiras"));
        resultado = resultado.subtract(grupo(linhas, grupos, DESPESA_FINANCEIRA, "Despesas financeiras"));
        subtotal(linhas, "RESULTADO_ANTES_TRIBUTOS", "Resultado antes dos tributos sobre o lucro", resultado);
        resultado = resultado.subtract(grupo(linhas, grupos, TRIBUTO_SOBRE_LUCRO, "Tributos sobre o lucro"));
        subtotal(linhas, "RESULTADO_LIQUIDO", "Resultado liquido gerencial", resultado);

        return new DreResponse(inicio, fim, "CAIXA", pendencias.quantidade == 0,
                List.copyOf(linhas), pendencias.response(), foraDre.response());
    }

    private BigDecimal grupo(List<LinhaDreResponse> linhas,
            EnumMap<GrupoDre, List<CategoriaDreResponse>> grupos, GrupoDre grupo, String descricao) {
        var categorias = List.copyOf(grupos.get(grupo));
        var valor = categorias.stream().map(CategoriaDreResponse::valor).reduce(BigDecimal.ZERO, BigDecimal::add);
        linhas.add(new LinhaDreResponse(grupo.name(), descricao, GRUPO, valor, categorias));
        return valor;
    }

    private void subtotal(List<LinhaDreResponse> linhas, String codigo, String descricao, BigDecimal valor) {
        linhas.add(new LinhaDreResponse(codigo, descricao, SUBTOTAL, valor, List.of()));
    }

    private static class Totais {
        private long quantidade;
        private BigDecimal receitas = BigDecimal.ZERO;
        private BigDecimal despesas = BigDecimal.ZERO;
        void adicionar(TipoMovimentacao tipo, BigDecimal valor, long quantidade) {
            this.quantidade += quantidade;
            if (tipo == TipoMovimentacao.RECEITA) receitas = receitas.add(valor);
            else despesas = despesas.add(valor);
        }
        PendenciasDreResponse response() { return new PendenciasDreResponse(quantidade, receitas, despesas); }
    }
}
