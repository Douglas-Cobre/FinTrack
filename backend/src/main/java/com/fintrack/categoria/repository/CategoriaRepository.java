package com.fintrack.categoria.repository;

import com.fintrack.categoria.domain.Categoria;
import com.fintrack.shared.domain.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    List<Categoria> findAllByUsuarioIdOrderByNome(UUID usuarioId);

    List<Categoria> findAllByUsuarioIdAndTipoOrderByNome(UUID usuarioId, TipoMovimentacao tipo);

    Optional<Categoria> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndTipoAndUsuarioId(String nome, TipoMovimentacao tipo, UUID usuarioId);

    boolean existsByNomeIgnoreCaseAndTipoAndUsuarioIdAndIdNot(String nome, TipoMovimentacao tipo, UUID usuarioId, UUID id);
    @Query(value = "SELECT EXISTS (SELECT 1 FROM movimentacoes WHERE categoria_id = :id) OR EXISTS (SELECT 1 FROM contas_a_pagar WHERE categoria_id = :id) OR EXISTS (SELECT 1 FROM contas_a_receber WHERE categoria_id = :id) OR EXISTS (SELECT 1 FROM parcelas WHERE categoria_id = :id)", nativeQuery = true)
    boolean emUso(@Param("id") UUID id);
}
