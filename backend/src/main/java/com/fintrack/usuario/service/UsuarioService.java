package com.fintrack.usuario.service;

import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.repository.UsuarioRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public Usuario obterUsuarioAutenticado() {
        var email = SecurityContextHolder.getContext().getAuthentication().getName();

        return usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado nao encontrado."));
    }
}
