package com.fintrack.compromisso.service;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.assertj.core.api.Assertions.*;

@DataJpaTest(properties = {"spring.flyway.enabled=true", "spring.flyway.baseline-on-migrate=false",
        "spring.jpa.hibernate.ddl-auto=validate"}, showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PostgresEfetivacaoIT extends EfetivacaoIntegrationTest {
    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;

    @DynamicPropertySource
    static void postgres(DynamicPropertyRegistry registry) { PostgresTestDatabase.configure(registry, "efetivacao"); }

    @Test
    void todasAsMigracoesReaisAplicadasEValidadas() {
        flyway.validate();
        assertThat(java.util.Arrays.stream(flyway.info().applied()).filter(m -> m.getVersion() != null).map(m -> m.getVersion().toString())).containsExactly("1", "2", "3", "4", "5");
        assertThat(jdbc.queryForObject("SELECT current_setting('server_version_num')::int", Integer.class)).isGreaterThanOrEqualTo(160000);
    }

    @Test
    void exclusaoDeCadastrosVinculadosRetornaRegraDeNegocio() {
        var categoria = categoriaService.listar(com.fintrack.shared.domain.TipoMovimentacao.DESPESA).get(0).id();
        var conta = contas.listar().get(0);
        movimentacoes.criar(new com.fintrack.movimentacao.dto.MovimentacaoRequest("Vinculo", new java.math.BigDecimal("10"),
                com.fintrack.shared.domain.TipoMovimentacao.DESPESA, java.time.LocalDate.now(), conta.id(), categoria));
        assertThatThrownBy(() -> contas.excluir(conta.id())).isInstanceOf(com.fintrack.shared.exception.RegraNegocioException.class)
                .hasMessageContaining("vinculados");
        assertThatThrownBy(() -> categoriaService.excluir(categoria)).isInstanceOf(com.fintrack.shared.exception.RegraNegocioException.class)
                .hasMessageContaining("vinculados");
    }

    @Test
    void postgresRecusaGrupoDreIncompativelMesmoForaDaAplicacao() {
        em.flush();
        assertThatThrownBy(() -> jdbc.update("UPDATE categorias SET grupo_dre = 'CUSTO' WHERE tipo = 'RECEITA'"))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Autowired com.fintrack.categoria.service.CategoriaService categoriaService;
}
