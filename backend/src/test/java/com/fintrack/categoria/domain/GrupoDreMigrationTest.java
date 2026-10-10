package com.fintrack.categoria.domain;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import java.sql.DriverManager;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.*;

class GrupoDreMigrationTest {
    @Test
    void migrationPreservaLegadasERejeitaGruposInvalidosOuIncompativeis() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:migration_dre;MODE=PostgreSQL")) {
            var stmt = connection.createStatement();
            stmt.execute("CREATE TABLE categorias (id INTEGER PRIMARY KEY, tipo VARCHAR(20) NOT NULL)");
            stmt.execute("INSERT INTO categorias (id, tipo) VALUES (1, 'RECEITA')");
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/V5__adicionar_grupo_dre_categorias.sql"));
            try (var rows = stmt.executeQuery("SELECT grupo_dre FROM categorias WHERE id = 1")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString(1)).isNull();
            }
            int id = 2;
            for (var grupo : GrupoDre.values()) {
                for (var tipo : com.fintrack.shared.domain.TipoMovimentacao.values()) {
                    String sql = "INSERT INTO categorias (id, tipo, grupo_dre) VALUES (" + id++ + ", '" + tipo + "', '" + grupo + "')";
                    if (grupo.compativelCom(tipo)) assertThatCode(() -> stmt.execute(sql)).doesNotThrowAnyException();
                    else assertThatThrownBy(() -> stmt.execute(sql)).isInstanceOf(SQLException.class);
                }
            }
            assertThatThrownBy(() -> stmt.execute("INSERT INTO categorias (id, tipo, grupo_dre) VALUES (100, 'RECEITA', 'INVALIDO')"))
                    .isInstanceOf(SQLException.class);
        }
    }
}
