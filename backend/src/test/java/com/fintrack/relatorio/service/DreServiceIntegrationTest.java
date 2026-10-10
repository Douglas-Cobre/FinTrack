package com.fintrack.relatorio.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.domain.GrupoDre;
import com.fintrack.compromisso.domain.ContaAPagar;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.domain.TipoContaFinanceira;
import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.movimentacao.domain.OrigemMovimentacaoTipo;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.relatorio.dto.DreResponse;
import com.fintrack.relatorio.dto.LinhaDreResponse;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;

import static com.fintrack.categoria.domain.GrupoDre.*;
import static com.fintrack.shared.domain.TipoMovimentacao.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"}, showSql = false)
@Import({DreService.class, RelatorioService.class})
class DreServiceIntegrationTest {
    @Autowired TestEntityManager em;
    @Autowired DreService service;
    @Autowired RelatorioService relatorioService;
    @Autowired MovimentacaoRepository repository;
    @MockBean UsuarioService usuarioService;
    private Usuario usuario;
    private ContaFinanceira conta;
    private final LocalDate inicio = LocalDate.of(2026, 9, 1);
    private final LocalDate fim = LocalDate.of(2026, 9, 30);

    @BeforeEach
    void preparar() {
        usuario = em.persist(new Usuario("Usuario", "usuario@teste.com", "hash"));
        conta = em.persist(new ContaFinanceira("Conta", TipoContaFinanceira.CONTA_CORRENTE, BigDecimal.ZERO, usuario));
        when(usuarioService.obterUsuarioAutenticado()).thenReturn(usuario);
    }

    @Test
    void calculaFormulasPrecisaoEReconciliaTotaisPorTipo() {
        registrar(RECEITA, RECEITA_OPERACIONAL, "100.10");
        registrar(DESPESA, DEDUCAO_RECEITA, "10.05");
        registrar(DESPESA, CUSTO, "20.03");
        registrar(DESPESA, DESPESA_OPERACIONAL, "90.02");
        registrar(RECEITA, RECEITA_FINANCEIRA, "3.01");
        registrar(DESPESA, DESPESA_FINANCEIRA, "4.04");
        registrar(DESPESA, TRIBUTO_SOBRE_LUCRO, "2.02");
        registrar(RECEITA, null, "7.77");
        movimentacao(usuario, conta, null, DESPESA, "8.88", fim);
        registrar(RECEITA, FORA_DRE, "9.99");
        registrar(DESPESA, FORA_DRE, "10.11");
        em.flush();

        var dre = service.consultar(inicio, fim);
        assertThat(dre.regime()).isEqualTo("CAIXA");
        assertThat(dre.completo()).isFalse();
        assertThat(dre.linhas()).extracting(LinhaDreResponse::codigo).containsExactly(
                "RECEITA_OPERACIONAL", "DEDUCAO_RECEITA", "RECEITA_LIQUIDA", "CUSTO", "RESULTADO_BRUTO",
                "DESPESA_OPERACIONAL", "RESULTADO_OPERACIONAL", "RECEITA_FINANCEIRA", "DESPESA_FINANCEIRA",
                "RESULTADO_ANTES_TRIBUTOS", "TRIBUTO_SOBRE_LUCRO", "RESULTADO_LIQUIDO");
        assertThat(valor(dre, "RECEITA_LIQUIDA")).isEqualByComparingTo("90.05");
        assertThat(valor(dre, "RESULTADO_BRUTO")).isEqualByComparingTo("70.02");
        assertThat(valor(dre, "RESULTADO_OPERACIONAL")).isEqualByComparingTo("-20.00");
        assertThat(valor(dre, "RESULTADO_ANTES_TRIBUTOS")).isEqualByComparingTo("-21.03");
        assertThat(valor(dre, "RESULTADO_LIQUIDO")).isEqualByComparingTo("-23.05");
        assertThat(dre.pendencias().quantidade()).isEqualTo(2);
        assertThat(dre.pendencias().receitas()).isEqualByComparingTo("7.77");
        assertThat(dre.pendencias().despesas()).isEqualByComparingTo("8.88");
        assertThat(dre.foraDre().quantidade()).isEqualTo(2);
        assertThat(dre.foraDre().receitas()).isEqualByComparingTo("9.99");
        assertThat(dre.foraDre().despesas()).isEqualByComparingTo("10.11");
        for (var tipo : TipoMovimentacao.values()) {
            var classificados = dre.linhas().stream().filter(l -> l.tipo() == LinhaDreResponse.TipoLinhaDre.GRUPO)
                    .flatMap(l -> l.categorias().stream()).filter(c -> c.tipoMovimentacao() == tipo)
                    .map(c -> c.valor()).reduce(BigDecimal.ZERO, BigDecimal::add);
            var pendentes = tipo == RECEITA ? dre.pendencias().receitas() : dre.pendencias().despesas();
            var fora = tipo == RECEITA ? dre.foraDre().receitas() : dre.foraDre().despesas();
            assertThat(classificados.add(pendentes).add(fora))
                    .isEqualByComparingTo(repository.somarPorUsuarioETipo(usuario.getId(), tipo));
        }
    }

    @Test
    void incluiLimitesExcluiOutrasDatasUsuariosECompromissosPendentes() {
        var categoria = categoria(RECEITA, RECEITA_OPERACIONAL, "Receita");
        movimentacao(usuario, conta, categoria, RECEITA, "10", inicio);
        movimentacao(usuario, conta, categoria, RECEITA, "20", fim);
        movimentacao(usuario, conta, categoria, RECEITA, "100", inicio.minusDays(1));
        movimentacao(usuario, conta, categoria, RECEITA, "200", fim.plusDays(1));
        var outro = em.persist(new Usuario("Outro", "outro@teste.com", "hash"));
        var outraConta = em.persist(new ContaFinanceira("Outra", TipoContaFinanceira.DINHEIRO, BigDecimal.ZERO, outro));
        var outraCategoria = em.persist(new Categoria("Privada", RECEITA, outro, RECEITA_OPERACIONAL));
        movimentacao(outro, outraConta, outraCategoria, RECEITA, "999", inicio);
        movimentacao(outro, outraConta, null, DESPESA, "888", fim);
        var despesa = categoria(DESPESA, DESPESA_OPERACIONAL, "Despesa prevista");
        em.persist(new ContaAPagar("Pendente", new BigDecimal("500"), inicio, conta, despesa, usuario,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));
        em.flush();
        var dre = service.consultar(inicio, fim);
        assertThat(valor(dre, "RESULTADO_LIQUIDO")).isEqualByComparingTo("30");
        assertThat(dre.completo()).isTrue();
        assertThat(dre.pendencias().quantidade()).isZero();
        assertThat(dre.linhas().get(0).categorias()).hasSize(1);
        assertThat(dre.linhas().get(0).categorias().get(0).categoriaId()).isEqualTo(categoria.getId());
        assertThat(dre.linhas().get(0).categorias().get(0).categoriaNome()).isEqualTo("Receita");
        assertThat(service.consultar(inicio, inicio).linhas().get(0).valor()).isEqualByComparingTo("10");
    }

    @Test
    void periodoVazioRetornaTodasAsLinhasZeradas() {
        var dre = service.consultar(inicio, fim);
        assertThat(dre.completo()).isTrue();
        assertThat(dre.inicio()).isEqualTo(inicio);
        assertThat(dre.fim()).isEqualTo(fim);
        assertThat(dre.linhas()).hasSize(12).allSatisfy(linha -> {
            assertThat(linha.valor()).isZero();
            assertThat(linha.categorias()).isEmpty();
        });
    }

    @Test
    void reclassificacaoAlteraPeriodosAnterioresEIncompatibilidadeViraPendencia() {
        var categoria = categoria(RECEITA, RECEITA_OPERACIONAL, "Reclassificada");
        movimentacao(usuario, conta, categoria, RECEITA, "50", inicio);
        assertThat(valor(service.consultar(inicio, fim), "RECEITA_OPERACIONAL")).isEqualByComparingTo("50");
        categoria.atualizar(categoria.getNome(), RECEITA, RECEITA_FINANCEIRA);
        assertThat(valor(service.consultar(inicio, fim), "RECEITA_FINANCEIRA")).isEqualByComparingTo("50");
        categoria.atualizar(categoria.getNome(), DESPESA, DESPESA_OPERACIONAL);
        var dre = service.consultar(inicio, fim);
        assertThat(dre.completo()).isFalse();
        assertThat(dre.pendencias().receitas()).isEqualByComparingTo("50");
        assertThat(valor(dre, "RESULTADO_LIQUIDO")).isZero();
    }

    @Test
    void preservaResumoFinanceiroIndependenteDeGrupoEPeriodo() {
        registrar(RECEITA, FORA_DRE, "100");
        registrar(DESPESA, null, "20");
        var receita = categoria(RECEITA, RECEITA_FINANCEIRA, "Rendimento");
        movimentacao(usuario, conta, receita, RECEITA, "30", fim.plusDays(1));
        var resumo = relatorioService.resumo();
        assertThat(resumo.receitas()).isEqualByComparingTo("130");
        assertThat(resumo.despesas()).isEqualByComparingTo("20");
        assertThat(resumo.resultado()).isEqualByComparingTo("110");
        assertThat(resumo.receitasPorCategoria()).hasSize(2);
        assertThat(resumo.despesasPorCategoria()).hasSize(1);
    }

    @Test
    void rejeitaPeriodoInvalido() {
        assertThatThrownBy(() -> service.consultar(fim, inicio)).isInstanceOf(PeriodoDreInvalidoException.class);
        assertThatThrownBy(() -> service.consultar(null, fim)).isInstanceOf(PeriodoDreInvalidoException.class);
    }

    private Categoria categoria(TipoMovimentacao tipo, GrupoDre grupo, String nome) {
        return em.persist(new Categoria(nome, tipo, usuario, grupo));
    }
    private void registrar(TipoMovimentacao tipo, GrupoDre grupo, String valor) {
        movimentacao(usuario, conta, categoria(tipo, grupo, tipo + " " + grupo), tipo, valor, inicio);
    }
    private void movimentacao(Usuario dono, ContaFinanceira conta, Categoria categoria,
            TipoMovimentacao tipo, String valor, LocalDate data) {
        em.persist(new Movimentacao("Movimento", new BigDecimal(valor), tipo, data, conta, categoria,
                dono, OrigemMovimentacaoTipo.MANUAL, null));
    }
    private BigDecimal valor(DreResponse dre, String codigo) {
        return dre.linhas().stream().filter(l -> l.codigo().equals(codigo)).findFirst().orElseThrow().valor();
    }
}
