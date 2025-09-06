/**
 * Web Data Extractor - Bookmarklet Loader
 * This script is injected by the bookmarklet to load the main application
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    SCRIPT_URL: 'https://your-domain.github.io/web-data-extractor/web-data-extractor.min.js',
    CSS_URL: 'https://your-domain.github.io/web-data-extractor/web-data-extractor.min.css',
    VERSION_CHECK_URL: 'https://your-domain.github.io/web-data-extractor/version.json',
    CACHE_KEY: 'web-data-extractor-cache',
    VERSION_KEY: 'web-data-extractor-version',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    SCRIPT_ID: 'web-data-extractor-script',
    CSS_ID: 'web-data-extractor-styles',
    APP_NAMESPACE: 'WebDataExtractorApp'
  };

  // Check if already loaded
  if (window[CONFIG.APP_NAMESPACE]) {
    console.log('Web Data Extractor already loaded');
    
    // If already initialized, just toggle activation
    const app = window[CONFIG.APP_NAMESPACE];
    if (app.getState && typeof app.getState === 'function') {
      const state = app.getState();
      if (state.isInitialized) {
        if (state.isActive) {
          app.deactivate();
        } else {
          app.activate();
        }
        return;
      }
    }
    
    // If loaded but not initialized, try to initialize
    if (app.init && typeof app.init === 'function') {
      app.init();
      return;
    }
  }

  // Utility functions
  const utils = {
    /**
     * Get cached script content and metadata
     */
    getCachedScript: function() {
      try {
        const cached = localStorage.getItem(CONFIG.CACHE_KEY);
        const version = localStorage.getItem(CONFIG.VERSION_KEY);
        
        if (cached && version) {
          const cacheData = JSON.parse(cached);
          const versionData = JSON.parse(version);
          
          // Check if cache is still valid
          const now = Date.now();
          if (now - cacheData.timestamp < CONFIG.CACHE_DURATION) {
            return {
              script: cacheData.script,
              css: cacheData.css,
              version: versionData.version,
              timestamp: cacheData.timestamp
            };
          }
        }
      } catch (error) {
        console.warn('Failed to read cache:', error);
      }
      return null;
    },

    /**
     * Cache script content and metadata
     */
    cacheScript: function(script, css, version) {
      try {
        const cacheData = {
          script: script,
          css: css,
          timestamp: Date.now()
        };
        
        const versionData = {
          version: version,
          timestamp: Date.now()
        };

        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
        localStorage.setItem(CONFIG.VERSION_KEY, JSON.stringify(versionData));
      } catch (error) {
        console.warn('Failed to cache script:', error);
      }
    },

    /**
     * Clear cached script
     */
    clearCache: function() {
      try {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        localStorage.removeItem(CONFIG.VERSION_KEY);
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    },

    /**
     * Check for script updates
     */
    checkForUpdates: function() {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', CONFIG.VERSION_CHECK_URL + '?t=' + Date.now(), true);
        xhr.timeout = 5000; // 5 second timeout
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const versionInfo = JSON.parse(xhr.responseText);
              resolve(versionInfo);
            } catch (error) {
              console.warn('Failed to parse version info:', error);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        
        xhr.onerror = function() {
          resolve(null);
        };
        
        xhr.ontimeout = function() {
          resolve(null);
        };
        
        xhr.send();
      });
    },

    /**
     * Load script from URL
     */
    loadScript: function(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url + '?t=' + Date.now(), true);
        xhr.timeout = 10000; // 10 second timeout
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error('Failed to load script: HTTP ' + xhr.status));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error loading script'));
        };
        
        xhr.ontimeout = function() {
          reject(new Error('Timeout loading script'));
        };
        
        xhr.send();
      });
    },

    /**
     * Load CSS from URL
     */
    loadCSS: function(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url + '?t=' + Date.now(), true);
        xhr.timeout = 10000; // 10 second timeout
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error('Failed to load CSS: HTTP ' + xhr.status));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error loading CSS'));
        };
        
        xhr.ontimeout = function() {
          reject(new Error('Timeout loading CSS'));
        };
        
        xhr.send();
      });
    },

    /**
     * Inject CSS into the page
     */
    injectCSS: function(cssContent) {
      // Remove existing CSS if present
      const existingCSS = document.getElementById(CONFIG.CSS_ID);
      if (existingCSS) {
        existingCSS.remove();
      }

      // Create and inject new CSS
      const style = document.createElement('style');
      style.id = CONFIG.CSS_ID;
      style.type = 'text/css';
      style.textContent = cssContent;
      
      // Insert at the beginning of head to allow page styles to override if needed
      const head = document.head || document.getElementsByTagName('head')[0];
      head.insertBefore(style, head.firstChild);
    },

    /**
     * Execute script content
     */
    executeScript: function(scriptContent) {
      try {
        // Remove existing script if present
        const existingScript = document.getElementById(CONFIG.SCRIPT_ID);
        if (existingScript) {
          existingScript.remove();
        }

        // Create script element for better error handling and debugging
        const script = document.createElement('script');
        script.id = CONFIG.SCRIPT_ID;
        script.type = 'text/javascript';
        script.textContent = scriptContent;
        
        // Add error handling
        script.onerror = function(error) {
          console.error('Script execution error:', error);
          throw new Error('Failed to execute Web Data Extractor script');
        };

        // Inject script
        document.head.appendChild(script);
        
        // Verify the script loaded correctly
        if (!window.WebDataExtractor) {
          throw new Error('WebDataExtractor not found after script execution');
        }

        return true;
      } catch (error) {
        console.error('Failed to execute script:', error);
        throw error;
      }
    },

    /**
     * Show loading notification
     */
    showLoading: function(message) {
      // Create simple loading notification
      const notification = document.createElement('div');
      notification.id = 'web-data-extractor-loading';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        z-index: 10001;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        max-width: 300px;
        word-wrap: break-word;
      `;
      notification.textContent = message || 'Carregando Web Data Extractor...';
      
      document.body.appendChild(notification);
      
      return notification;
    },

    /**
     * Hide loading notification
     */
    hideLoading: function() {
      const notification = document.getElementById('web-data-extractor-loading');
      if (notification) {
        notification.remove();
      }
    },

    /**
     * Show error notification
     */
    showError: function(message) {
      const notification = document.createElement('div');
      notification.id = 'web-data-extractor-error';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #F44336;
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
      `;
      notification.textContent = message || 'Erro ao carregar Web Data Extractor';
      notification.title = 'Clique para fechar';
      
      // Auto-remove after 5 seconds or on click
      const removeNotification = () => notification.remove();
      notification.addEventListener('click', removeNotification);
      setTimeout(removeNotification, 5000);
      
      document.body.appendChild(notification);
    }
  };

  /**
   * Main loader function
   */
  async function loadWebDataExtractor() {
    let loadingNotification = null;
    
    try {
      loadingNotification = utils.showLoading('Carregando Web Data Extractor...');
      
      // Check for updates first
      const versionInfo = await utils.checkForUpdates();
      const cachedData = utils.getCachedScript();
      
      let shouldUseCache = false;
      let scriptContent = '';
      let cssContent = '';
      
      // Determine if we should use cache or download fresh
      if (cachedData && versionInfo) {
        shouldUseCache = cachedData.version === versionInfo.version;
      } else if (cachedData && !versionInfo) {
        // If we can't check for updates, use cache if it's recent
        const cacheAge = Date.now() - cachedData.timestamp;
        shouldUseCache = cacheAge < CONFIG.CACHE_DURATION;
      }
      
      if (shouldUseCache && cachedData) {
        console.log('Using cached Web Data Extractor script');
        scriptContent = cachedData.script;
        cssContent = cachedData.css;
      } else {
        console.log('Downloading fresh Web Data Extractor script');
        
        // Update loading message
        if (loadingNotification) {
          loadingNotification.textContent = 'Baixando script...';
        }
        
        // Load script and CSS in parallel
        const [script, css] = await Promise.all([
          utils.loadScript(CONFIG.SCRIPT_URL),
          utils.loadCSS(CONFIG.CSS_URL)
        ]);
        
        scriptContent = script;
        cssContent = css;
        
        // Cache the new content
        const version = versionInfo ? versionInfo.version : Date.now().toString();
        utils.cacheScript(scriptContent, cssContent, version);
      }
      
      // Update loading message
      if (loadingNotification) {
        loadingNotification.textContent = 'Inicializando...';
      }
      
      // Inject CSS first
      utils.injectCSS(cssContent);
      
      // Execute script
      utils.executeScript(scriptContent);
      
      // Initialize the application
      if (window.WebDataExtractor) {
        const app = new window.WebDataExtractor();
        window[CONFIG.APP_NAMESPACE] = app;
        
        // Initialize the app
        app.init();
        
        console.log('Web Data Extractor loaded and initialized successfully');
      } else {
        throw new Error('WebDataExtractor class not available after script execution');
      }
      
    } catch (error) {
      console.error('Failed to load Web Data Extractor:', error);
      
      // Clear cache on error in case it's corrupted
      utils.clearCache();
      
      // Show error to user
      utils.showError('Erro ao carregar: ' + error.message);
      
      // Try to provide fallback or recovery options
      if (error.message.includes('Network') || error.message.includes('Timeout')) {
        setTimeout(() => {
          utils.showError('Verifique sua conexão e tente novamente');
        }, 2000);
      }
      
    } finally {
      // Hide loading notification
      utils.hideLoading();
    }
  }

  // Start loading
  loadWebDataExtractor();

})();