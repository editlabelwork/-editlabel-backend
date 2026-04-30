import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../auth/jwt';
import { encryptCRF, decryptCRF, encryptEmail, decryptEmail } from '../security/encryption';

export interface IUser {
  id: string;
  email: string; // criptografado
  passwordHash: string;
  nome: string;
  crf: string; // criptografado
  estado: string;
  role: 'admin' | 'user' | 'farmaceutico';
  
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  
  // LGPD
  consentimentoLGPD: boolean;
  dataConsentimento: Date;
  
  // Auditoria
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // Status
  ativo: boolean;
}

export class User implements IUser {
  id: string;
  email: string;
  passwordHash: string;
  nome: string;
  crf: string;
  estado: string;
  role: 'admin' | 'user' | 'farmaceutico';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  consentimentoLGPD: boolean;
  dataConsentimento: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  ativo: boolean;

  constructor(data: Partial<IUser>) {
    this.id = data.id || uuidv4();
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.nome = data.nome || '';
    this.crf = data.crf || '';
    this.estado = data.estado || '';
    this.role = data.role || 'user';
    this.twoFactorEnabled = data.twoFactorEnabled || false;
    this.twoFactorSecret = data.twoFactorSecret;
    this.backupCodes = data.backupCodes;
    this.consentimentoLGPD = data.consentimentoLGPD || false;
    this.dataConsentimento = data.dataConsentimento || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin;
    this.loginAttempts = data.loginAttempts || 0;
    this.lockedUntil = data.lockedUntil;
    this.ativo = data.ativo !== false;
  }

  /**
   * Define senha com hash
   */
  async setPassword(password: string): Promise<void> {
    if (password.length < 12) {
      throw new Error('Senha deve ter pelo menos 12 caracteres');
    }
    this.passwordHash = await hashPassword(password);
    this.updatedAt = new Date();
  }

  /**
   * Verifica senha
   */
  async verifyPassword(password: string): Promise<boolean> {
    return verifyPassword(password, this.passwordHash);
  }

  /**
   * Retorna dados públicos do usuário
   */
  toPublic() {
    return {
      id: this.id,
      nome: this.nome,
      role: this.role,
      twoFactorEnabled: this.twoFactorEnabled,
      ativo: this.ativo,
      createdAt: this.createdAt
    };
  }

  /**
   * Retorna dados para API (sem dados sensíveis)
   */
  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      role: this.role,
      ativo: this.ativo,
      twoFactorEnabled: this.twoFactorEnabled,
      consentimentoLGPD: this.consentimentoLGPD,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }

  /**
   * Incrementa tentativas de login
   */
  incrementLoginAttempts(): void {
    this.loginAttempts += 1;
    
    // Bloqueia após 5 tentativas por 15 minutos
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Reseta tentativas de login
   */
  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLogin = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Verifica se usuário está bloqueado
   */
  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    if (this.lockedUntil < new Date()) {
      this.lockedUntil = undefined;
      this.loginAttempts = 0;
      return false;
    }
    return true;
  }

  /**
   * Valida força de senha
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Senha deve ter pelo menos 12 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
