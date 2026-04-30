import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Criptografa dados sensíveis com AES-256-GCM
 */
export const encryptData = (data: string): string => {
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw new Error('Falha na criptografia de dados');
  }
};

/**
 * Descriptografa dados sensíveis com AES-256-GCM
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia de dados');
  }
};

/**
 * Criptografa CNPJ
 */
export const encryptCNPJ = (cnpj: string): string => {
  return encryptData(cnpj);
};

/**
 * Descriptografa CNPJ
 */
export const decryptCNPJ = (encryptedCNPJ: string): string => {
  return decryptData(encryptedCNPJ);
};

/**
 * Criptografa CRF
 */
export const encryptCRF = (crf: string): string => {
  return encryptData(crf);
};

/**
 * Descriptografa CRF
 */
export const decryptCRF = (encryptedCRF: string): string => {
  return decryptData(encryptedCRF);
};

/**
 * Criptografa email
 */
export const encryptEmail = (email: string): string => {
  return encryptData(email);
};

/**
 * Descriptografa email
 */
export const decryptEmail = (encryptedEmail: string): string => {
  return decryptData(encryptedEmail);
};

/**
 * Hash de dados (não reversível, para comparação)
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Gera hash HMAC para integridade de dados
 */
export const generateHMAC = (data: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Verifica integridade de dados com HMAC
 */
export const verifyHMAC = (data: string, hmac: string): boolean => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const expectedHmac = crypto.createHmac('sha256', key).update(data).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
};
