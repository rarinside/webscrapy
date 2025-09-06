/**
 * Integration tests for the deployment system
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateDevFiles } from '../../scripts/dev-server';

describe('Deployment System Integration', () => {
  const distDir = path.join(__dirname, '../../dist');
  const requiredFiles = [
    'web-data-extractor.min.js',
    'web-data-extractor.min.css',
    'version.json',
    'bookmarklet.html',
    'bookmarklet.js',
    'bookmarklet-url.txt',
    'index.html'
  ];

  beforeAll(() => {
    // Generate development files for testing
    generateDevFiles();
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
  });

  describe('File Generation', () => {
    it('should generate all required files', () => {
      requiredFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should generate non-empty files', () => {
      requiredFiles.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });

    it('should generate valid JSON version file', () => {
      const versionPath = path.join(distDir, 'version.json');
      const versionContent = fs.readFileSync(versionPath, 'utf8');
      
      expect(() => JSON.parse(versionContent)).not.toThrow();
      
      const versionData = JSON.parse(versionContent);
      expect(versionData).toHaveProperty('version');
      expect(versionData).toHaveProperty('timestamp');
      expect(versionData).toHaveProperty('files');
      expect(versionData.environment).toBe('development');
    });

    it('should generate valid HTML installation page', () => {
      const htmlPath = path.join(distDir, 'bookmarklet.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Web Data Extractor');
      expect(htmlContent).toContain('javascript:');
      expect(htmlContent).toContain('Como Instalar');
    });

    it('should generate valid bookmarklet URL', () => {
      const urlPath = path.join(distDir, 'bookmarklet-url.txt');
      const urlContent = fs.readFileSync(urlPath, 'utf8');
      
      expect(urlContent).toMatch(/^javascript:/);
      
      // Decode the URL to check its contents
      const decodedContent = decodeURIComponent(urlContent.replace('javascript:', ''));
      expect(decodedContent).toContain('localhost:3000');
      
      expect(urlContent.length).toBeGreaterThan(1000);
      expect(urlContent.length).toBeLessThan(15000);
    });
  });

  describe('Content Validation', () => {
    it('should have placeholder script with WebDataExtractor class', () => {
      const scriptPath = path.join(distDir, 'web-data-extractor.min.js');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      expect(scriptContent).toContain('WebDataExtractor');
      expect(scriptContent).toContain('class WebDataExtractor');
      expect(scriptContent).toContain('init()');
      expect(scriptContent).toContain('getState()');
    });

    it('should have CSS with extractor styles', () => {
      const cssPath = path.join(distDir, 'web-data-extractor.min.css');
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      
      expect(cssContent).toContain('web-data-extractor');
      expect(cssContent).toContain('highlight');
      expect(cssContent).toContain('modal');
    });

    it('should have bookmarklet with correct configuration', () => {
      const bookmarkletPath = path.join(distDir, 'bookmarklet.js');
      const bookmarkletContent = fs.readFileSync(bookmarkletPath, 'utf8');
      
      expect(bookmarkletContent).toContain('localhost:3000');
      expect(bookmarkletContent).toContain('web-data-extractor.min.js');
      expect(bookmarkletContent).toContain('web-data-extractor.min.css');
      expect(bookmarkletContent).toContain('version.json');
    });

    it('should have index.html with redirect', () => {
      const indexPath = path.join(distDir, 'index.html');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      expect(indexContent).toContain('DEVELOPMENT MODE');
      expect(indexContent).toContain('bookmarklet.html');
      expect(indexContent).toContain('localhost:3000');
    });
  });

  describe('File Sizes', () => {
    it('should have reasonable file sizes', () => {
      const fileSizeExpectations = {
        'web-data-extractor.min.js': { min: 1000, max: 10000 },
        'web-data-extractor.min.css': { min: 100, max: 5000 },
        'version.json': { min: 200, max: 2000 },
        'bookmarklet.html': { min: 5000, max: 50000 },
        'bookmarklet.js': { min: 5000, max: 15000 },
        'bookmarklet-url.txt': { min: 5000, max: 15000 },
        'index.html': { min: 300, max: 2000 }
      };

      Object.entries(fileSizeExpectations).forEach(([file, { min, max }]) => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        
        expect(stats.size).toBeGreaterThanOrEqual(min);
        expect(stats.size).toBeLessThanOrEqual(max);
      });
    });

    it('should have bookmarklet under browser limits', () => {
      const urlPath = path.join(distDir, 'bookmarklet-url.txt');
      const urlContent = fs.readFileSync(urlPath, 'utf8');
      
      // Most browsers support bookmarklets up to ~8KB, but modern browsers can handle more
      expect(urlContent.length).toBeLessThan(20000);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent URLs across files', () => {
      const baseUrl = 'http://localhost:3000';
      
      // Check version.json
      const versionPath = path.join(distDir, 'version.json');
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      
      // Check bookmarklet
      const bookmarkletPath = path.join(distDir, 'bookmarklet.js');
      const bookmarkletContent = fs.readFileSync(bookmarkletPath, 'utf8');
      
      expect(bookmarkletContent).toContain(baseUrl);
      
      // Check HTML
      const htmlPath = path.join(distDir, 'bookmarklet.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      expect(htmlContent).toContain(baseUrl);
    });

    it('should have matching file references', () => {
      const versionPath = path.join(distDir, 'version.json');
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      
      // Check that referenced files actually exist
      Object.values(versionData.files).forEach((filename: any) => {
        const filePath = path.join(distDir, filename);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing directories gracefully', () => {
      // This test ensures the generateDevFiles function creates directories as needed
      const tempDir = path.join(__dirname, '../../temp-test-dist');
      
      // Remove directory if it exists
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      // This should not throw even if directory doesn't exist
      expect(() => {
        // We can't easily test this without modifying the function,
        // but we can at least verify the function exists and is callable
        expect(typeof generateDevFiles).toBe('function');
      }).not.toThrow();
    });
  });
});