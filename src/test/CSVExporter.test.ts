/**
 * Unit tests for CSVExporter class
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CSVExporter } from '../classes/CSVExporter';
import { ContactData } from '../types/interfaces';

describe('CSVExporter', () => {
  let csvExporter: CSVExporter;
  let mockContacts: ContactData[];

  beforeEach(() => {
    csvExporter = new CSVExporter();
    mockContacts = [
      {
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@example.com',
        source: 'https://example.com',
        timestamp: new Date('2024-01-15T10:30:00Z')
      },
      {
        name: 'Maria Santos',
        phone: '+55 21 98888-8888',
        email: 'maria@test.com',
        source: 'https://test.com',
        timestamp: new Date('2024-01-15T11:45:00Z')
      }
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCSV', () => {
    it('should generate CSV with UTF-8 BOM and headers', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      
      expect(csv).toContain('\uFEFF'); // UTF-8 BOM
      expect(csv).toContain('Nome,Telefone,Email,Fonte,Data de Extração');
    });

    it('should properly format contact data in CSV rows', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      
      expect(csv).toContain('João Silva,(11) 99999-9999,joao@example.com,https://example.com');
      expect(csv).toContain('Maria Santos,+55 21 98888-8888,maria@test.com,https://test.com');
    });

    it('should format timestamps in Brazilian format', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      
      // Check for Brazilian date format DD/MM/YYYY HH:MM:SS
      expect(csv).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should escape CSV fields with special characters', () => {
      const contactWithSpecialChars: ContactData[] = [{
        name: 'José "Zé" Silva, Jr.',
        phone: '(11) 99999-9999',
        email: 'jose@example.com',
        source: 'https://example.com/page,with,commas',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(contactWithSpecialChars);
      
      expect(csv).toContain('"José ""Zé"" Silva, Jr."'); // Escaped quotes and commas
      expect(csv).toContain('"https://example.com/page,with,commas"'); // Escaped commas
    });

    it('should handle empty fields gracefully', () => {
      const contactWithEmptyFields: ContactData[] = [{
        name: 'João Silva',
        phone: '',
        email: 'joao@example.com',
        source: '',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(contactWithEmptyFields);
      
      expect(csv).toContain('João Silva,"",joao@example.com,""');
    });

    it('should throw error for empty contact array', () => {
      expect(() => csvExporter.generateCSV([])).toThrow('Nenhum contato fornecido para exportação');
    });

    it('should throw error for null/undefined contacts', () => {
      expect(() => csvExporter.generateCSV(null as any)).toThrow('Nenhum contato fornecido para exportação');
      expect(() => csvExporter.generateCSV(undefined as any)).toThrow('Nenhum contato fornecido para exportação');
    });

    it('should handle invalid timestamp gracefully', () => {
      const contactWithInvalidDate: ContactData[] = [{
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@example.com',
        source: 'https://example.com',
        timestamp: null as any
      }];

      const csv = csvExporter.generateCSV(contactWithInvalidDate);
      expect(csv).toContain('João Silva,(11) 99999-9999,joao@example.com,https://example.com,""');
    });
  });

  describe('downloadCSV', () => {
    let mockCreateObjectURL: any;
    let mockRevokeObjectURL: any;
    let mockAppendChild: any;
    let mockRemoveChild: any;
    let mockClick: any;

    beforeEach(() => {
      // Mock URL methods
      mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock DOM methods
      mockClick = vi.fn();
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();
      
      const mockElement = {
        click: mockClick,
        style: {},
        setAttribute: vi.fn(),
        href: '',
        download: ''
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      // Mock Blob constructor
      global.Blob = vi.fn().mockImplementation((content, options) => ({
        content,
        options,
        type: options?.type || 'text/plain'
      })) as any;
    });

    it('should create blob and trigger download with custom filename', () => {
      const csvContent = 'Nome,Email\nJoão,joao@test.com';
      const filename = 'custom-export.csv';

      csvExporter.downloadCSV(csvContent, filename);

      expect(global.Blob).toHaveBeenCalledWith([csvContent], { type: 'text/csv;charset=utf-8;' });
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('should generate timestamp-based filename when none provided', () => {
      const csvContent = 'Nome,Email\nJoão,joao@test.com';

      csvExporter.downloadCSV(csvContent);

      expect(mockClick).toHaveBeenCalled();
      // Verify that a timestamp-based filename was used (format: contatos_YYYYMMDD_HHMMSS.csv)
      const createdElement = document.createElement('a');
      expect(createdElement.download).toMatch(/contatos_\d{8}_\d{6}\.csv/);
    });

    it('should throw error for empty CSV content', () => {
      expect(() => csvExporter.downloadCSV('')).toThrow('Conteúdo CSV vazio para download');
      expect(() => csvExporter.downloadCSV(null as any)).toThrow('Conteúdo CSV vazio para download');
    });
  });

  describe('exportContacts', () => {
    it('should generate CSV and trigger download in one call', () => {
      const downloadSpy = vi.spyOn(csvExporter, 'downloadCSV').mockImplementation(() => {});
      const generateSpy = vi.spyOn(csvExporter, 'generateCSV').mockReturnValue('mock-csv-content');

      csvExporter.exportContacts(mockContacts, 'test-export.csv');

      expect(generateSpy).toHaveBeenCalledWith(mockContacts);
      expect(downloadSpy).toHaveBeenCalledWith('mock-csv-content', 'test-export.csv');
    });
  });

  describe('timestamp filename generation', () => {
    it('should generate filename with current timestamp', () => {
      const downloadSpy = vi.spyOn(csvExporter, 'downloadCSV').mockImplementation(() => {});
      
      csvExporter.exportContacts(mockContacts);

      // Should call downloadCSV with generated CSV content and undefined filename (auto-generated)
      expect(downloadSpy).toHaveBeenCalledWith(
        expect.any(String),
        undefined
      );
    });
  });

  describe('Advanced CSV Generation', () => {
    it('should handle contacts with all empty optional fields', () => {
      const contactsWithEmptyFields: ContactData[] = [{
        name: 'João Silva',
        phone: '',
        email: '',
        source: '',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(contactsWithEmptyFields);
      
      expect(csv).toContain('João Silva,"","",""');
    });

    it('should handle very large datasets efficiently', () => {
      const largeDataset: ContactData[] = Array(10000).fill(null).map((_, i) => ({
        name: `Contact ${i}`,
        phone: `(11) 9999${i.toString().padStart(4, '0')}`,
        email: `contact${i}@test.com`,
        source: `https://example.com/page${i}`,
        timestamp: new Date('2024-01-15T10:30:00Z')
      }));

      const startTime = Date.now();
      const csv = csvExporter.generateCSV(largeDataset);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(csv.split('\n')).toHaveLength(10002); // Header + 10000 contacts + empty line at end
    });

    it('should handle contacts with unicode and emoji characters', () => {
      const unicodeContacts: ContactData[] = [{
        name: 'José María 🇧🇷',
        phone: '(11) 99999-9999',
        email: 'josé@tëst.com',
        source: 'https://example.com/página',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(unicodeContacts);
      
      expect(csv).toContain('José María 🇧🇷');
      expect(csv).toContain('josé@tëst.com');
      expect(csv).toContain('https://example.com/página');
    });

    it('should handle contacts with newlines and carriage returns', () => {
      const contactsWithNewlines: ContactData[] = [{
        name: 'João\nSilva',
        phone: '(11) 99999-9999',
        email: 'joao@test.com',
        source: 'https://example.com/page\r\nwith\nnewlines',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(contactsWithNewlines);
      
      expect(csv).toContain('"João\nSilva"');
      expect(csv).toContain('"https://example.com/page\r\nwith\nnewlines"');
    });

    it('should handle contacts with various quote combinations', () => {
      const contactsWithQuotes: ContactData[] = [{
        name: 'João "Zé" Silva',
        phone: '(11) 99999-9999',
        email: 'joao@test.com',
        source: 'https://example.com/page"with"quotes',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(contactsWithQuotes);
      
      expect(csv).toContain('"João ""Zé"" Silva"');
      expect(csv).toContain('"https://example.com/page""with""quotes"');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle contacts with null timestamp gracefully', () => {
      const contactWithNullTimestamp: ContactData[] = [{
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@test.com',
        source: 'https://example.com',
        timestamp: null as any
      }];

      expect(() => csvExporter.generateCSV(contactWithNullTimestamp)).not.toThrow();
      const csv = csvExporter.generateCSV(contactWithNullTimestamp);
      expect(csv).toContain('João Silva,(11) 99999-9999,joao@test.com,https://example.com,""');
    });

    it('should handle contacts with invalid timestamp gracefully', () => {
      const contactWithInvalidTimestamp: ContactData[] = [{
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@test.com',
        source: 'https://example.com',
        timestamp: 'invalid date' as any
      }];

      expect(() => csvExporter.generateCSV(contactWithInvalidTimestamp)).not.toThrow();
      const csv = csvExporter.generateCSV(contactWithInvalidTimestamp);
      expect(csv).toContain('João Silva,(11) 99999-9999,joao@test.com,https://example.com,""');
    });

    it('should handle mixed valid and invalid data', () => {
      const mixedContacts: ContactData[] = [
        {
          name: 'Valid Contact',
          phone: '(11) 99999-9999',
          email: 'valid@test.com',
          source: 'https://example.com',
          timestamp: new Date('2024-01-15T10:30:00Z')
        },
        {
          name: null as any,
          phone: '(21) 88888-8888',
          email: 'test@test.com',
          source: 'https://example.com',
          timestamp: new Date('2024-01-15T10:30:00Z')
        }
      ];

      expect(() => csvExporter.generateCSV(mixedContacts)).not.toThrow();
      const csv = csvExporter.generateCSV(mixedContacts);
      expect(csv).toContain('Valid Contact');
      expect(csv.split('\n')).toHaveLength(4); // Header + 2 contacts + empty line
    });
  });

  describe('Download Functionality Edge Cases', () => {
    beforeEach(() => {
      // Reset all mocks
      vi.clearAllMocks();
    });

    it('should handle download failure gracefully', () => {
      // Mock Blob to throw an error
      const originalBlob = global.Blob;
      global.Blob = vi.fn().mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      const csvContent = 'Nome,Email\nJoão,joao@test.com';
      
      expect(() => csvExporter.downloadCSV(csvContent)).toThrow();

      // Restore Blob
      global.Blob = originalBlob;
    });

    it('should handle URL.createObjectURL failure', () => {
      const originalCreateObjectURL = global.URL.createObjectURL;
      global.URL.createObjectURL = vi.fn().mockImplementation(() => {
        throw new Error('createObjectURL failed');
      });

      const csvContent = 'Nome,Email\nJoão,joao@test.com';
      
      expect(() => csvExporter.downloadCSV(csvContent)).toThrow();

      // Restore createObjectURL
      global.URL.createObjectURL = originalCreateObjectURL;
    });

    it('should generate valid filename format', () => {
      const downloadSpy = vi.spyOn(csvExporter, 'downloadCSV').mockImplementation(() => {});
      
      csvExporter.exportContacts(mockContacts);
      
      // The filename should be auto-generated, so downloadCSV should be called with undefined filename
      expect(downloadSpy).toHaveBeenCalledWith(expect.any(String), undefined);
    });
  });

  describe('CSV Format Compliance', () => {
    it('should generate RFC 4180 compliant CSV', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      
      // Should start with UTF-8 BOM
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
      
      // Should have proper headers
      expect(csv).toContain('Nome,Telefone,Email,Fonte,Data de Extração');
      
      // Should have proper line endings
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(2); // At least header + 1 data row
    });

    it('should handle all CSV special characters correctly', () => {
      const specialContact: ContactData[] = [{
        name: 'Test, "Quote" \nNewline \r\nCRLF',
        phone: '(11) 99999-9999',
        email: 'test@example.com',
        source: 'https://example.com',
        timestamp: new Date('2024-01-15T10:30:00Z')
      }];

      const csv = csvExporter.generateCSV(specialContact);
      
      // Should properly escape the complex field
      expect(csv).toContain('"Test, ""Quote"" \nNewline \r\nCRLF"');
    });

    it('should maintain consistent column count across all rows', () => {
      const csv = csvExporter.generateCSV(mockContacts);
      const lines = csv.split('\n').filter(line => line.trim() !== '');
      
      const headerColumns = lines[0].split(',').length;
      
      // All data rows should have the same number of columns as header
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').length;
        expect(columns).toBe(headerColumns);
      }
    });
  });
});