-- ============================================
-- EDITLABEL - SCHEMA PostgreSQL
-- ============================================

-- ============================================
-- 1. TABELA DE USUÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  crf VARCHAR(50) NOT NULL UNIQUE,
  estado VARCHAR(2) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'farmaceutico')),
  
  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  backup_codes TEXT[], -- Array de códigos de backup
  
  -- LGPD
  consentimento_lgpd BOOLEAN DEFAULT FALSE,
  data_consentimento TIMESTAMP,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Índices
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_crf ON users(crf);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. TABELA DE INDÚSTRIAS
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  
  -- Endereço
  endereco_rua VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado VARCHAR(2),
  endereco_cep VARCHAR(10),
  
  -- Contato
  contato_nome VARCHAR(255),
  contato_email VARCHAR(255),
  contato_telefone VARCHAR(20),
  contato_whatsapp VARCHAR(20),
  
  site VARCHAR(255),
  observacoes TEXT,
  
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industries_user_id ON industries(user_id);
CREATE INDEX idx_industries_cnpj ON industries(cnpj);
CREATE INDEX idx_industries_status ON industries(status);

-- ============================================
-- 3. TABELA DE RÓTULOS
-- ============================================
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informações do Produto
  nome_produto VARCHAR(255) NOT NULL,
  tipo_suplemento VARCHAR(50) NOT NULL,
  sabor VARCHAR(100),
  apresentacao VARCHAR(100),
  
  -- Peso/Volume
  qty_porcoes INTEGER,
  peso_porcao DECIMAL(10, 2),
  unidade_peso VARCHAR(10),
  peso_liquido DECIMAL(10, 2),
  unidade_peso_liquido VARCHAR(10),
  
  -- Código de Barras
  codigo_barras VARCHAR(13) UNIQUE,
  
  -- Informações Técnicas
  ingredientes TEXT,
  sugestao_uso TEXT,
  conservacao TEXT,
  grupo_populacional VARCHAR(50),
  
  -- Alergênicos (JSON Array)
  alergênicos JSONB DEFAULT '[]',
  contem_gluten BOOLEAN DEFAULT FALSE,
  
  -- Advertências
  advertências JSONB DEFAULT '[]',
  
  -- Dispensado de Registro
  dispensado_registro BOOLEAN DEFAULT FALSE,
  texto_dispensado TEXT,
  
  -- Fabricante
  fabricante_razao_social VARCHAR(255),
  fabricante_cnpj VARCHAR(18),
  fabricante_endereco_rua VARCHAR(255),
  fabricante_endereco_numero VARCHAR(20),
  fabricante_endereco_bairro VARCHAR(100),
  fabricante_endereco_cidade VARCHAR(100),
  fabricante_endereco_estado VARCHAR(2),
  fabricante_endereco_cep VARCHAR(10),
  fabricante_site VARCHAR(255),
  fabricante_sac VARCHAR(20),
  fabricante_email VARCHAR(255),
  
  -- Distribuidor
  distribuidor_razao_social VARCHAR(255),
  distribuidor_cnpj VARCHAR(18),
  
  -- Farmacêutico Responsável
  farmaceutico_nome VARCHAR(255),
  farmaceutico_crf VARCHAR(50),
  farmaceutico_estado VARCHAR(2),
  
  -- Designer
  designer_email VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'em_andamento' CHECK (status IN (
    'em_andamento', 'alteracao', 'enviado_industria', 'finalizado'
  )),
  
  prazo DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_labels_industry_id ON labels(industry_id);
CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_labels_status ON labels(status);
CREATE INDEX idx_labels_codigo_barras ON labels(codigo_barras);

-- ============================================
-- 4. TABELA DE TABELA NUTRICIONAL
-- ============================================
CREATE TABLE IF NOT EXISTS nutritional_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  
  nutriente VARCHAR(100) NOT NULL,
  por_100g DECIMAL(10, 2),
  por_porcao DECIMAL(10, 2),
  vd_percentual DECIMAL(5, 2),
  unidade VARCHAR(10),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nutritional_tables_label_id ON nutritional_tables(label_id);

-- ============================================
-- 5. TABELA DE AUDITORIA
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'
  )),
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE')),
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 6. TABELA DE CONSENTIMENTO LGPD
-- ============================================
CREATE TABLE IF NOT EXISTS lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  consentido BOOLEAN NOT NULL DEFAULT FALSE,
  data_consentimento TIMESTAMP NOT NULL,
  versao_politica VARCHAR(20),
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lgpd_consents_user_id ON lgpd_consents(user_id);

-- ============================================
-- 7. TABELA DE SOLICITAÇÕES LGPD
-- ============================================
CREATE TABLE IF NOT EXISTS lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  tipo_solicitacao VARCHAR(50) NOT NULL CHECK (tipo_solicitacao IN (
    'access', 'correction', 'deletion', 'portability', 'objection', 'revoke_consent'
  )),
  
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'rejeitado')),
  
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_processamento TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lgpd_requests_user_id ON lgpd_requests(user_id);
CREATE INDEX idx_lgpd_requests_status ON lgpd_requests(status);

-- ============================================
-- 8. TABELA DE TOKENS DE REFRESH
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- 9. TABELA DE ANEXOS
-- ============================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  
  nome_arquivo VARCHAR(255) NOT NULL,
  tipo_arquivo VARCHAR(50),
  caminho_arquivo VARCHAR(500) NOT NULL,
  tamanho_bytes BIGINT,
  
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_label_id ON attachments(label_id);

-- ============================================
-- 10. TABELA DE HISTÓRICO DE VERSÕES
-- ============================================
CREATE TABLE IF NOT EXISTS label_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  
  versao INTEGER NOT NULL,
  conteudo JSONB NOT NULL,
  
  criado_por UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_label_revisions_label_id ON label_revisions(label_id);
CREATE INDEX idx_label_revisions_versao ON label_revisions(label_id, versao);

-- ============================================
-- 11. TABELA DE CONFORMIDADE ANVISA
-- ============================================
CREATE TABLE IF NOT EXISTS anvisa_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  
  rdc_429_valido BOOLEAN,
  rdc_429_erros JSONB,
  
  rdc_26_valido BOOLEAN,
  rdc_26_erros JSONB,
  
  advertencias_validas BOOLEAN,
  advertencias_erros JSONB,
  
  conformidade_geral BOOLEAN,
  relatorio TEXT,
  
  verificado_em TIMESTAMP,
  verificado_por UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_anvisa_compliance_label_id ON anvisa_compliance(label_id);
CREATE INDEX idx_anvisa_compliance_conformidade_geral ON anvisa_compliance(conformidade_geral);

-- ============================================
-- TRIGGERS
-- ============================================

-- Atualiza updated_at em users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Atualiza updated_at em industries
CREATE OR REPLACE FUNCTION update_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_industries_updated_at
BEFORE UPDATE ON industries
FOR EACH ROW
EXECUTE FUNCTION update_industries_updated_at();

-- Atualiza updated_at em labels
CREATE OR REPLACE FUNCTION update_labels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_labels_updated_at
BEFORE UPDATE ON labels
FOR EACH ROW
EXECUTE FUNCTION update_labels_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- View de usuários ativos
CREATE OR REPLACE VIEW active_users AS
SELECT id, nome, email, role, created_at
FROM users
WHERE ativo = TRUE;

-- View de rótulos por status
CREATE OR REPLACE VIEW labels_by_status AS
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as finalizados
FROM labels
GROUP BY status;

-- View de conformidade geral
CREATE OR REPLACE VIEW compliance_overview AS
SELECT 
  COUNT(DISTINCT l.id) as total_labels,
  COUNT(DISTINCT CASE WHEN ac.conformidade_geral = TRUE THEN l.id END) as conforme,
  COUNT(DISTINCT CASE WHEN ac.conformidade_geral = FALSE THEN l.id END) as nao_conforme,
  ROUND(
    COUNT(DISTINCT CASE WHEN ac.conformidade_geral = TRUE THEN l.id END)::NUMERIC / 
    COUNT(DISTINCT l.id) * 100, 2
  ) as percentual_conformidade
FROM labels l
LEFT JOIN anvisa_compliance ac ON l.id = ac.label_id;

-- ============================================
-- PERMISSÕES
-- ============================================

-- Criar role para aplicação
CREATE ROLE editlabel_app WITH LOGIN PASSWORD 'change_me_in_production';

-- Dar permissões básicas
GRANT CONNECT ON DATABASE editlabel TO editlabel_app;
GRANT USAGE ON SCHEMA public TO editlabel_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO editlabel_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO editlabel_app;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE users IS 'Usuários do sistema EditLabel';
COMMENT ON TABLE industries IS 'Indústrias/Empresas cadastradas';
COMMENT ON TABLE labels IS 'Rótulos de produtos';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para conformidade LGPD';
COMMENT ON TABLE lgpd_consents IS 'Consentimentos LGPD dos usuários';
COMMENT ON TABLE anvisa_compliance IS 'Validação de conformidade ANVISA';
