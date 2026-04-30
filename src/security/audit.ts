import { v4 as uuidv4 } from 'uuid';

export interface AuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'VALIDATE' | 'GENERATE' | 'ACCESS';
  entity: string;
  entityId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}

/**
 * Cria log de auditoria
 */
export const createAuditLog = (
  userId: string,
  action: AuditLog['action'],
  entity: string,
  entityId: string,
  ipAddress: string,
  userAgent: string,
  changes?: Record<string, { before: any; after: any }>,
  status: 'SUCCESS' | 'FAILURE' = 'SUCCESS',
  errorMessage?: string
): AuditLog => {
  return {
    id: uuidv4(),
    userId,
    action,
    entity,
    entityId,
    changes,
    ipAddress,
    userAgent,
    timestamp: new Date(),
    status,
    errorMessage
  };
};

/**
 * Formata log de auditoria para armazenamento
 */
export const formatAuditLog = (log: AuditLog): string => {
  return JSON.stringify({
    id: log.id,
    userId: log.userId,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    changes: log.changes,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    timestamp: log.timestamp.toISOString(),
    status: log.status,
    errorMessage: log.errorMessage
  });
};

/**
 * Detecta mudanças entre dois objetos
 */
export const detectChanges = (before: any, after: any): Record<string, { before: any; after: any }> => {
  const changes: Record<string, { before: any; after: any }> = {};
  
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        before: before[key],
        after: after[key]
      };
    }
  }
  
  return changes;
};

/**
 * Extrai IP do request
 */
export const extractIPAddress = (req: any): string => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    'UNKNOWN'
  );
};

/**
 * Extrai User Agent do request
 */
export const extractUserAgent = (req: any): string => {
  return req.headers['user-agent'] || 'UNKNOWN';
};
