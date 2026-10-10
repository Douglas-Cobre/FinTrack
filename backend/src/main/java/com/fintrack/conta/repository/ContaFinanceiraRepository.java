package com.fintrack.conta.repository;

import com.fintrack.conta.domain.ContaFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaFinanceiraRepository extends JpaRepository<ContaFinanceira, UUID> {

    List<ContaFinanceira> findAllByUsuarioIdOrderByNome(UUID usuarioId);

    Optional<ContaFinanceira> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndUsuarioId(String nome, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndUsuarioIdAndIdNot(String nome, UUID usuarioId, UUID id);
    @Query(value = "SELECT EXISTS (SELECT 1 FROM movimentacoes WHERE conta_financeira_id = :id) OR EXISTS (SELECT 1 FROM contas_a_pagar WHERE conta_financeira_id = :id) OR EXISTS (SELECT 1 FROM contas_a_receber WHERE conta_financeira_id = :id) OR EXISTS (SELECT 1 FROM parcelas WHERE conta_financeira_id = :id)", nativeQuery = true)
    boolean emUso(@Param("id") UUID id);
}
