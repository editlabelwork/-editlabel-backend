# EditLabel Backend API

Backend seguro e robusto para o sistema EditLabel, construído com Node.js, Express, TypeScript e PostgreSQL.

## 🛡️ Recursos de Segurança Implementados

1. **Autenticação JWT**: Tokens seguros com expiração e validação.
2. **Criptografia AES-256**: Dados sensíveis (como fórmulas) são criptografados antes de serem salvos no banco.
3. **Hashing de Senhas**: Utilização de `bcryptjs` para armazenamento seguro de senhas.
4. **Proteção contra Ataques**:
   - `helmet`: Configuração de headers HTTP seguros.
   - `express-rate-limit`: Prevenção contra ataques de força bruta.
   - `cors`: Restrição de origens permitidas.
5. **Validação de Dados**: Schema validation com Prisma.

## 🚀 Como Fazer o Deploy no Antigravity (ou VPS)

### Pré-requisitos
- Docker e Docker Compose instalados no servidor.
- Git instalado.

### Passo a Passo

1. **Clone o repositório no servidor:**
   ```bash
   git clone https://github.com/editlabelwork/-editlabel-backend.git
   cd -editlabel-backend
   ```

2. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   **⚠️ IMPORTANTE:** Gere chaves seguras para produção:
   - `JWT_SECRET`: Gere com `openssl rand -base64 48`
   - `ENCRYPTION_KEY`: DEVE ter exatamente 32 caracteres. Gere com `openssl rand -hex 16`
   - `CORS_ORIGIN`: Defina para a URL do seu frontend (ex: `https://editlabel-app.vercel.app`)

3. **Inicie os Containers:**
   ```bash
   docker-compose up -d --build
   ```

4. **Verifique os Logs:**
   ```bash
   docker-compose logs -f api
   ```

O banco de dados PostgreSQL e a API Node.js serão iniciados automaticamente. As migrations do Prisma rodarão sozinhas na inicialização.

## 🔗 Integração com o Frontend

No seu projeto frontend (Vite/React), atualize as chamadas de API para apontar para o novo backend:

1. Crie um arquivo `.env` no frontend:
   ```env
   VITE_API_URL=https://sua-api-url.com/api
   ```

2. Atualize os serviços para usar o token JWT nas requisições:
   ```javascript
   const token = localStorage.getItem('token');
   const response = await fetch(`${import.meta.env.VITE_API_URL}/endpoint`, {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```
