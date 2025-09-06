/**
 * Core TypeScript interfaces for Web Data Extractor
 */

/**
 * Contact data structure representing extracted contact information
 */
export interface ContactData {
  /** Nome completo do contato */
  name: string;
  /** Telefone formatado */
  phone: string;
  /** Email validado */
  email: string;
  /** URL da página de origem */
  source: string;
  /** Data/hora da extração */
  timestamp: Date;
}

/**
 * Result of extraction operation containing contacts and metadata
 */
export interface ExtractionResult {
  /** Array of extracted contacts */
  contacts: ContactData[];
  /** HTML elements that were found during extraction */
  elementsFound: HTMLElement[];
  /** Nível de confiança da extração (0-1) */
  confidence: number;
}

/**
 * Configuration options for the extractor
 */
export interface ExtractorConfig {
  /** Whether to highlight found elements */
  highlightElements: boolean;
  /** Maximum number of contacts to extract */
  maxContacts?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
}

/**
 * Notification message structure
 */
export interface NotificationMessage {
  /** Message text */
  message: string;
  /** Message type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Duration in milliseconds (optional) */
  duration?: number;
}