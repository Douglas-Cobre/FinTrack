package com.fintrack.usuario.controller;

import com.fintrack.usuario.dto.UsuarioAutenticadoResponse;
import com.fintrack.usuario.service.UsuarioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/me")
    public UsuarioAutenticadoResponse me() {
        var usuario = usuarioService.obterUsuarioAutenticado();
        return new UsuarioAutenticadoResponse(usuario.getId(), usuario.getNome(), usuario.getEmail());
    }
}
