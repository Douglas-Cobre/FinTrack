package com.fintrack.autenticacao.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuthResponse(
        String token,
        String tipo,
        OffsetDateTime expiraEm,
        UsuarioResumoResponse usuario
) {

    public static AuthResponse bearer(String token, OffsetDateTime expiraEm, UsuarioResumoResponse usuario) {
        return new AuthResponse(token, "Bearer", expiraEm, usuario);
    }

    public record UsuarioResumoResponse(
            UUID id,
            String nome,
            String email
    ) {
    }
}
