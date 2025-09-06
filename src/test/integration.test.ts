/**
 * Integration tests using real HTML pages with various contact layouts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DOMScanner } from '../classes/DOMScanner.js';
import { PatternMatcher } from '../classes/PatternMatcher.js';
import { DataManager } from '../classes/DataManager.js';
import { CSVExporter } from '../classes/CSVExporter.js';
import fs from 'fs';
import path from 'path';

describe('Integration Tests - Real HTML Pages', () => {
  let domScanner: DOMScanner;
  let patternMatcher: PatternMatcher;
  let dataManager: DataManager;
  let csvExporter: CSVExporter;

  beforeEach(() => {
    domScanner = new DOMScanner();
    patternMatcher = new PatternMatcher();
    dataManager = new DataManager();
    csvExporter = new CSVExporter();
  });

  afterEach(() => {
    domScanner.cleanup();
    document.body.innerHTML = '';
  });

  describe('Simple Contacts Page', () => {
    beforeEach(() => {
      const htmlPath = path.join(__dirname, 'pages/simple-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should extract all contacts from simple layout', () => {
      const contacts = domScanner.scanPage();
      
      expect(contacts.length).toBeGreaterThanOrEqual(10);
      
      // Check for specific contacts
      const joaoContact = contacts.find(c => c.name === 'João Silva');
      expect(joaoContact).toBeTruthy();
      expect(joaoContact?.phone).toBe('(11) 99999-9999');
      expect(joaoContact?.email).toBe('joao.silva@empresa.com.br');

      const mariaContact = contacts.find(c => c.name === 'Maria Santos');
      expect(mariaContact).toBeTruthy();
      expect(mariaContact?.phone).toBe('(21) 98888-8888');
      expect(mariaContact?.email).toBe('maria.santos@gmail.com');
    });

    it('should handle different phone formats', () => {
      const contacts = domScanner.scanPage();
      
      // Check for international format
      const pedroContact = contacts.find(c => c.name === 'Pedro Costa');
      expect(pedroContact?.phone).toBe('(31) 97777-7777');

      // Check for landline format
      const anaContact = contacts.find(c => c.name === 'Ana Oliveira');
      expect(anaContact?.phone).toBe('(41) 3666-5555');
    });

    it('should handle compound Brazilian names', () => {
      const contacts = domScanner.scanPage();
      
      const joseContact = contacts.find(c => c.name === 'José da Silva Santos');
      expect(joseContact).toBeTruthy();
      expect(joseContact?.phone).toBe('(85) 99999-0000');

      const mariaGracasContact = contacts.find(c => c.name === 'Maria das Graças Oliveira');
      expect(mariaGracasContact).toBeTruthy();
      expect(mariaGracasContact?.phone).toBe('(91) 98888-1111');
    });
  });

  describe('Table Contacts Page', () => {
    beforeEach(() => {
      const htmlPath = path.join(__dirname, 'pages/table-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should extract contacts from tables with headers', () => {
      const contacts = domScanner.scanPage();
      
      expect(contacts.length).toBeGreaterThanOrEqual(15);
      
      // Check sales team contacts
      const gabrielContact = contacts.find(c => c.name === 'Gabriel Santos');
      expect(gabrielContact).toBeTruthy();
      expect(gabrielContact?.phone).toBe('(11) 99999-8888');
      expect(gabrielContact?.email).toBe('gabriel@vendas.com.br');
    });

    it('should extract contacts from tables without headers', () => {
      const contacts = domScanner.scanPage();
      
      const beatrizContact = contacts.find(c => c.name === 'Beatriz Costa');
      expect(beatrizContact).toBeTruthy();
      expect(beatrizContact?.phone).toBe('(41) 96666-5555');
      expect(beatrizContact?.email).toBe('beatriz@suporte.com.br');
    });

    it('should handle mixed data in table cells', () => {
      const contacts = domScanner.scanPage();
      
      const eduardoContact = contacts.find(c => c.name === 'Eduardo Silva');
      expect(eduardoContact).toBeTruthy();
      expect(eduardoContact?.phone).toBe('(71) 93333-2222');
      expect(eduardoContact?.email).toBe('eduardo@diretoria.com.br');
    });

    it('should handle nested table structures', () => {
      const contacts = domScanner.scanPage();
      
      // Should find contacts from nested tables
      expect(contacts.length).toBeGreaterThan(10);
      
      // Check for landline contacts
      const juliaContact = contacts.find(c => c.name === 'Julia Mendes');
      expect(juliaContact).toBeTruthy();
      expect(juliaContact?.phone).toBe('(11) 3333-4444');
    });
  });

  describe('List Contacts Page', () => {
    beforeEach(() => {
      const htmlPath = path.join(__dirname, 'pages/list-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should extract contacts from unordered lists', () => {
      const contacts = domScanner.scanPage();
      
      expect(contacts.length).toBeGreaterThanOrEqual(20);
      
      const danielaContact = contacts.find(c => c.name === 'Daniela Ferreira');
      expect(danielaContact).toBeTruthy();
      expect(danielaContact?.phone).toBe('(11) 99999-5555');
      expect(danielaContact?.email).toBe('daniela@marketing.com.br');
    });

    it('should extract contacts from ordered lists with structured format', () => {
      const contacts = domScanner.scanPage();
      
      const renataContact = contacts.find(c => c.name === 'Renata Oliveira');
      expect(renataContact).toBeTruthy();
      expect(renataContact?.phone).toBe('(51) 95555-1111');
      expect(renataContact?.email).toBe('renata@projetos.com.br');
    });

    it('should extract contacts from definition lists', () => {
      const contacts = domScanner.scanPage();
      
      const rodrigoContact = contacts.find(c => c.name === 'Rodrigo Pereira');
      expect(rodrigoContact).toBeTruthy();
      expect(rodrigoContact?.phone).toBe('(81) 92222-8888');
      expect(rodrigoContact?.email).toBe('rodrigo@admin.com.br');
    });

    it('should handle lists with spans and links', () => {
      const contacts = domScanner.scanPage();
      
      const amandaContact = contacts.find(c => c.name === 'Amanda Silva');
      expect(amandaContact).toBeTruthy();
      expect(amandaContact?.phone).toBe('(47) 99999-5555');
      expect(amandaContact?.email).toBe('amanda@dev.com.br');
    });
  });

  describe('Complex Layout Page', () => {
    beforeEach(() => {
      const htmlPath = path.join(__dirname, 'pages/complex-layout.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should extract contacts from complex nested structures', () => {
      const contacts = domScanner.scanPage();
      
      expect(contacts.length).toBeGreaterThanOrEqual(15);
      
      // Check header contact
      const headerContact = contacts.find(c => c.phone === '(11) 3333-0000');
      expect(headerContact).toBeTruthy();

      // Check sidebar emergency contacts
      const joaoSeguranca = contacts.find(c => c.name === 'João da Segurança');
      expect(joaoSeguranca).toBeTruthy();
      expect(joaoSeguranca?.phone).toBe('(11) 99999-0911');
    });

    it('should extract contacts from nested tables', () => {
      const contacts = domScanner.scanPage();
      
      const robertoContact = contacts.find(c => c.name === 'Roberto Silva');
      expect(robertoContact).toBeTruthy();
      expect(robertoContact?.phone).toBe('(11) 99999-1001');
      expect(robertoContact?.email).toBe('ceo@empresa.com.br');
    });

    it('should extract contacts from grid layouts', () => {
      const contacts = domScanner.scanPage();
      
      const thiagoContact = contacts.find(c => c.name === 'Thiago Oliveira');
      expect(thiagoContact).toBeTruthy();
      expect(thiagoContact?.phone).toBe('(11) 97777-3001');
      expect(thiagoContact?.email).toBe('thiago@dev.empresa.com.br');
    });

    it('should ignore script and style content', () => {
      const contacts = domScanner.scanPage();
      
      // Should not find contacts from script or style tags
      const scriptContact = contacts.find(c => c.name === 'Script Contact');
      expect(scriptContact).toBeFalsy();
      
      const cssContact = contacts.find(c => c.name === 'CSS Contact');
      expect(cssContact).toBeFalsy();
      
      // But should find the real technical contact
      const brunoContact = contacts.find(c => c.name === 'Bruno Oliveira');
      expect(brunoContact).toBeTruthy();
      expect(brunoContact?.phone).toBe('(11) 95555-5001');
    });

    it('should handle modal content', () => {
      const contacts = domScanner.scanPage();
      
      // Should find contacts from modal (even if hidden)
      const diegoContact = contacts.find(c => c.name === 'Diego Silva');
      expect(diegoContact).toBeTruthy();
      expect(diegoContact?.phone).toBe('(21) 99999-5001');
    });
  });

  describe('End-to-End Workflow', () => {
    beforeEach(() => {
      const htmlPath = path.join(__dirname, 'pages/simple-contacts.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      document.body.innerHTML = htmlContent;
    });

    it('should complete full extraction to CSV workflow', () => {
      // Step 1: Extract contacts from DOM
      const extractedContacts = domScanner.scanPage();
      expect(extractedContacts.length).toBeGreaterThan(0);

      // Step 2: Add contacts to data manager
      extractedContacts.forEach(contact => {
        const success = dataManager.addContact(contact);
        expect(success).toBe(true);
      });

      expect(dataManager.getContactCount()).toBe(extractedContacts.length);

      // Step 3: Get all contacts for export
      const contactsForExport = dataManager.getAllContacts();
      expect(contactsForExport).toHaveLength(extractedContacts.length);

      // Step 4: Generate CSV
      const csvContent = csvExporter.generateCSV(contactsForExport);
      expect(csvContent).toContain('Nome,Telefone,Email,Fonte,Data de Extração');
      expect(csvContent).toContain('João Silva');
      expect(csvContent).toContain('(11) 99999-9999');
      expect(csvContent).toContain('joao.silva@empresa.com.br');
    });

    it('should handle duplicate detection in workflow', () => {
      // Extract contacts twice
      const extractedContacts1 = domScanner.scanPage();
      const extractedContacts2 = domScanner.scanPage();

      // Add first batch
      extractedContacts1.forEach(contact => {
        dataManager.addContact(contact);
      });

      const countAfterFirst = dataManager.getContactCount();

      // Add second batch (should be duplicates)
      extractedContacts2.forEach(contact => {
        dataManager.addContact(contact);
      });

      const countAfterSecond = dataManager.getContactCount();

      // Count should remain the same due to duplicate detection
      expect(countAfterSecond).toBe(countAfterFirst);
    });

    it('should handle data validation in workflow', () => {
      // Create some invalid contacts
      const invalidContacts = [
        { name: '', phone: '(11) 99999-9999', email: 'test@test.com', source: '', timestamp: new Date() },
        { name: 'Test', phone: 'invalid', email: 'invalid', source: '', timestamp: new Date() },
        { name: 'Valid Contact', phone: '(11) 99999-9999', email: 'valid@test.com', source: '', timestamp: new Date() }
      ];

      let successCount = 0;
      invalidContacts.forEach(contact => {
        if (dataManager.addContact(contact)) {
          successCount++;
        }
      });

      // Only the valid contact should be added
      expect(successCount).toBe(1);
      expect(dataManager.getContactCount()).toBe(1);
    });
  });

  describe('Performance Tests with Real Pages', () => {
    it('should handle large HTML pages efficiently', () => {
      // Create a large HTML page
      let largeHtml = '<html><body>';
      for (let i = 0; i < 1000; i++) {
        largeHtml += `
          <div class="contact">
            <h3>Contact ${i}</h3>
            <p>Nome: Pessoa ${i}</p>
            <p>Telefone: (11) 9999${i.toString().padStart(4, '0')}</p>
            <p>Email: pessoa${i}@test.com</p>
          </div>
        `;
      }
      largeHtml += '</body></html>';

      document.body.innerHTML = largeHtml;

      const startTime = Date.now();
      const contacts = domScanner.scanPage();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(contacts.length).toBeGreaterThan(500); // Should find most contacts
    });
  });
});