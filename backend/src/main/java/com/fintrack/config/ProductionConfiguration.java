package com.fintrack.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.nio.charset.StandardCharsets;

@Configuration
@Profile("prod")
public class ProductionConfiguration {
    public ProductionConfiguration(@Value("${fintrack.jwt.secret}") String secret,
            @Value("${spring.datasource.password}") String password,
            @Value("${fintrack.cors.allowed-origins}") String origins) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 64 || secret.startsWith("CHANGE_ME")) {
            throw new IllegalStateException("Configure JWT_SECRET com uma chave aleatoria de pelo menos 64 bytes.");
        }
        if (password.isBlank() || password.startsWith("CHANGE_ME")) {
            throw new IllegalStateException("Configure DB_PASSWORD para o ambiente de producao.");
        }
        if (origins.contains("*")) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS deve conter origens explicitas.");
        }
    }
}
