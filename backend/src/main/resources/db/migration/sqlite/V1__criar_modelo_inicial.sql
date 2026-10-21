CREATE TABLE usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE contas_financeiras (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    saldo_inicial NUMERIC(15, 2) NOT NULL CHECK (saldo_inicial >= 0),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE categorias (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    grupo_dre VARCHAR(40) CHECK (
        grupo_dre IS NULL OR grupo_dre = 'FORA_DRE'
        OR (tipo = 'RECEITA' AND grupo_dre IN ('RECEITA_OPERACIONAL', 'RECEITA_FINANCEIRA'))
        OR (tipo = 'DESPESA' AND grupo_dre IN (
            'DEDUCAO_RECEITA', 'CUSTO', 'DESPESA_OPERACIONAL', 'DESPESA_FINANCEIRA', 'TRIBUTO_SOBRE_LUCRO'
        ))
    ),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_categorias_usuario_nome_tipo UNIQUE (usuario_id, nome, tipo)
);

CREATE TABLE fontes_de_renda (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor_esperado NUMERIC(15, 2) CHECK (valor_esperado IS NULL OR valor_esperado > 0),
    periodicidade VARCHAR(20),
    dia_previsto INTEGER CHECK (dia_previsto IS NULL OR dia_previsto BETWEEN 1 AND 31),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE movimentacoes (
    id VARCHAR(36) PRIMARY KEY,
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(20) NOT NULL,
    data DATE NOT NULL,
    conta_financeira_id VARCHAR(36) NOT NULL REFERENCES contas_financeiras(id),
    categoria_id VARCHAR(36) REFERENCES categorias(id),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    origem_tipo VARCHAR(30) NOT NULL,
    origem_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_movimentacoes_origem UNIQUE (origem_tipo, origem_id)
);

CREATE TABLE contas_a_pagar (
    id VARCHAR(36) PRIMARY KEY,
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id VARCHAR(36) NOT NULL REFERENCES contas_financeiras(id),
    categoria_id VARCHAR(36) NOT NULL REFERENCES categorias(id),
    movimentacao_id VARCHAR(36) UNIQUE REFERENCES movimentacoes(id),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (multa_percentual >= 0),
    juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (juros_dia_percentual >= 0),
    desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (desconto_percentual BETWEEN 0 AND 100),
    desconto_dias_antes INTEGER NOT NULL DEFAULT 0 CHECK (desconto_dias_antes >= 0),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE contas_a_receber (
    id VARCHAR(36) PRIMARY KEY,
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id VARCHAR(36) NOT NULL REFERENCES contas_financeiras(id),
    categoria_id VARCHAR(36) NOT NULL REFERENCES categorias(id),
    fonte_de_renda_id VARCHAR(36) REFERENCES fontes_de_renda(id),
    movimentacao_id VARCHAR(36) UNIQUE REFERENCES movimentacoes(id),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (multa_percentual >= 0),
    juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (juros_dia_percentual >= 0),
    desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (desconto_percentual BETWEEN 0 AND 100),
    desconto_dias_antes INTEGER NOT NULL DEFAULT 0 CHECK (desconto_dias_antes >= 0),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE configuracoes_financeiras (
    id VARCHAR(36) PRIMARY KEY,
    multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 2 CHECK (multa_percentual >= 0),
    juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0.03 CHECK (juros_dia_percentual >= 0),
    desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0 CHECK (desconto_percentual BETWEEN 0 AND 100),
    desconto_dias_antes INTEGER NOT NULL DEFAULT 0 CHECK (desconto_dias_antes >= 0),
    usuario_id VARCHAR(36) NOT NULL UNIQUE REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE parcelamentos (
    id VARCHAR(36) PRIMARY KEY,
    descricao VARCHAR(160) NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total > 0),
    quantidade_parcelas INTEGER NOT NULL CHECK (quantidade_parcelas > 1),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE parcelas (
    id VARCHAR(36) PRIMARY KEY,
    parcelamento_id VARCHAR(36) NOT NULL REFERENCES parcelamentos(id),
    numero INTEGER NOT NULL,
    quantidade_total INTEGER NOT NULL,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id VARCHAR(36) NOT NULL REFERENCES contas_financeiras(id),
    categoria_id VARCHAR(36) NOT NULL REFERENCES categorias(id),
    movimentacao_id VARCHAR(36) UNIQUE REFERENCES movimentacoes(id),
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_parcela_numero_por_parcelamento UNIQUE (parcelamento_id, numero),
    CONSTRAINT ck_parcelas_numero_valido CHECK (numero >= 1 AND numero <= quantidade_total)
);

CREATE INDEX idx_contas_financeiras_usuario ON contas_financeiras(usuario_id);
CREATE INDEX idx_categorias_usuario ON categorias(usuario_id);
CREATE INDEX idx_fontes_de_renda_usuario ON fontes_de_renda(usuario_id);
CREATE INDEX idx_movimentacoes_usuario_data ON movimentacoes(usuario_id, data);
CREATE INDEX idx_movimentacoes_conta ON movimentacoes(conta_financeira_id);
CREATE INDEX idx_movimentacoes_categoria ON movimentacoes(categoria_id);
CREATE INDEX idx_contas_a_pagar_usuario_vencimento ON contas_a_pagar(usuario_id, data_vencimento);
CREATE INDEX idx_contas_a_receber_usuario_vencimento ON contas_a_receber(usuario_id, data_vencimento);
CREATE INDEX idx_parcelas_usuario_vencimento ON parcelas(usuario_id, data_vencimento);
