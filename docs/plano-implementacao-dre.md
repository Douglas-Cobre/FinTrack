# Plano de implementação — Componente de DRE

## 1. Objetivo e escopo

Adicionar um componente independente de DRE ao FinTrack, preservando o componente de relatórios existente e o resumo consumido pelo dashboard.

Este documento especifica as modificações a executar. A criação deste plano não implementa as funcionalidades descritas.

A implementação será dividida em duas entregas:

1. **DRE gerencial por caixa:** organizar as movimentações efetivadas por período e grupos de resultado. É a primeira entrega proposta para o contexto de finanças pessoais do projeto.
2. **DRE por competência:** acrescentar registros próprios de reconhecimento de receitas e despesas, separados da liquidação financeira. Esta entrega exige as mudanças de domínio descritas na seção 10.

Na primeira entrega, a tela deve apresentar o título **DRE gerencial** e informar **Regime de caixa — valores recebidos e pagos no período**. Não apresentar essa apuração como uma demonstração contábil por competência.

### Funcionalidades existentes a preservar

- `RelatoriosComponent`, seus gráficos, tabelas e comportamento atual.
- Rota `/relatorios` e configuração de gráficos em `RELATORIOS_ROUTES`.
- Endpoint `GET /api/relatorios/resumo`, sem alterar sua resposta ou suas regras.
- `ResumoFinanceiro`, `ResumoFinanceiroResponse` e integração do dashboard.
- Cálculo do saldo das contas financeiras.
- Cadastro e efetivação de movimentações e compromissos na primeira entrega.

## 2. Navegação e experiência do usuário

Adicionar o item **DRE** no menu lateral, próximo de **Relatórios**, apontando para `/dre`.

```text
Dashboard
Contas financeiras
Movimentações
Categorias
Financeiro
Relatórios  → /relatorios, componente existente
DRE         → /dre, novo componente
```

O usuário continuará registrando entradas e saídas pelo fluxo atual. Para utilizar a DRE gerencial, precisará classificar suas categorias e selecionar o período de consulta.

### Comportamento do novo componente

- Abrir com o mês corrente, calculado no contexto local do usuário.
- Permitir intervalo de datas, com início e fim inclusivos.
- Aplicar os filtros por um botão **Consultar**.
- Exibir os grupos na ordem da apuração e destacar os subtotais.
- Permitir expandir um grupo para visualizar suas categorias.
- Exibir explicitamente o regime utilizado.
- Mostrar estados de carregamento, período vazio e erro com tentativa novamente.
- Avisar quando existirem valores sem classificação e indicar que o resultado está incompleto.
- Oferecer acesso ao cadastro de categorias para resolver a classificação.
- Manter a ordem contábil/gerencial das linhas; não permitir uma ordenação global que misture os subtotais.
- Garantir leitura em telas menores, com rolagem horizontal apenas quando necessária.

## 3. Classificação das categorias

### Arquivos a modificar

| Arquivo | Modificação |
| --- | --- |
| `backend/src/main/java/com/fintrack/categoria/domain/Categoria.java` | Acrescentar `grupoDre`, getter e suporte nos métodos de criação/atualização. |
| `backend/src/main/java/com/fintrack/categoria/dto/CategoriaRequest.java` | Acrescentar `grupoDre` opcional para compatibilidade com clientes existentes. |
| `backend/src/main/java/com/fintrack/categoria/dto/CategoriaResponse.java` | Retornar `grupoDre`. |
| `backend/src/main/java/com/fintrack/categoria/service/CategoriaService.java` | Persistir, validar e converter a classificação. |
| `frontend/src/app/core/categorias/categoria.models.ts` | Acrescentar o tipo `GrupoDre` e o campo nos contratos. |
| `frontend/src/app/features/categorias/categorias.component.ts` | Adicionar seletor de grupo e indicação de categorias não classificadas. |

Criar `backend/src/main/java/com/fintrack/categoria/domain/GrupoDre.java`:

| Grupo | Tipo compatível | Exemplo |
| --- | --- | --- |
| `RECEITA_OPERACIONAL` | `RECEITA` | Receita principal; salário na visão pessoal. |
| `DEDUCAO_RECEITA` | `DESPESA` | Devoluções ou deduções registradas como saída. |
| `CUSTO` | `DESPESA` | Custos diretamente associados à atividade. |
| `DESPESA_OPERACIONAL` | `DESPESA` | Despesas administrativas ou despesas pessoais agrupadas. |
| `RECEITA_FINANCEIRA` | `RECEITA` | Rendimentos financeiros. |
| `DESPESA_FINANCEIRA` | `DESPESA` | Juros e encargos financeiros. |
| `TRIBUTO_SOBRE_LUCRO` | `DESPESA` | Quando aplicável ao contexto empresarial. |
| `FORA_DRE` | Ambos | Principal de empréstimos, aportes ou outras operações sem efeito no resultado. |

### Regras

- Usar classificação explícita; não inferir o grupo pelo nome da categoria.
- Categoria sem grupo continua válida no sistema, mas gera pendência na DRE.
- Ao atualizar uma categoria sem enviar `grupoDre`, preservar a classificação existente. Para removê-la, enviar `grupoDre: null` explicitamente. Implementar a distinção entre campo ausente e nulo no contrato de atualização; um campo Java anulável isolado não distingue esses casos.
- Ao alterar o tipo da categoria, validar sua compatibilidade com o grupo selecionado.
- `FORA_DRE` significa exclusão intencional; não confundir com classificação ausente.
- Para a primeira entrega, a DRE utiliza a classificação atual da categoria. Reclassificar uma categoria modifica também a apresentação de períodos anteriores; informar esse efeito ao editar.
- Agrupar pelo identificador da categoria e pelo grupo, retornando o nome para apresentação.
- Preservar as validações de propriedade dos registros pelo usuário autenticado.

## 4. Banco de dados — primeira entrega

Criar uma migration nova, inicialmente prevista como:

```text
backend/src/main/resources/db/migration/V5__adicionar_grupo_dre_categorias.sql
```

Verificar a próxima versão livre no momento da implementação; atualmente o histórico vai até `V4`.

Modificações:

- Adicionar `categorias.grupo_dre` como `VARCHAR(40)` anulável.
- Acrescentar restrição para os valores aceitos e sua compatibilidade com `tipo`.
- Manter categorias existentes sem classificação até revisão pelo usuário.
- Não atribuir grupos retroativos automaticamente com base no nome.
- Não alterar migrations já existentes.

Já existe o índice `idx_movimentacoes_usuario_data`. Utilizá-lo para a consulta por usuário/período e avaliar novos índices apenas se o plano de execução justificar.

Não criar tabela de totais de DRE nesta entrega: os valores serão calculados a partir das movimentações.

## 5. Backend — novo endpoint e apuração

### Arquivos novos

```text
backend/src/main/java/com/fintrack/relatorio/
├── dto/
│   ├── DreResponse.java
│   ├── LinhaDreResponse.java
│   ├── CategoriaDreResponse.java
│   └── PendenciasDreResponse.java
└── service/
    └── DreService.java
```

### Arquivos a modificar

| Arquivo | Modificação |
| --- | --- |
| `backend/src/main/java/com/fintrack/relatorio/controller/RelatorioController.java` | Acrescentar a operação `/dre`, mantendo `/resumo`. |
| `backend/src/main/java/com/fintrack/movimentacao/repository/MovimentacaoRepository.java` | Acrescentar consulta específica por usuário, período, tipo, grupo e categoria. Preservar as consultas atuais. |

### Endpoint

```http
GET /api/relatorios/dre?inicio=2026-09-01&fim=2026-09-30
```

- Receber `inicio` e `fim` obrigatórios como datas ISO.
- Validar `inicio <= fim` e retornar erro `400` legível para parâmetros inválidos.
- Obter o usuário pela autenticação; não aceitar `usuarioId` do cliente.
- Filtrar por `Movimentacao.data` entre início e fim, incluindo os limites.
- Usar `LEFT JOIN` explícito com categoria para preservar movimentações sem categoria.
- Consultar apenas movimentações efetivadas; não somar compromissos pendentes.
- Usar `BigDecimal` na apuração e preservar a precisão monetária.
- Manter as consultas restritas ao usuário autenticado, inclusive detalhamento e pendências.

### Contrato de resposta

`DreResponse` deve conter:

| Campo | Conteúdo |
| --- | --- |
| `inicio`, `fim` | Período consultado. |
| `regime` | `CAIXA` na primeira entrega. |
| `completo` | Falso se houver movimentações sem classificação no período. |
| `linhas` | Grupos e subtotais na ordem definida. |
| `pendencias` | Quantidade e totais separados de receitas/despesas não classificadas. |
| `foraDre` | Totais separados de receitas/despesas excluídas intencionalmente. |

`LinhaDreResponse`: `codigo`, `descricao`, `tipo` (`GRUPO` ou `SUBTOTAL`), `valor` e `categorias`.

`CategoriaDreResponse`: `categoriaId`, `categoriaNome`, `tipoMovimentacao` e `valor`.

Convenção: valores de grupos são magnitudes positivas; a fórmula define se serão somados ou subtraídos. Subtotais podem ser negativos. A tela utiliza o código/tipo da linha para exibir sinais, sem recalcular a apuração.

### Ordem e fórmulas

```text
Receita operacional
(-) Deduções da receita
(=) Receita líquida
(-) Custos
(=) Resultado bruto
(-) Despesas operacionais
(=) Resultado operacional
(+) Receitas financeiras
(-) Despesas financeiras
(=) Resultado antes dos tributos sobre o lucro
(-) Tributos sobre o lucro
(=) Resultado líquido gerencial
```

- Retornar todas as linhas, inclusive grupos com valor zero.
- Excluir `FORA_DRE` dos subtotais e apresentar seus totais separadamente.
- Excluir não classificados dos subtotais, apresentando pendências e o aviso de resultado incompleto.
- Não fazer compensação entre receitas e despesas nas pendências.
- Cada movimentação deve pertencer a um único grupo, a `FORA_DRE` ou às pendências.
- Conferir que totais classificados + fora da DRE + não classificados correspondam ao total movimentado no período, separadamente por tipo.

### Limitação da primeira entrega

Hoje, a efetivação de compromissos incorpora juros, multas e descontos ao valor de uma movimentação única. A DRE por caixa usará a categoria dessa movimentação para classificar o valor inteiro. Exibir essa limitação na documentação da funcionalidade; a separação dos componentes faz parte da evolução por competência.

## 6. Frontend — componente independente

### Arquivos novos

```text
frontend/src/app/
├── core/dre/
│   ├── dre.models.ts
│   └── dre.service.ts
└── features/dre/
    ├── dre.component.ts
    ├── dre.component.html
    ├── dre.component.scss
    └── dre.routes.ts
```

- Criar `DreComponent` standalone usando `FeatureShellComponent`.
- Criar `DreService` com `consultar(inicio, fim)` e parâmetros HTTP explícitos.
- Definir os tipos TypeScript correspondentes ao contrato da API.
- Utilizar Angular Material já disponível para filtros, botões, tabela e indicadores.
- Formatar moeda como BRL e datas conforme o padrão usado no projeto.
- Calcular o mês inicial no contexto local; evitar `toISOString()` para derivar datas locais que possam mudar de dia em UTC.
- Ao mudar o período, evitar que uma resposta antiga substitua uma consulta mais recente; utilizar cancelamento com `switchMap` ou mecanismo equivalente.
- Em erro de consulta, não apresentar dados de outro período como se fossem do filtro atual.
- Exibir as fórmulas por linhas e manter subtotal visualmente distinto dos detalhes.

### Arquivos a modificar

| Arquivo | Modificação |
| --- | --- |
| `frontend/src/app/app.routes.ts` | Adicionar rota filha `dre` com carregamento de `DRE_ROUTES`, dentro da estrutura protegida existente. |
| `frontend/src/app/features/dashboard/dashboard-placeholder.component.ts` | Acrescentar o link DRE ao menu lateral. |

Não é necessário modificar `relatorios.component.ts`, `relatorios.routes.ts`, `relatorio.service.ts` ou `relatorio.models.ts` para adicionar a nova tela.

## 7. Critérios de aceitação — primeira entrega

- [ ] Relatórios continuam acessíveis em `/relatorios`, com os gráficos e tabelas existentes.
- [ ] O dashboard continua utilizando o mesmo resumo financeiro.
- [ ] DRE possui componente, rota `/dre` e item de menu próprios.
- [ ] A tela identifica explicitamente o regime de caixa.
- [ ] O usuário consegue consultar mês ou intervalo de datas.
- [ ] O backend inclui movimentações das duas datas-limite e exclui as demais.
- [ ] Grupos e subtotais aparecem na ordem definida, inclusive com valores zero.
- [ ] Categorias podem ser classificadas, com validação entre grupo e tipo.
- [ ] Categorias legadas e movimentações sem categoria geram pendências visíveis.
- [ ] `FORA_DRE` é excluído dos subtotais e permanece rastreável na resposta.
- [ ] Os totais reconciliam com as movimentações do período.
- [ ] Compromissos pendentes não são somados.
- [ ] Consultas não expõem registros de outro usuário.
- [ ] Estados vazio, carregamento, erro e resultado incompleto estão implementados.

## 8. Verificação da implementação

Criar testes de backend para as regras de negócio, não para detalhes visuais:

- Fórmulas com receitas, deduções, custos, despesas financeiras e resultado negativo.
- Período sem movimentações e inclusão das datas-limite.
- Consulta com categoria nula, grupo nulo e `FORA_DRE`.
- Reconciliação dos totais por tipo, sem omissões ou duplicidades.
- Restrição ao usuário autenticado.
- Rejeição de período inválido e classificação incompatível.
- Atualização de categoria diferenciando campo ausente de remoção explícita.
- Preservação do contrato e dos totais do endpoint `/resumo`.

Executar os testes do backend com o Maven disponível no projeto e o build do frontend com `npm run build` no diretório `frontend`.

Verificar manualmente navegação, filtros, expansão dos grupos, estados de erro e visualização em tela menor. O `package.json` tem script `test`, mas a infraestrutura de testes do frontend deve ser conferida antes de assumir que já está configurada.

## 9. Ordem de execução — primeira entrega

1. Criar enum, migration e suporte à classificação no backend.
2. Atualizar contratos e formulário de categorias.
3. Implementar consulta por período, DTOs, apuração e endpoint de DRE.
4. Validar fórmulas, pendências, reconciliação e isolamento por usuário.
5. Criar o novo componente, serviço e modelos do frontend.
6. Adicionar rota e item de menu.
7. Executar verificações e confirmar que relatórios/dashboard mantêm o comportamento.
8. Atualizar `docs/menus-e-funcionalidades.md` e `docs/arquitetura-e-dominio.md` conforme o estado efetivamente entregue. Esses documentos têm trechos desatualizados em relação ao código atual.

## 10. Segunda entrega — evolução para competência

Esta etapa reutiliza o componente DRE e acrescenta uma fonte de apuração por reconhecimento. Não basta usar vencimento de compromisso como competência, nem adicionar uma data às movimentações já pagas.

### Nova estrutura de domínio

```text
backend/src/main/java/com/fintrack/resultado/
├── domain/
│   ├── LancamentoResultado.java
│   └── OrigemLancamentoResultado.java
├── dto/
│   ├── LancamentoResultadoRequest.java
│   └── LancamentoResultadoResponse.java
├── repository/LancamentoResultadoRepository.java
├── service/LancamentoResultadoService.java
└── controller/LancamentoResultadoController.java
```

`LancamentoResultado` deve conter:

- Identificador e usuário proprietário.
- Descrição e valor monetário positivo.
- Tipo de receita/despesa e data de competência.
- Categoria e grupo registrados no momento do reconhecimento, para estabilidade histórica.
- Origem identificável, componente (principal, juros, multa, desconto ou ajuste) e chave de idempotência.
- Referência ao lançamento original quando for estorno; estornos revertem o efeito original e não usam valor monetário negativo.
- Datas de criação/alteração para rastreabilidade.

Criar migration nova para a tabela, chaves estrangeiras, restrições e índice por `(usuario_id, data_competencia)`. A chave de idempotência deve permitir múltiplos componentes de um mesmo compromisso e impedir a duplicação de cada reconhecimento.

### Mudanças nos fluxos existentes

| Fluxo | Modificação |
| --- | --- |
| Cadastro de compromisso previsto | Manter a previsão sem reconhecer resultado automaticamente. |
| Reconhecimento de compromisso | Adicionar ação explícita com competência e gerar o lançamento de resultado vinculado. |
| Pagamento/recebimento | Manter a movimentação financeira, sem reconhecer novamente o principal já reconhecido. |
| Movimentação manual | Permitir reconhecimento associado com competência explícita, evitando gerar resultado em duplicidade. |
| Juros, multas e descontos | Separar componentes e definir sua classificação/data de reconhecimento. |
| Correção/cancelamento | Distinguir cancelamento da previsão, reversão da liquidação e estorno do resultado; cada ação tem efeitos próprios. |
| Ajustes sem caixa | Permitir reconhecimento de despesas/receitas aplicáveis, como depreciação, sem alterar o saldo bancário. |

Modificar entidades, DTOs, serviços e formulários de `ContaAPagar`, `ContaAReceber` e movimentações para suportar esses vínculos e ações. As operações associadas devem ser transacionais e validar a propriedade de todos os registros relacionados.

Na tela `Financeiro`, oferecer o reconhecimento como ação adicional. Na DRE, disponibilizar o cadastro de ajustes de resultado sem exigir um novo item no menu principal.

### API e componente DRE

- Acrescentar `regime=CAIXA|COMPETENCIA` ao endpoint, mantendo `CAIXA` como padrão para compatibilidade.
- No regime de competência, consultar exclusivamente os lançamentos de resultado por `dataCompetencia`; não somar compromissos e movimentações como fontes adicionais.
- Manter a estrutura de grupos/subtotais e acrescentar o seletor de regime no componente.
- Definir deduções e tributos conforme o contexto do usuário, sem aplicar regras empresariais automaticamente às finanças pessoais.
- Documentar que a inclusão de competência, por si só, não implementa todos os processos de uma contabilidade empresarial, como estoque e apuração fiscal.

### Histórico e verificação

- Não preencher competência retroativa com a data de pagamento sem revisão explícita.
- Permitir revisão/importação do histórico com origem rastreável e prevenção de duplicidade.
- Distinguir ausência de reconhecimento de um resultado realmente igual a zero.
- Testar despesa de setembro paga em outubro: resultado de setembro por competência e saída de outubro por caixa.
- Testar que pagamentos, recebimentos e reenvio da mesma ação não duplicam o resultado.
- Testar estornos, componentes financeiros e preservação da classificação histórica.

Referência conceitual para competência: [CPC 26, itens 27–28](https://www.cpc.org.br/Arquivos/Documentos/312_CPC_26_R1_rev%2023.pdf).

## 11. Itens posteriores

Comparação entre meses, análise percentual, exportação PDF/Excel, gráfico de evolução e plano de contas personalizável podem ser entregues depois. Não são requisitos para disponibilizar o componente inicial.
