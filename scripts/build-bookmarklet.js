#!/usr/bin/env node

/**
 * Build script for Web Data Extractor bookmarklet deployment
 * Integrates with webpack build process and generates all deployment files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateBookmarklet, generateInstallationPage, saveBookmarkletFiles } = require('../src/bookmarklet/generator');

// Configuration
const CONFIG = {
  BASE_URL: process.env.BASE_URL || 'https://your-domain.github.io/web-data-extractor',
  DIST_DIR: path.join(__dirname, '../dist'),
  DOCS_DIR: path.join(__dirname, '../docs'), // For GitHub Pages
  VERSION_FILE: 'version.json',
  PACKAGE_JSON: path.join(__dirname, '../package.json')
};

/**
 * Get version from package.json
 */
function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(CONFIG.PACKAGE_JSON, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.warn('Could not read version from package.json, using timestamp');
    return new Date().toISOString();
  }
}

/**
 * Generate version.json file for update checking
 */
function generateVersionFile() {
  const version = getVersion();
  const versionInfo = {
    version: version,
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleDateString('pt-BR'),
    files: {
      script: 'web-data-extractor.min.js',
      css: 'web-data-extractor.min.css',
      bookmarklet: 'bookmarklet.html'
    },
    changelog: [
      {
        version: version,
        date: new Date().toLocaleDateString('pt-BR'),
        changes: [
          'Bookmarklet deployment system implemented',
          'Automatic caching and update checking',
          'Improved error handling and user feedback'
        ]
      }
    ]
  };

  const versionPath = path.join(CONFIG.DIST_DIR, CONFIG.VERSION_FILE);
  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2), 'utf8');
  
  return versionInfo;
}

/**
 * Copy files to docs directory for GitHub Pages
 */
function copyToGitHubPages() {
  try {
    // Ensure docs directory exists
    if (!fs.existsSync(CONFIG.DOCS_DIR)) {
      fs.mkdirSync(CONFIG.DOCS_DIR, { recursive: true });
    }

    // Files to copy
    const filesToCopy = [
      'web-data-extractor.min.js',
      'web-data-extractor.min.css',
      'version.json',
      'bookmarklet.html',
      'bookmarklet.js',
      'bookmarklet-url.txt'
    ];

    filesToCopy.forEach(file => {
      const srcPath = path.join(CONFIG.DIST_DIR, file);
      const destPath = path.join(CONFIG.DOCS_DIR, file);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`📄 Copied ${file} to docs/`);
      } else {
        console.warn(`⚠️  File not found: ${file}`);
      }
    });

    // Create index.html that redirects to bookmarklet.html
    const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Data Extractor</title>
    <meta http-equiv="refresh" content="0; url=bookmarklet.html">
    <link rel="canonical" href="bookmarklet.html">
</head>
<body>
    <p>Redirecionando para <a href="bookmarklet.html">página de instalação</a>...</p>
</body>
</html>`;

    fs.writeFileSync(path.join(CONFIG.DOCS_DIR, 'index.html'), indexHtml, 'utf8');
    console.log('📄 Created index.html redirect');

    return true;
  } catch (error) {
    console.error('❌ Error copying to GitHub Pages:', error.message);
    return false;
  }
}

/**
 * Validate build output
 */
function validateBuild() {
  const requiredFiles = [
    'web-data-extractor.min.js',
    'web-data-extractor.min.css',
    'version.json',
    'bookmarklet.html',
    'bookmarklet.js'
  ];

  const missingFiles = requiredFiles.filter(file => {
    const filePath = path.join(CONFIG.DIST_DIR, file);
    return !fs.existsSync(filePath);
  });

  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }

  // Check file sizes
  const scriptPath = path.join(CONFIG.DIST_DIR, 'web-data-extractor.min.js');
  const scriptSize = fs.statSync(scriptPath).size;
  
  if (scriptSize < 1000) {
    throw new Error('Main script file seems too small, build may have failed');
  }

  console.log(`✅ Build validation passed (main script: ${Math.round(scriptSize / 1024)} KB)`);
  return true;
}

/**
 * Generate deployment README
 */
function generateDeploymentReadme() {
  const version = getVersion();
  const readme = `# Web Data Extractor - Deployment Files

Versão: ${version}
Data de build: ${new Date().toLocaleDateString('pt-BR')}
URL base: ${CONFIG.BASE_URL}

## Arquivos

- \`web-data-extractor.min.js\` - Script principal minificado
- \`web-data-extractor.min.css\` - Estilos minificados
- \`bookmarklet.html\` - Página de instalação do bookmarklet
- \`bookmarklet.js\` - Código do bookmarklet minificado
- \`version.json\` - Informações de versão para verificação de atualizações

## Instalação

1. Hospede os arquivos em um servidor web (GitHub Pages, CDN, etc.)
2. Atualize a URL base no arquivo de configuração se necessário
3. Acesse \`bookmarklet.html\` para instruções de instalação

## URLs de Exemplo

- Página de instalação: ${CONFIG.BASE_URL}/bookmarklet.html
- Script principal: ${CONFIG.BASE_URL}/web-data-extractor.min.js
- Verificação de versão: ${CONFIG.BASE_URL}/version.json

## Uso

Após instalar o bookmarklet:
1. Visite qualquer página web
2. Clique no bookmarklet na barra de favoritos
3. Use Ctrl+Shift+E para ativar/desativar o extrator

## Atualizações

O sistema verifica automaticamente por atualizações e usa cache inteligente
para melhorar a performance. O cache é invalidado automaticamente quando
uma nova versão está disponível.
`;

  const readmePath = path.join(CONFIG.DIST_DIR, 'README.md');
  fs.writeFileSync(readmePath, readme, 'utf8');
  
  return readme;
}

/**
 * Main build function
 */
async function buildBookmarklet() {
  console.log('🚀 Building Web Data Extractor bookmarklet deployment...\n');
  
  try {
    // Step 1: Run webpack build
    console.log('📦 Running webpack build...');
    execSync('npm run build', { stdio: 'inherit', cwd: path.dirname(CONFIG.PACKAGE_JSON) });
    console.log('✅ Webpack build completed\n');

    // Step 2: Generate version file
    console.log('📋 Generating version file...');
    const versionInfo = generateVersionFile();
    console.log(`✅ Version file created (v${versionInfo.version})\n`);

    // Step 3: Generate bookmarklet files
    console.log('🔖 Generating bookmarklet files...');
    const bookmarkletResult = saveBookmarkletFiles(CONFIG.BASE_URL);
    console.log(`✅ Bookmarklet generated (${Math.round(bookmarkletResult.size / 1024 * 100) / 100} KB)\n`);

    // Step 4: Validate build
    console.log('🔍 Validating build...');
    validateBuild();
    console.log('✅ Build validation passed\n');

    // Step 5: Generate deployment README
    console.log('📝 Generating deployment documentation...');
    generateDeploymentReadme();
    console.log('✅ Documentation generated\n');

    // Step 6: Copy to GitHub Pages (if docs directory should be used)
    if (process.env.GITHUB_PAGES === 'true' || process.argv.includes('--github-pages')) {
      console.log('📤 Copying files for GitHub Pages...');
      const copied = copyToGitHubPages();
      if (copied) {
        console.log('✅ Files copied to docs/ directory\n');
      }
    }

    // Success summary
    console.log('🎉 Build completed successfully!\n');
    console.log('📁 Output files:');
    console.log(`   • Main script: dist/web-data-extractor.min.js`);
    console.log(`   • Styles: dist/web-data-extractor.min.css`);
    console.log(`   • Installation page: dist/bookmarklet.html`);
    console.log(`   • Version info: dist/version.json`);
    console.log(`\n🌐 Base URL: ${CONFIG.BASE_URL}`);
    console.log(`📏 Bookmarklet size: ${Math.round(bookmarkletResult.size / 1024 * 100) / 100} KB`);
    
    if (bookmarkletResult.size > 2048) {
      console.log('\n⚠️  Warning: Bookmarklet is large. Consider optimizing for better browser compatibility.');
    }

    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Upload dist/ files to: ${CONFIG.BASE_URL}`);
    console.log(`   2. Test installation page: ${CONFIG.BASE_URL}/bookmarklet.html`);
    console.log(`   3. Verify bookmarklet works on test pages`);

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    
    if (error.message.includes('webpack')) {
      console.error('💡 Try running: npm install && npm run build');
    }
    
    process.exit(1);
  }
}

/**
 * CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Web Data Extractor - Bookmarklet Build Script

Usage: node scripts/build-bookmarklet.js [options]

Options:
  --github-pages    Copy files to docs/ directory for GitHub Pages
  --base-url <url>  Set custom base URL (default: from BASE_URL env var)
  --help, -h        Show this help message

Environment Variables:
  BASE_URL          Base URL for hosted files (required for production)
  GITHUB_PAGES      Set to 'true' to enable GitHub Pages deployment

Examples:
  node scripts/build-bookmarklet.js
  BASE_URL=https://mysite.com/extractor node scripts/build-bookmarklet.js
  node scripts/build-bookmarklet.js --github-pages
`);
    return;
  }

  // Override base URL if provided
  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    CONFIG.BASE_URL = args[baseUrlIndex + 1];
  }

  // Run the build
  buildBookmarklet();
}

// Export for use in other scripts
module.exports = {
  buildBookmarklet,
  generateVersionFile,
  copyToGitHubPages,
  validateBuild
};

// Run CLI if called directly
if (require.main === module) {
  main();
}