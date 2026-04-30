# 🔗 Integração Frontend com Backend - EditLabel

## 1. Configurar URL do Backend

### 1.1 Arquivo: `/home/ubuntu/editlabel/src/services/api.ts`

```typescript
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para renovar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 1.2 Arquivo: `/home/ubuntu/editlabel/.env.local`

```env
VITE_API_URL=http://localhost:3001
```

### 1.3 Para Produção: `/home/ubuntu/editlabel/.env.production`

```env
VITE_API_URL=https://seu-backend-em-producao.com
```

---

## 2. Criar Serviços de API

### 2.1 Arquivo: `/home/ubuntu/editlabel/src/services/auth.ts`

```typescript
import api from './api';

export const authService = {
  register: async (data: {
    email: string;
    password: string;
    nome: string;
    crf: string;
    estado: string;
  }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });

    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};
```

### 2.2 Arquivo: `/home/ubuntu/editlabel/src/services/labels.ts`

```typescript
import api from './api';

export const labelsService = {
  getAll: async () => {
    const response = await api.get('/api/labels');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/labels/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/labels', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/labels/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/labels/${id}`);
    return response.data;
  },

  getCompliance: async (id: string) => {
    const response = await api.get(`/api/labels/${id}/compliance`);
    return response.data;
  },
};
```

---

## 3. Implementar Tela de Login

### 3.1 Arquivo: `/home/ubuntu/editlabel/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            EditLabel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login na sua conta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 4. Implementar Context de Autenticação

### 4.1 Arquivo: `/home/ubuntu/editlabel/src/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authService
        .getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
```

---

## 5. Testar Integração

### 5.1 Iniciar Backend
```bash
cd /home/ubuntu/editlabel-backend-repo
npm start
```

### 5.2 Iniciar Frontend
```bash
cd /home/ubuntu/editlabel
npm run dev
```

### 5.3 Testar Login
1. Abra http://localhost:5173
2. Faça login com:
   - Email: marco@example.com
   - Senha: TestPassword123!
3. Você deve ser redirecionado para /dashboard

---

## Checklist de Integração

- [ ] API URL configurada
- [ ] Serviço de autenticação criado
- [ ] Serviço de labels criado
- [ ] Tela de login implementada
- [ ] Context de autenticação criado
- [ ] Rotas protegidas implementadas
- [ ] Interceptors de token configurados
- [ ] Renovação de token implementada
- [ ] Logout implementado
- [ ] Testes de integração passando
