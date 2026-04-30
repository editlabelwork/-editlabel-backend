# 🚀 GUIA DE DEPLOYMENT - EDITLABEL

## 📋 PRÉ-REQUISITOS

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn
- Conta no Railway.com ou Render.com
- Conta no Vercel (para frontend)

---

## 🔧 CONFIGURAÇÃO LOCAL

### 1. Clonar Repositório

```bash
git clone https://github.com/editlabelwork/editlabel-backend.git
cd editlabel-backend
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas configurações:

```env
# Servidor
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
JWT_REFRESH_EXPIRATION=7d

# 2FA
TOTP_WINDOW=1

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/editlabel
DB_HOST=localhost
DB_PORT=5432
DB_NAME=editlabel
DB_USER=editlabel_user
DB_PASSWORD=senha_super_segura

# Criptografia
ENCRYPTION_KEY=sua_chave_de_32_caracteres_aqui
ENCRYPTION_ALGORITHM=aes-256-cbc

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://editlabel-app.vercel.app

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Segurança
PASSWORD_MIN_LENGTH=12
BCRYPT_ROUNDS=12

# ANVISA
ANVISA_API_URL=https://api.anvisa.gov.br
ANVISA_API_KEY=sua_chave_api

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=editlabel-uploads

# Monitoramento
SENTRY_DSN=https://seu_sentry_dsn
LOG_LEVEL=info
```

### 4. Criar Banco de Dados

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

### 5. Compilar TypeScript

```bash
npm run build
```

### 6. Iniciar Servidor Local

```bash
npm run dev
```

Servidor rodará em: `http://localhost:3001`

---

## 🚀 DEPLOYMENT NO RAILWAY

### 1. Criar Conta no Railway

Acesse: https://railway.app

### 2. Conectar GitHub

1. Clique em "New Project"
2. Selecione "Deploy from GitHub"
3. Autorize Railway a acessar seu GitHub
4. Selecione o repositório `editlabel-backend`

### 3. Configurar PostgreSQL

1. Clique em "Add Service"
2. Selecione "PostgreSQL"
3. Configure:
   - Database: `editlabel`
   - User: `editlabel_user`
   - Password: (gerado automaticamente)

### 4. Configurar Variáveis de Ambiente

No Railway, adicione as variáveis de ambiente:

```
DATABASE_URL=postgresql://...
JWT_SECRET=seu_secret
JWT_REFRESH_SECRET=seu_refresh_secret
ENCRYPTION_KEY=sua_chave
ALLOWED_ORIGINS=https://editlabel-app.vercel.app
```

### 5. Deploy Automático

Railway fará deploy automaticamente quando você fazer push para a branch principal.

---

## 🚀 DEPLOYMENT NO RENDER

### 1. Criar Conta no Render

Acesse: https://render.com

### 2. Conectar GitHub

1. Clique em "New Web Service"
2. Selecione "Deploy from GitHub"
3. Autorize Render a acessar seu GitHub
4. Selecione o repositório `editlabel-backend`

### 3. Configurar Serviço

1. **Name**: `editlabel-backend`
2. **Environment**: `Node`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm run start`
5. **Plan**: Free ou Paid

### 4. Adicionar PostgreSQL

1. Clique em "Add Service"
2. Selecione "PostgreSQL"
3. Configure banco de dados

### 5. Configurar Variáveis de Ambiente

Adicione as mesmas variáveis que no Railway.

### 6. Deploy

Clique em "Create Web Service" para fazer o deploy.

---

## 🌐 DEPLOYMENT DO FRONTEND NO VERCEL

### 1. Conectar GitHub

1. Acesse: https://vercel.com
2. Clique em "Import Project"
3. Selecione o repositório `editlabel-frontend`

### 2. Configurar Variáveis de Ambiente

Adicione:

```
VITE_API_URL=https://seu-backend.railway.app
VITE_API_URL=https://seu-backend.onrender.com
```

### 3. Deploy

Vercel fará deploy automaticamente.

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] JWT secrets gerados
- [ ] Criptografia configurada
- [ ] CORS configurado
- [ ] Email configurado
- [ ] Testes de segurança passando
- [ ] Logs funcionando
- [ ] Backup configurado
- [ ] Monitoramento ativado
- [ ] SSL/HTTPS ativado
- [ ] Rate limiting ativado
- [ ] 2FA funcionando
- [ ] LGPD compliance verificado
- [ ] ANVISA compliance verificado

---

## 🔍 TESTES PRÉ-DEPLOYMENT

### 1. Testes Unitários

```bash
npm run test
```

### 2. Testes de Segurança

```bash
npm run test:security
```

### 3. Testes de Integração

```bash
npm run test:integration
```

### 4. Verificar Conformidade

```bash
npm run check:compliance
```

---

## 📊 MONITORAMENTO

### 1. Logs

```bash
# Ver logs em tempo real
npm run logs

# Ver logs do Railway
railway logs

# Ver logs do Render
render logs
```

### 2. Métricas

- CPU Usage
- Memory Usage
- Request Rate
- Error Rate
- Response Time

### 3. Alertas

Configure alertas para:
- Erro 5xx
- Taxa de erro > 1%
- Tempo de resposta > 1s
- CPU > 80%
- Memória > 80%

---

## 🔒 SEGURANÇA PÓS-DEPLOYMENT

- [ ] Ativar HTTPS
- [ ] Configurar firewall
- [ ] Ativar WAF (Web Application Firewall)
- [ ] Configurar backup automático
- [ ] Ativar monitoramento de segurança
- [ ] Configurar alertas de segurança
- [ ] Fazer teste de penetração
- [ ] Revisar logs de auditoria

---

## 🆘 TROUBLESHOOTING

### Erro: "Database connection failed"

```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL
```

### Erro: "JWT secret not found"

```bash
# Gerar novo secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Erro: "CORS error"

```bash
# Verificar ALLOWED_ORIGINS
echo $ALLOWED_ORIGINS

# Adicionar nova origem
ALLOWED_ORIGINS=https://novo-dominio.com
```

---

## 📞 SUPORTE

Para dúvidas ou problemas:
- Email: support@editlabel.com
- Discord: https://discord.gg/editlabel
- GitHub Issues: https://github.com/editlabelwork/editlabel-backend/issues

---

**Deployment realizado com sucesso! 🎉**
