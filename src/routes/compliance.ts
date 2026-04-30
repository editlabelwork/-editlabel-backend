import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateAnvisaCompliance, generateComplianceReport, AnvisaCompliance } from '../compliance/anvisa';
import { createAuditLog } from '../security/audit';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/compliance/validate
 * Valida conformidade ANVISA de um rótulo
 */
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      ingredientes,
      modo_uso
    } = req.body;

    if (!tipo_suplemento) {
      res.status(400).json({ error: 'Tipo de suplemento é obrigatório' });
      return;
    }

    // Valida conformidade
    const compliance: AnvisaCompliance = validateAnvisaCompliance({
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      ingredientes,
      modo_uso
    });

    // Log de auditoria
    createAuditLog(
      userId || '',
      'VALIDATE',
      'Compliance',
      'compliance-check',
      req.ip || '',
      (req.get('user-agent') || ''),
      { tipo_suplemento },
      'SUCCESS'
    );

    // Calcula percentual de conformidade
    const totalChecks = 3; // RDC 429, RDC 26, Warnings
    const passedChecks = [compliance.rdc429.valid, compliance.rdc26.valid, compliance.warnings.valid].filter(Boolean).length;
    const compliancePercentage = (passedChecks / totalChecks) * 100;

    res.status(200).json({
      valid: compliance.valid,
      compliance_percentage: compliancePercentage,
      validations: [
        {
          name: 'RDC 429/2020 - Rotulagem Nutricional',
          passed: compliance.rdc429.valid,
          errors: compliance.rdc429.errors,
          warnings: compliance.rdc429.warnings
        },
        {
          name: 'RDC 26/2015 - Alergênicos',
          passed: compliance.rdc26.valid,
          errors: compliance.rdc26.errors
        },
        {
          name: 'Advertências Obrigatórias',
          passed: compliance.warnings.valid,
          errors: compliance.warnings.errors
        }
      ],
      summary: {
        total_validations: 3,
        passed: passedChecks,
        failed: totalChecks - passedChecks,
        compliance_percentage: compliancePercentage
      }
    });
  } catch (error: any) {
    console.error('Erro ao validar conformidade:', error);
    res.status(500).json({ error: 'Erro ao validar conformidade' });
  }
});

/**
 * GET /api/compliance/rdc/:rdc_number
 * Obtém informações sobre uma RDC específica
 */
router.get('/rdc/:rdc_number', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rdc_number } = req.params as { rdc_number: string };

    // Mapeamento de RDCs
    const rdcInfo: Record<string, Record<string, any>> = {
      '429': {
        number: '429/2020',
        title: 'Regulamenta a Rotulagem de Alimentos',
        description: 'Define os requisitos para rotulagem de alimentos embalados',
        requirements: [
          'Denominação do produto',
          'Lista de ingredientes',
          'Declaração de alergênicos',
          'Conteúdo líquido',
          'Identificação da origem',
          'Modo de uso',
          'Prazo de validade',
          'Lote',
          'Tabela nutricional'
        ],
        last_update: '2020-12-08',
        official_url: 'https://www.in.gov.br/web/dou/-/resolucao-rdc-n-429-de-8-de-outubro-de-2020-280222903'
      },
      '26': {
        number: '26/2015',
        title: 'Regulamenta Suplementos Alimentares',
        description: 'Define os requisitos para suplementos alimentares',
        requirements: [
          'Identificação clara como suplemento',
          'Ingredientes permitidos',
          'Declaração de alergênicos',
          'Modo de uso recomendado',
          'Advertências obrigatórias'
        ],
        last_update: '2015-05-25',
        official_url: 'https://www.in.gov.br/web/dou/-/resolucao-rdc-n-26-de-25-de-maio-de-2015-17975826'
      },
      '657': {
        number: '657/2022',
        title: 'Regulamenta Software Médico (SaMD)',
        description: 'Define os requisitos para software de uso médico',
        requirements: [
          'Classificação de risco',
          'Documentação técnica',
          'Testes de segurança',
          'Rastreabilidade'
        ],
        last_update: '2022-11-23',
        official_url: 'https://www.in.gov.br/web/dou/-/resolucao-rdc-n-657-de-23-de-novembro-de-2022-442618919'
      }
    };

    const info = rdcInfo[rdc_number];
    if (!info) {
      res.status(404).json({ error: 'RDC não encontrada' });
      return;
    }

    res.status(200).json(info);
  } catch (error: any) {
    console.error('Erro ao obter informações da RDC:', error);
    res.status(500).json({ error: 'Erro ao obter informações da RDC' });
  }
});

/**
 * GET /api/compliance/rdcs
 * Lista todas as RDCs suportadas
 */
router.get('/rdcs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rdcs = [
      {
        number: '429/2020',
        title: 'Rotulagem de Alimentos',
        scope: 'Alimentos embalados'
      },
      {
        number: '26/2015',
        title: 'Suplementos Alimentares',
        scope: 'Suplementos alimentares'
      },
      {
        number: '657/2022',
        title: 'Software Médico (SaMD)',
        scope: 'Softwares de uso médico'
      }
    ];

    res.status(200).json({
      total: rdcs.length,
      rdcs
    });
  } catch (error: any) {
    console.error('Erro ao listar RDCs:', error);
    res.status(500).json({ error: 'Erro ao listar RDCs' });
  }
});

/**
 * POST /api/compliance/generate-report
 * Gera relatório de conformidade
 */
router.post('/generate-report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      labelId,
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      ingredientes,
      modo_uso
    } = req.body;

    if (!labelId || !tipo_suplemento) {
      res.status(400).json({ error: 'labelId e tipo_suplemento são obrigatórios' });
      return;
    }

    // Valida conformidade
    const compliance: AnvisaCompliance = validateAnvisaCompliance({
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      ingredientes,
      modo_uso
    });

    // Gera relatório
    const reportText = generateComplianceReport(labelId, compliance);

    // Calcula percentual
    const totalChecks = 3;
    const passedChecks = [compliance.rdc429.valid, compliance.rdc26.valid, compliance.warnings.valid].filter(Boolean).length;
    const compliancePercentage = (passedChecks / totalChecks) * 100;

    // Log de auditoria
    createAuditLog(
      userId || '',
      'GENERATE',
      'ComplianceReport',
      labelId,
      req.ip || '',
      (req.get('user-agent') || ''),
      { tipo_suplemento },
      'SUCCESS'
    );

    res.status(200).json({
      report: {
        id: uuidv4(),
        label_id: labelId,
        compliance_percentage: compliancePercentage,
        validations: [
          {
            name: 'RDC 429/2020',
            passed: compliance.rdc429.valid,
            errors: compliance.rdc429.errors
          },
          {
            name: 'RDC 26/2015',
            passed: compliance.rdc26.valid,
            errors: compliance.rdc26.errors
          },
          {
            name: 'Advertências',
            passed: compliance.warnings.valid,
            errors: compliance.warnings.errors
          }
        ],
        recommendations: compliance.overallErrors.map(error => `Corrigir: ${error}`),
        generated_at: new Date().toISOString(),
        report_text: reportText
      }
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

/**
 * GET /api/compliance/calculator/rdc429
 * Calculadora de conformidade RDC 429
 */
router.get('/calculator/rdc429', authMiddleware, async (req: Request, res: Response) => {
  try {
    const calculator = {
      title: 'Calculadora de Conformidade RDC 429/2020',
      fields: [
        {
          name: 'valor_energetico',
          label: 'Valor Energético (kcal)',
          required: true,
          unit: 'kcal'
        },
        {
          name: 'carboidratos',
          label: 'Carboidratos',
          required: true,
          unit: 'g'
        },
        {
          name: 'proteinas',
          label: 'Proteínas',
          required: true,
          unit: 'g'
        },
        {
          name: 'gorduras_totais',
          label: 'Gorduras Totais',
          required: true,
          unit: 'g'
        },
        {
          name: 'sodio',
          label: 'Sódio',
          required: true,
          unit: 'mg'
        }
      ],
      instructions: 'Preencha os campos acima com os valores nutricionais do seu produto'
    };

    res.status(200).json(calculator);
  } catch (error: any) {
    console.error('Erro ao obter calculadora:', error);
    res.status(500).json({ error: 'Erro ao obter calculadora' });
  }
});

export default router;
