package com.fintrack.compromisso.repository;

import com.fintrack.compromisso.domain.ContaAReceber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaAReceberRepository extends JpaRepository<ContaAReceber, UUID> {

    List<ContaAReceber> findAllByUsuarioIdOrderByDataVencimentoAsc(UUID usuarioId);

    Optional<ContaAReceber> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ContaAReceber c where c.id = :id and c.usuario.id = :usuarioId")
    Optional<ContaAReceber> buscarParaAtualizacao(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);
}
