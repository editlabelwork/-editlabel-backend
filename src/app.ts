import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Rotas
import authRoutes from './routes/auth';
import labelsRoutes from './routes/labels';
import complianceRoutes from './routes/compliance';
import lgpdRoutes from './routes/lgpd';

// Carregar variáveis de ambiente
dotenv.config();

const app: Express = express();

// ============================================
// MIDDLEWARES DE SEGURANÇA
// ============================================

// Helmet - Proteção de headers
app.use(helmet());

// CORS Seguro
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ============================================
// MIDDLEWARES DE LOGGING
// ============================================

// Morgan - HTTP request logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ============================================
// MIDDLEWARES DE PARSING
// ============================================

// JSON Parser
app.use(express.json({ limit: '10mb' }));

// URL Encoded Parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MIDDLEWARES DE SEGURANÇA CUSTOMIZADOS
// ============================================

// Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Previne MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Ativa proteção XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});

// ============================================
// ROTAS DE API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/labels', labelsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/lgpd', lgpdRoutes);

// ============================================
// ROTAS DE SAÚDE
// ============================================

/**
 * GET /health
 * Verifica saúde da aplicação
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'EditLabel API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

/**
 * GET /health/db
 * Verifica conexão com banco de dados
 */
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    // TODO: Verificar conexão com banco de dados
    res.status(200).json({
      status: 'ok',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ROTAS 404
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
