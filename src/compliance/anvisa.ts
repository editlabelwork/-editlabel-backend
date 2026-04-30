/**
 * Conformidade com Regulamentações ANVISA
 * RDC 429/2020, RDC 26/2015, RDC 240/2018, RDC 657/2022
 */

export interface NutritionalReference {
  nutrient: string;
  unit: string;
  dailyValue: number;
  minValue?: number;
  maxValue?: number;
}

/**
 * Valores de Referência Diária (VD) conforme RDC 429/2020
 */
export const NUTRITIONAL_REFERENCES: NutritionalReference[] = [
  { nutrient: 'Valor Energético', unit: 'kcal', dailyValue: 2000 },
  { nutrient: 'Carboidratos', unit: 'g', dailyValue: 300 },
  { nutrient: 'Proteínas', unit: 'g', dailyValue: 50 },
  { nutrient: 'Gorduras Totais', unit: 'g', dailyValue: 55 },
  { nutrient: 'Gordura Saturada', unit: 'g', dailyValue: 20 },
  { nutrient: 'Gordura Trans', unit: 'g', dailyValue: 0, maxValue: 0 },
  { nutrient: 'Fibra Alimentar', unit: 'g', dailyValue: 25 },
  { nutrient: 'Sódio', unit: 'mg', dailyValue: 2400 },
  { nutrient: 'Vitamina A', unit: 'mcg', dailyValue: 600 },
  { nutrient: 'Vitamina C', unit: 'mg', dailyValue: 45 },
  { nutrient: 'Vitamina D', unit: 'mcg', dailyValue: 10 },
  { nutrient: 'Vitamina E', unit: 'mg', dailyValue: 10 },
  { nutrient: 'Vitamina K', unit: 'mcg', dailyValue: 55 },
  { nutrient: 'Tiamina', unit: 'mg', dailyValue: 1.2 },
  { nutrient: 'Riboflavina', unit: 'mg', dailyValue: 1.3 },
  { nutrient: 'Niacina', unit: 'mg', dailyValue: 16 },
  { nutrient: 'Vitamina B6', unit: 'mg', dailyValue: 1.3 },
  { nutrient: 'Ácido Fólico', unit: 'mcg', dailyValue: 240 },
  { nutrient: 'Vitamina B12', unit: 'mcg', dailyValue: 2.4 },
  { nutrient: 'Cálcio', unit: 'mg', dailyValue: 1000 },
  { nutrient: 'Fósforo', unit: 'mg', dailyValue: 700 },
  { nutrient: 'Magnésio', unit: 'mg', dailyValue: 320 },
  { nutrient: 'Ferro', unit: 'mg', dailyValue: 8 },
  { nutrient: 'Zinco', unit: 'mg', dailyValue: 11 },
  { nutrient: 'Cobre', unit: 'mg', dailyValue: 0.9 },
  { nutrient: 'Manganês', unit: 'mg', dailyValue: 2.3 },
  { nutrient: 'Selênio', unit: 'mcg', dailyValue: 34 },
  { nutrient: 'Iodo', unit: 'mcg', dailyValue: 150 }
];

/**
 * Alergênicos declaráveis conforme RDC 26/2015
 */
export const ALLERGENS = [
  'Glúten',
  'Leite e derivados',
  'Soja',
  'Ovo',
  'Amendoim',
  'Castanhas',
  'Peixe',
  'Crustáceos',
  'Trigo',
  'Centeio',
  'Cevada',
  'Aveia',
  'Látex natural',
  'Aromatizante/Corante'
];

/**
 * Advertências obrigatórias conforme RDC 429/2020
 */
export const MANDATORY_WARNINGS = [
  'ESTE PRODUTO NÃO É UM MEDICAMENTO.',
  'NÃO EXCEDER A RECOMENDAÇÃO DIÁRIA DE CONSUMO INDICADA NA EMBALAGEM.',
  'MANTENHA FORA DO ALCANCE DE CRIANÇAS.'
];

/**
 * Validação de tabela nutricional
 */
export interface NutritionalValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida tabela nutricional conforme RDC 429/2020
 */
export const validateNutritionalTable = (
  nutrients: Array<{ name: string; value: number; unit: string }>
): NutritionalValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verifica se tem valor energético
  const energyValue = nutrients.find(n => n.name === 'Valor Energético');
  if (!energyValue) {
    errors.push('Valor Energético é obrigatório');
  } else if (energyValue.value <= 0) {
    errors.push('Valor Energético deve ser maior que 0');
  }

  // Verifica se tem proteínas
  const proteins = nutrients.find(n => n.name === 'Proteínas');
  if (!proteins) {
    errors.push('Proteínas é obrigatório');
  }

  // Verifica se tem carboidratos
  const carbs = nutrients.find(n => n.name === 'Carboidratos');
  if (!carbs) {
    errors.push('Carboidratos é obrigatório');
  }

  // Verifica se tem gorduras
  const fats = nutrients.find(n => n.name === 'Gorduras Totais');
  if (!fats) {
    errors.push('Gorduras Totais é obrigatório');
  }

  // Verifica se tem sódio
  const sodium = nutrients.find(n => n.name === 'Sódio');
  if (!sodium) {
    errors.push('Sódio é obrigatório');
  }

  // Validações de valores
  for (const nutrient of nutrients) {
    const ref = NUTRITIONAL_REFERENCES.find(r => r.nutrient === nutrient.name);
    
    if (ref) {
      if (nutrient.value < 0) {
        errors.push(`${nutrient.name} não pode ser negativo`);
      }
      
      if (ref.maxValue !== undefined && nutrient.value > ref.maxValue) {
        errors.push(`${nutrient.name} excede o valor máximo permitido (${ref.maxValue}${nutrient.unit})`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validação de alergênicos
 */
export interface AllergenValidation {
  valid: boolean;
  errors: string[];
  declaredAllergens: string[];
}

/**
 * Valida declaração de alergênicos
 */
export const validateAllergens = (
  declaredAllergens: string[]
): AllergenValidation => {
  const errors: string[] = [];
  const validAllergens: string[] = [];

  for (const allergen of declaredAllergens) {
    if (!ALLERGENS.includes(allergen)) {
      errors.push(`Alergênico não reconhecido: ${allergen}`);
    } else {
      validAllergens.push(allergen);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    declaredAllergens: validAllergens
  };
};

/**
 * Validação de advertências
 */
export interface WarningValidation {
  valid: boolean;
  errors: string[];
  missingWarnings: string[];
}

/**
 * Valida advertências obrigatórias
 */
export const validateWarnings = (
  warnings: string[]
): WarningValidation => {
  const errors: string[] = [];
  const missingWarnings: string[] = [];

  for (const mandatory of MANDATORY_WARNINGS) {
    if (!warnings.some(w => w.includes(mandatory))) {
      missingWarnings.push(mandatory);
    }
  }

  if (missingWarnings.length > 0) {
    errors.push(`Faltam advertências obrigatórias: ${missingWarnings.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    missingWarnings
  };
};

/**
 * Classificação de risco para SaMD (RDC 657/2022)
 */
export enum SaMDRiskClass {
  CLASS_I = 'I',
  CLASS_II = 'II',
  CLASS_III = 'III',
  CLASS_IV = 'IV'
}

/**
 * Determina classificação de risco
 */
export const determineSaMDRiskClass = (
  functionality: string
): SaMDRiskClass => {
  // Lógica simplificada de classificação
  if (functionality.includes('diagnóstico')) {
    return SaMDRiskClass.CLASS_III;
  }
  if (functionality.includes('tratamento')) {
    return SaMDRiskClass.CLASS_III;
  }
  if (functionality.includes('monitoramento')) {
    return SaMDRiskClass.CLASS_II;
  }
  if (functionality.includes('informação')) {
    return SaMDRiskClass.CLASS_I;
  }
  return SaMDRiskClass.CLASS_I;
};

/**
 * Validação completa de conformidade ANVISA
 */
export interface AnvisaCompliance {
  valid: boolean;
  rdc429: NutritionalValidation;
  rdc26: AllergenValidation;
  warnings: WarningValidation;
  overallErrors: string[];
}

/**
 * Valida conformidade completa com ANVISA
 */
export const validateAnvisaCompliance = (
  label: any
): AnvisaCompliance => {
  const rdc429 = validateNutritionalTable(label.tabelaNutricional || []);
  const rdc26 = validateAllergens(label.alergênicos || []);
  const warnings = validateWarnings(label.advertências || []);

  const overallErrors = [
    ...rdc429.errors,
    ...rdc26.errors,
    ...warnings.errors
  ];

  return {
    valid: overallErrors.length === 0,
    rdc429,
    rdc26,
    warnings,
    overallErrors
  };
};

/**
 * Gera relatório de conformidade
 */
export const generateComplianceReport = (
  labelId: string,
  compliance: AnvisaCompliance
): string => {
  const timestamp = new Date().toISOString();
  
  return `
RELATÓRIO DE CONFORMIDADE ANVISA
================================
ID do Rótulo: ${labelId}
Data: ${timestamp}
Status: ${compliance.valid ? '✅ CONFORME' : '❌ NÃO CONFORME'}

RDC 429/2020 - Rotulagem Nutricional
Status: ${compliance.rdc429.valid ? '✅ CONFORME' : '❌ NÃO CONFORME'}
${compliance.rdc429.errors.length > 0 ? `Erros: ${compliance.rdc429.errors.join(', ')}` : 'Sem erros'}

RDC 26/2015 - Alergênicos
Status: ${compliance.rdc26.valid ? '✅ CONFORME' : '❌ NÃO CONFORME'}
${compliance.rdc26.errors.length > 0 ? `Erros: ${compliance.rdc26.errors.join(', ')}` : 'Sem erros'}

Advertências Obrigatórias
Status: ${compliance.warnings.valid ? '✅ CONFORME' : '❌ NÃO CONFORME'}
${compliance.warnings.errors.length > 0 ? `Erros: ${compliance.warnings.errors.join(', ')}` : 'Sem erros'}

Erros Gerais:
${compliance.overallErrors.length > 0 ? compliance.overallErrors.map(e => `- ${e}`).join('\n') : 'Nenhum erro encontrado'}
  `;
};
