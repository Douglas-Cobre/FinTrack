package com.fintrack.conta.repository;

import com.fintrack.conta.domain.ContaFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaFinanceiraRepository extends JpaRepository<ContaFinanceira, UUID> {

    List<ContaFinanceira> findAllByUsuarioIdOrderByNome(UUID usuarioId);

    Optional<ContaFinanceira> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndUsuarioId(String nome, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndUsuarioIdAndIdNot(String nome, UUID usuarioId, UUID id);
}
