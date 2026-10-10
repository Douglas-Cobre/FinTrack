# Banco de dados

Configure `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` no `.env` local, conforme `.env.example`. O script `run-backend.ps1` importa essas variáveis. Não armazene senhas no código ou nos documentos.

O desenvolvimento usa `jdbc:postgresql://localhost:5432/fintrack`. Crie esse banco vazio e deixe o Flyway executar V1–V5. O esquema inclui usuários, contas, categorias, fontes de renda, movimentações, compromissos, parcelamentos, parcelas e configurações financeiras.

Os scripts antigos em `database/` representam a estrutura inicial e não substituem as migrações atuais. Para uma nova instalação, use exclusivamente as migrações do backend.

## Banco criado manualmente

A configuração de desenvolvimento mantém `baseline-on-migrate: true` para compatibilidade com a instalação inicial. Faça backup antes de atualizar um banco existente. Confira a estrutura e o histórico do Flyway; não altere migrações já executadas.

Em produção, `baseline-on-migrate` é desabilitado. A implantação pressupõe banco vazio ou banco com histórico Flyway correto. Para migrar a instalação manual antiga, compare o esquema com V1, faça uma restauração de ensaio e estabeleça uma baseline explícita somente depois dessa conferência.

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history ORDER BY installed_rank;
```

## Testes isolados

Execute `scripts/test-postgres.ps1`. Ele cria nomes `fintrack_test_<uuid>` e `fintrack_restore_<uuid>` e remove apenas esses bancos ao terminar. As classes de integração recusam uma URL que não use o prefixo de teste. O banco usado pelo aplicativo não é limpo nem recriado.

O PostgreSQL de produção e da CI é 16. A validação local também passou no PostgreSQL 18.3 instalado nesta máquina; a versão atual do Flyway emite um aviso de suporte para o 18. Use PostgreSQL 16 na implantação preparada.
