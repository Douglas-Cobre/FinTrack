ALTER TABLE categorias ADD COLUMN grupo_dre VARCHAR(40);

ALTER TABLE categorias ADD CONSTRAINT ck_categorias_grupo_dre CHECK (
    grupo_dre IS NULL
    OR grupo_dre = 'FORA_DRE'
    OR (tipo = 'RECEITA' AND grupo_dre IN ('RECEITA_OPERACIONAL', 'RECEITA_FINANCEIRA'))
    OR (tipo = 'DESPESA' AND grupo_dre IN (
        'DEDUCAO_RECEITA', 'CUSTO', 'DESPESA_OPERACIONAL', 'DESPESA_FINANCEIRA', 'TRIBUTO_SOBRE_LUCRO'
    ))
);
