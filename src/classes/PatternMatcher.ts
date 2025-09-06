import { ErrorHandler, ErrorType, ErrorSeverity } from './ErrorHandler.js';

/**
 * Pattern Matcher class for extracting and validating contact data patterns
 */
export class PatternMatcher {
  private errorHandler?: ErrorHandler;
  // Brazilian phone number patterns
  private static readonly PHONE_PATTERNS = {
    // (11) 99999-9999 or (11) 9999-9999
    withParentheses: /\(([1-9]{2})\)\s*([9]?[0-9]{4})-?([0-9]{4})/g,
    // 11 99999-9999 or 11 9999-9999
    withSpace: /([1-9]{2})\s+([9]?[0-9]{4})-?([0-9]{4})/g,
    // +55 11 99999-9999 or +55 11 9999-9999
    international: /\+55\s*([1-9]{2})\s*([9]?[0-9]{4})-?([0-9]{4})/g,
    // General pattern for any Brazilian phone format
    general: /(?:\+55\s*)?(?:\(?([1-9]{2})\)?\s*)?([9]?[0-9]{4})-?([0-9]{4})/g
  };

  // Email pattern for standard email formats
  private static readonly EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  // Portuguese name patterns with proper capitalization
  private static readonly NAME_PATTERNS = {
    // Full name pattern: First name + Last name(s) with proper capitalization and particles
    fullName: /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+(?:d[aeo]s?|da|do|dos|das|de|del|della|van|von|le|la|el)\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+|\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+/g,
    // Simple pattern for names with at least 2 words
    simpleName: /\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]{1,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]{1,}/g
  };

  // Common Brazilian prepositions and articles that can appear in names
  private static readonly NAME_PARTICLES = new Set([
    'da', 'das', 'de', 'do', 'dos', 'del', 'della', 'van', 'von', 'le', 'la', 'el'
  ]);

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Extract phone numbers from text using Brazilian phone patterns
   * @param text Text to search for phone numbers
   * @returns Array of found phone numbers
   */
  extractPhones(text: string): string[] {
    try {
      if (!text || typeof text !== 'string') {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Texto inválido fornecido para extração de telefones',
          undefined,
          { text: typeof text }
        );
        return [];
      }

      const phones: string[] = [];
      const cleanText = text.replace(/\s+/g, ' ').trim();

      // Try each pattern
      Object.values(PatternMatcher.PHONE_PATTERNS).forEach(pattern => {
        try {
          const matches = cleanText.matchAll(new RegExp(pattern.source, 'g'));
          for (const match of matches) {
            const phone = this.formatPhone(match[0]);
            if (phone && this.validatePhone(phone) && !phones.includes(phone)) {
              phones.push(phone);
            }
          }
        } catch (error) {
          this.errorHandler?.handleError(
            ErrorType.PATTERN_MATCHING,
            ErrorSeverity.LOW,
            'Erro ao processar padrão de telefone',
            error as Error,
            { pattern: pattern.source }
          );
        }
      });

      return phones;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.PATTERN_MATCHING,
        ErrorSeverity.MEDIUM,
        'Erro geral na extração de telefones',
        error as Error,
        { textLength: text?.length }
      );
      return [];
    }
  }

  /**
   * Validate if a phone number follows Brazilian format rules
   * @param phone Phone number to validate
   * @returns True if valid Brazilian phone number
   */
  validatePhone(phone: string): boolean {
    // Remove all non-digit characters for validation
    const digits = phone.replace(/\D/g, '');
    
    // Brazilian phone rules:
    // - Must have 10 or 11 digits (with area code)
    // - Area code must be between 11-99
    // - Mobile numbers (11 digits) must start with 9
    // - Landline numbers (10 digits) cannot start with 9
    
    if (digits.length < 10 || digits.length > 11) {
      return false;
    }

    // Extract area code (first 2 digits)
    const areaCode = parseInt(digits.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return false;
    }

    if (digits.length === 11) {
      // Mobile number - must start with 9 after area code
      const firstDigit = digits.charAt(2);
      return firstDigit === '9';
    } else if (digits.length === 10) {
      // Landline number - cannot start with 9 after area code
      const firstDigit = digits.charAt(2);
      return firstDigit !== '9' && firstDigit !== '0' && firstDigit !== '1';
    }

    return false;
  }

  /**
   * Format phone number to standard Brazilian format
   * @param phone Raw phone number
   * @returns Formatted phone number or null if invalid
   */
  formatPhone(phone: string): string | null {
    let digits = phone.replace(/\D/g, '');
    
    // Handle international format with country code +55
    if (digits.length === 13 && digits.startsWith('55')) {
      digits = digits.substring(2); // Remove country code
    } else if (digits.length === 12 && digits.startsWith('55')) {
      digits = digits.substring(2); // Remove country code
    }
    
    // Validate the cleaned digits
    if (digits.length < 10 || digits.length > 11) {
      return null;
    }

    const areaCode = parseInt(digits.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return null;
    }

    if (digits.length === 11) {
      // Mobile number - must start with 9 after area code
      const firstDigit = digits.charAt(2);
      if (firstDigit !== '9') {
        return null;
      }
      // Mobile: (11) 99999-9999
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
      // Landline number - cannot start with 9, 0, or 1 after area code
      const firstDigit = digits.charAt(2);
      if (firstDigit === '9' || firstDigit === '0' || firstDigit === '1') {
        return null;
      }
      // Landline: (11) 9999-9999
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }

    return null;
  }

  /**
   * Extract email addresses from text
   * @param text Text to search for email addresses
   * @returns Array of found email addresses
   */
  extractEmails(text: string): string[] {
    try {
      if (!text || typeof text !== 'string') {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Texto inválido fornecido para extração de emails',
          undefined,
          { text: typeof text }
        );
        return [];
      }

      const emails: string[] = [];
      const matches = text.matchAll(PatternMatcher.EMAIL_PATTERN);
      
      for (const match of matches) {
        try {
          const email = match[0].toLowerCase();
          if (this.validateEmail(email) && !emails.includes(email)) {
            emails.push(email);
          }
        } catch (error) {
          this.errorHandler?.handleError(
            ErrorType.PATTERN_MATCHING,
            ErrorSeverity.LOW,
            'Erro ao processar email encontrado',
            error as Error,
            { match: match[0] }
          );
        }
      }

      return emails;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.PATTERN_MATCHING,
        ErrorSeverity.MEDIUM,
        'Erro geral na extração de emails',
        error as Error,
        { textLength: text?.length }
      );
      return [];
    }
  }

  /**
   * Validate if an email address is in correct format
   * @param email Email address to validate
   * @returns True if valid email format
   */
  validateEmail(email: string): boolean {
    // Basic format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional validation rules
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }

    const [localPart, domain] = parts;

    // Local part validation
    if (localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    // Cannot start or end with dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    // Cannot have consecutive dots
    if (localPart.includes('..')) {
      return false;
    }

    // Domain validation
    if (domain.length === 0 || domain.length > 253) {
      return false;
    }

    // Domain cannot start or end with dot or hyphen
    if (domain.startsWith('.') || domain.endsWith('.') || 
        domain.startsWith('-') || domain.endsWith('-')) {
      return false;
    }

    // Domain must have at least one dot
    if (!domain.includes('.')) {
      return false;
    }

    // Check for valid domain parts
    const domainParts = domain.split('.');
    for (const part of domainParts) {
      if (part.length === 0 || part.length > 63) {
        return false;
      }
      // Domain parts cannot start or end with hyphen
      if (part.startsWith('-') || part.endsWith('-')) {
        return false;
      }
    }

    // Top-level domain must be at least 2 characters
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Extract names from text using Portuguese name patterns
   * @param text Text to search for names
   * @returns Array of found names
   */
  extractNames(text: string): string[] {
    try {
      if (!text || typeof text !== 'string') {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Texto inválido fornecido para extração de nomes',
          undefined,
          { text: typeof text }
        );
        return [];
      }

      const names: string[] = [];
      
      // Use a more comprehensive approach to find names
      // Look for sequences of capitalized words that could be names
      const words = text.split(/\s+/);
      let currentName: string[] = [];
      
      for (let i = 0; i < words.length; i++) {
        try {
          const word = words[i].replace(/[^\w\sáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
          
          // Check if word looks like a name part
          if (this.isNameWord(word)) {
            currentName.push(word);
            
            // Look ahead for particles and continue the name
            let j = i + 1;
            while (j < words.length) {
              const nextWord = words[j].replace(/[^\w\sáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '');
              if (this.isNameWord(nextWord)) {
                currentName.push(nextWord);
                i = j; // Skip ahead
                j++;
              } else {
                break;
              }
            }
            
            // Check if we have a complete name
            if (currentName.length >= 2) {
              const nameCandidate = currentName.join(' ');
              const formattedName = this.formatName(nameCandidate);
              if (formattedName && this.validateName(formattedName) && !names.includes(formattedName)) {
                names.push(formattedName);
              }
            }
            currentName = [];
          }
        } catch (error) {
          this.errorHandler?.handleError(
            ErrorType.PATTERN_MATCHING,
            ErrorSeverity.LOW,
            'Erro ao processar palavra para extração de nome',
            error as Error,
            { word: words[i], index: i }
          );
        }
      }

      return names;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.PATTERN_MATCHING,
        ErrorSeverity.MEDIUM,
        'Erro geral na extração de nomes',
        error as Error,
        { textLength: text?.length }
      );
      return [];
    }
  }

  /**
   * Check if a word could be part of a name
   * @param word Word to check
   * @returns True if word could be part of a name
   */
  private isNameWord(word: string): boolean {
    if (!word || word.length < 2) {
      return false;
    }

    const lowerWord = word.toLowerCase();

    // Check if it's a name particle first (particles can be lowercase)
    if (PatternMatcher.NAME_PARTICLES.has(lowerWord)) {
      return true;
    }

    // Must start with uppercase for regular name words
    if (!/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(word)) {
      return false;
    }

    // Reject common non-name words
    const nonNameWords = new Set([
      'contato', 'contatos', 'email', 'telefone', 'phone', 'endereço', 'address',
      'rua', 'street', 'cidade', 'city', 'gerente', 'diretor', 'responsável',
      'manager', 'director', 'contact', 'info', 'information', 'empresa', 'company'
    ]);

    if (nonNameWords.has(lowerWord)) {
      return false;
    }

    // Regular name word - must be properly capitalized and at least 2 chars
    return /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+$/.test(word) && word.length >= 2;
  }

  /**
   * Validate if a name follows Portuguese naming conventions
   * @param name Name to validate
   * @returns True if valid Portuguese name
   */
  validateName(name: string): boolean {
    const trimmedName = name.trim();
    
    // Must have at least 2 characters
    if (trimmedName.length < 2) {
      return false;
    }

    // Must have at least 2 words (first name + last name)
    const words = trimmedName.split(/\s+/);
    if (words.length < 2) {
      return false;
    }

    // Check each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip validation for name particles (prepositions/articles)
      if (PatternMatcher.NAME_PARTICLES.has(word.toLowerCase())) {
        continue;
      }

      // Each name part must be at least 2 characters (except particles)
      if (word.length < 2) {
        return false;
      }

      // For non-particles, require at least 3 characters for a valid name
      if (!PatternMatcher.NAME_PARTICLES.has(word.toLowerCase()) && word.length < 3) {
        return false;
      }

      // Must start with uppercase letter
      if (!/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(word)) {
        return false;
      }

      // Rest must be lowercase letters (with accents)
      if (!/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+$/.test(word)) {
        return false;
      }
    }

    // Reject common non-name patterns
    const lowerName = trimmedName.toLowerCase();
    const invalidPatterns = [
      /\b(email|telefone|phone|contact|contato|endereço|address|rua|street|cidade|city)\b/,
      /\b(segunda|terça|quarta|quinta|sexta|sábado|domingo)\b/,
      /\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(lowerName)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Format name with proper capitalization
   * @param name Raw name string
   * @returns Formatted name or null if invalid
   */
  formatName(name: string): string | null {
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    
    if (!trimmedName) {
      return null;
    }

    const words = trimmedName.split(' ');
    const formattedWords = words.map((word, index) => {
      const lowerWord = word.toLowerCase();
      
      // Keep name particles lowercase (except if it's the first word)
      if (index > 0 && PatternMatcher.NAME_PARTICLES.has(lowerWord)) {
        return lowerWord;
      }
      
      // Capitalize first letter, rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return formattedWords.join(' ');
  }
}