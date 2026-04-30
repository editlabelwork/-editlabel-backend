import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validateAnvisaCompliance, generateComplianceReport } from '../compliance/anvisa';
import { createAuditLog } from '../security/audit';

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
    const compliance = validateAnvisaCompliance({
      tipo_suplemento,
      tabelaNutricional,
      alergênicos,
      advertências,
      ingredientes,
      modo_uso
    });

    // Log de auditoria
    createAuditLog(
      userId,
      'VALIDATE',
      'Compliance',
      'compliance-check',
      req.ip || '',
      req.get('user-agent') || '',
      { tipo_suplemento },
      'SUCCESS'
    );

    res.status(200).json({
      compliance,
      summary: {
        total_validations: compliance.validations.length,
        passed: compliance.validations.filter((v: any) => v.passed).length,
        failed: compliance.validations.filter((v: any) => !v.passed).length,
        compliance_percentage: compliance.compliance_percentage
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
    const { rdc_number } = req.params;

    // Mapeamento de RDCs
    const rdcInfo: any = {
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
          'Modo de uso',
          'Advertências obrigatórias',
          'Tabela nutricional',
          'Lote e validade'
        ],
        last_update: '2015-05-25',
        official_url: 'https://www.in.gov.br/materia/-/asset_publisher/Kujrw0TZC2Mb/content/id/30817949'
      },
      '657': {
        number: '657/2022',
        title: 'Software como Dispositivo Médico',
        description: 'Regulamenta software como dispositivo médico',
        requirements: [
          'Documentação técnica',
          'Testes de segurança',
          'Validação de funcionalidades',
          'Rastreabilidade',
          'Conformidade com padrões internacionais'
        ],
        last_update: '2022-09-23',
        official_url: 'https://www.in.gov.br/web/dou/-/resolucao-rdc-n-657-de-23-de-setembro-de-2022-432923302'
      }
    };

    const info = rdcInfo[rdc_number];
    if (!info) {
      res.status(404).json({ error: 'RDC não encontrada' });
      return;
    }

    res.status(200).json({
      rdc: info
    });
  } catch (error: any) {
    console.error('Erro ao obter RDC:', error);
    res.status(500).json({ error: 'Erro ao obter informações da RDC' });
  }
});

/**
 * GET /api/compliance/rdcs
 * Lista todas as RDCs relevantes
 */
router.get('/rdcs', authMiddleware, async (req: Request, res: Response) => {
  try {
    const rdcs = [
      {
        number: '429/2020',
        title: 'Rotulagem de Alimentos',
        description: 'Requisitos para rotulagem de alimentos embalados',
        type: 'food_labeling',
        status: 'active'
      },
      {
        number: '26/2015',
        title: 'Suplementos Alimentares',
        description: 'Requisitos para suplementos alimentares',
        type: 'supplements',
        status: 'active'
      },
      {
        number: '657/2022',
        title: 'Software como Dispositivo Médico',
        description: 'Regulamenta software como dispositivo médico',
        type: 'software_medical_device',
        status: 'active'
      },
      {
        number: '259/2002',
        title: 'Regulamento Técnico sobre Rotulagem de Alimentos Embalados',
        description: 'Requisitos técnicos para rotulagem',
        type: 'labeling',
        status: 'superseded'
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
 * Gera relatório de conformidade completo
 */
router.post('/generate-report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { labelId, compliance } = req.body;

    if (!labelId || !compliance) {
      res.status(400).json({ error: 'labelId e compliance são obrigatórios' });
      return;
    }

    // Gera relatório
    const report = generateComplianceReport(labelId, compliance);

    // Log de auditoria
    createAuditLog(
      userId,
      'GENERATE',
      'ComplianceReport',
      labelId,
      req.ip || '',
      req.get('user-agent') || '',
      undefined,
      'SUCCESS'
    );

    res.status(200).json({
      reportId: report.id,
      labelId,
      compliance_percentage: report.compliance_percentage,
      validations: report.validations,
      recommendations: report.recommendations,
      generated_at: report.generated_at
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

/**
 * GET /api/compliance/calculator/rdc429
 * Calculadora RDC 429
 */
router.get('/calculator/rdc429', authMiddleware, async (req: Request, res: Response) => {
  try {
    const calculator = {
      name: 'Calculadora RDC 429/2020',
      description: 'Calcula conformidade com RDC 429/2020',
      fields: [
        {
          name: 'denominacao',
          label: 'Denominação do Produto',
          type: 'text',
          required: true
        },
        {
          name: 'ingredientes',
          label: 'Lista de Ingredientes',
          type: 'textarea',
          required: true
        },
        {
          name: 'alergênicos',
          label: 'Alergênicos',
          type: 'multiselect',
          options: ['Glúten', 'Leite', 'Ovos', 'Amendoim', 'Castanha', 'Soja', 'Peixe', 'Crustáceo'],
          required: true
        },
        {
          name: 'conteudo_liquido',
          label: 'Conteúdo Líquido',
          type: 'text',
          required: true
        },
        {
          name: 'tabela_nutricional',
          label: 'Tabela Nutricional',
          type: 'table',
          required: true
        }
      ]
    };

    res.status(200).json(calculator);
  } catch (error: any) {
    console.error('Erro ao obter calculadora:', error);
    res.status(500).json({ error: 'Erro ao obter calculadora' });
  }
});

export default router;
