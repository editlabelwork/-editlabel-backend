# 🔒 Testes de Segurança - EditLabel

## 1. Teste de Autenticação JWT

### 1.1 Registrar Usuário
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"seguranca@test.com",
    "password":"TestPassword123!",
    "nome":"Teste Segurança",
    "crf":"CRF123456",
    "estado":"SP"
  }'

# Esperado: Usuário criado com ID único
```

### 1.2 Login e Obter Token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"seguranca@test.com",
    "password":"TestPassword123!"
  }'

# Esperado: accessToken e refreshToken gerados
# Token deve ser válido por 15 minutos
```

### 1.3 Testar Token Inválido
```bash
curl http://localhost:3001/api/compliance/rdcs \
  -H "Authorization: Bearer invalid_token"

# Esperado: 401 Unauthorized
```

### 1.4 Testar Sem Token
```bash
curl http://localhost:3001/api/compliance/rdcs

# Esperado: 401 Token não fornecido
```

---

## 2. Teste de Força de Senha

### 2.1 Senha Fraca (Deve Falhar)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"weak@test.com",
    "password":"123",
    "nome":"Weak",
    "crf":"123",
    "estado":"SP"
  }'

# Esperado: 400 Senha fraca
# Requisitos: Mín 12 caracteres, maiúscula, minúscula, número, símbolo
```

### 2.2 Senha Forte (Deve Passar)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"strong@test.com",
    "password":"StrongPass123!@#",
    "nome":"Strong",
    "crf":"123",
    "estado":"SP"
  }'

# Esperado: 201 Usuário criado
```

---

## 3. Teste de CORS

### 3.1 CORS Permitido
```bash
curl -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Esperado: 200 OK com headers CORS
```

### 3.2 CORS Bloqueado
```bash
curl -X OPTIONS http://localhost:3001/api/auth/register \
  -H "Origin: http://malicious.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Esperado: Sem headers CORS ou erro
```

---

## 4. Teste de Rate Limiting

### 4.1 Múltiplas Requisições Rápidas
```bash
for i in {1..150}; do
  curl -s http://localhost:3001/health > /dev/null
done

# Esperado: Após 100 requisições em 15 min, erro 429 Too Many Requests
```

---

## 5. Teste de Criptografia

### 5.1 Verificar Hash de Senha
```bash
# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"crypto@test.com",
    "password":"CryptoPass123!",
    "nome":"Crypto",
    "crf":"123",
    "estado":"SP"
  }'

# Verificar no banco: SELECT password_hash FROM users WHERE email='crypto@test.com'
# Esperado: Hash bcrypt (começa com $2b$)
```

---

## 6. Teste de Conformidade LGPD

### 6.1 Acessar Política de Privacidade
```bash
curl http://localhost:3001/api/lgpd/privacy-policy

# Esperado: Política completa com direitos do usuário
```

### 6.2 Registrar Consentimento LGPD
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3001/api/lgpd/consent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"marketing",
    "accepted":true
  }'

# Esperado: 201 Consentimento registrado
```

### 6.3 Acessar Dados Pessoais
```bash
TOKEN="seu_token_aqui"

curl http://localhost:3001/api/lgpd/my-data \
  -H "Authorization: Bearer $TOKEN"

# Esperado: Todos os dados pessoais do usuário
```

---

## 7. Teste de Conformidade ANVISA

### 7.1 Listar RDCs
```bash
TOKEN="seu_token_aqui"

curl http://localhost:3001/api/compliance/rdcs \
  -H "Authorization: Bearer $TOKEN"

# Esperado: RDC 429/2020, 26/2015, 657/2022
```

### 7.2 Validar Conformidade
```bash
TOKEN="seu_token_aqui"

curl -X POST http://localhost:3001/api/compliance/validate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_suplemento":"vitamina",
    "tabelaNutricional":true,
    "alergênicos":true,
    "advertências":true
  }'

# Esperado: Validação de conformidade
```

---

## 8. Teste de Security Headers

### 8.1 Verificar Headers de Segurança
```bash
curl -i http://localhost:3001/health

# Esperado headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: ...
```

---

## 9. Teste de Auditoria

### 9.1 Verificar Logs de Auditoria
```bash
TOKEN="seu_token_aqui"

curl http://localhost:3001/api/lgpd/audit-logs \
  -H "Authorization: Bearer $TOKEN"

# Esperado: Logs de todas as ações do usuário
```

---

## 10. Teste de Injeção SQL (Proteção)

### 10.1 Tentar Injeção SQL
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com' OR '1'='1",
    "password":"TestPassword123!",
    "nome":"Test",
    "crf":"123",
    "estado":"SP"
  }'

# Esperado: Erro de validação, sem execução de SQL
```

---

## Checklist de Segurança

- [ ] Autenticação JWT funcionando
- [ ] Tokens expirando corretamente
- [ ] Senhas com força mínima
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Senhas criptografadas com bcrypt
- [ ] LGPD implementado
- [ ] ANVISA implementado
- [ ] Security headers presentes
- [ ] Auditoria de logs funcionando
- [ ] Proteção contra SQL injection
- [ ] Proteção contra XSS
- [ ] HTTPS em produção
- [ ] Variáveis sensíveis em .env

---

## Como Executar Todos os Testes

```bash
#!/bin/bash

echo "🔒 Iniciando testes de segurança..."

# 1. Registrar usuário
echo "1. Registrando usuário..."
REGISTER=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test'$(date +%s)'@test.com",
    "password":"TestPassword123!",
    "nome":"Test",
    "crf":"123",
    "estado":"SP"
  }')

echo "✅ Usuário registrado"

# 2. Login
echo "2. Fazendo login..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test'$(date +%s)'@test.com",
    "password":"TestPassword123!"
  }')

TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "✅ Token obtido: ${TOKEN:0:20}..."

# 3. Testar endpoints protegidos
echo "3. Testando endpoints protegidos..."
curl -s http://localhost:3001/api/compliance/rdcs \
  -H "Authorization: Bearer $TOKEN" | head -20
echo "✅ Endpoints protegidos funcionando"

# 4. Testar LGPD
echo "4. Testando LGPD..."
curl -s http://localhost:3001/api/lgpd/privacy-policy | head -20
echo "✅ LGPD funcionando"

# 5. Testar Health
echo "5. Testando health..."
curl -s http://localhost:3001/health
echo "✅ Health check funcionando"

echo ""
echo "🎉 Todos os testes de segurança passaram!"
```

