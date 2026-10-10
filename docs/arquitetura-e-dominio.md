# FinTrack — arquitetura e domínio

## Estrutura atual

Monolito modular Spring Boot, com frontend Angular standalone e Angular Material. O backend separa domínio, contratos, repositórios, serviços e controllers por módulo: `autenticacao`, `usuario`, `conta`, `categoria`, `fonte`, `movimentacao`, `compromisso`, `configuracaofinanceira`, `parcelamento` e `relatorio`; `shared` reúne tipos e tratamento de erros.

PostgreSQL é o banco da aplicação. Flyway mantém migrations incrementais V1–V5; migrations anteriores não são alteradas. Os testes de apuração usam H2 com JPA para validar a consulta e as regras sem depender do banco local. O teste da migration V5 verifica as restrições em modo PostgreSQL do H2; não substitui validação operacional no PostgreSQL.

## Propriedade e valores financeiros

Todo recurso financeiro pertence a um `Usuario`. A identidade vem da autenticação JWT; serviços consultam recursos pelo identificador e pelo usuário proprietário. Valores financeiros usam `BigDecimal`, persistidos como `NUMERIC(15,2)`. Valores de lançamentos são positivos; o tipo define entrada ou saída.

### Contas financeiras

`ContaFinanceira` contém nome, tipo, saldo inicial e usuário. O saldo atual é calculado:

```text
saldoInicial + receitas efetivadas - despesas efetivadas
```

A DRE não altera essa regra nem persiste saldos ou totais próprios.

### Categorias

`Categoria` contém nome, `TipoMovimentacao`, `grupoDre` opcional e usuário, além da auditoria de `BaseEntity`. Categorias informadas em movimentações devem ser compatíveis com seu tipo e pertencer ao mesmo usuário.

`GrupoDre` aceita:

| Grupo | Tipo compatível |
| --- | --- |
| RECEITA_OPERACIONAL | RECEITA |
| DEDUCAO_RECEITA | DESPESA |
| CUSTO | DESPESA |
| DESPESA_OPERACIONAL | DESPESA |
| RECEITA_FINANCEIRA | RECEITA |
| DESPESA_FINANCEIRA | DESPESA |
| TRIBUTO_SOBRE_LUCRO | DESPESA |
| FORA_DRE | Ambos |

A migration V5 acrescenta `categorias.grupo_dre VARCHAR(40)` anulável e uma restrição dos valores e tipos compatíveis. Categorias existentes permanecem sem grupo. O serviço também valida a compatibilidade antes de persistir.

No contrato de atualização, omitir `grupoDre` preserva o valor existente; enviar `grupoDre: null` remove a classificação. `CategoriaRequest` registra a presença do campo pelo setter Jackson. Alterar o tipo sem fornecer grupo também valida a classificação preservada.

A classificação é atual, não uma fotografia histórica: reclassificar altera a apresentação de períodos anteriores. Se uma mudança de tipo tornar um movimento histórico incompatível com o grupo atual, a DRE o registra nas pendências sem mudar seu tipo financeiro.

### Movimentações

`Movimentacao` representa receita ou despesa efetivada, com descrição, valor, data, conta, categoria opcional, usuário e origem (`origemTipo`, `origemId`). A origem permite rastrear efetivações sem duplicar o mesmo compromisso. Movimentações manuais também entram na apuração por caixa.

### Compromissos e configuração financeira

`ContaAPagar` e `ContaAReceber` representam obrigações e expectativas futuras, com vencimento, status, conta, categoria, valores de juros/multa/desconto e eventual movimentação vinculada. Contas a receber também permitem fonte de renda. `ConfiguracaoFinanceira` mantém os padrões do usuário.

Pagar ou receber cria uma movimentação única de despesa ou receita e atualiza o compromisso. Uma previsão pendente não é uma movimentação efetivada. Juros, multas e descontos são incorporados ao valor liquidado; nessa entrega, a DRE classifica todo esse valor pela mesma categoria.

As operações de edição, efetivação, cancelamento e exclusão bloqueiam a linha do compromisso com `PESSIMISTIC_WRITE`, sempre filtrando pelo proprietário. Duas confirmações concorrentes produzem uma única movimentação; a segunda recebe um erro de negócio. O índice único de origem continua sendo uma proteção adicional.

`GET /api/contas-a-pagar/{id}/previa?data=AAAA-MM-DD` e o equivalente em `contas-a-receber` retornam a data, valor original, multa, juros, desconto e total. `CalculoEfetivacao` centraliza a regra usada na prévia e na liquidação. O corpo da efetivação aceita `{data, valorConfirmado}`; `valorConfirmado` é opcional para compatibilidade com clientes anteriores, mas a interface sempre o envia. Valores divergentes exigem nova conferência, sem alterar status ou saldo. Os componentes são arredondados individualmente em centavos (`HALF_UP`); valor final não positivo é recusado.

O cadastro não aceita status diferente de pendente e a atualização não permite transições de status. Movimentações de origem diferente de `MANUAL` ou com origem vinculada não podem ser editadas/excluídas pelo serviço de movimentações. A resposta expõe `origemTipo` e `origemId` para a interface indicar essa restrição. Compromissos liquidados exibem o valor da movimentação persistida, sem atualização de encargos pela data atual.

Os testes de integração cobrem saldos, relatórios, datas, restrições de edição/status, conferência divergente e propriedade dos compromissos. Os testes concorrentes usam transações independentes e duas threads para verificar pagamento e recebimento duplicados. O teste de data local do frontend é executado com `npm run test:datas` e cobre São Paulo, a virada do ano e um fuso à frente de UTC.

### Fontes de renda e parcelamentos

`FonteDeRenda` representa origem esperada de renda com tipo, valor esperado, periodicidade e dia previsto. `Parcelamento` agrupa `Parcela`, com número, quantidade, valor, vencimento, status e referências financeiras. A existência dessas entidades não significa que haja uma tela completa de parcelamentos.

## Relatórios e DRE por caixa

`RelatorioService`, `ResumoFinanceiroResponse` e `GET /api/relatorios/resumo` permanecem com o contrato e as consultas acumuladas existentes, consumidos pelo dashboard e por Relatórios. O componente de gráficos permanece em `/relatorios`, com `RELATORIOS_ROUTES`.

`DreService` usa uma consulta agregada independente em `MovimentacaoRepository`. A consulta recebe apenas o usuário autenticado e as datas, filtra `Movimentacao.data BETWEEN inicio AND fim` e agrupa por tipo, grupo e identificador/nome da categoria. Um `LEFT JOIN` explícito preserva movimentações sem categoria e restringe o vínculo à propriedade do usuário. O índice existente `(usuario_id, data)` atende ao filtro; não foi criado índice adicional sem evidência de plano de execução.

```http
GET /api/relatorios/dre?inicio=2026-09-01&fim=2026-09-30
```

As duas datas ISO são obrigatórias. Datas ausentes, inválidas ou período invertido retornam HTTP 400 com mensagem legível. A API não aceita identificação de outro usuário como fonte da consulta.

`DreResponse` contém `inicio`, `fim`, `regime: CAIXA`, `completo`, `linhas`, `pendencias` e `foraDre`. Cada linha contém código, descrição, tipo (`GRUPO` ou `SUBTOTAL`), valor e categorias com identificador, nome, tipo de movimentação e valor. `pendencias` e `foraDre` contêm `quantidade`, `receitas` e `despesas`, sem compensação entre tipos.

```text
Receita operacional
- Deduções da receita = Receita líquida
- Custos = Resultado bruto
- Despesas operacionais = Resultado operacional
+ Receitas financeiras
- Despesas financeiras = Resultado antes dos tributos sobre o lucro
- Tributos sobre o lucro = Resultado líquido gerencial
```

Todas as 12 linhas são retornadas, inclusive zeros. Grupos contêm magnitudes positivas; subtotais podem ser negativos. O frontend mostra sinais pelos códigos e não recalcula a apuração.

Cada movimento entra uma única vez em um grupo, nas pendências ou em `FORA_DRE`. Não classificados e exclusões intencionais não entram nos subtotais. `completo` é falso quando há pendências. Os testes reconciliam os grupos, as pendências e as exclusões com o total movimentado, separadamente por tipo.

O frontend tem modelos e serviço em `core/dre`, componente standalone em `features/dre` e rota lazy `/dre` na estrutura autenticada. Calcula datas iniciais no contexto local do navegador, usa parâmetros HTTP explícitos, cancelamento com `switchMap`, filtros aplicados por Consultar e estados de carregamento, vazio e erro. Alterar datas cancela a consulta e limpa o resultado anterior. O cadastro de categorias permite classificação compatível e avisa sobre o efeito retroativo.

## Evolução por competência

Ainda não implementada. Requer domínio próprio de reconhecimento (`LancamentoResultado`), data de competência explícita, classificação histórica, origem/componentes, chave de idempotência, estornos e vínculos transacionais com os fluxos financeiros. Vencimento ou data de pagamento não substituem reconhecimento. O plano detalhado está em `plano-implementacao-dre.md`.

Esta entrega mantém o cálculo de saldos, o cadastro e a efetivação de compromissos e movimentações. Não implementa estoque, processos fiscais ou contabilidade empresarial completa.
