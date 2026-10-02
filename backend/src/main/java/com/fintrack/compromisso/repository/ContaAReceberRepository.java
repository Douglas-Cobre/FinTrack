package com.fintrack.compromisso.repository;

import com.fintrack.compromisso.domain.ContaAReceber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaAReceberRepository extends JpaRepository<ContaAReceber, UUID> {

    List<ContaAReceber> findAllByUsuarioIdOrderByDataVencimentoAsc(UUID usuarioId);

    Optional<ContaAReceber> findByIdAndUsuarioId(UUID id, UUID usuarioId);
}
