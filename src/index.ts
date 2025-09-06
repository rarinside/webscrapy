/**
 * Web Data Extractor - Main Entry Point
 * Browser-based contact data extraction tool
 */

// Import core classes (to be implemented in later tasks)
import { DOMScanner } from '@classes/DOMScanner';
import { PatternMatcher } from '@classes/PatternMatcher';
import { UIController } from '@classes/UIController';
import { DataManager } from '@classes/DataManager';
import { CSVExporter } from '@classes/CSVExporter';
import { ErrorHandler, ErrorType, ErrorSeverity } from '@classes/ErrorHandler';
import { NotificationManager } from '@classes/NotificationManager';

// Import types
import type { ContactData, ExtractionResult, ExtractorConfig } from '@types/interfaces';

// Import styles
import '@assets/styles.css';

/**
 * Main Web Data Extractor Application Class
 * Coordinates all components and manages the extraction workflow
 */
export class WebDataExtractor {
  private domScanner: DOMScanner;
  private patternMatcher: PatternMatcher;
  private uiController: UIController;
  private dataManager: DataManager;
  private csvExporter: CSVExporter;
  private errorHandler: ErrorHandler;
  private notificationManager: NotificationManager;
  private config: ExtractorConfig;
  private isInitialized: boolean = false;
  private isActive: boolean = false;
  private activationButton: HTMLElement | null = null;

  constructor(config: Partial<ExtractorConfig> = {}) {
    this.config = {
      highlightElements: true,
      maxContacts: 100,
      minConfidence: 0.5,
      ...config
    };

    // Initialize error handling and notifications first
    this.notificationManager = new NotificationManager();
    this.errorHandler = new ErrorHandler(this.notificationManager, false); // Set to true for debug mode

    // Check browser compatibility
    if (!this.errorHandler.checkBrowserCompatibility()) {
      throw new Error('Navegador não suportado');
    }

    // Initialize components with error handling
    this.domScanner = new DOMScanner(this.errorHandler);
    this.patternMatcher = new PatternMatcher(this.errorHandler);
    this.uiController = new UIController();
    this.dataManager = new DataManager(this.errorHandler);
    this.csvExporter = new CSVExporter(this.errorHandler);
  }

  /**
   * Initialize the extractor application
   * Sets up DOM ready state handling, error handling, and user notifications
   */
  public init(): void {
    if (this.isInitialized) {
      this.errorHandler.handleError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        'Web Data Extractor já foi inicializado'
      );
      return;
    }

    try {
      // Check if DOM is already ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
      } else {
        // DOM is already ready
        this.onDOMReady();
      }

      // Set up UI controller callbacks
      this.setupUICallbacks();

      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();

      this.isInitialized = true;
      console.log('Web Data Extractor initialized successfully');
      
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNEXPECTED,
        ErrorSeverity.CRITICAL,
        'Falha ao inicializar Web Data Extractor',
        error as Error
      );
    }
  }

  /**
   * Handle DOM ready state - called when DOM is fully loaded
   */
  private onDOMReady(): void {
    try {
      // Clean up any old sessions if needed
      this.dataManager.cleanupOldSessions(24);

      // Check if there's a previous session to restore
      if (this.dataManager.hasSession()) {
        const sessionAge = this.dataManager.getSessionAge();
        if (sessionAge !== null && sessionAge < 60) { // Less than 1 hour old
          this.notificationManager.info('Sessão anterior encontrada. Dados restaurados.');
          this.dataManager.restoreSession('merge');
        }
      }

      // Create activation button
      this.createActivationButton();

      console.log('Web Data Extractor DOM ready');
      
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.DOM_ACCESS,
        ErrorSeverity.HIGH,
        'Erro durante configuração DOM ready',
        error as Error
      );
    }
  }



  /**
   * Set up UI controller callbacks and event handlers
   */
  private setupUICallbacks(): void {
    // Set callback for when contacts are updated in the UI
    this.uiController.setContactsUpdatedCallback((contacts: ContactData[]) => {
      // Update data manager with the modified contacts
      this.dataManager.clearAll();
      contacts.forEach(contact => this.dataManager.addContact(contact));
      this.dataManager.saveSession({ extractedCount: contacts.length });
    });

    // Set up CSV export handler
    this.setupCSVExportHandler();
  }

  /**
   * Set up keyboard shortcuts for tool activation
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Check for Ctrl+Shift+E (or Cmd+Shift+E on Mac)
      const isActivationShortcut = (event.ctrlKey || event.metaKey) && 
                                   event.shiftKey && 
                                   event.key.toLowerCase() === 'e';

      if (isActivationShortcut) {
        event.preventDefault();
        event.stopPropagation();
        
        // Toggle extractor state
        this.toggleExtractor();
        
        // Show shortcut feedback
        const action = this.isActive ? 'ativado' : 'desativado';
        this.showNotification(`Extrator ${action} via teclado`, 'info');
      }

      // Additional shortcuts when extractor is active
      if (this.isActive) {
        // Escape key to deactivate
        if (event.key === 'Escape') {
          event.preventDefault();
          this.deactivateExtractor();
        }

        // Ctrl+Shift+S to save/export (when modal is visible)
        if ((event.ctrlKey || event.metaKey) && 
            event.shiftKey && 
            event.key.toLowerCase() === 's' && 
            this.uiController.isVisible()) {
          event.preventDefault();
          this.handleCSVExport();
        }

        // Ctrl+Shift+R to refresh/re-extract
        if ((event.ctrlKey || event.metaKey) && 
            event.shiftKey && 
            event.key.toLowerCase() === 'r') {
          event.preventDefault();
          this.refreshExtraction();
        }
      }

      // Ctrl+Shift+H to show help (works anytime when initialized)
      if ((event.ctrlKey || event.metaKey) && 
          event.shiftKey && 
          event.key.toLowerCase() === 'h') {
        event.preventDefault();
        this.showKeyboardShortcutsHelp();
      }
    });

    // Prevent conflicts with existing page shortcuts
    document.addEventListener('keydown', (event) => {
      // If our shortcuts are triggered, prevent other handlers
      const isOurShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && 
                           ['e', 's', 'r', 'h'].includes(event.key.toLowerCase());
      
      if (isOurShortcut && this.isInitialized) {
        event.stopImmediatePropagation();
      }
    }, true); // Use capture phase to intercept early
  }

  /**
   * Refresh extraction - re-scan the page for new contacts
   */
  private async refreshExtraction(): Promise<void> {
    if (!this.isActive) return;

    try {
      this.showNotification('Atualizando extração...', 'info');
      
      // Clear highlights first
      this.domScanner.removeHighlights();
      
      // Re-run extraction
      const result = await this.startExtraction();
      
      if (result.contacts.length > 0) {
        this.showNotification(`Extração atualizada: ${result.contacts.length} contatos`, 'success');
        
        // Update modal if visible
        if (this.uiController.isVisible()) {
          this.uiController.showReviewModal(result.contacts);
        }
        
        // Re-highlight elements
        if (this.config.highlightElements) {
          this.domScanner.highlightElements(result.elementsFound);
        }
      } else {
        this.showNotification('Nenhum contato encontrado na atualização', 'warning');
      }

    } catch (error) {
      console.error('Refresh extraction failed:', error);
      this.showNotification('Erro ao atualizar extração', 'error');
    }
  }

  /**
   * Set up CSV export functionality
   */
  private setupCSVExportHandler(): void {
    // Listen for export button clicks in the modal
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.id === 'export-csv-btn') {
        event.preventDefault();
        this.handleCSVExport();
      }
    });
  }

  /**
   * Handle CSV export process
   */
  private handleCSVExport(): void {
    try {
      const contacts = this.dataManager.getAllContacts();
      
      if (contacts.length === 0) {
        this.showNotification('Nenhum contato para exportar', 'warning');
        return;
      }

      // Generate and download CSV
      this.csvExporter.exportContacts(contacts);
      this.showNotification(`${contacts.length} contatos exportados com sucesso`, 'success');
      
      // Save session after export
      this.dataManager.saveSession({ 
        extractedCount: contacts.length,
        lastExport: new Date().toISOString()
      });

    } catch (error) {
      console.error('CSV export failed:', error);
      this.showNotification('Erro ao exportar CSV: ' + (error as Error).message, 'error');
    }
  }

  /**
   * Create activation button that can be injected into pages
   */
  private createActivationButton(): void {
    // Remove existing button if present
    if (this.activationButton) {
      this.activationButton.remove();
    }

    // Create floating activation button
    this.activationButton = document.createElement('button');
    this.activationButton.id = 'web-data-extractor-activation-btn';
    this.activationButton.innerHTML = '📞';
    this.activationButton.title = 'Ativar Extrator de Contatos (Ctrl+Shift+E)';
    this.activationButton.className = 'web-data-extractor-activation-btn';
    this.activationButton.setAttribute('aria-label', 'Ativar Extrator de Contatos');

    // Style the button with better positioning logic
    const buttonPosition = this.calculateButtonPosition();
    Object.assign(this.activationButton.style, {
      position: 'fixed',
      top: buttonPosition.top,
      right: buttonPosition.right,
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#FFC107',
      border: '2px solid #FF8F00',
      color: '#000',
      fontSize: '20px',
      cursor: 'pointer',
      zIndex: '10000',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      outline: 'none'
    });

    // Add interaction effects
    this.setupButtonInteractions();

    // Add click handler with debouncing
    let clickTimeout: number | null = null;
    this.activationButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Debounce clicks to prevent double-activation
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      
      clickTimeout = window.setTimeout(() => {
        this.toggleExtractor();
        clickTimeout = null;
      }, 100);
    });

    // Add keyboard support for accessibility
    this.activationButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggleExtractor();
      }
    });

    // Make button draggable for better UX
    this.makeButtonDraggable();

    // Append to body
    document.body.appendChild(this.activationButton);

    // Add pulse animation when first created
    this.pulseButton();
  }

  /**
   * Calculate optimal button position to avoid conflicts with page elements
   */
  private calculateButtonPosition(): { top: string; right: string } {
    // Default position
    let top = '20px';
    let right = '20px';

    // Check for common conflicting elements and adjust position
    const conflictingSelectors = [
      '[style*="position: fixed"][style*="top"][style*="right"]',
      '.fixed-top-right',
      '.notification-container',
      '.chat-widget',
      '.help-widget'
    ];

    let hasConflict = false;
    for (const selector of conflictingSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        hasConflict = true;
        break;
      }
    }

    // If there's a conflict, move button to left side
    if (hasConflict) {
      right = 'auto';
      return { top, right: '20px' }; // Keep on right but adjust if needed
    }

    // Check if we're in an iframe or specific domains that might have conflicts
    if (window !== window.top || (window.location.hostname && window.location.hostname.includes('pipedrive'))) {
      top = '60px'; // Move down a bit for better integration
    }

    return { top, right };
  }

  /**
   * Set up button interaction effects
   */
  private setupButtonInteractions(): void {
    if (!this.activationButton) return;

    // Hover effects
    this.activationButton.addEventListener('mouseenter', () => {
      if (this.activationButton) {
        this.activationButton.style.transform = 'scale(1.1)';
        this.activationButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
      }
    });

    this.activationButton.addEventListener('mouseleave', () => {
      if (this.activationButton) {
        this.activationButton.style.transform = 'scale(1)';
        this.activationButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      }
    });

    // Focus effects for accessibility
    this.activationButton.addEventListener('focus', () => {
      if (this.activationButton) {
        this.activationButton.style.outline = '3px solid #2196F3';
        this.activationButton.style.outlineOffset = '2px';
      }
    });

    this.activationButton.addEventListener('blur', () => {
      if (this.activationButton) {
        this.activationButton.style.outline = 'none';
      }
    });

    // Active state
    this.activationButton.addEventListener('mousedown', () => {
      if (this.activationButton) {
        this.activationButton.style.transform = 'scale(0.95)';
      }
    });

    this.activationButton.addEventListener('mouseup', () => {
      if (this.activationButton) {
        this.activationButton.style.transform = 'scale(1.1)';
      }
    });
  }

  /**
   * Make the activation button draggable for better user experience
   */
  private makeButtonDraggable(): void {
    if (!this.activationButton) return;

    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    this.activationButton.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return; // Only left mouse button
      
      isDragging = true;
      const rect = this.activationButton!.getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left;
      dragOffset.y = event.clientY - rect.top;
      
      this.activationButton!.style.cursor = 'grabbing';
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
      if (!isDragging || !this.activationButton) return;

      const x = event.clientX - dragOffset.x;
      const y = event.clientY - dragOffset.y;

      // Keep button within viewport bounds
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;

      const constrainedX = Math.max(0, Math.min(x, maxX));
      const constrainedY = Math.max(0, Math.min(y, maxY));

      this.activationButton.style.left = constrainedX + 'px';
      this.activationButton.style.top = constrainedY + 'px';
      this.activationButton.style.right = 'auto';
      this.activationButton.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (isDragging && this.activationButton) {
        isDragging = false;
        this.activationButton.style.cursor = 'pointer';
      }
    });
  }

  /**
   * Add pulse animation to draw attention to the button
   */
  private pulseButton(): void {
    if (!this.activationButton) return;

    // Add pulse animation
    const pulseKeyframes = `
      @keyframes web-data-extractor-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;

    // Inject keyframes if not already present
    if (!document.getElementById('web-data-extractor-pulse-styles')) {
      const style = document.createElement('style');
      style.id = 'web-data-extractor-pulse-styles';
      style.textContent = pulseKeyframes;
      document.head.appendChild(style);
    }

    // Apply pulse animation briefly
    this.activationButton.style.animation = 'web-data-extractor-pulse 1s ease-in-out 3';
    
    // Remove animation after it completes
    setTimeout(() => {
      if (this.activationButton) {
        this.activationButton.style.animation = '';
      }
    }, 3000);
  }

  /**
   * Toggle extractor active/inactive state
   */
  private toggleExtractor(): void {
    if (this.isActive) {
      this.deactivateExtractor();
    } else {
      this.activateExtractor();
    }
  }

  /**
   * Activate the extractor and start extraction process
   */
  private async activateExtractor(): Promise<void> {
    if (this.isActive) return;

    try {
      this.isActive = true;
      this.updateActivationButtonState();
      this.showNotification('Iniciando extração de contatos...', 'info');

      // Start extraction process
      const result = await this.startExtraction();
      
      if (result.contacts.length > 0) {
        this.showNotification(`${result.contacts.length} contatos encontrados`, 'success');
        
        // Show review modal
        this.uiController.showReviewModal(result.contacts);
        
        // Highlight elements if configured
        if (this.config.highlightElements) {
          this.domScanner.highlightElements(result.elementsFound);
        }
      } else {
        this.showNotification('Nenhum contato encontrado na página', 'warning');
        this.deactivateExtractor();
      }

    } catch (error) {
      console.error('Extraction failed:', error);
      this.showNotification('Erro durante extração: ' + (error as Error).message, 'error');
      this.deactivateExtractor();
    }
  }

  /**
   * Deactivate the extractor and clean up
   */
  private deactivateExtractor(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.updateActivationButtonState();
    
    // Clean up highlights
    this.domScanner.removeHighlights();
    
    // Hide modal if visible
    if (this.uiController.isVisible()) {
      this.uiController.hideReviewModal();
    }

    this.showNotification('Extrator desativado', 'info');
  }

  /**
   * Update activation button appearance based on state
   */
  private updateActivationButtonState(): void {
    if (!this.activationButton) return;

    if (this.isActive) {
      this.activationButton.innerHTML = '⏹️';
      this.activationButton.title = 'Desativar Extrator de Contatos (Ctrl+Shift+E) - Esc para sair';
      this.activationButton.setAttribute('aria-label', 'Desativar Extrator de Contatos');
      this.activationButton.style.backgroundColor = '#FF5722';
      this.activationButton.style.borderColor = '#D84315';
      
      // Add active state indicator
      this.activationButton.style.boxShadow = '0 4px 8px rgba(255, 87, 34, 0.4), 0 0 0 3px rgba(255, 87, 34, 0.2)';
      
      // Add subtle pulsing for active state
      this.activationButton.style.animation = 'web-data-extractor-pulse 2s ease-in-out infinite';
    } else {
      this.activationButton.innerHTML = '📞';
      this.activationButton.title = 'Ativar Extrator de Contatos (Ctrl+Shift+E)';
      this.activationButton.setAttribute('aria-label', 'Ativar Extrator de Contatos');
      this.activationButton.style.backgroundColor = '#FFC107';
      this.activationButton.style.borderColor = '#FF8F00';
      this.activationButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      this.activationButton.style.animation = '';
    }

    // Add contact count badge if there are contacts
    const contactCount = this.dataManager.getContactCount();
    if (contactCount > 0) {
      this.addContactCountBadge(contactCount);
    } else {
      this.removeContactCountBadge();
    }
  }

  /**
   * Add contact count badge to activation button
   */
  private addContactCountBadge(count: number): void {
    if (!this.activationButton) return;

    // Remove existing badge
    this.removeContactCountBadge();

    // Create badge element
    const badge = document.createElement('span');
    badge.id = 'web-data-extractor-count-badge';
    badge.textContent = count.toString();
    badge.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      background: #F44336;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 1;
    `;

    this.activationButton.style.position = 'relative';
    this.activationButton.appendChild(badge);
  }

  /**
   * Remove contact count badge from activation button
   */
  private removeContactCountBadge(): void {
    const existingBadge = document.getElementById('web-data-extractor-count-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  }

  /**
   * Start extraction process
   */
  public async startExtraction(): Promise<ExtractionResult> {
    try {
      // Clear previous data
      this.dataManager.clearAll();

      // Scan the page for contacts
      const contacts = this.domScanner.scanPage();
      
      // Filter contacts based on configuration
      const filteredContacts = contacts.slice(0, this.config.maxContacts || 100);
      
      // Add contacts to data manager
      const addedContacts: ContactData[] = [];
      const elementsFound: HTMLElement[] = [];
      
      filteredContacts.forEach(contact => {
        if (this.dataManager.addContact(contact)) {
          addedContacts.push(contact);
          
          // Find elements containing this contact's data for highlighting
          const contactElements = this.findElementsForContact(contact);
          elementsFound.push(...contactElements);
        }
      });

      // Calculate confidence based on data quality
      const confidence = this.calculateExtractionConfidence(addedContacts);
      
      // Save session
      this.dataManager.saveSession({ 
        extractedCount: addedContacts.length,
        confidence: confidence
      });

      return {
        contacts: addedContacts,
        elementsFound: elementsFound,
        confidence: confidence
      };

    } catch (error) {
      console.error('Extraction process failed:', error);
      throw new Error('Falha durante extração de dados: ' + (error as Error).message);
    }
  }

  /**
   * Find HTML elements that contain the given contact's data
   */
  private findElementsForContact(contact: ContactData): HTMLElement[] {
    const elements: HTMLElement[] = [];
    const searchTerms: string[] = [];

    // Add non-empty contact fields to search terms
    if (contact.name) searchTerms.push(contact.name);
    if (contact.phone) searchTerms.push(contact.phone);
    if (contact.email) searchTerms.push(contact.email);

    if (searchTerms.length === 0) return elements;

    // Search through all text-containing elements
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const htmlElement = element as HTMLElement;
      
      // Skip excluded elements
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'TITLE'].includes(htmlElement.tagName)) {
        continue;
      }

      const elementText = htmlElement.textContent || '';
      
      // Check if this element contains any of the contact's data
      const containsContactData = searchTerms.some(term => 
        elementText.toLowerCase().includes(term.toLowerCase())
      );

      if (containsContactData && !elements.includes(htmlElement)) {
        elements.push(htmlElement);
      }
    }

    return elements;
  }

  /**
   * Calculate extraction confidence based on data quality
   */
  private calculateExtractionConfidence(contacts: ContactData[]): number {
    if (contacts.length === 0) return 0;

    let totalScore = 0;
    
    contacts.forEach(contact => {
      let contactScore = 0;
      
      // Score based on completeness
      if (contact.name && contact.name.trim()) contactScore += 0.4;
      if (contact.phone && contact.phone.trim()) contactScore += 0.3;
      if (contact.email && contact.email.trim()) contactScore += 0.3;
      
      totalScore += contactScore;
    });

    return Math.min(totalScore / contacts.length, 1.0);
  }

  /**
   * Show notification to user
   */
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.notificationManager.show(message, type);
  }

  /**
   * Get current application state
   */
  public getState(): { 
    isInitialized: boolean; 
    isActive: boolean; 
    contactCount: number;
    hasSession: boolean;
    sessionAge: number | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isActive: this.isActive,
      contactCount: this.dataManager.getContactCount(),
      hasSession: this.dataManager.hasSession(),
      sessionAge: this.dataManager.getSessionAge()
    };
  }

  /**
   * Manually activate the extractor (for external use)
   */
  public activate(): Promise<void> {
    return this.activateExtractor();
  }

  /**
   * Manually deactivate the extractor (for external use)
   */
  public deactivate(): void {
    this.deactivateExtractor();
  }

  /**
   * Get all extracted contacts (for external use)
   */
  public getContacts(): ContactData[] {
    return this.dataManager.getAllContacts();
  }

  /**
   * Export contacts to CSV (for external use)
   */
  public exportCSV(filename?: string): void {
    const contacts = this.dataManager.getAllContacts();
    if (contacts.length === 0) {
      throw new Error('Nenhum contato para exportar');
    }
    this.csvExporter.exportContacts(contacts, filename);
  }

  /**
   * Show help information about keyboard shortcuts
   */
  private showKeyboardShortcutsHelp(): void {
    const helpMessage = `
Atalhos do Extrator de Contatos:

• Ctrl+Shift+E: Ativar/Desativar extrator
• Esc: Desativar extrator (quando ativo)
• Ctrl+Shift+S: Exportar CSV (quando modal visível)
• Ctrl+Shift+R: Atualizar extração (quando ativo)
• Ctrl+Shift+H: Mostrar esta ajuda

Dica: Você também pode arrastar o botão para reposicioná-lo!
    `.trim();

    // Create help modal or use notification
    this.showNotification('Pressione F12 para ver atalhos no console', 'info');
    console.log(helpMessage);
  }

  /**
   * Clean up and destroy the application
   */
  public destroy(): void {
    try {
      // Deactivate if active
      if (this.isActive) {
        this.deactivateExtractor();
      }

      // Remove activation button
      if (this.activationButton) {
        this.activationButton.remove();
        this.activationButton = null;
      }

      // Clean up DOM scanner
      this.domScanner.cleanup();

      // Destroy UI controller
      this.uiController.destroy();

      // Clear session
      this.dataManager.clearSession();

      this.isInitialized = false;
      console.log('Web Data Extractor destroyed');

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export types for external use
export type { ContactData, ExtractionResult, ExtractorConfig };

// Export main class as default
export default WebDataExtractor;