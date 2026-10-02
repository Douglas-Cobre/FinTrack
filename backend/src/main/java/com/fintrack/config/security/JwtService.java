package com.fintrack.config.security;

import com.fintrack.usuario.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${fintrack.jwt.secret}") String secret,
            @Value("${fintrack.jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public TokenGerado gerarToken(Usuario usuario) {
        var agora = OffsetDateTime.now(ZoneOffset.UTC);
        var expiraEm = agora.plusMinutes(expirationMinutes);

        var token = Jwts.builder()
                .subject(usuario.getEmail())
                .claim("usuarioId", usuario.getId().toString())
                .claim("nome", usuario.getNome())
                .issuedAt(Date.from(agora.toInstant()))
                .expiration(Date.from(expiraEm.toInstant()))
                .signWith(secretKey)
                .compact();

        return new TokenGerado(token, expiraEm);
    }

    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public UUID extrairUsuarioId(String token) {
        return UUID.fromString(extrairClaims(token).get("usuarioId", String.class));
    }

    public boolean tokenValido(String token) {
        try {
            return extrairClaims(token).getExpiration().after(new Date());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record TokenGerado(String token, OffsetDateTime expiraEm) {
    }
}
