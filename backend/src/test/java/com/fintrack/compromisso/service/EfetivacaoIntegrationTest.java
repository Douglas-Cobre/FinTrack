package com.fintrack.compromisso.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.compromisso.domain.*;
import com.fintrack.compromisso.dto.*;
import com.fintrack.compromisso.repository.*;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.domain.TipoContaFinanceira;
import com.fintrack.conta.service.ContaFinanceiraService;
import com.fintrack.movimentacao.domain.OrigemMovimentacaoTipo;
import com.fintrack.movimentacao.dto.MovimentacaoRequest;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.movimentacao.service.MovimentacaoService;
import com.fintrack.relatorio.service.RelatorioService;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"}, showSql = false)
@Import({ContaAPagarService.class, ContaAReceberService.class, CategoriaService.class, UsuarioService.class,
        MovimentacaoService.class, ContaFinanceiraService.class, RelatorioService.class})
@WithMockUser(username = "efetivacao@teste.com")
class EfetivacaoIntegrationTest {
    @Autowired TestEntityManager em;
    @Autowired ContaAPagarService pagar;
    @Autowired ContaAReceberService receber;
    @Autowired ContaAPagarRepository pagarRepository;
    @Autowired ContaAReceberRepository receberRepository;
    @Autowired MovimentacaoRepository movimentacaoRepository;
    @Autowired MovimentacaoService movimentacoes;
    @Autowired ContaFinanceiraService contas;
    @Autowired RelatorioService relatorios;
    private Usuario usuario;
    private ContaFinanceira conta;
    private Categoria despesa;
    private Categoria receita;
    private final LocalDate vencimento = LocalDate.of(2026, 9, 10);

    @BeforeEach
    void preparar() {
        usuario = em.persist(new Usuario("Usuario", "efetivacao@teste.com", "hash"));
        conta = em.persist(new ContaFinanceira("Conta", TipoContaFinanceira.CONTA_CORRENTE, new BigDecimal("1000"), usuario));
        despesa = em.persist(new Categoria("Despesa", TipoMovimentacao.DESPESA, usuario));
        receita = em.persist(new Categoria("Receita", TipoMovimentacao.RECEITA, usuario));
    }

    @Test
    void previaELiquidacaoUsamAMesmaDataValoresSaldoERelatorio() {
        var compromisso = pagar.criar(requestPagar(null));
        var data = vencimento.plusDays(2);
        var previa = pagar.previa(compromisso.id(), data);
        assertThat(previa.data()).isEqualTo(data);
        assertThat(previa.valorOriginal()).isEqualByComparingTo("100");
        assertThat(previa.multa()).isEqualByComparingTo("2");
        assertThat(previa.juros()).isEqualByComparingTo("1");
        assertThat(previa.desconto()).isEqualByComparingTo("0");
        assertThat(previa.valorAtualizado()).isEqualByComparingTo("103");
        var paga = pagar.pagar(compromisso.id(), new EfetivacaoRequest(data, previa.valorAtualizado()));
        em.flush();
        em.clear();
        var movimento = movimentacaoRepository.findById(paga.movimentacaoId()).orElseThrow();
        assertThat(movimento.getData()).isEqualTo(data);
        assertThat(movimento.getValor()).isEqualByComparingTo("103");
        assertThat(movimento.getOrigemTipo()).isEqualTo(OrigemMovimentacaoTipo.CONTA_A_PAGAR);
        assertThat(movimento.getOrigemId()).isEqualTo(compromisso.id());
        assertThat(paga.status()).isEqualTo(StatusContaAPagar.PAGA);
        assertThat(pagar.listar().get(0).valorAtualizado()).isEqualByComparingTo("103");
        assertThat(contas.listar().get(0).saldoAtual()).isEqualByComparingTo("897");
        assertThat(relatorios.resumo().despesas()).isEqualByComparingTo("103");
    }

    @Test
    void recebimentoComDescontoMantemValorHistorico() {
        var compromisso = receber.criar(requestReceber(null));
        var data = vencimento.minusDays(3);
        var previa = receber.previa(compromisso.id(), data);
        assertThat(previa.desconto()).isEqualByComparingTo("10");
        assertThat(previa.valorAtualizado()).isEqualByComparingTo("90");
        var recebida = receber.receber(compromisso.id(), new EfetivacaoRequest(data, previa.valorAtualizado()));
        em.flush();
        em.clear();
        assertThat(recebida.status()).isEqualTo(StatusContaAReceber.RECEBIDA);
        assertThat(receber.listar().get(0).valorAtualizado()).isEqualByComparingTo("90");
        assertThat(contas.listar().get(0).saldoAtual()).isEqualByComparingTo("1090");
        assertThat(relatorios.resumo().receitas()).isEqualByComparingTo("90");
        var movimento = movimentacaoRepository.findById(recebida.movimentacaoId()).orElseThrow();
        assertThat(movimento.getData()).isEqualTo(data);
        assertThat(movimento.getOrigemTipo()).isEqualTo(OrigemMovimentacaoTipo.CONTA_A_RECEBER);
    }

    @Test
    void statusFinalNaoPodeSerEnviadoNoCadastroOuEdicao() {
        assertThatThrownBy(() -> pagar.criar(requestPagar(StatusContaAPagar.PAGA))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.criar(requestReceber(StatusContaAReceber.RECEBIDA))).isInstanceOf(RegraNegocioException.class);
        var pendentePagar = pagar.criar(requestPagar(null));
        var pendenteReceber = receber.criar(requestReceber(null));
        assertThatThrownBy(() -> pagar.atualizar(pendentePagar.id(), requestPagar(StatusContaAPagar.PAGA))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.atualizar(pendenteReceber.id(), requestReceber(StatusContaAReceber.RECEBIDA))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.atualizar(pendentePagar.id(), requestPagar(StatusContaAPagar.CANCELADA))).isInstanceOf(RegraNegocioException.class);
        assertThat(pagarRepository.findById(pendentePagar.id()).orElseThrow().getStatus()).isEqualTo(StatusContaAPagar.PENDENTE);
        assertThat(movimentacaoRepository.count()).isZero();
    }

    @Test
    void statusOmitidoPreservaCompromissoAtrasado() {
        var compromisso = pagarRepository.save(new ContaAPagar("Atrasada", new BigDecimal("100"), vencimento,
                conta, despesa, usuario, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));
        compromisso.atualizar("Atrasada", new BigDecimal("100"), vencimento, conta, despesa,
                StatusContaAPagar.ATRASADA, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0);
        assertThat(pagar.atualizar(compromisso.getId(), requestPagar(null)).status()).isEqualTo(StatusContaAPagar.ATRASADA);
    }

    @Test
    void naoPermiteEditarExcluirOuEfetivarNovamenteCompromissosLiquidados() {
        var p = pagar.criar(requestPagar(null));
        var r = receber.criar(requestReceber(null));
        pagar.pagar(p.id(), new EfetivacaoRequest(vencimento));
        receber.receber(r.id(), new EfetivacaoRequest(vencimento));
        assertThatThrownBy(() -> pagar.pagar(p.id(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.receber(r.id(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.atualizar(p.id(), requestPagar(null))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.atualizar(r.id(), requestReceber(null))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.cancelar(p.id())).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.cancelar(r.id())).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.excluir(p.id())).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.excluir(r.id())).isInstanceOf(RegraNegocioException.class);
        assertThat(movimentacaoRepository.count()).isEqualTo(2);
    }

    @Test
    void movimentacoesDeCompromissosNaoPodemSerAlteradasDiretamente() {
        var p = pagar.criar(requestPagar(null));
        var r = receber.criar(requestReceber(null));
        var paga = pagar.pagar(p.id(), new EfetivacaoRequest(vencimento));
        var recebida = receber.receber(r.id(), new EfetivacaoRequest(vencimento));
        var request = new MovimentacaoRequest("Alterada", new BigDecimal("999"), TipoMovimentacao.DESPESA,
                vencimento, conta.getId(), despesa.getId());
        for (var id : new java.util.UUID[]{paga.movimentacaoId(), recebida.movimentacaoId()}) {
            assertThatThrownBy(() -> movimentacoes.atualizar(id, request)).isInstanceOf(RegraNegocioException.class);
            assertThatThrownBy(() -> movimentacoes.excluir(id)).isInstanceOf(RegraNegocioException.class);
        }
        assertThat(movimentacaoRepository.count()).isEqualTo(2);
        assertThat(movimentacoes.listar()).allSatisfy(m -> assertThat(m.origemId()).isNotNull());
    }

    @Test
    void movimentacaoManualContinuaEditavelEExcluivel() {
        var request = new MovimentacaoRequest("Manual", new BigDecimal("25"), TipoMovimentacao.DESPESA,
                vencimento, conta.getId(), null);
        var manual = movimentacoes.criar(request);
        assertThat(manual.origemTipo()).isEqualTo(OrigemMovimentacaoTipo.MANUAL);
        assertThat(movimentacoes.atualizar(manual.id(), new MovimentacaoRequest("Corrigida", new BigDecimal("30"),
                TipoMovimentacao.DESPESA, vencimento, conta.getId(), null)).valor()).isEqualByComparingTo("30");
        movimentacoes.excluir(manual.id());
        assertThat(movimentacaoRepository.count()).isZero();
    }

    @Test
    void compromissoCanceladoNaoPodeSerEditadoConsultadoOuEfetivado() {
        var p = pagar.criar(requestPagar(null));
        var r = receber.criar(requestReceber(null));
        pagar.cancelar(p.id());
        receber.cancelar(r.id());
        assertThatThrownBy(() -> pagar.previa(p.id(), vencimento)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.previa(r.id(), vencimento)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.pagar(p.id(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.receber(r.id(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.atualizar(p.id(), requestPagar(null))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.atualizar(r.id(), requestReceber(null))).isInstanceOf(RegraNegocioException.class);
        assertThat(movimentacaoRepository.count()).isZero();
    }

    @Test
    void valorDiferenteDaPreviaNaoEfetivaNemAlteraSaldo() {
        var p = pagar.criar(requestPagar(null));
        var r = receber.criar(requestReceber(null));
        assertThatThrownBy(() -> pagar.pagar(p.id(), new EfetivacaoRequest(vencimento, new BigDecimal("999"))))
                .isInstanceOf(RegraNegocioException.class).hasMessageContaining("previa");
        assertThatThrownBy(() -> receber.receber(r.id(), new EfetivacaoRequest(vencimento, new BigDecimal("999"))))
                .isInstanceOf(RegraNegocioException.class);
        assertThat(movimentacaoRepository.count()).isZero();
        assertThat(contas.listar().get(0).saldoAtual()).isEqualByComparingTo("1000");
    }

    @Test
    void previaEEfetivacaoNaoAcessamCompromissosDeOutroUsuario() {
        var outro = em.persist(new Usuario("Outro", "outro@teste.com", "hash"));
        var contaOutro = em.persist(new ContaFinanceira("Outra", TipoContaFinanceira.CONTA_CORRENTE, BigDecimal.ZERO, outro));
        var p = em.persist(new ContaAPagar("Privada", new BigDecimal("100"), vencimento, contaOutro, despesa,
                outro, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));
        var r = em.persist(new ContaAReceber("Privada", new BigDecimal("100"), vencimento, contaOutro, receita,
                null, outro, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));
        assertThatThrownBy(() -> pagar.previa(p.getId(), vencimento)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.previa(r.getId(), vencimento)).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> pagar.pagar(p.getId(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThatThrownBy(() -> receber.receber(r.getId(), new EfetivacaoRequest(vencimento))).isInstanceOf(RegraNegocioException.class);
        assertThat(movimentacaoRepository.count()).isZero();
    }

    private ContaAPagarRequest requestPagar(StatusContaAPagar status) {
        return new ContaAPagarRequest("Pagamento", new BigDecimal("100"), vencimento, conta.getId(), despesa.getId(),
                new BigDecimal("2"), new BigDecimal("0.5"), new BigDecimal("10"), 3, status);
    }

    private ContaAReceberRequest requestReceber(StatusContaAReceber status) {
        return new ContaAReceberRequest("Recebimento", new BigDecimal("100"), vencimento, conta.getId(), receita.getId(),
                new BigDecimal("2"), new BigDecimal("0.5"), new BigDecimal("10"), 3, status);
    }
}
