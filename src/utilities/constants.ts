// Constants and configuration
export const ERROR_MESSAGES = {
  NO_DATA_FOUND: 'Nenhum dado de contato encontrado na página',
  INVALID_EMAIL: 'Email inválido detectado',
  INVALID_PHONE: 'Telefone em formato inválido',
  EXPORT_FAILED: 'Falha ao gerar arquivo CSV',
  DOM_ACCESS_ERROR: 'Erro ao acessar elementos da página',
  PATTERN_MATCHING_ERROR: 'Erro ao processar padrões de texto',
  DATA_STORAGE_ERROR: 'Erro ao armazenar dados',
  UI_RENDERING_ERROR: 'Erro ao renderizar interface',
  NETWORK_ERROR: 'Erro de conexão de rede',
  PERMISSION_ERROR: 'Permissão negada pelo navegador',
  BROWSER_COMPATIBILITY_ERROR: 'Navegador não suportado',
  UNEXPECTED_ERROR: 'Erro inesperado ocorreu'
} as const;

export const SUCCESS_MESSAGES = {
  DATA_EXTRACTED: 'Dados extraídos com sucesso',
  CONTACT_SAVED: 'Contato salvo com sucesso',
  CONTACT_UPDATED: 'Contato atualizado com sucesso',
  CONTACT_REMOVED: 'Contato removido com sucesso',
  CSV_EXPORTED: 'Arquivo CSV exportado com sucesso',
  SESSION_SAVED: 'Sessão salva com sucesso'
} as const;

export const WARNING_MESSAGES = {
  NO_CONTACTS_SELECTED: 'Nenhum contato selecionado',
  DUPLICATE_CONTACT: 'Contato duplicado detectado',
  INCOMPLETE_DATA: 'Dados incompletos detectados',
  BROWSER_STORAGE_FULL: 'Armazenamento do navegador está cheio'
} as const;

export const INFO_MESSAGES = {
  SCANNING_PAGE: 'Escaneando página em busca de contatos...',
  PROCESSING_DATA: 'Processando dados extraídos...',
  PREPARING_EXPORT: 'Preparando arquivo para exportação...',
  SESSION_RESTORED: 'Sessão anterior restaurada'
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  PHONE_BR: /(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}[-\s]?[0-9]{4}/g,
  NAME: /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+\b/g
} as const;