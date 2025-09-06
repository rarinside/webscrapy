import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DOMScanner } from '../classes/DOMScanner.js';
import { ContactData } from '../types/interfaces.js';

// Mock DOM environment
const mockDOM = () => {
  // Create a basic DOM structure for testing
  document.body.innerHTML = '';
  
  // Remove any existing styles
  const existingStyles = document.getElementById('web-data-extractor-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
};

describe('DOMScanner', () => {
  let scanner: DOMScanner;

  beforeEach(() => {
    mockDOM();
    scanner = new DOMScanner();
  });

  afterEach(() => {
    scanner.cleanup();
    document.body.innerHTML = '';
  });

  describe('Table Data Extraction', () => {
    it('should extract contact data from a structured table with headers', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Email</th>
          </tr>
          <tr>
            <td>João Silva</td>
            <td>(11) 99999-9999</td>
            <td>joao@email.com</td>
          </tr>
          <tr>
            <td>Maria Santos</td>
            <td>(21) 8888-8888</td>
            <td>maria@email.com</td>
          </tr>
        </table>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(2);
      expect(contacts[0]).toMatchObject({
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@email.com'
      });
      expect(contacts[1]).toMatchObject({
        name: 'Maria Santos',
        phone: '(21) 8888-8888',
        email: 'maria@email.com'
      });
    });

    it('should extract contact data from table without headers', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td>Pedro Costa</td>
            <td>(31) 7777-7777</td>
            <td>pedro@email.com</td>
          </tr>
        </table>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'Pedro Costa',
        phone: '(31) 7777-7777',
        email: 'pedro@email.com'
      });
    });

    it('should handle tables with mixed data types', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <th>Contato</th>
            <th>Informações</th>
          </tr>
          <tr>
            <td>Ana Oliveira</td>
            <td>(41) 96666-6666 - ana@email.com</td>
          </tr>
        </table>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Ana Oliveira');
      expect(contacts[0].phone).toBe('(41) 96666-6666');
      expect(contacts[0].email).toBe('ana@email.com');
    });
  });

  describe('List Data Extraction', () => {
    it('should extract contact data from unordered list', () => {
      document.body.innerHTML = `
        <ul>
          <li>Carlos Mendes - (51) 95555-5555 - carlos@email.com</li>
          <li>Lucia Ferreira - (61) 94444-4444 - lucia@email.com</li>
        </ul>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(2);
      expect(contacts[0]).toMatchObject({
        name: 'Carlos Mendes',
        phone: '(51) 95555-5555',
        email: 'carlos@email.com'
      });
      expect(contacts[1]).toMatchObject({
        name: 'Lucia Ferreira',
        phone: '(61) 94444-4444',
        email: 'lucia@email.com'
      });
    });

    it('should extract contact data from definition list', () => {
      document.body.innerHTML = `
        <dl>
          <dt>Nome:</dt>
          <dd>Roberto Lima</dd>
          <dt>Telefone:</dt>
          <dd>(71) 3333-3333</dd>
          <dt>Email:</dt>
          <dd>roberto@email.com</dd>
        </dl>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'Roberto Lima',
        phone: '(71) 3333-3333',
        email: 'roberto@email.com'
      });
    });

    it('should extract contact data from structured list items', () => {
      document.body.innerHTML = `
        <ul>
          <li>
            <strong>Fernanda Costa</strong>
            <span class="phone">(81) 92222-2222</span>
            <a href="mailto:fernanda@email.com">fernanda@email.com</a>
          </li>
        </ul>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'Fernanda Costa',
        phone: '(81) 92222-2222',
        email: 'fernanda@email.com'
      });
    });
  });

  describe('Visual Highlighting', () => {
    it('should inject CSS styles for highlighting', () => {
      document.body.innerHTML = '<div>Test content</div>';
      const element = document.querySelector('div') as HTMLElement;
      
      scanner.highlightElements([element]);
      
      const styles = document.getElementById('web-data-extractor-styles');
      expect(styles).toBeTruthy();
      expect(styles?.textContent).toContain('web-data-extractor-highlight');
    });

    it('should add highlight class to elements', () => {
      document.body.innerHTML = '<div>Test content</div>';
      const element = document.querySelector('div') as HTMLElement;
      
      scanner.highlightElements([element]);
      
      expect(element.classList.contains('web-data-extractor-highlight')).toBe(true);
    });

    it('should remove highlights from elements', () => {
      document.body.innerHTML = '<div>Test content</div>';
      const element = document.querySelector('div') as HTMLElement;
      
      scanner.highlightElements([element]);
      expect(element.classList.contains('web-data-extractor-highlight')).toBe(true);
      
      scanner.removeHighlights();
      expect(element.classList.contains('web-data-extractor-highlight')).toBe(false);
    });

    it('should clean up styles and highlights on cleanup', () => {
      document.body.innerHTML = '<div>Test content</div>';
      const element = document.querySelector('div') as HTMLElement;
      
      scanner.highlightElements([element]);
      expect(element.classList.contains('web-data-extractor-highlight')).toBe(true);
      expect(document.getElementById('web-data-extractor-styles')).toBeTruthy();
      
      scanner.cleanup();
      expect(element.classList.contains('web-data-extractor-highlight')).toBe(false);
      expect(document.getElementById('web-data-extractor-styles')).toBeFalsy();
    });
  });

  describe('Contact Association', () => {
    it('should associate related data in the same table row', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td>Contato: Gabriel Santos</td>
            <td>Tel: (91) 91111-1111</td>
            <td>Email: gabriel@email.com</td>
          </tr>
        </table>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'Gabriel Santos',
        phone: '(91) 91111-1111',
        email: 'gabriel@email.com'
      });
    });

    it('should handle partial contact data', () => {
      document.body.innerHTML = `
        <ul>
          <li>Mariana Silva - (85) 99999-8888</li>
          <li>contato@empresa.com</li>
        </ul>
      `;

      const contacts = scanner.scanPage();
      
      expect(contacts.length).toBeGreaterThan(0);
      
      // Should find at least the contact with name and phone
      const marianaContact = contacts.find(c => c.name === 'Mariana Silva');
      expect(marianaContact).toBeTruthy();
      expect(marianaContact?.phone).toBe('(85) 99999-8888');
      
      // Should also find the email-only contact
      const emailContact = contacts.find(c => c.email === 'contato@empresa.com');
      expect(emailContact).toBeTruthy();
    });
  });

  describe('Data Deduplication', () => {
    it('should remove duplicate contacts based on email', () => {
      document.body.innerHTML = `
        <div>
          <p>João Silva - joao@email.com - (11) 99999-9999</p>
          <p>João Silva - joao@email.com</p>
        </div>
      `;

      const contacts = scanner.scanPage();
      
      // Should only have one contact, with merged data
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'João Silva',
        phone: '(11) 99999-9999',
        email: 'joao@email.com'
      });
    });

    it('should remove duplicate contacts based on phone', () => {
      document.body.innerHTML = `
        <div>
          <p>Maria Santos - (21) 98888-8888 - maria@email.com</p>
          <p>(21) 98888-8888 - Maria Santos</p>
        </div>
      `;

      const contacts = scanner.scanPage();
      
      // Should only have one contact, with merged data
      expect(contacts).toHaveLength(1);
      expect(contacts[0]).toMatchObject({
        name: 'Maria Santos',
        phone: '(21) 98888-8888',
        email: 'maria@email.com'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed HTML gracefully', () => {
      document.body.innerHTML = `
        <table>
          <tr>
            <td>Incomplete row
          </tr>
          <tr>
            <td>Pedro Costa</td>
            <td>(31) 7777-7777</td>
          </tr>
        </table>
      `;

      expect(() => {
        const contacts = scanner.scanPage();
        expect(Array.isArray(contacts)).toBe(true);
      }).not.toThrow();
    });

    it('should skip excluded elements', () => {
      document.body.innerHTML = `
        <div>
          <script>var contact = "João Silva - (11) 99999-9999";</script>
          <style>.contact { color: red; }</style>
          <p>Maria Santos - (21) 88888-8888 - maria@email.com</p>
        </div>
      `;

      const contacts = scanner.scanPage();
      
      // Should only find the contact in the paragraph, not in script/style
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Maria Santos');
    });
  });
});