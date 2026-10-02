package com.fintrack.autenticacao.service;

import com.fintrack.autenticacao.dto.AuthResponse;
import com.fintrack.autenticacao.dto.AuthResponse.UsuarioResumoResponse;
import com.fintrack.autenticacao.dto.CadastroRequest;
import com.fintrack.autenticacao.dto.LoginRequest;
import com.fintrack.config.security.JwtService;
import com.fintrack.shared.exception.CredenciaisInvalidasException;
import com.fintrack.shared.exception.RegraNegocioException;
import com.fintrack.usuario.domain.Usuario;
import com.fintrack.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutenticacaoService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AutenticacaoService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse cadastrar(CadastroRequest request) {
        var emailNormalizado = normalizarEmail(request.email());

        if (usuarioRepository.existsByEmailIgnoreCase(emailNormalizado)) {
            throw new RegraNegocioException("Ja existe um usuario cadastrado com este email.");
        }

        var usuario = new Usuario(
                request.nome().trim(),
                emailNormalizado,
                passwordEncoder.encode(request.senha())
        );

        var usuarioSalvo = usuarioRepository.save(usuario);
        return gerarResposta(usuarioSalvo);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        var usuario = usuarioRepository.findByEmailIgnoreCase(normalizarEmail(request.email()))
                .orElseThrow(CredenciaisInvalidasException::new);

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new CredenciaisInvalidasException();
        }

        return gerarResposta(usuario);
    }

    private AuthResponse gerarResposta(Usuario usuario) {
        var tokenGerado = jwtService.gerarToken(usuario);
        var usuarioResumo = new UsuarioResumoResponse(usuario.getId(), usuario.getNome(), usuario.getEmail());

        return AuthResponse.bearer(tokenGerado.token(), tokenGerado.expiraEm(), usuarioResumo);
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }
}
