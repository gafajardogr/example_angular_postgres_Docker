CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_config (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    master_password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_pagina TEXT NOT NULL,
    url TEXT,
    aplicacion TEXT,
    usuario TEXT NOT NULL,
    password TEXT NOT NULL,
    puerto INTEGER CHECK (puerto IS NULL OR (puerto BETWEEN 1 AND 65535)),
    base_datos TEXT,
    otros_atributos JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(otros_atributos) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credentials_nombre_pagina_idx
    ON credentials (lower(nombre_pagina));
CREATE INDEX IF NOT EXISTS credentials_updated_at_idx
    ON credentials (updated_at DESC);
