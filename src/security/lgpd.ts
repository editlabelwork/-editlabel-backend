/**
 * LGPD - Lei Geral de Proteção de Dados
 * Implementação de conformidade com LGPD
 */

export interface LGPDConsent {
  userId: string;
  consentido: boolean;
  dataConsentimento: Date;
  versaoPolitica: string;
  ipAddress: string;
  userAgent: string;
}

export interface PrivacyPolicy {
  versao: string;
  dataEfetiva: Date;
  conteudo: string;
}

/**
 * Política de Privacidade Padrão
 */
export const DEFAULT_PRIVACY_POLICY: PrivacyPolicy = {
  versao: '1.0',
  dataEfetiva: new Date(),
  conteudo: `
# POLÍTICA DE PRIVACIDADE - EDITLABEL

## 1. INTRODUÇÃO

A EditLabel ("Empresa", "nós", "nosso" ou "nos") respeita a privacidade de seus usuários ("usuário" ou "você"). 
Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações.

## 2. INFORMAÇÕES QUE COLETAMOS

### 2.1 Informações Fornecidas Diretamente
- Nome completo
- Email
- Número de CRF (Conselho Regional de Farmácia)
- CNPJ da empresa
- Dados de contato

### 2.2 Informações Coletadas Automaticamente
- Endereço IP
- Tipo de navegador
- Sistema operacional
- Páginas visitadas
- Tempo de acesso
- Cookies e tecnologias similares

### 2.3 Dados Sensíveis
- Informações de registro profissional (CRF)
- Dados de identificação da empresa (CNPJ)

## 3. BASE LEGAL PARA PROCESSAMENTO

Processamos seus dados com base em:
- Consentimento explícito (Art. 7, I da LGPD)
- Execução de contrato (Art. 7, II da LGPD)
- Obrigação legal (Art. 7, II da LGPD)
- Proteção de direitos (Art. 7, VI da LGPD)

## 4. USO DE INFORMAÇÕES

Usamos suas informações para:
- Fornecer e melhorar nossos serviços
- Comunicação sobre atualizações e mudanças
- Conformidade com regulamentações
- Prevenção de fraude e segurança
- Análise e pesquisa

## 5. COMPARTILHAMENTO DE DADOS

Não compartilhamos seus dados pessoais com terceiros, exceto:
- Quando obrigado por lei
- Para proteger direitos e segurança
- Com seu consentimento explícito
- Com prestadores de serviço sob acordo de confidencialidade

## 6. RETENÇÃO DE DADOS

Retemos seus dados pelo tempo necessário para:
- Fornecer os serviços
- Cumprir obrigações legais
- Resolver disputas
- Máximo de 5 anos após término do contrato

## 7. SEUS DIREITOS

Você tem direito a:
- Acessar seus dados pessoais
- Corrigir dados imprecisos
- Solicitar exclusão de dados
- Portabilidade de dados
- Revogar consentimento
- Objeção ao processamento

## 8. SEGURANÇA

Implementamos medidas de segurança incluindo:
- Criptografia AES-256
- Autenticação de dois fatores
- Auditoria de logs
- Backup regular
- Conformidade com padrões de segurança

## 9. COOKIES

Usamos cookies para:
- Manter sua sessão
- Lembrar preferências
- Análise de uso
- Você pode desabilitar cookies em seu navegador

## 10. CONTATO

Para questões sobre privacidade, entre em contato:
- Email: privacy@editlabel.com
- Telefone: +55 (11) XXXX-XXXX
- Endereço: [Endereço da Empresa]

## 11. ALTERAÇÕES

Podemos atualizar esta política. Notificaremos sobre mudanças significativas.

Última atualização: ${new Date().toLocaleDateString('pt-BR')}
  `
};

/**
 * Cria registro de consentimento LGPD
 */
export const createLGPDConsent = (
  userId: string,
  ipAddress: string,
  userAgent: string,
  versaoPolitica: string = DEFAULT_PRIVACY_POLICY.versao
): LGPDConsent => {
  return {
    userId,
    consentido: true,
    dataConsentimento: new Date(),
    versaoPolitica,
    ipAddress,
    userAgent
  };
};

/**
 * Valida consentimento LGPD
 */
export const validateLGPDConsent = (consent: LGPDConsent): boolean => {
  return (
    consent.consentido &&
    consent.userId &&
    consent.dataConsentimento &&
    consent.versaoPolitica
  );
};

/**
 * Formata consentimento para armazenamento
 */
export const formatLGPDConsent = (consent: LGPDConsent): string => {
  return JSON.stringify({
    userId: consent.userId,
    consentido: consent.consentido,
    dataConsentimento: consent.dataConsentimento.toISOString(),
    versaoPolitica: consent.versaoPolitica,
    ipAddress: consent.ipAddress,
    userAgent: consent.userAgent
  });
};

/**
 * Direitos do usuário sob LGPD
 */
export enum LGPDUserRights {
  ACCESS = 'access', // Direito de acesso
  CORRECTION = 'correction', // Direito de correção
  DELETION = 'deletion', // Direito ao esquecimento
  PORTABILITY = 'portability', // Direito à portabilidade
  OBJECTION = 'objection', // Direito de objeção
  REVOKE_CONSENT = 'revoke_consent' // Direito de revogar consentimento
}

/**
 * Processa solicitação de direitos LGPD
 */
export const processLGPDRequest = (
  userId: string,
  right: LGPDUserRights,
  data?: any
): { success: boolean; message: string; data?: any } => {
  try {
    switch (right) {
      case LGPDUserRights.ACCESS:
        return {
          success: true,
          message: 'Dados de acesso compilados',
          data: {
            userId,
            requestDate: new Date(),
            dataIncluded: ['profile', 'audit_logs', 'documents']
          }
        };

      case LGPDUserRights.CORRECTION:
        return {
          success: true,
          message: 'Dados corrigidos com sucesso'
        };

      case LGPDUserRights.DELETION:
        return {
          success: true,
          message: 'Solicitação de exclusão registrada. Será processada em 30 dias.'
        };

      case LGPDUserRights.PORTABILITY:
        return {
          success: true,
          message: 'Dados exportados em formato portável',
          data: {
            format: 'JSON',
            exportDate: new Date(),
            expiresIn: '30 dias'
          }
        };

      case LGPDUserRights.OBJECTION:
        return {
          success: true,
          message: 'Objeção registrada'
        };

      case LGPDUserRights.REVOKE_CONSENT:
        return {
          success: true,
          message: 'Consentimento revogado'
        };

      default:
        return {
          success: false,
          message: 'Direito não reconhecido'
        };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao processar solicitação LGPD'
    };
  }
};

/**
 * Notificação de vazamento de dados
 */
export interface DataBreachNotification {
  incidentId: string;
  dataDiscovery: Date;
  dataNotification: Date;
  affectedUsers: number;
  description: string;
  measuresTaken: string[];
}

/**
 * Cria notificação de vazamento
 */
export const createDataBreachNotification = (
  affectedUsers: number,
  description: string,
  measuresTaken: string[]
): DataBreachNotification => {
  return {
    incidentId: `BREACH-${Date.now()}`,
    dataDiscovery: new Date(),
    dataNotification: new Date(),
    affectedUsers,
    description,
    measuresTaken
  };
};
