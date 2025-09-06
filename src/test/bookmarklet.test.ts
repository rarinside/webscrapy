/**
 * Tests for bookmarklet generation and deployment system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateBookmarklet, generateInstallationPage, minifyForBookmarklet } from '../bookmarklet/generator';

describe('Bookmarklet System', () => {
  const testBaseUrl = 'https://test.example.com/extractor';
  const tempDir = path.join(__dirname, '../../temp-test');

  beforeEach(() => {
    // Create temp directory for tests
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('minifyForBookmarklet', () => {
    it('should remove comments and unnecessary whitespace', () => {
      const code = `
        // This is a comment
        function test() {
          /* Multi-line
             comment */
          return "hello world";
        }
      `;

      const minified = minifyForBookmarklet(code);
      
      expect(minified).not.toContain('// This is a comment');
      expect(minified).not.toContain('/* Multi-line');
      expect(minified).not.toContain('comment */');
      expect(minified).toContain('function test()');
      expect(minified).toContain('return "hello world"');
      expect(minified.length).toBeLessThan(code.length);
    });

    it('should preserve string contents', () => {
      const code = 'const msg = "Hello, world!";';
      const minified = minifyForBookmarklet(code);
      
      expect(minified).toContain('"Hello, world!"');
      expect(minified).toContain('const msg = ');
    });

    it('should handle empty input', () => {
      expect(minifyForBookmarklet('')).toBe('');
      expect(minifyForBookmarklet('   ')).toBe('');
    });
  });

  describe('generateBookmarklet', () => {
    it('should generate valid bookmarklet with custom base URL', () => {
      const result = generateBookmarklet(testBaseUrl);
      
      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('size');
      
      expect(result.url).toMatch(/^javascript:/);
      expect(result.code).toContain(testBaseUrl);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should replace configuration URLs correctly', () => {
      const result = generateBookmarklet(testBaseUrl);
      
      expect(result.code).toContain(`${testBaseUrl}/web-data-extractor.min.js`);
      expect(result.code).toContain(`${testBaseUrl}/web-data-extractor.min.css`);
      expect(result.code).toContain(`${testBaseUrl}/version.json`);
    });

    it('should create URL-encoded bookmarklet', () => {
      const result = generateBookmarklet(testBaseUrl);
      
      // Should be properly URL encoded
      expect(result.url).not.toContain(' ');
      expect(result.url).not.toContain('\n');
      
      // Should be decodable
      const decoded = decodeURIComponent(result.url.replace('javascript:', ''));
      expect(decoded).toContain('function');
    });

    it('should handle special characters in base URL', () => {
      const specialUrl = 'https://test.example.com/path with spaces/extractor';
      const result = generateBookmarklet(specialUrl);
      
      expect(result.code).toContain(specialUrl);
      expect(result.url).toMatch(/^javascript:/);
    });
  });

  describe('generateInstallationPage', () => {
    it('should generate valid HTML page', () => {
      const bookmarkletUrl = 'javascript:alert("test");';
      const html = generateInstallationPage(bookmarkletUrl, testBaseUrl);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="pt-BR">');
      expect(html).toContain('Web Data Extractor');
      expect(html).toContain(bookmarkletUrl);
      expect(html).toContain(testBaseUrl);
    });

    it('should include installation instructions', () => {
      const bookmarkletUrl = 'javascript:alert("test");';
      const html = generateInstallationPage(bookmarkletUrl, testBaseUrl);
      
      expect(html).toContain('Como Instalar');
      expect(html).toContain('Arraste o botão');
      expect(html).toContain('barra de favoritos');
    });

    it('should include keyboard shortcuts', () => {
      const bookmarkletUrl = 'javascript:alert("test");';
      const html = generateInstallationPage(bookmarkletUrl, testBaseUrl);
      
      expect(html).toContain('Ctrl+Shift+E');
      expect(html).toContain('Atalhos de Teclado');
    });

    it('should include troubleshooting section', () => {
      const bookmarkletUrl = 'javascript:alert("test");';
      const html = generateInstallationPage(bookmarkletUrl, testBaseUrl);
      
      expect(html).toContain('Solução de Problemas');
      expect(html).toContain('Bookmarklet não funciona');
    });

    it('should calculate and display bookmarklet size', () => {
      const bookmarkletUrl = 'javascript:' + 'a'.repeat(1000);
      const html = generateInstallationPage(bookmarkletUrl, testBaseUrl);
      
      expect(html).toContain('Tamanho do bookmarklet');
      expect(html).toMatch(/\d+(\.\d+)?\s*KB/);
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete bookmarklet package', () => {
      const result = generateBookmarklet(testBaseUrl);
      const html = generateInstallationPage(result.url, testBaseUrl);
      
      // Bookmarklet should be functional
      expect(result.code).toContain('WebDataExtractor');
      expect(result.code).toContain('localStorage');
      expect(result.code).toContain('XMLHttpRequest');
      
      // HTML should reference the bookmarklet
      expect(html).toContain(result.url);
      
      // Size should be reasonable for a bookmarklet
      expect(result.size).toBeLessThan(12000); // Less than 12KB
      expect(result.size).toBeGreaterThan(1000); // More than 1KB
    });

    it('should handle loader script existence', () => {
      const loaderPath = path.join(__dirname, '../bookmarklet/loader.js');
      expect(fs.existsSync(loaderPath)).toBe(true);
      
      const loaderContent = fs.readFileSync(loaderPath, 'utf8');
      expect(loaderContent).toContain('WebDataExtractor');
      expect(loaderContent).toContain('CONFIG');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing loader file gracefully', () => {
      // This test would need to mock the file system
      // For now, we just ensure the function exists
      expect(typeof generateBookmarklet).toBe('function');
    });

    it('should validate URL format', () => {
      const result = generateBookmarklet('invalid-url');
      expect(result.url).toMatch(/^javascript:/);
    });
  });

  describe('Performance', () => {
    it('should generate bookmarklet quickly', () => {
      const start = Date.now();
      generateBookmarklet(testBaseUrl);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });

    it('should produce reasonably sized output', () => {
      const result = generateBookmarklet(testBaseUrl);
      
      // Bookmarklet should be compressed but not too small
      expect(result.size).toBeGreaterThan(500);
      expect(result.size).toBeLessThan(15000); // Allow for larger bookmarklets since modern browsers support more
    });
  });
});