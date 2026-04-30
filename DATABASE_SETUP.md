# 🗄️ Configuração do PostgreSQL - EditLabel

## Opção 1: Supabase (Recomendado - Gratuito)

### Passo 1: Criar Conta Supabase
1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com Google (editlabel.work@gmail.com)
4. Crie uma nova organização: "EditLabel"
5. Crie um novo projeto: "editlabel-db"

### Passo 2: Obter Connection String
1. No dashboard Supabase, vá para "Settings" > "Database"
2. Copie a "Connection string" (URI)
3. Formato: `postgresql://user:password@host:5432/postgres`

### Passo 3: Configurar .env
```bash
DATABASE_URL=postgresql://user:password@host:5432/postgres
DB_HOST=host
DB_PORT=5432
DB_NAME=postgres
DB_USER=user
DB_PASSWORD=password
```

### Passo 4: Executar Schema
```bash
cd /home/ubuntu/editlabel-backend-repo
psql $DATABASE_URL < src/database/schema.sql
```

---

## Opção 2: PostgreSQL Local (Desenvolvimento)

### Passo 1: Instalar PostgreSQL
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### Passo 2: Criar Banco de Dados
```bash
sudo -u postgres psql
CREATE DATABASE editlabel;
CREATE USER editlabel_user WITH PASSWORD 'senha_super_segura';
ALTER ROLE editlabel_user SET client_encoding TO 'utf8';
ALTER ROLE editlabel_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE editlabel_user SET default_transaction_deferrable TO on;
ALTER ROLE editlabel_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE editlabel TO editlabel_user;
\q
```

### Passo 3: Executar Schema
```bash
psql -U editlabel_user -d editlabel < src/database/schema.sql
```

### Passo 4: Configurar .env
```bash
DATABASE_URL=postgresql://editlabel_user:senha_super_segura@localhost:5432/editlabel
DB_HOST=localhost
DB_PORT=5432
DB_NAME=editlabel
DB_USER=editlabel_user
DB_PASSWORD=senha_super_segura
```

---

## Verificar Conexão

```bash
# Testar conexão
psql $DATABASE_URL -c "SELECT version();"

# Verificar tabelas criadas
psql $DATABASE_URL -c "\dt"

# Verificar schema
psql $DATABASE_URL -c "\d users"
```

---

## Schema Criado

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `labels` | Rótulos de suplementos |
| `audit_logs` | Logs de auditoria |
| `consents` | Consentimentos LGPD |
| `compliance_reports` | Relatórios de conformidade |

---

## Próximos Passos

1. Criar banco de dados (Supabase ou local)
2. Executar schema.sql
3. Atualizar DATABASE_URL em .env
4. Testar conexão
5. Integrar com backend
