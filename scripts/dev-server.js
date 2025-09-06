#!/usr/bin/env node

/**
 * Development server for testing the bookmarklet locally
 * Serves the dist files and provides a test environment
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateBookmarklet, generateInstallationPage } = require('../src/bookmarklet/generator');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../dist');
const BASE_URL = `http://localhost:${PORT}`;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.md': 'text/markdown'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Generate development files
 */
function generateDevFiles() {
  console.log('🔧 Generating development files...');
  
  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Create placeholder main script for development
  const placeholderScript = `
/**
 * Web Data Extractor - Development Placeholder
 * This is a placeholder script for development testing
 */

console.log('Web Data Extractor loaded (development mode)');

// Create a minimal WebDataExtractor class for testing
window.WebDataExtractor = class WebDataExtractor {
  constructor() {
    this.initialized = false;
    this.active = false;
  }
  
  init() {
    this.initialized = true;
    console.log('WebDataExtractor initialized');
    this.showNotification('Web Data Extractor carregado com sucesso!', 'success');
  }
  
  getState() {
    return {
      isInitialized: this.initialized,
      isActive: this.active,
      contactCount: 0,
      hasSession: false,
      sessionAge: null
    };
  }
  
  activate() {
    this.active = true;
    console.log('WebDataExtractor activated');
    this.showNotification('Extrator ativado! (modo desenvolvimento)', 'info');
    return Promise.resolve();
  }
  
  deactivate() {
    this.active = false;
    console.log('WebDataExtractor deactivated');
    this.showNotification('Extrator desativado', 'info');
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: \${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
      cursor: pointer;
    \`;
    notification.textContent = message;
    notification.onclick = () => notification.remove();
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }
};

console.log('WebDataExtractor class available for testing');
`;

  // Create placeholder CSS
  const placeholderCSS = `
/**
 * Web Data Extractor - Development Styles
 * Placeholder styles for development testing
 */

.web-data-extractor-highlight {
  background-color: yellow !important;
  border: 2px solid orange !important;
}

.web-data-extractor-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  z-index: 10000;
  padding: 20px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}
`;

  // Write placeholder files
  fs.writeFileSync(path.join(DIST_DIR, 'web-data-extractor.min.js'), placeholderScript);
  fs.writeFileSync(path.join(DIST_DIR, 'web-data-extractor.min.css'), placeholderCSS);

  // Generate version file
  const versionInfo = {
    version: 'dev-' + Date.now(),
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleDateString('pt-BR'),
    environment: 'development',
    files: {
      script: 'web-data-extractor.min.js',
      css: 'web-data-extractor.min.css',
      bookmarklet: 'bookmarklet.html'
    },
    changelog: [
      {
        version: 'dev',
        date: new Date().toLocaleDateString('pt-BR'),
        changes: [
          'Development server with placeholder scripts',
          'Local testing environment',
          'Bookmarklet development mode'
        ]
      }
    ]
  };

  fs.writeFileSync(path.join(DIST_DIR, 'version.json'), JSON.stringify(versionInfo, null, 2));

  // Generate bookmarklet files
  const bookmarklet = generateBookmarklet(BASE_URL);
  const installationHtml = generateInstallationPage(bookmarklet.url, BASE_URL);

  fs.writeFileSync(path.join(DIST_DIR, 'bookmarklet.js'), bookmarklet.code);
  fs.writeFileSync(path.join(DIST_DIR, 'bookmarklet.html'), installationHtml);
  fs.writeFileSync(path.join(DIST_DIR, 'bookmarklet-url.txt'), bookmarklet.url);

  // Create index.html redirect
  const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Data Extractor - Development</title>
    <meta http-equiv="refresh" content="0; url=bookmarklet.html">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 50px; }
        .dev-badge { background: #FF9800; color: white; padding: 5px 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Web Data Extractor</h1>
    <p><span class="dev-badge">DEVELOPMENT MODE</span></p>
    <p>Redirecionando para <a href="bookmarklet.html">página de instalação</a>...</p>
    <p><small>Servidor local: ${BASE_URL}</small></p>
</body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

  console.log('✅ Development files generated');
  console.log(`📏 Bookmarklet size: ${Math.round(bookmarklet.size / 1024 * 100) / 100} KB`);
}

/**
 * Create HTTP server
 */
function createServer() {
  const server = http.createServer((req, res) => {
    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = url.pathname;

    // Default to index.html
    if (filePath === '/') {
      filePath = '/index.html';
    }

    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
      return;
    }

    const fullPath = path.join(DIST_DIR, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 Not Found</h1>
          <p>File not found: ${filePath}</p>
          <p><a href="/">Go to home</a></p>
        </body>
        </html>
      `);
      return;
    }

    // Read and serve file
    try {
      const content = fs.readFileSync(fullPath);
      const mimeType = getMimeType(fullPath);
      
      // Add CORS headers for development
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.end(content);
      
      // Log request
      console.log(`📄 ${req.method} ${filePath} (${mimeType})`);
      
    } catch (error) {
      console.error('Error serving file:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  return server;
}

/**
 * Start development server
 */
function startServer() {
  // Generate files first
  generateDevFiles();

  // Create and start server
  const server = createServer();
  
  server.listen(PORT, () => {
    console.log('\n🚀 Web Data Extractor Development Server');
    console.log(`📍 Server running at: ${BASE_URL}`);
    console.log(`📖 Installation page: ${BASE_URL}/bookmarklet.html`);
    console.log(`🔧 Version info: ${BASE_URL}/version.json`);
    console.log('\n📋 Available endpoints:');
    console.log(`   • ${BASE_URL}/                     - Home (redirects to bookmarklet.html)`);
    console.log(`   • ${BASE_URL}/bookmarklet.html     - Bookmarklet installation page`);
    console.log(`   • ${BASE_URL}/web-data-extractor.min.js - Main script (placeholder)`);
    console.log(`   • ${BASE_URL}/web-data-extractor.min.css - Styles (placeholder)`);
    console.log(`   • ${BASE_URL}/version.json         - Version information`);
    console.log(`   • ${BASE_URL}/bookmarklet-url.txt  - Raw bookmarklet URL`);
    console.log('\n💡 Tips:');
    console.log('   • Install the bookmarklet from the installation page');
    console.log('   • Test it on any webpage (try https://example.com)');
    console.log('   • The bookmarklet will load placeholder scripts for testing');
    console.log('   • Press Ctrl+C to stop the server');
    console.log('');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });

  // Watch for file changes and regenerate
  if (fs.existsSync(path.join(__dirname, '../src/bookmarklet'))) {
    fs.watch(path.join(__dirname, '../src/bookmarklet'), { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`📝 File changed: ${filename}, regenerating...`);
        setTimeout(() => {
          try {
            generateDevFiles();
            console.log('✅ Files regenerated');
          } catch (error) {
            console.error('❌ Error regenerating files:', error.message);
          }
        }, 100);
      }
    });
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Web Data Extractor - Development Server

Usage: node scripts/dev-server.js [options]

Options:
  --port <port>     Set server port (default: 3000)
  --help, -h        Show this help message

Environment Variables:
  PORT              Server port (default: 3000)

Examples:
  node scripts/dev-server.js
  PORT=8080 node scripts/dev-server.js
  node scripts/dev-server.js --port 8080
`);
    process.exit(0);
  }

  // Handle port option
  const portIndex = args.indexOf('--port');
  if (portIndex !== -1 && args[portIndex + 1]) {
    process.env.PORT = args[portIndex + 1];
  }

  startServer();
}

module.exports = { startServer, generateDevFiles };