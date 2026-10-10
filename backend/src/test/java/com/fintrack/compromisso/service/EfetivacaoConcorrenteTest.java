package com.fintrack.compromisso.service;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.categoria.repository.CategoriaRepository;
import com.fintrack.categoria.service.CategoriaService;
import com.fintrack.compromisso.dto.ContaAPagarRequest;
import com.fintrack.compromisso.dto.ContaAReceberRequest;
import com.fintrack.compromisso.dto.EfetivacaoRequest;
import com.fintrack.conta.domain.ContaFinanceira;
import com.fintrack.conta.domain.TipoContaFinanceira;
import com.fintrack.conta.repository.ContaFinanceiraRepository;
import com.fintrack.movimentacao.repository.MovimentacaoRepository;
import com.fintrack.shared.domain.TipoMovimentacao;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.repository.UsuarioRepository;
import com.fintrack.usuario.service.UsuarioService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"}, showSql = false)
@Import({ContaAPagarService.class, ContaAReceberService.class, CategoriaService.class, UsuarioService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class EfetivacaoConcorrenteTest {
    @Autowired ContaAPagarService pagar;
    @Autowired ContaAReceberService receber;
    @Autowired UsuarioRepository usuarios;
    @Autowired ContaFinanceiraRepository contas;
    @Autowired CategoriaRepository categorias;
    @Autowired MovimentacaoRepository movimentacoes;
    @Autowired PlatformTransactionManager transactionManager;

    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    void duasConfirmacoesSimultaneasGeramUmaUnicaMovimentacao(boolean pagamento) throws Exception {
        var email = UUID.randomUUID() + "@concorrencia.teste";
        var vencimento = LocalDate.of(2026, 9, 10);
        autenticar(email);
        UUID id;
        UUID usuarioId;
        try {
            var dados = new TransactionTemplate(transactionManager).execute(status -> {
                var usuario = usuarios.save(new Usuario("Usuario", email, "hash"));
                var conta = contas.save(new ContaFinanceira("Conta", TipoContaFinanceira.CONTA_CORRENTE, BigDecimal.ZERO, usuario));
                var categoria = categorias.save(new Categoria("Categoria", pagamento ? TipoMovimentacao.DESPESA : TipoMovimentacao.RECEITA, usuario));
                var compromissoId = pagamento
                        ? pagar.criar(new ContaAPagarRequest("Pagamento", new BigDecimal("100"), vencimento,
                            conta.getId(), categoria.getId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, null)).id()
                        : receber.criar(new ContaAReceberRequest("Recebimento", new BigDecimal("100"), vencimento,
                            conta.getId(), categoria.getId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0, null)).id();
                return new UUID[]{compromissoId, usuario.getId()};
            });
            id = dados[0];
            usuarioId = dados[1];
        } finally {
            SecurityContextHolder.clearContext();
        }
        var executor = Executors.newFixedThreadPool(2);
        var prontos = new CountDownLatch(2);
        var iniciar = new CountDownLatch(1);
        try {
            java.util.concurrent.Callable<Boolean> confirmar = () -> {
                autenticar(email);
                try {
                    prontos.countDown();
                    if (!iniciar.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Inicio excedeu o prazo");
                    var request = new EfetivacaoRequest(vencimento, new BigDecimal("100"));
                    if (pagamento) pagar.pagar(id, request);
                    else receber.receber(id, request);
                    return true;
                } catch (RegraNegocioException exception) {
                    assertThat(exception).hasMessageContaining("ja foi efetivada");
                    return false;
                } finally {
                    SecurityContextHolder.clearContext();
                }
            };
            var primeira = executor.submit(confirmar);
            var segunda = executor.submit(confirmar);
            assertThat(prontos.await(5, TimeUnit.SECONDS)).isTrue();
            iniciar.countDown();
            assertThat(List.of(primeira.get(20, TimeUnit.SECONDS), segunda.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
            var quantidade = new TransactionTemplate(transactionManager).execute(status ->
                    movimentacoes.findAllByUsuarioIdOrderByDataDescCreatedAtDesc(usuarioId).size());
            assertThat(quantidade).isEqualTo(1);
        } finally {
            iniciar.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    private static void autenticar(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "", List.of()));
    }
}
