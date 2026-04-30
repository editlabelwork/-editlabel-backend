import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../auth/jwt';
import { extractIPAddress, extractUserAgent } from '../security/audit';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      ipAddress?: string;
      userAgent?: string;
    }
  }
}

/**
 * Middleware de autenticação JWT
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extrai informações do request
    req.ipAddress = extractIPAddress(req);
    req.userAgent = extractUserAgent(req);

    // Obtém token do header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

/**
 * Middleware de autorização por role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  };
};

/**
 * Middleware de rate limiting
 */
export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ipAddress || req.ip || 'unknown';
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    const record = requests.get(key)!;

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' });
      return;
    }

    next();
  };
};

/**
 * Middleware de validação de consentimento LGPD
 */
export const requireLGPDConsent = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  // Verificar se usuário consentiu com LGPD
  // TODO: Implementar verificação no banco de dados
  
  next();
};

/**
 * Middleware de CORS seguro
 */
export const secureCors = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

/**
 * Middleware de segurança de headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
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
};

/**
 * Middleware de tratamento de erros
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Erro:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};
