import { describe, it, expect, beforeEach } from 'vitest';
import { PatternMatcher } from '../classes/PatternMatcher';

describe('PatternMatcher - Phone Pattern Matching', () => {
  let patternMatcher: PatternMatcher;

  beforeEach(() => {
    patternMatcher = new PatternMatcher();
  });

  describe('extractPhones', () => {
    it('should extract phone with parentheses format', () => {
      const text = 'Contato: (11) 99999-9999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toContain('(11) 99999-9999');
    });

    it('should extract phone with space format', () => {
      const text = 'Telefone: 11 99999-9999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toContain('(11) 99999-9999');
    });

    it('should extract international format', () => {
      const text = 'WhatsApp: +55 11 99999-9999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toContain('(11) 99999-9999');
    });

    it('should extract landline numbers', () => {
      const text = 'Fixo: (11) 3333-4444';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toContain('(11) 3333-4444');
    });

    it('should extract multiple phones from text', () => {
      const text = 'Celular: (11) 99999-9999 Fixo: (11) 3333-4444';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toHaveLength(2);
      expect(phones).toContain('(11) 99999-9999');
      expect(phones).toContain('(11) 3333-4444');
    });

    it('should handle phones without dashes', () => {
      const text = 'Tel: (11) 999999999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toContain('(11) 99999-9999');
    });

    it('should not extract invalid phone numbers', () => {
      const text = 'Invalid: 123456789 or (00) 99999-9999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toHaveLength(0);
    });

    it('should not duplicate phones', () => {
      const text = '(11) 99999-9999 and 11 99999-9999';
      const phones = patternMatcher.extractPhones(text);
      expect(phones).toHaveLength(1);
      expect(phones[0]).toBe('(11) 99999-9999');
    });
  });

  describe('validatePhone', () => {
    it('should validate mobile numbers (11 digits)', () => {
      expect(patternMatcher.validatePhone('11999999999')).toBe(true);
      expect(patternMatcher.validatePhone('21987654321')).toBe(true);
    });

    it('should validate landline numbers (10 digits)', () => {
      expect(patternMatcher.validatePhone('1133334444')).toBe(true);
      expect(patternMatcher.validatePhone('2133334444')).toBe(true);
    });

    it('should reject invalid area codes', () => {
      expect(patternMatcher.validatePhone('0999999999')).toBe(false);
      expect(patternMatcher.validatePhone('1099999999')).toBe(false);
    });

    it('should reject mobile numbers not starting with 9', () => {
      expect(patternMatcher.validatePhone('11899999999')).toBe(false);
      expect(patternMatcher.validatePhone('11799999999')).toBe(false);
    });

    it('should reject landline numbers starting with 9', () => {
      expect(patternMatcher.validatePhone('1199999999')).toBe(false);
    });

    it('should reject numbers with wrong length', () => {
      expect(patternMatcher.validatePhone('119999999')).toBe(false); // 9 digits
      expect(patternMatcher.validatePhone('119999999999')).toBe(false); // 12 digits
    });

    it('should reject landline starting with 0 or 1', () => {
      expect(patternMatcher.validatePhone('1103334444')).toBe(false);
      expect(patternMatcher.validatePhone('1113334444')).toBe(false);
    });
  });

  describe('formatPhone', () => {
    it('should format mobile numbers correctly', () => {
      expect(patternMatcher.formatPhone('11999999999')).toBe('(11) 99999-9999');
      // For international format, we need to handle the country code
      expect(patternMatcher.formatPhone('5511999999999')).toBe('(11) 99999-9999');
    });

    it('should format landline numbers correctly', () => {
      expect(patternMatcher.formatPhone('1133334444')).toBe('(11) 3333-4444');
      expect(patternMatcher.formatPhone('(11) 3333-4444')).toBe('(11) 3333-4444');
    });

    it('should return null for invalid phones', () => {
      expect(patternMatcher.formatPhone('123456789')).toBe(null);
      expect(patternMatcher.formatPhone('00999999999')).toBe(null);
    });

    it('should handle phones with various formatting', () => {
      expect(patternMatcher.formatPhone('11 99999-9999')).toBe('(11) 99999-9999');
      expect(patternMatcher.formatPhone('(11)99999-9999')).toBe('(11) 99999-9999');
      expect(patternMatcher.formatPhone('5511999999999')).toBe('(11) 99999-9999');
    });
  });

  describe('extractEmails', () => {
    it('should extract valid email addresses', () => {
      const text = 'Contact us at info@company.com or support@example.org';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(2);
      expect(emails).toContain('info@company.com');
      expect(emails).toContain('support@example.org');
    });

    it('should extract emails with various formats', () => {
      const text = 'Emails: user.name@domain.com, test+tag@example.co.uk, user_123@test-domain.net';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(3);
      expect(emails).toContain('user.name@domain.com');
      expect(emails).toContain('test+tag@example.co.uk');
      expect(emails).toContain('user_123@test-domain.net');
    });

    it('should handle emails with numbers and special characters', () => {
      const text = 'Contact: user123@domain.com and test.email+tag@example-site.org';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(2);
      expect(emails).toContain('user123@domain.com');
      expect(emails).toContain('test.email+tag@example-site.org');
    });

    it('should not extract invalid email formats', () => {
      const text = 'Invalid: @domain.com, user@, user@domain, user.domain.com';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(0);
    });

    it('should not duplicate emails', () => {
      const text = 'Same email: test@example.com and test@example.com again';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(1);
      expect(emails[0]).toBe('test@example.com');
    });

    it('should convert emails to lowercase', () => {
      const text = 'Email: USER@DOMAIN.COM';
      const emails = patternMatcher.extractEmails(text);
      expect(emails).toHaveLength(1);
      expect(emails[0]).toBe('user@domain.com');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(patternMatcher.validateEmail('user@domain.com')).toBe(true);
      expect(patternMatcher.validateEmail('test.email@example.org')).toBe(true);
      expect(patternMatcher.validateEmail('user+tag@domain.co.uk')).toBe(true);
      expect(patternMatcher.validateEmail('user_123@test-domain.net')).toBe(true);
    });

    it('should reject emails without @ symbol', () => {
      expect(patternMatcher.validateEmail('userdomain.com')).toBe(false);
      expect(patternMatcher.validateEmail('user.domain.com')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(patternMatcher.validateEmail('user@')).toBe(false);
      expect(patternMatcher.validateEmail('@domain.com')).toBe(false);
    });

    it('should reject emails without TLD', () => {
      expect(patternMatcher.validateEmail('user@domain')).toBe(false);
    });

    it('should reject emails with invalid local part', () => {
      expect(patternMatcher.validateEmail('.user@domain.com')).toBe(false); // starts with dot
      expect(patternMatcher.validateEmail('user.@domain.com')).toBe(false); // ends with dot
      expect(patternMatcher.validateEmail('us..er@domain.com')).toBe(false); // consecutive dots
    });

    it('should reject emails with invalid domain', () => {
      expect(patternMatcher.validateEmail('user@.domain.com')).toBe(false); // starts with dot
      expect(patternMatcher.validateEmail('user@domain.com.')).toBe(false); // ends with dot
      expect(patternMatcher.validateEmail('user@-domain.com')).toBe(false); // starts with hyphen
      expect(patternMatcher.validateEmail('user@domain.com-')).toBe(false); // ends with hyphen
    });

    it('should reject emails with too short TLD', () => {
      expect(patternMatcher.validateEmail('user@domain.c')).toBe(false);
    });

    it('should reject emails with multiple @ symbols', () => {
      expect(patternMatcher.validateEmail('user@@domain.com')).toBe(false);
      expect(patternMatcher.validateEmail('user@domain@com')).toBe(false);
    });

    it('should validate Brazilian email domains', () => {
      expect(patternMatcher.validateEmail('usuario@empresa.com.br')).toBe(true);
      expect(patternMatcher.validateEmail('contato@site.org.br')).toBe(true);
      expect(patternMatcher.validateEmail('info@governo.gov.br')).toBe(true);
    });
  });

  describe('extractNames', () => {
    it('should extract simple Portuguese names', () => {
      const text = 'Contato: João Silva e Maria Santos';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(2);
      expect(names).toContain('João Silva');
      expect(names).toContain('Maria Santos');
    });

    it('should extract names with multiple parts', () => {
      const text = 'Responsável: Ana Paula de Oliveira';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('Ana Paula de Oliveira');
    });

    it('should extract names with common Brazilian particles', () => {
      const text = 'Diretor: José da Silva dos Santos';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('José da Silva dos Santos');
    });

    it('should handle names with accents', () => {
      const text = 'Contatos: André Luís e Mônica Araújo';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(2);
      expect(names).toContain('André Luís');
      expect(names).toContain('Mônica Araújo');
    });

    it('should not extract invalid name patterns', () => {
      const text = 'Email: contato@empresa.com Telefone: (11) 99999-9999';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(0);
    });

    it('should not duplicate names', () => {
      const text = 'João Silva trabalha com João Silva na empresa';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('João Silva');
    });

    it('should extract names from mixed content', () => {
      const text = 'Gerente: Carlos Pereira - Email: carlos@empresa.com - Tel: (11) 99999-9999';
      const names = patternMatcher.extractNames(text);
      expect(names).toHaveLength(1);
      expect(names[0]).toBe('Carlos Pereira');
    });
  });

  describe('validateName', () => {
    it('should validate correct Portuguese names', () => {
      expect(patternMatcher.validateName('João Silva')).toBe(true);
      expect(patternMatcher.validateName('Maria Santos')).toBe(true);
      expect(patternMatcher.validateName('Ana Paula Oliveira')).toBe(true);
      expect(patternMatcher.validateName('José da Silva')).toBe(true);
    });

    it('should validate names with particles', () => {
      expect(patternMatcher.validateName('Pedro dos Santos')).toBe(true);
      expect(patternMatcher.validateName('Ana de Oliveira')).toBe(true);
      expect(patternMatcher.validateName('Carlos da Costa')).toBe(true);
    });

    it('should validate names with accents', () => {
      expect(patternMatcher.validateName('André Luís')).toBe(true);
      expect(patternMatcher.validateName('Mônica Araújo')).toBe(true);
      expect(patternMatcher.validateName('José António')).toBe(true);
    });

    it('should reject single word names', () => {
      expect(patternMatcher.validateName('João')).toBe(false);
      expect(patternMatcher.validateName('Silva')).toBe(false);
    });

    it('should reject names with incorrect capitalization', () => {
      expect(patternMatcher.validateName('joão silva')).toBe(false);
      expect(patternMatcher.validateName('MARIA SANTOS')).toBe(false);
      expect(patternMatcher.validateName('Ana PAULA')).toBe(false);
    });

    it('should reject names with numbers', () => {
      expect(patternMatcher.validateName('João Silva123')).toBe(false);
      expect(patternMatcher.validateName('Maria 2Santos')).toBe(false);
    });

    it('should reject common non-name words', () => {
      expect(patternMatcher.validateName('Email Contato')).toBe(false);
      expect(patternMatcher.validateName('Telefone Endereço')).toBe(false);
      expect(patternMatcher.validateName('Segunda Feira')).toBe(false);
      expect(patternMatcher.validateName('Janeiro Fevereiro')).toBe(false);
    });

    it('should reject too short names', () => {
      expect(patternMatcher.validateName('A B')).toBe(false);
      expect(patternMatcher.validateName('Jo Si')).toBe(false);
      expect(patternMatcher.validateName('An Bo')).toBe(false);
    });
  });

  describe('formatName', () => {
    it('should format names with proper capitalization', () => {
      expect(patternMatcher.formatName('joão silva')).toBe('João Silva');
      expect(patternMatcher.formatName('MARIA SANTOS')).toBe('Maria Santos');
      expect(patternMatcher.formatName('ana PAULA oliveira')).toBe('Ana Paula Oliveira');
    });

    it('should preserve particles in lowercase', () => {
      expect(patternMatcher.formatName('JOSÉ DA SILVA')).toBe('José da Silva');
      expect(patternMatcher.formatName('ana DE oliveira')).toBe('Ana de Oliveira');
      expect(patternMatcher.formatName('pedro DOS santos')).toBe('Pedro dos Santos');
    });

    it('should handle extra whitespace', () => {
      expect(patternMatcher.formatName('  joão   silva  ')).toBe('João Silva');
      expect(patternMatcher.formatName('maria    santos')).toBe('Maria Santos');
    });

    it('should return null for empty names', () => {
      expect(patternMatcher.formatName('')).toBe(null);
      expect(patternMatcher.formatName('   ')).toBe(null);
    });

    it('should capitalize particles when they are first word', () => {
      expect(patternMatcher.formatName('da silva joão')).toBe('Da Silva João');
      expect(patternMatcher.formatName('de oliveira maria')).toBe('De Oliveira Maria');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(patternMatcher.extractPhones(null as any)).toEqual([]);
      expect(patternMatcher.extractPhones(undefined as any)).toEqual([]);
      expect(patternMatcher.extractEmails(null as any)).toEqual([]);
      expect(patternMatcher.extractEmails(undefined as any)).toEqual([]);
      expect(patternMatcher.extractNames(null as any)).toEqual([]);
      expect(patternMatcher.extractNames(undefined as any)).toEqual([]);
    });

    it('should handle non-string inputs', () => {
      expect(patternMatcher.extractPhones(123 as any)).toEqual([]);
      expect(patternMatcher.extractEmails(true as any)).toEqual([]);
      expect(patternMatcher.extractNames({} as any)).toEqual([]);
    });

    it('should handle very long text inputs', () => {
      const longText = 'João Silva '.repeat(1000) + '(11) 99999-9999 ' + 'joao@test.com '.repeat(500);
      const phones = patternMatcher.extractPhones(longText);
      const emails = patternMatcher.extractEmails(longText);
      const names = patternMatcher.extractNames(longText);
      
      expect(phones).toHaveLength(1);
      expect(emails).toHaveLength(1);
      expect(names.length).toBeGreaterThan(0);
    });

    it('should handle text with special characters and unicode', () => {
      const specialText = 'José María Ñoño - (11) 99999-9999 - josé.maría@test.com.br';
      const phones = patternMatcher.extractPhones(specialText);
      const emails = patternMatcher.extractEmails(specialText);
      const names = patternMatcher.extractNames(specialText);
      
      expect(phones).toContain('(11) 99999-9999');
      expect(emails).toContain('josé.maría@test.com.br');
      expect(names).toContain('José María Ñoño');
    });

    it('should handle mixed language content', () => {
      const mixedText = 'Contact: John Smith - Phone: (11) 99999-9999 - Email: john@test.com - Contato: Maria Silva - Telefone: (21) 88888-8888';
      const phones = patternMatcher.extractPhones(mixedText);
      const emails = patternMatcher.extractEmails(mixedText);
      const names = patternMatcher.extractNames(mixedText);
      
      expect(phones).toHaveLength(2);
      expect(emails).toHaveLength(1);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle large amounts of data efficiently', () => {
      const largeText = Array(1000).fill('João Silva (11) 99999-9999 joao@test.com').join(' ');
      
      const startTime = Date.now();
      const phones = patternMatcher.extractPhones(largeText);
      const emails = patternMatcher.extractEmails(largeText);
      const names = patternMatcher.extractNames(largeText);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(phones).toHaveLength(1); // Should deduplicate
      expect(emails).toHaveLength(1); // Should deduplicate
      expect(names).toHaveLength(1); // Should deduplicate
    });

    it('should handle regex-heavy content without performance issues', () => {
      const regexHeavyText = Array(100).fill('(11) 99999-9999 (21) 88888-8888 (31) 77777-7777').join(' ');
      
      const startTime = Date.now();
      const phones = patternMatcher.extractPhones(regexHeavyText);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete quickly
      expect(phones).toHaveLength(3); // Should find all unique phones
    });
  });

  describe('Brazilian-specific Patterns', () => {
    it('should handle Brazilian mobile number variations', () => {
      const brazilianPhones = [
        '(11) 9 9999-9999', // With extra 9
        '11 9 9999-9999',   // Space format with extra 9
        '+55 11 9 9999-9999', // International with extra 9
        '(85) 99999-9999',  // Ceará
        '(21) 98765-4321',  // Rio de Janeiro
        '(47) 99876-5432'   // Santa Catarina
      ];

      brazilianPhones.forEach(phone => {
        const extracted = patternMatcher.extractPhones(`Contact: ${phone}`);
        expect(extracted.length).toBeGreaterThan(0);
      });
    });

    it('should handle Brazilian landline variations', () => {
      const brazilianLandlines = [
        '(11) 3333-4444',   // São Paulo
        '(21) 2222-3333',   // Rio de Janeiro
        '(85) 3444-5555',   // Ceará
        '(47) 3666-7777'    // Santa Catarina
      ];

      brazilianLandlines.forEach(phone => {
        const extracted = patternMatcher.extractPhones(`Office: ${phone}`);
        expect(extracted.length).toBeGreaterThan(0);
      });
    });

    it('should handle Brazilian email domains', () => {
      const brazilianEmails = [
        'usuario@empresa.com.br',
        'contato@site.org.br',
        'info@governo.gov.br',
        'suporte@universidade.edu.br',
        'vendas@loja.net.br'
      ];

      brazilianEmails.forEach(email => {
        const extracted = patternMatcher.extractEmails(`Email: ${email}`);
        expect(extracted).toContain(email.toLowerCase());
      });
    });

    it('should handle compound Brazilian names', () => {
      const brazilianNames = [
        'José da Silva Santos',
        'Maria das Graças Oliveira',
        'João dos Santos Pereira',
        'Ana Paula de Souza',
        'Carlos Eduardo da Costa',
        'Luiz Fernando dos Reis'
      ];

      brazilianNames.forEach(name => {
        const extracted = patternMatcher.extractNames(`Nome: ${name}`);
        expect(extracted).toContain(name);
      });
    });
  });
});