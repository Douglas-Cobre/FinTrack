package com.fintrack.movimentacao.repository;

import com.fintrack.movimentacao.domain.Movimentacao;
import com.fintrack.shared.domain.TipoMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovimentacaoRepository extends JpaRepository<Movimentacao, UUID> {

    @Query("""
            select new com.fintrack.movimentacao.repository.TotalDrePorCategoria(
                m.tipo, c.grupoDre, c.id, c.nome, sum(m.valor), count(m))
            from Movimentacao m
            left join m.categoria c on c.usuario.id = :usuarioId
            where m.usuario.id = :usuarioId
              and m.data between :inicio and :fim
            group by m.tipo, c.grupoDre, c.id, c.nome
            order by c.nome, c.id, m.tipo
            """)
    List<TotalDrePorCategoria> somarParaDre(
            @Param("usuarioId") UUID usuarioId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim
    );

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
            select coalesce(m.categoria.nome, 'Sem categoria'), coalesce(sum(m.valor), 0)
            from Movimentacao m
            where m.usuario.id = :usuarioId
              and m.tipo = :tipo
            group by coalesce(m.categoria.nome, 'Sem categoria')
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
