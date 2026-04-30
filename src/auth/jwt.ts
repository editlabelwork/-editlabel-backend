import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRATION = '15m';
const JWT_REFRESH_EXPIRATION = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'farmaceutico';
  iat?: number;
  exp?: number;
}

/**
 * Gera token JWT de acesso
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    algorithm: 'HS256'
  });
};

/**
 * Gera token JWT de refresh
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION,
    algorithm: 'HS256'
  });
};

/**
 * Verifica token JWT de acesso
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica token JWT de refresh
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256']
    }) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Hash de senha com bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifica senha com bcrypt
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Gera secret para 2FA (TOTP)
 */
export const generate2FASecret = (): { secret: string; qrCode: string } => {
  const secret = authenticator.generateSecret();
  const qrCode = authenticator.keyuri('editlabel', 'EditLabel', secret);
  return { secret, qrCode };
};

/**
 * Verifica token TOTP (2FA)
 */
export const verify2FAToken = (secret: string, token: string): boolean => {
  return authenticator.check(token, secret);
};

/**
 * Gera tokens de backup para 2FA
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
};
