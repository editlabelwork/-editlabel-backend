import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createAuditLog } from '../security/audit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock database
const consents: any[] = [];
const dataRequests: any[] = [];
const deletionRequests: any[] = [];

/**
 * GET /api/lgpd/privacy-policy
 * Obtém política de privacidade
 */
router.get('/privacy-policy', async (req: Request, res: Response) => {
  try {
    const policy = {
      version: '1.0',
      effective_date: '2026-04-30',
      last_updated: '2026-04-30',
      content: `
# POLÍTICA DE PRIVACIDADE - EDITLABEL

## 1. INTRODUÇÃO
A EditLabel ("Empresa", "nós", "nosso") respeita a privacidade de seus usuários ("Usuário", "você"). Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações.

## 2. INFORMAÇÕES QUE COLETAMOS
- Dados de identificação (nome, email, CRF, CNPJ)
- Dados de autenticação (senha criptografada)
- Dados de uso (logs de acesso, ações realizadas)
- Dados de dispositivo (IP, user agent)

## 3. BASE LEGAL
Processamos seus dados com base em:
- Consentimento explícito (Art. 7º, I da LGPD)
- Execução de contrato (Art. 7º, V da LGPD)
- Obrigação legal (Art. 7º, II da LGPD)

## 4. DIREITOS DO USUÁRIO
Você tem direito a:
- Acessar seus dados pessoais
- Corrigir dados imprecisos
- Solicitar exclusão (direito ao esquecimento)
- Portabilidade de dados
- Revogar consentimento

## 5. SEGURANÇA
Implementamos:
- Criptografia AES-256
- Autenticação JWT + 2FA
- Auditoria completa
- Backup regular

## 6. RETENÇÃO DE DADOS
Mantemos seus dados enquanto:
- Sua conta estiver ativa
- Necessário para cumprir obrigações legais
- Conforme sua solicitação

## 7. CONTATO
Para dúvidas sobre privacidade: privacy@editlabel.com
      `
    };

    res.status(200).json(policy);
  } catch (error: any) {
    console.error('Erro ao obter política:', error);
    res.status(500).json({ error: 'Erro ao obter política de privacidade' });
  }
});

/**
 * POST /api/lgpd/consent
 * Registra consentimento do usuário
 */
router.post('/consent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, version, accepted } = req.body;

    if (!type || version === undefined || accepted === undefined) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    const consent = {
      id: uuidv4(),
      user_id: userId,
      type, // 'privacy_policy', 'marketing', 'analytics'
      version,
      accepted,
      ip_address: req.ip || '',
      user_agent: req.get('user-agent') || '',
      created_at: new Date()
    };

    consents.push(consent);

    // Log de auditoria
    createAuditLog(
      userId || '',
      'CREATE',
      'Consent',
      consent.id,
      req.ip || '',
      req.get('user-agent') || '',
      { type, accepted },
      'SUCCESS'
    );

    res.status(201).json({
      message: 'Consentimento registrado com sucesso',
      consentId: consent.id
    });
  } catch (error: any) {
    console.error('Erro ao registrar consentimento:', error);
    res.status(500).json({ error: 'Erro ao registrar consentimento' });
  }
});

/**
 * GET /api/lgpd/my-data
 * Obtém todos os dados do usuário (direito de acesso)
 */
router.get('/my-data', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Simula coleta de dados do usuário
    const userData = {
      profile: {
        id: userId,
        email: req.user?.email,
        // Outros dados do perfil
      },
      consents: consents.filter(c => c.user_id === userId),
      audit_logs: [], // Logs de auditoria do usuário
      labels: [], // Rótulos criados
      created_at: new Date()
    };

    // Log de auditoria
    createAuditLog(
      userId || '',
      'ACCESS',
      'PersonalData',
      userId || '',
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(200).json({
      message: 'Dados pessoais obtidos com sucesso',
      data: userData,
      format: 'json'
    });
  } catch (error: any) {
    console.error('Erro ao obter dados:', error);
    res.status(500).json({ error: 'Erro ao obter dados pessoais' });
  }
});

/**
 * POST /api/lgpd/data-portability
 * Solicita portabilidade de dados
 */
router.post('/data-portability', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { format = 'json' } = req.body;

    if (!['json', 'csv', 'xml'].includes(format)) {
      res.status(400).json({ error: 'Formato inválido' });
      return;
    }

    const request = {
      id: uuidv4(),
      user_id: userId,
      type: 'data_portability',
      format,
      status: 'pending',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    };

    dataRequests.push(request);

    // Log de auditoria
    createAuditLog(
      userId || '',
      'CREATE',
      'DataPortabilityRequest',
      request.id,
      req.ip || '',
      req.get('user-agent') || '',
      { format },
      'SUCCESS'
    );

    res.status(201).json({
      message: 'Solicitação de portabilidade criada com sucesso',
      requestId: request.id,
      status: 'pending',
      expires_at: request.expires_at,
      note: 'Você receberá um email com o arquivo em até 30 dias'
    });
  } catch (error: any) {
    console.error('Erro ao solicitar portabilidade:', error);
    res.status(500).json({ error: 'Erro ao solicitar portabilidade' });
  }
});

/**
 * POST /api/lgpd/deletion-request
 * Solicita exclusão de dados (direito ao esquecimento)
 */
router.post('/deletion-request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { reason, password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Senha é obrigatória para confirmar exclusão' });
      return;
    }

    // TODO: Verificar senha

    const request = {
      id: uuidv4(),
      user_id: userId,
      type: 'deletion_request',
      reason: reason || 'Não especificado',
      status: 'pending',
      created_at: new Date(),
      scheduled_deletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    };

    deletionRequests.push(request);

    // Log de auditoria
    createAuditLog(
      userId || '',
      'CREATE',
      'DeletionRequest',
      request.id,
      req.ip || '',
      req.get('user-agent') || '',
      { reason },
      'SUCCESS'
    );

    res.status(201).json({
      message: 'Solicitação de exclusão criada com sucesso',
      requestId: request.id,
      status: 'pending',
      scheduled_deletion: request.scheduled_deletion,
      note: 'Sua conta será excluída em 30 dias. Você pode cancelar esta solicitação a qualquer momento.'
    });
  } catch (error: any) {
    console.error('Erro ao solicitar exclusão:', error);
    res.status(500).json({ error: 'Erro ao solicitar exclusão' });
  }
});

/**
 * POST /api/lgpd/cancel-deletion
 * Cancela solicitação de exclusão
 */
router.post('/cancel-deletion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.body;

    if (!requestId) {
      res.status(400).json({ error: 'requestId é obrigatório' });
      return;
    }

    const request = deletionRequests.find(r => r.id === requestId && r.user_id === userId);
    if (!request) {
      res.status(404).json({ error: 'Solicitação não encontrada' });
      return;
    }

    request.status = 'cancelled';
    request.cancelled_at = new Date();

    // Log de auditoria
    createAuditLog(
      userId || '',
      'UPDATE',
      'DeletionRequest',
      requestId,
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(200).json({
      message: 'Solicitação de exclusão cancelada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao cancelar exclusão:', error);
    res.status(500).json({ error: 'Erro ao cancelar exclusão' });
  }
});

/**
 * GET /api/lgpd/audit-logs
 * Obtém logs de auditoria do usuário
 */
router.get('/audit-logs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 50, offset = 0 } = req.query;

    // TODO: Buscar logs de auditoria do usuário do banco de dados

    res.status(200).json({
      total: 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      logs: []
    });
  } catch (error: any) {
    console.error('Erro ao obter logs:', error);
    res.status(500).json({ error: 'Erro ao obter logs de auditoria' });
  }
});

/**
 * POST /api/lgpd/revoke-consent
 * Revoga consentimento
 */
router.post('/revoke-consent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { consentId } = req.body;

    if (!consentId) {
      res.status(400).json({ error: 'consentId é obrigatório' });
      return;
    }

    const consent = consents.find(c => c.id === consentId && c.user_id === userId);
    if (!consent) {
      res.status(404).json({ error: 'Consentimento não encontrado' });
      return;
    }

    consent.revoked_at = new Date();
    consent.revoked = true;

    // Log de auditoria
    createAuditLog(
      userId || '',
      'UPDATE',
      'Consent',
      consentId,
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(200).json({
      message: 'Consentimento revogado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao revogar consentimento:', error);
    res.status(500).json({ error: 'Erro ao revogar consentimento' });
  }
});

export default router;
