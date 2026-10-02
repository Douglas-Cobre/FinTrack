package com.fintrack.usuario.dto;

import java.util.UUID;

public record UsuarioAutenticadoResponse(
        UUID id,
        String nome,
        String email
) {
}
