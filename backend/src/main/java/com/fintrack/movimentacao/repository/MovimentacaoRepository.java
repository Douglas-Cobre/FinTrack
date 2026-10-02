package com.fintrack.movimentacao.repository;

import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.shared.domain.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {

    List<Movimentacao> findAllByUsuarioIdOrderByDataDescCreatedAtDesc(UUID usuarioId);

    Optional<Movimentacao> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    @Query("""
            select coalesce(sum(m.valor), 0)
            from Movimentacao m
            where m.usuario.id = :usuarioId
              and m.tipo = :tipo
            """)
    BigDecimal somarPorUsuarioETipo(
            @Param("usuarioId") UUID usuarioId,
            @Param("tipo") TipoMovimentacao tipo
    );

    @Query("""
            select m.categoria.nome, coalesce(sum(m.valor), 0)
            from Movimentacao m
            where m.usuario.id = :usuarioId
              and m.tipo = :tipo
            group by m.categoria.nome
            order by coalesce(sum(m.valor), 0) desc
            """)
    List<Object[]> somarPorCategoria(
            @Param("usuarioId") UUID usuarioId,
            @Param("tipo") TipoMovimentacao tipo
    );

    @Query("""
            select coalesce(sum(m.valor), 0)
            from Movimentacao m
            where m.contaFinanceira.id = :contaId
              and m.usuario.id = :usuarioId
              and m.tipo = :tipo
            """)
    BigDecimal somarPorContaUsuarioETipo(
            @Param("contaId") UUID contaId,
            @Param("usuarioId") UUID usuarioId,
            @Param("tipo") TipoMovimentacao tipo
    );

}
