package com.fintrack.compromisso.repository;

import com.fintrack.compromisso.domain.ContaAPagar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContaAPagarRepository extends JpaRepository<ContaAPagar, UUID> {

    List<ContaAPagar> findAllByUsuarioIdOrderByDataVencimentoAsc(UUID usuarioId);

    Optional<ContaAPagar> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ContaAPagar c where c.id = :id and c.usuario.id = :usuarioId")
    Optional<ContaAPagar> buscarParaAtualizacao(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);
}
