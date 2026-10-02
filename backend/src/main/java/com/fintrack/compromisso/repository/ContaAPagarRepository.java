package com.fintrack.compromisso.repository;

import com.fintrack.compromisso.domain.ContaAPagar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaAPagarRepository extends JpaRepository<ContaAPagar, UUID> {

    List<ContaAPagar> findAllByUsuarioIdOrderByDataVencimentoAsc(UUID usuarioId);

    Optional<ContaAPagar> findByIdAndUsuarioId(UUID id, UUID usuarioId);
}
