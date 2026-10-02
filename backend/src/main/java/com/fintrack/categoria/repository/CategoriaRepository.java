package com.fintrack.categoria.repository;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.shared.domain.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    List<Categoria> findAllByUsuarioIdOrderByNome(UUID usuarioId);

    List<Categoria> findAllByUsuarioIdAndTipoOrderByNome(UUID usuarioId, TipoMovimentacao tipo);

    Optional<Categoria> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndTipoAndUsuarioId(String nome, TipoMovimentacao tipo, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndTipoAndUsuarioIdAndIdNot(String nome, TipoMovimentacao tipo, UUID usuarioId, UUID id);
}
