CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    saldo_inicial NUMERIC(15, 2) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_contas_financeiras_saldo_inicial_valido CHECK (saldo_inicial >= 0)
);

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_categorias_usuario_nome_tipo UNIQUE (usuario_id, nome, tipo)
);

CREATE TABLE IF NOT EXISTS fontes_de_renda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor_esperado NUMERIC(15, 2),
    periodicidade VARCHAR(20),
    dia_previsto INTEGER,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_fontes_de_renda_valor_positivo CHECK (valor_esperado IS NULL OR valor_esperado > 0),
    CONSTRAINT ck_fontes_de_renda_dia_previsto CHECK (dia_previsto IS NULL OR dia_previsto BETWEEN 1 AND 31)
);

CREATE TABLE IF NOT EXISTS movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    data DATE NOT NULL,
    conta_financeira_id UUID NOT NULL REFERENCES contas_financeiras(id),
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    origem_tipo VARCHAR(30) NOT NULL,
    origem_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_movimentacoes_valor_positivo CHECK (valor > 0),
    CONSTRAINT uk_movimentacoes_origem UNIQUE (origem_tipo, origem_id)
);

CREATE TABLE IF NOT EXISTS contas_a_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id UUID NOT NULL REFERENCES contas_financeiras(id),
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    movimentacao_id UUID UNIQUE REFERENCES movimentacoes(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_contas_a_pagar_valor_positivo CHECK (valor > 0)
);

CREATE TABLE IF NOT EXISTS contas_a_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(160) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id UUID NOT NULL REFERENCES contas_financeiras(id),
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    fonte_de_renda_id UUID REFERENCES fontes_de_renda(id),
    movimentacao_id UUID UNIQUE REFERENCES movimentacoes(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_contas_a_receber_valor_positivo CHECK (valor > 0)
);

CREATE TABLE IF NOT EXISTS parcelamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao VARCHAR(160) NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL,
    quantidade_parcelas INTEGER NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_parcelamentos_valor_total_positivo CHECK (valor_total > 0),
    CONSTRAINT ck_parcelamentos_quantidade_valida CHECK (quantidade_parcelas > 1)
);

CREATE TABLE IF NOT EXISTS parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcelamento_id UUID NOT NULL REFERENCES parcelamentos(id),
    numero INTEGER NOT NULL,
    quantidade_total INTEGER NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    conta_financeira_id UUID NOT NULL REFERENCES contas_financeiras(id),
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    movimentacao_id UUID UNIQUE REFERENCES movimentacoes(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_parcela_numero_por_parcelamento UNIQUE (parcelamento_id, numero),
    CONSTRAINT ck_parcelas_valor_positivo CHECK (valor > 0),
    CONSTRAINT ck_parcelas_numero_valido CHECK (numero >= 1 AND numero <= quantidade_total)
);

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_usuario ON contas_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categorias_usuario ON categorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fontes_de_renda_usuario ON fontes_de_renda(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_data ON movimentacoes(usuario_id, data);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta ON movimentacoes(conta_financeira_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria ON movimentacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_a_pagar_usuario_vencimento ON contas_a_pagar(usuario_id, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_a_receber_usuario_vencimento ON contas_a_receber(usuario_id, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_usuario_vencimento ON parcelas(usuario_id, data_vencimento);
