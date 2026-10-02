# Banco de dados - FinTrack

Este projeto pode usar o PostgreSQL local que voce ja acessa pelo DBeaver. Nao precisa usar Docker para desenvolver agora.

## Conexao usada pelo backend

```text
Host: localhost
Porta: 5432
Banco: fintrack
Usuario: postgres
Senha: 8318
JDBC: jdbc:postgresql://localhost:5432/fintrack
```

No Spring Boot, esses dados ficam em:

```text
backend/src/main/resources/application.yml
```

## Fluxo simples recomendado

1. Abra o PostgreSQL/DBeaver.
2. Confirme que o database `fintrack` existe.
3. Confirme que as tabelas existem no schema `public`.
4. Rode o backend.

Para conferir as tabelas no DBeaver:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Tabelas esperadas:

```text
categorias
contas_a_pagar
contas_a_receber
contas_financeiras
fontes_de_renda
movimentacoes
parcelamentos
parcelas
usuarios
```

## Quando usar os arquivos SQL

Use apenas se estiver configurando o banco do zero.

Para criar o database manualmente:

```text
database/create-database.sql
```

Para criar as tabelas:

```text
database/setup.sql
```

Como voce ja executou esses scripts, nao precisa rodar de novo agora.

## Sobre Flyway

O projeto usa Flyway para versionar o banco.

Como as tabelas foram criadas manualmente pelo DBeaver nesta primeira configuracao, o backend esta com:

```yaml
spring:
  flyway:
    baseline-on-migrate: true
```

Isso permite que o Flyway reconheca o banco existente e siga dali nas proximas migrations.

## Docker

Docker fica opcional neste momento. Os scripts em `scripts/` existem como alternativa, mas voce nao precisa usar se ja tem PostgreSQL local funcionando.
