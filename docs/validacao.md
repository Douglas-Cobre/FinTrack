# Validação da versão 0.1.0

## Comandos

```powershell
.\scripts\test-backend.ps1
.\scripts\test-postgres.ps1
Set-Location frontend
npm test
npm run build
```

O Maven configura o agente Byte Buddy no início do processo de teste, evitando a anexação dinâmica do Mockito. O perfil `postgres` acrescenta os testes Failsafe `*IT`; os testes rápidos continuam usando H2 quando apropriado.

Para rodar em Linux/CI, crie um banco vazio com prefixo `fintrack_test_`, defina `PG_TEST_URL`, `PG_TEST_USERNAME` e `PG_TEST_PASSWORD` e execute `mvn -B -Ppostgres verify` dentro de `backend/`. A URL deve ser JDBC PostgreSQL sem parâmetros. Cada classe usa um esquema separado para isolar seus dados.

## Evidências locais — 10/10/2026

- 36 testes gerais do backend passaram.
- 15 testes de integração passaram no PostgreSQL 18.3: V1–V5, conferência/efetivação, saldo, relatórios, proteção contra alterações indevidas, isolamento por usuário, exclusão com vínculos e pagamento/recebimento simultâneos.
- O dump custom foi restaurado em outro banco temporário e conferido: cinco migrações em cada esquema de teste e dois movimentos de concorrência.
- Regressões de data local em São Paulo/Tóquio, fronteira de envio do token em desenvolvimento/produção e mensagens de erro.
- Build Angular de produção: pacote inicial de aproximadamente 398 KB, abaixo do limite de 500 KB. Rotas carregam os componentes sob demanda.
- Interface em navegador: login, mensagem de categoria duplicada, diálogo de exclusão em 390 px, menu de ações do Financeiro, confirmação de cancelamento com opção Voltar e filtros. O compromisso permaneceu pendente.
- HTTP com perfil `prod` em banco separado: saúde, autenticação exigida, CORS recusando origem externa, JSON inválido, exclusão vinculada com erro 409 e documentação Swagger indisponível.

O PostgreSQL de implantação/CI é 16. O Flyway atual avisa sobre suporte ao 18 local; não houve falha de migração ou validação.

## CI e verificação Docker

`.github/workflows/ci.yml` executa três jobs: backend com PostgreSQL 16, frontend e instalação Docker. O job Docker verifica healthcheck, acesso à SPA em rota direta, API protegida e restauração de backup. Nenhum job publica imagens ou implanta em hospedagem externa.

Docker não foi executado localmente porque o programa não está disponível. A configuração precisa passar pelo job Docker antes da publicação. Resultado de workflow só pode ser considerado validado após sua execução no GitHub.
