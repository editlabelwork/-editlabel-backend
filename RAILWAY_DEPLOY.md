# 🚀 Deploy EditLabel no Railway

## 1. Criar Conta Railway

1. Acesse https://railway.app
2. Faça login com GitHub (editlabelwork)
3. Crie novo projeto

---

## 2. Conectar GitHub

1. Clique em "New Project"
2. Selecione "Deploy from GitHub"
3. Conecte o repositório: `editlabelwork/-editlabel-backend`
4. Selecione branch: `main`

---

## 3. Adicionar PostgreSQL

1. No Railway dashboard, clique em "Add Service"
2. Selecione "PostgreSQL"
3. Configure:
   - Database: `editlabel`
   - Username: `postgres`
   - Password: (gerado automaticamente)

---

## 4. Configurar Variáveis de Ambiente

No Railway, vá para "Variables" e adicione:

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=editlabel_jwt_secret_super_seguro_2026_producao_123456789

# PostgreSQL (Railway fornece automaticamente)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Supabase (opcional, para backup)
SUPABASE_URL=https://exzykikhenrcluinjlna.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
ALLOWED_ORIGINS=https://editlabel-app.vercel.app,https://editlabel.com.br

# Segurança
BCRYPT_ROUNDS=12
SESSION_SECRET=editlabel_session_secret_super_seguro_2026_producao_123456789

# Logging
LOG_LEVEL=info
```

---

## 5. Executar Migrations

1. Acesse o PostgreSQL no Railway
2. Execute o schema SQL:

```bash
psql $DATABASE_URL < schema.sql
```

Ou via Railway CLI:

```bash
railway run psql -f schema.sql
```

---

## 6. Deploy

1. Railway detecta mudanças no GitHub automaticamente
2. Ou clique em "Deploy" manualmente
3. Aguarde o build e deploy completarem

---

## 7. Verificar Deploy

```bash
# Testar endpoint
curl https://seu-app-railway.up.railway.app/health

# Testar login
curl -X POST https://seu-app-railway.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"marco@example.com","password":"TestPassword123!"}'
```

---

## 8. Configurar Domínio Customizado

1. No Railway, vá para "Settings"
2. Clique em "Add Domain"
3. Configure seu domínio: `api.editlabel.com.br`

---

## Checklist de Deploy

- [ ] Repositório conectado ao Railway
- [ ] PostgreSQL criado e configurado
- [ ] Variáveis de ambiente definidas
- [ ] Schema SQL executado
- [ ] Build passou sem erros
- [ ] Endpoints respondendo
- [ ] Domínio customizado configurado
- [ ] SSL/TLS ativado
- [ ] Backups configurados
- [ ] Monitoramento ativado

---

## Troubleshooting

### Erro: "Cannot find module"
- Solução: Certifique-se de que `npm install` foi executado

### Erro: "Connection refused"
- Solução: Verifique se DATABASE_URL está correto

### Erro: "CORS error"
- Solução: Adicione seu domínio em ALLOWED_ORIGINS

---

## Próximos Passos

1. ✅ Deploy backend no Railway
2. ⏳ Integrar frontend com backend real
3. ⏳ Configurar CI/CD
4. ⏳ Ativar monitoramento (Sentry)
5. ⏳ Configurar alertas
