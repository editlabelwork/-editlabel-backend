import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateAnvisaCompliance, generateComplianceReport } from '../compliance/anvisa';
import { createAuditLog } from '../security/audit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Mock database
const labels: any[] = [];

/**
 * GET /api/labels
 * Lista todos os rótulos do usuário
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userLabels = labels.filter(l => l.user_id === userId);

    res.status(200).json({
      total: userLabels.length,
      data: userLabels
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar rótulos' });
  }
});

/**
 * GET /api/labels/:id
 * Obtém detalhes de um rótulo específico
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const label = labels.find(l => l.id === id && l.user_id === userId);
    if (!label) {
      res.status(404).json({ error: 'Rótulo não encontrado' });
      return;
    }

    res.status(200).json(label);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao obter rótulo' });
  }
});

/**
 * POST /api/labels
 * Cria novo rótulo
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      industry_id,
      nome_produto,
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências
    } = req.body;

    // Validação básica
    if (!nome_produto || !tipo_suplemento) {
      res.status(400).json({ error: 'Campos obrigatórios faltando' });
      return;
    }

    // Valida conformidade ANVISA
    const compliance = validateAnvisaCompliance({
      tabelaNutricional,
      alergênicos,
      advertências
    });

    const newLabel = {
      id: uuidv4(),
      user_id: userId,
      industry_id,
      nome_produto,
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      status: 'em_andamento',
      compliance,
      created_at: new Date(),
      updated_at: new Date()
    };

    labels.push(newLabel);

    // Log de auditoria
    createAuditLog(
      userId,
      'CREATE',
      'Label',
      newLabel.id,
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(201).json({
      message: 'Rótulo criado com sucesso',
      data: newLabel
    });
  } catch (error: any) {
    console.error('Erro ao criar rótulo:', error);
    res.status(500).json({ error: 'Erro ao criar rótulo' });
  }
});

/**
 * PUT /api/labels/:id
 * Atualiza um rótulo
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    const labelIndex = labels.findIndex(l => l.id === id && l.user_id === userId);
    if (labelIndex === -1) {
      res.status(404).json({ error: 'Rótulo não encontrado' });
      return;
    }

    // Valida conformidade ANVISA se houver mudanças
    if (updates.tabelaNutricional || updates.alergênicos || updates.advertências) {
      const label = labels[labelIndex];
      const compliance = validateAnvisaCompliance({
        tabelaNutricional: updates.tabelaNutricional || label.tabelaNutricional,
        alergênicos: updates.alergênicos || label.alergênicos,
        advertências: updates.advertências || label.advertências
      });
      updates.compliance = compliance;
    }

    labels[labelIndex] = {
      ...labels[labelIndex],
      ...updates,
      updated_at: new Date()
    };

    // Log de auditoria
    createAuditLog(
      userId,
      'UPDATE',
      'Label',
      id,
      req.ip || '',
      req.get('user-agent') || '',
      updates,
      'SUCCESS'
    );

    res.status(200).json({
      message: 'Rótulo atualizado com sucesso',
      data: labels[labelIndex]
    });
  } catch (error: any) {
    console.error('Erro ao atualizar rótulo:', error);
    res.status(500).json({ error: 'Erro ao atualizar rótulo' });
  }
});

/**
 * DELETE /api/labels/:id
 * Deleta um rótulo
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const labelIndex = labels.findIndex(l => l.id === id && l.user_id === userId);
    if (labelIndex === -1) {
      res.status(404).json({ error: 'Rótulo não encontrado' });
      return;
    }

    const deletedLabel = labels.splice(labelIndex, 1)[0];

    // Log de auditoria
    createAuditLog(
      userId,
      'DELETE',
      'Label',
      id,
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(200).json({
      message: 'Rótulo deletado com sucesso',
      data: deletedLabel
    });
  } catch (error: any) {
    console.error('Erro ao deletar rótulo:', error);
    res.status(500).json({ error: 'Erro ao deletar rótulo' });
  }
});

/**
 * GET /api/labels/:id/compliance
 * Obtém relatório de conformidade ANVISA
 */
router.get('/:id/compliance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const label = labels.find(l => l.id === id && l.user_id === userId);
    if (!label) {
      res.status(404).json({ error: 'Rótulo não encontrado' });
      return;
    }

    const report = generateComplianceReport(id, label.compliance);

    res.status(200).json({
      labelId: id,
      compliance: label.compliance,
      report
    });
  } catch (error: any) {
    console.error('Erro ao obter conformidade:', error);
    res.status(500).json({ error: 'Erro ao obter conformidade' });
  }
});

/**
 * POST /api/labels/:id/export
 * Exporta rótulo em PDF
 */
router.post('/:id/export', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { format = 'pdf' } = req.body;

    const label = labels.find(l => l.id === id && l.user_id === userId);
    if (!label) {
      res.status(404).json({ error: 'Rótulo não encontrado' });
      return;
    }

    // TODO: Implementar exportação em PDF/PNG

    res.status(200).json({
      message: 'Rótulo exportado com sucesso',
      format,
      downloadUrl: `/api/labels/${id}/export/${format}`
    });
  } catch (error: any) {
    console.error('Erro ao exportar rótulo:', error);
    res.status(500).json({ error: 'Erro ao exportar rótulo' });
  }
});

export default router;
