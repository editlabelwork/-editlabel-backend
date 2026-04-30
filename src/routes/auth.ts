import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  generate2FASecret,
  verify2FAToken,
  generateBackupCodes
} from '../auth/jwt';
import { authMiddleware } from '../middleware/auth';
import { createAuditLog, extractIPAddress, extractUserAgent } from '../security/audit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock database (será substituído por PostgreSQL)
const users = new Map<string, User>();
const refreshTokens = new Map<string, string>();
const auditLogs: any[] = [];

/**
 * POST /auth/register
 * Registra novo usuário
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nome, crf, estado } = req.body;

    // Validação
    if (!email || !password || !nome || !crf || !estado) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Verifica se usuário já existe
    for (const user of users.values()) {
      if (user.email === email) {
        res.status(409).json({ error: 'Email já cadastrado' });
        return;
      }
    }

    // Valida força de senha
    const passwordValidation = User.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      res.status(400).json({ 
        error: 'Senha fraca',
        details: passwordValidation.errors 
      });
      return;
    }

    // Cria novo usuário
    const user = new User({
      email,
      nome,
      crf,
      estado,
      role: 'farmaceutico',
      consentimentoLGPD: req.body.consentimentoLGPD || false,
      dataConsentimento: new Date()
    });

    await user.setPassword(password);
    users.set(user.id, user);

    // Log de auditoria
    const auditLog = createAuditLog(
      user.id,
      'CREATE',
      'User',
      user.id,
      extractIPAddress(req),
      extractUserAgent(req),
      undefined,
      'SUCCESS'
    );
    auditLogs.push(auditLog);

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

/**
 * POST /auth/login
 * Faz login do usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha obrigatórios' });
      return;
    }

    // Procura usuário por email
    let user: User | undefined;
    for (const u of users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    // Verifica se usuário está bloqueado
    if (user.isLocked()) {
      res.status(429).json({ error: 'Usuário bloqueado. Tente novamente mais tarde.' });
      return;
    }

    // Verifica senha
    const passwordValid = await user.verifyPassword(password);
    if (!passwordValid) {
      user.incrementLoginAttempts();
      users.set(user.id, user);
      res.status(401).json({ error: 'Email ou senha incorretos' });
      return;
    }

    // Reseta tentativas
    user.resetLoginAttempts();

    // Se 2FA está ativado, retorna desafio
    if (user.twoFactorEnabled) {
      res.status(200).json({
        message: 'Digite o código 2FA',
        requiresTwoFactor: true,
        tempToken: generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role
        })
      });
      return;
    }

    // Gera tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = generateRefreshToken(user.id);

    refreshTokens.set(user.id, refreshToken);
    users.set(user.id, user);

    // Log de auditoria
    const auditLog = createAuditLog(
      user.id,
      'LOGIN',
      'User',
      user.id,
      extractIPAddress(req),
      extractUserAgent(req),
      undefined,
      'SUCCESS'
    );
    auditLogs.push(auditLog);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      accessToken,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /auth/verify-2fa
 * Verifica código 2FA
 */
router.post('/verify-2fa', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?.userId;

    if (!userId || !code) {
      res.status(400).json({ error: 'Código 2FA obrigatório' });
      return;
    }

    const user = users.get(userId);
    if (!user || !user.twoFactorSecret) {
      res.status(400).json({ error: 'Usuário não tem 2FA ativado' });
      return;
    }

    // Verifica código TOTP
    const isValid = verify2FAToken(user.twoFactorSecret, code);
    if (!isValid) {
      res.status(401).json({ error: 'Código 2FA inválido' });
      return;
    }

    // Gera tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = generateRefreshToken(user.id);

    refreshTokens.set(user.id, refreshToken);

    res.status(200).json({
      message: '2FA verificado com sucesso',
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    console.error('Erro na verificação 2FA:', error);
    res.status(500).json({ error: 'Erro ao verificar 2FA' });
  }
});

/**
 * POST /auth/refresh
 * Renova token de acesso
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token obrigatório' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Refresh token inválido ou expirado' });
      return;
    }

    const user = users.get(payload.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error: any) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

/**
 * POST /auth/setup-2fa
 * Configura 2FA para o usuário
 */
router.post('/setup-2fa', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = users.get(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const { secret, qrCode } = generate2FASecret();
    const backupCodes = generateBackupCodes();

    // Não ativa 2FA ainda, apenas retorna para o usuário confirmar
    res.status(200).json({
      secret,
      qrCode,
      backupCodes,
      message: 'Escaneie o QR code com seu autenticador e confirme'
    });
  } catch (error: any) {
    console.error('Erro ao configurar 2FA:', error);
    res.status(500).json({ error: 'Erro ao configurar 2FA' });
  }
});

/**
 * POST /auth/confirm-2fa
 * Confirma e ativa 2FA
 */
router.post('/confirm-2fa', authMiddleware, (req: Request, res: Response) => {
  try {
    const { secret, code, backupCodes } = req.body;
    const userId = req.user?.userId;

    if (!userId || !secret || !code) {
      res.status(400).json({ error: 'Dados obrigatórios faltando' });
      return;
    }

    const user = users.get(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Verifica código TOTP
    const isValid = verify2FAToken(secret, code);
    if (!isValid) {
      res.status(401).json({ error: 'Código inválido' });
      return;
    }

    // Ativa 2FA
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    user.backupCodes = backupCodes;
    user.updatedAt = new Date();
    users.set(userId, user);

    res.status(200).json({
      message: '2FA ativado com sucesso',
      backupCodes
    });
  } catch (error: any) {
    console.error('Erro ao confirmar 2FA:', error);
    res.status(500).json({ error: 'Erro ao confirmar 2FA' });
  }
});

/**
 * POST /auth/logout
 * Faz logout do usuário
 */
router.post('/logout', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      refreshTokens.delete(userId);

      // Log de auditoria
      const auditLog = createAuditLog(
        userId,
        'LOGOUT',
        'User',
        userId,
        extractIPAddress(req),
        extractUserAgent(req),
        undefined,
        'SUCCESS'
      );
      auditLogs.push(auditLog);
    }

    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

export default router;
