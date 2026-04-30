# 🚀 Guia de Deployment - EditLabel Backend

## Opção 1: Railway (Recomendado)

### Passo 1: Criar Conta Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Crie um novo projeto

### Passo 2: Conectar Repositório
1. Selecione o repositório: `editlabelwork/-editlabel-backend`
2. Selecione branch: `main`
3. Railway fará deploy automático

### Passo 3: Configurar Variáveis de Ambiente
1. Vá para "Settings" > "Environment"
2. Adicione todas as variáveis do `.env`:
   - `PORT=3001`
   - `NODE_ENV=production`
   - `JWT_SECRET=...`
   - `DATABASE_URL=...`
   - etc.

### Passo 4: Adicionar PostgreSQL
1. Clique em "Add Service"
2. Selecione "PostgreSQL"
3. Railway criará banco automaticamente
4. Copie `DATABASE_URL` gerada
5. Execute schema.sql no banco

---

## Opção 2: Render

### Passo 1: Criar Conta Render
1. Acesse: https://render.com
2. Faça login com GitHub
3. Crie um novo "Web Service"

### Passo 2: Conectar Repositório
1. Selecione: `editlabelwork/-editlabel-backend`
2. Branch: `main`
3. Build command: `npm run build`
4. Start command: `npm start`

### Passo 3: Configurar Variáveis
1. Vá para "Environment"
2. Adicione todas as variáveis do `.env`

### Passo 4: Adicionar PostgreSQL
1. Crie um "PostgreSQL Database"
2. Copie connection string
3. Execute schema.sql

---

## Opção 3: Fly.io

### Passo 1: Instalar Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Passo 2: Fazer Login
```bash
flyctl auth login
```

### Passo 3: Criar App
```bash
cd /home/ubuntu/editlabel-backend-repo
flyctl launch
# Responda as perguntas:
# - App name: editlabel-backend
# - Region: gig (São Paulo)
# - Database: yes (PostgreSQL)
```

### Passo 4: Configurar Secrets
```bash
flyctl secrets set JWT_SECRET="seu_secret_aqui"
flyctl secrets set DATABASE_URL="postgresql://..."
# ... adicione outras variáveis
```

### Passo 5: Deploy
```bash
flyctl deploy
```

---

## Opção 4: Supabase Edge Functions (Serverless)

### Passo 1: Criar Projeto Supabase
1. Acesse: https://supabase.com
2. Crie novo projeto
3. Copie API URL e anon key

### Passo 2: Deploy com Supabase CLI
```bash
npm install -g supabase
supabase login
supabase functions deploy editlabel
```

---

## Verificar Deploy

```bash
# Testar health check
curl https://seu-app.com/health

# Testar autenticação
curl -X POST https://seu-app.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","nome":"Test","crf":"123","estado":"SP"}'
```

---

## Monitoramento

### Logs
```bash
# Railway
railway logs

# Render
render logs

# Fly.io
flyctl logs
```

### Métricas
- CPU Usage
- Memory Usage
- Request Rate
- Error Rate
- Response Time

---

## Troubleshooting

### Erro: "Cannot find module"
- Solução: Executar `npm install` antes de deploy

### Erro: "Database connection failed"
- Solução: Verificar DATABASE_URL em variáveis de ambiente

### Erro: "Port already in use"
- Solução: Usar porta 3001 (já configurada)

---

## Próximos Passos

1. Escolher plataforma de deploy
2. Criar conta e conectar repositório
3. Configurar variáveis de ambiente
4. Adicionar PostgreSQL
5. Executar schema.sql
6. Fazer deploy
7. Testar endpoints
8. Configurar domínio customizado (opcional)

