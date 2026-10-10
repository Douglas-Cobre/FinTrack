package com.fintrack.configuracaofinanceira.repository;

import com.fintrack.configuracaofinanceira.domain.ConfiguracaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConfiguracaoFinanceiraRepository extends JpaRepository<ConfiguracaoFinanceira, UUID> {

    Optional<ConfiguracaoFinanceira> findByUsuarioId(UUID usuarioId);
}

