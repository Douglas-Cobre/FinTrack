# Fase 3 - Contas financeiras

Esta fase implementa o primeiro recurso financeiro real do FinTrack.

## Backend

Endpoints criados:

```text
POST   /api/contas-financeiras
GET    /api/contas-financeiras
GET    /api/contas-financeiras/{id}
PUT    /api/contas-financeiras/{id}
DELETE /api/contas-financeiras/{id}
```

Todos exigem JWT.

## Regras implementadas

- Toda conta financeira pertence ao usuario autenticado.
- Um usuario nao acessa contas de outro usuario.
- Nome de conta nao pode repetir para o mesmo usuario.
- `saldoInicial` deve ser maior ou igual a zero.
- `saldoAtual` nao e armazenado no banco.
- `saldoAtual` e calculado como:

```text
saldoInicial + receitas efetivadas - despesas efetivadas
```

Enquanto ainda nao existem movimentacoes, `saldoAtual` sera igual ao `saldoInicial`.

## Frontend

Rota criada:

```text
/contas
```

A tela permite:

- listar contas financeiras;
- cadastrar conta;
- editar conta;
- excluir conta;
- visualizar saldo inicial e saldo atual calculado pelo backend.
