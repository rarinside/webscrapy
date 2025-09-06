/**
 * Bookmarklet Generator
 * Creates the minified bookmarklet code for browser bookmarks
 */

const fs = require('fs');
const path = require('path');

/**
 * Configuration for bookmarklet generation
 */
const CONFIG = {
  LOADER_PATH: path.join(__dirname, 'loader.js'),
  OUTPUT_DIR: path.join(__dirname, '../../dist'),
  BOOKMARKLET_FILE: 'bookmarklet.js',
  BOOKMARKLET_HTML_FILE: 'bookmarklet.html',
  BASE_URL: 'https://your-domain.github.io/web-data-extractor' // Will be replaced during build
};

/**
 * Minify JavaScript code for bookmarklet
 * Conservative minification that preserves functionality
 */
function minifyForBookmarklet(code) {
  // Store strings temporarily to protect them during minification
  const strings = [];
  let stringIndex = 0;
  
  // Replace strings with placeholders
  let protectedCode = code.replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, (match) => {
    const placeholder = `__STRING_${stringIndex}__`;
    strings[stringIndex] = match;
    stringIndex++;
    return placeholder;
  });
  
  // Minify the protected code
  protectedCode = protectedCode
    // Remove single-line comments
    .replace(/\/\/.*$/gm, '')
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Remove spaces around brackets and punctuation
    .replace(/\s*([{}();,])\s*/g, '$1')
    // Remove leading/trailing whitespace
    .trim();
  
  // Restore strings
  strings.forEach((str, index) => {
    protectedCode = protectedCode.replace(`__STRING_${index}__`, str);
  });
  
  return protectedCode;
}

/**
 * Generate bookmarklet code
 */
function generateBookmarklet(baseUrl = CONFIG.BASE_URL) {
  try {
    // Read the loader script
    const loaderCode = fs.readFileSync(CONFIG.LOADER_PATH, 'utf8');
    
    // Replace the configuration URLs with the actual base URL BEFORE minification
    const configuredCode = loaderCode
      .replace(
        "SCRIPT_URL: 'https://your-domain.github.io/web-data-extractor/web-data-extractor.min.js'",
        `SCRIPT_URL: '${baseUrl}/web-data-extractor.min.js'`
      )
      .replace(
        "CSS_URL: 'https://your-domain.github.io/web-data-extractor/web-data-extractor.min.css'",
        `CSS_URL: '${baseUrl}/web-data-extractor.min.css'`
      )
      .replace(
        "VERSION_CHECK_URL: 'https://your-domain.github.io/web-data-extractor/version.json'",
        `VERSION_CHECK_URL: '${baseUrl}/version.json'`
      );
    
    // Minify the code
    const minifiedCode = minifyForBookmarklet(configuredCode);
    
    // Create the bookmarklet URL
    const bookmarkletUrl = `javascript:${encodeURIComponent(minifiedCode)}`;
    
    return {
      code: minifiedCode,
      url: bookmarkletUrl,
      size: bookmarkletUrl.length
    };
    
  } catch (error) {
    throw new Error(`Failed to generate bookmarklet: ${error.message}`);
  }
}

/**
 * Generate installation HTML page
 */
function generateInstallationPage(bookmarkletUrl, baseUrl = CONFIG.BASE_URL) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Data Extractor - Instalação</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .bookmarklet-button {
            display: inline-block;
            background: #FFC107;
            color: #000;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 18px;
            border: 2px solid #FF8F00;
            transition: all 0.3s ease;
            margin: 10px;
        }
        .bookmarklet-button:hover {
            background: #FF8F00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .installation-steps {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .step {
            margin: 15px 0;
            padding: 10px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #2196F3;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #4CAF50;
        }
        .code {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }
        .stats {
            text-align: center;
            margin: 20px 0;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📞 Web Data Extractor</h1>
        <p>Ferramenta para extrair dados de contato de páginas web</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="${bookmarkletUrl}" class="bookmarklet-button" onclick="return false;">
            📞 Web Data Extractor
        </a>
        <div class="stats">
            Tamanho do bookmarklet: ${Math.round(bookmarkletUrl.length / 1024 * 100) / 100} KB
        </div>
    </div>

    <div class="warning">
        <strong>⚠️ Importante:</strong> Arraste o botão acima para sua barra de favoritos para instalar o bookmarklet.
        Não clique no botão - apenas arraste!
    </div>

    <div class="installation-steps">
        <h2>Como Instalar</h2>
        
        <div class="step">
            <strong>1. Mostre a barra de favoritos</strong><br>
            • Chrome/Edge: Ctrl+Shift+B (Windows) ou Cmd+Shift+B (Mac)<br>
            • Firefox: Ctrl+Shift+B (Windows) ou Cmd+Shift+B (Mac)<br>
            • Safari: Cmd+Shift+B
        </div>

        <div class="step">
            <strong>2. Arraste o botão</strong><br>
            Arraste o botão "📞 Web Data Extractor" acima para sua barra de favoritos.
            <strong>Não clique</strong> no botão - apenas arraste!
        </div>

        <div class="step">
            <strong>3. Use em qualquer página</strong><br>
            Visite qualquer página web e clique no bookmarklet na sua barra de favoritos
            para ativar o extrator de dados.
        </div>
    </div>

    <div class="features">
        <div class="feature">
            <h3>🔍 Detecção Automática</h3>
            <p>Identifica automaticamente nomes, telefones e emails em páginas web usando padrões brasileiros.</p>
        </div>

        <div class="feature">
            <h3>✏️ Edição Inline</h3>
            <p>Revise e edite os dados extraídos antes de exportar para garantir qualidade.</p>
        </div>

        <div class="feature">
            <h3>📊 Export CSV</h3>
            <p>Exporte os contatos coletados em formato CSV para importar em outras ferramentas.</p>
        </div>

        <div class="feature">
            <h3>⚡ Cache Inteligente</h3>
            <p>Sistema de cache que evita downloads repetidos e verifica atualizações automaticamente.</p>
        </div>
    </div>

    <div class="installation-steps">
        <h2>Atalhos de Teclado</h2>
        
        <div class="step">
            <strong>Ctrl+Shift+E</strong> - Ativar/Desativar extrator
        </div>
        
        <div class="step">
            <strong>Esc</strong> - Desativar extrator (quando ativo)
        </div>
        
        <div class="step">
            <strong>Ctrl+Shift+S</strong> - Exportar CSV (quando modal visível)
        </div>
        
        <div class="step">
            <strong>Ctrl+Shift+R</strong> - Atualizar extração
        </div>
        
        <div class="step">
            <strong>Ctrl+Shift+H</strong> - Mostrar ajuda
        </div>
    </div>

    <div class="installation-steps">
        <h2>Solução de Problemas</h2>
        
        <div class="step">
            <strong>Bookmarklet não funciona:</strong><br>
            • Verifique se você arrastou (não clicou) o botão<br>
            • Certifique-se de que JavaScript está habilitado<br>
            • Tente em uma página diferente
        </div>
        
        <div class="step">
            <strong>Erro de carregamento:</strong><br>
            • Verifique sua conexão com a internet<br>
            • O cache será limpo automaticamente em caso de erro<br>
            • Tente novamente em alguns segundos
        </div>
        
        <div class="step">
            <strong>Não encontra contatos:</strong><br>
            • Aguarde o carregamento completo da página<br>
            • Use Ctrl+Shift+R para atualizar a extração<br>
            • Alguns sites podem ter proteções contra extração
        </div>
    </div>

    <div style="text-align: center; margin: 40px 0; color: #666;">
        <p>Versão hospedada em: <code>${baseUrl}</code></p>
        <p>Última atualização: ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>

    <script>
        // Prevent accidental clicks on the bookmarklet button
        document.querySelector('.bookmarklet-button').addEventListener('click', function(e) {
            e.preventDefault();
            alert('Não clique no botão! Arraste-o para sua barra de favoritos para instalar.');
            return false;
        });

        // Add drag feedback
        document.querySelector('.bookmarklet-button').addEventListener('dragstart', function(e) {
            // Change appearance during drag
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.95)';
            
            // Show success message
            setTimeout(() => {
                const message = document.createElement('div');
                message.style.cssText = \`
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #4CAF50;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    font-size: 16px;
                    z-index: 1000;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                \`;
                message.textContent = '✅ Bookmarklet instalado! Agora você pode usá-lo em qualquer página.';
                document.body.appendChild(message);
                
                setTimeout(() => message.remove(), 3000);
            }, 500);
        });

        document.querySelector('.bookmarklet-button').addEventListener('dragend', function(e) {
            // Restore appearance
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });
    </script>
</body>
</html>`;

  return html;
}

/**
 * Save bookmarklet files
 */
function saveBookmarkletFiles(baseUrl = CONFIG.BASE_URL) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    }
    
    // Generate bookmarklet
    const bookmarklet = generateBookmarklet(baseUrl);
    
    // Save minified bookmarklet code
    const bookmarkletPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.BOOKMARKLET_FILE);
    fs.writeFileSync(bookmarkletPath, bookmarklet.code, 'utf8');
    
    // Save installation HTML page
    const installationHtml = generateInstallationPage(bookmarklet.url, baseUrl);
    const htmlPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.BOOKMARKLET_HTML_FILE);
    fs.writeFileSync(htmlPath, installationHtml, 'utf8');
    
    // Save bookmarklet URL for easy access
    const urlPath = path.join(CONFIG.OUTPUT_DIR, 'bookmarklet-url.txt');
    fs.writeFileSync(urlPath, bookmarklet.url, 'utf8');
    
    return {
      bookmarkletPath,
      htmlPath,
      urlPath,
      size: bookmarklet.size,
      url: bookmarklet.url
    };
    
  } catch (error) {
    throw new Error(`Failed to save bookmarklet files: ${error.message}`);
  }
}

/**
 * CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || CONFIG.BASE_URL;
  
  try {
    console.log('Generating bookmarklet...');
    console.log(`Base URL: ${baseUrl}`);
    
    const result = saveBookmarkletFiles(baseUrl);
    
    console.log('\n✅ Bookmarklet generated successfully!');
    console.log(`📁 Files created:`);
    console.log(`   • ${result.bookmarkletPath}`);
    console.log(`   • ${result.htmlPath}`);
    console.log(`   • ${result.urlPath}`);
    console.log(`📏 Bookmarklet size: ${Math.round(result.size / 1024 * 100) / 100} KB`);
    console.log(`🔗 Bookmarklet URL length: ${result.size} characters`);
    
    if (result.size > 2048) {
      console.log('\n⚠️  Warning: Bookmarklet is quite large. Some browsers may have issues.');
    }
    
    console.log(`\n🌐 Installation page: file://${result.htmlPath}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  generateBookmarklet,
  generateInstallationPage,
  saveBookmarkletFiles,
  minifyForBookmarklet
};

// Run CLI if called directly
if (require.main === module) {
  main();
}