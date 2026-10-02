# Fase 2 - Usuario e autenticacao

Esta fase implementa a base de autenticacao do FinTrack.

## Backend

Endpoints criados:

```text
POST /api/auth/cadastro
POST /api/auth/login
GET  /api/usuarios/me
```

## Cadastro

```http
POST /api/auth/cadastro
Content-Type: application/json
```

```json
{
  "nome": "Douglas",
  "email": "douglas@email.com",
  "senha": "12345678"
}
```

Resposta:

```json
{
  "token": "...",
  "tipo": "Bearer",
  "expiraEm": "2026-10-01T15:00:00Z",
  "usuario": {
    "id": "...",
    "nome": "Douglas",
    "email": "douglas@email.com"
  }
}
```

## Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "douglas@email.com",
  "senha": "12345678"
}
```

## Usuario autenticado

```http
GET /api/usuarios/me
Authorization: Bearer TOKEN
```

## Regras implementadas

- Senha armazenada com BCrypt.
- Email unico por usuario.
- Token JWT com expiracao configuravel.
- Endpoints financeiros ficam protegidos por padrao.
- Swagger e endpoints de autenticacao ficam publicos.
- Frontend envia o token automaticamente via interceptor.

## Frontend

Rotas criadas:

```text
/login
/cadastro
/
```

A rota `/` fica protegida por guard. Sem token, o usuario e redirecionado para `/login`.
