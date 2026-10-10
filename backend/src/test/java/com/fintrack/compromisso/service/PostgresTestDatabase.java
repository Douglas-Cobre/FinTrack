package com.fintrack.compromisso.service;

import org.springframework.test.context.DynamicPropertyRegistry;

final class PostgresTestDatabase {
    private PostgresTestDatabase() {}

    static void configure(DynamicPropertyRegistry registry, String schema) {
        String url = System.getenv("PG_TEST_URL");
        if (url == null || !url.matches("jdbc:postgresql://[^/]+/fintrack_test_[a-z0-9_]+")) {
            throw new IllegalStateException("PG_TEST_URL deve apontar para um banco exclusivo fintrack_test_*, sem parametros.");
        }
        registry.add("spring.datasource.url", () -> url + "?currentSchema=" + schema);
        registry.add("spring.datasource.username", () -> System.getenv("PG_TEST_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("PG_TEST_PASSWORD"));
        registry.add("spring.flyway.schemas", () -> schema);
    }
}
