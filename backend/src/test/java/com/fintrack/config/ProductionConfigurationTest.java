package com.fintrack.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ProductionConfigurationTest {
    @Test
    void recusaSegredosFracosEOrigensGenericas() {
        assertThatThrownBy(() -> new ProductionConfiguration("curta", "senha", "")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ProductionConfiguration("s".repeat(64), "CHANGE_ME", "")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new ProductionConfiguration("s".repeat(64), "senha", "*")).isInstanceOf(IllegalStateException.class);
        assertThatCode(() -> new ProductionConfiguration("s".repeat(64), "senha", "https://fintrack.example.com")).doesNotThrowAnyException();
    }

    @Test
    void saudeIndicaFalhaDoBancoSemExporDetalhes() {
        var jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
        var health = new HealthController(jdbc);
        assertThat(health.health().getStatusCode().value()).isEqualTo(200);
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenThrow(new DataAccessResourceFailureException("detalhe privado"));
        assertThat(health.health().getStatusCode().value()).isEqualTo(503);
        assertThat(health.health().getBody()).containsEntry("status", "DOWN");
    }
}
