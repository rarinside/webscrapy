import { ContactData, ExtractionResult } from '../types/interfaces.js';
import { PatternMatcher } from './PatternMatcher.js';
import { ErrorHandler, ErrorType, ErrorSeverity } from './ErrorHandler.js';

/**
 * DOM Scanner class for extracting contact data from web pages
 */
export class DOMScanner {
  private patternMatcher: PatternMatcher;
  private highlightedElements: Set<HTMLElement> = new Set();
  private static readonly HIGHLIGHT_CLASS = 'web-data-extractor-highlight';
  private errorHandler?: ErrorHandler;
  
  // Elements to exclude from scanning
  private static readonly EXCLUDED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'HEAD', 'TITLE'
  ]);

  // Elements that typically contain structured data
  private static readonly STRUCTURED_TAGS = new Set([
    'TABLE', 'TR', 'TD', 'TH', 'UL', 'OL', 'LI', 'DL', 'DT', 'DD'
  ]);

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler;
    this.patternMatcher = new PatternMatcher(errorHandler);
  }

  /**
   * Scan the entire page for contact data
   * @returns Array of extracted contact data
   */
  scanPage(): ContactData[] {
    try {
      const contacts: ContactData[] = [];
      const processedElements = new Set<HTMLElement>();
      
      // First, try to extract from structured data (tables, lists)
      try {
        const structuredContacts = this.extractFromStructuredData();
        contacts.push(...structuredContacts);
      } catch (error) {
        this.errorHandler?.handleError(
          ErrorType.DOM_ACCESS,
          ErrorSeverity.MEDIUM,
          'Erro ao extrair dados estruturados',
          error as Error
        );
      }

      // Then scan all text nodes for additional contacts
      try {
        const textContacts = this.extractFromTextNodes(processedElements);
        contacts.push(...textContacts);
      } catch (error) {
        this.errorHandler?.handleError(
          ErrorType.DOM_ACCESS,
          ErrorSeverity.MEDIUM,
          'Erro ao extrair dados de texto',
          error as Error
        );
      }

      // Remove duplicates based on email or phone
      const uniqueContacts = this.removeDuplicateContacts(contacts);

      return uniqueContacts;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.DOM_ACCESS,
        ErrorSeverity.HIGH,
        'Erro geral ao escanear página',
        error as Error,
        { url: window.location.href }
      );
      return [];
    }
  }

  /**
   * Extract text content from various element types
   * @param element HTML element to extract text from
   * @returns Cleaned text content
   */
  private extractTextContent(element: HTMLElement): string {
    if (!element || DOMScanner.EXCLUDED_TAGS.has(element.tagName)) {
      return '';
    }

    // For input elements, get the value
    if (element instanceof HTMLInputElement) {
      return element.value || element.placeholder || '';
    }

    // For text areas, get the value
    if (element instanceof HTMLTextAreaElement) {
      return element.value || element.placeholder || '';
    }

    // For other elements, get text content but exclude script/style content
    let text = '';
    
    // Use a tree walker to get only text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent || DOMScanner.EXCLUDED_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      text += textNode.textContent + ' ';
    }

    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Find all text nodes in the document, excluding script/style tags
   * @param processedElements Set of already processed elements to avoid duplicates
   * @returns Array of contact data found in text nodes
   */
  private extractFromTextNodes(processedElements: Set<HTMLElement>): ContactData[] {
    const contacts: ContactData[] = [];
    const elementsToScan: HTMLElement[] = [];

    // Get all elements that might contain contact data
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      const htmlElement = element as HTMLElement;
      
      // Skip excluded elements and already processed ones
      if (DOMScanner.EXCLUDED_TAGS.has(htmlElement.tagName) || 
          processedElements.has(htmlElement)) {
        continue;
      }

      // Skip elements that are likely to be navigation, headers, footers with common class names
      const className = htmlElement.className.toLowerCase();
      const skipClasses = ['nav', 'menu', 'header', 'footer', 'sidebar', 'advertisement', 'ad'];
      if (skipClasses.some(cls => className.includes(cls))) {
        continue;
      }

      // Only process elements that have direct text content (leaf nodes with text)
      const hasDirectText = Array.from(htmlElement.childNodes).some(
        node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );

      if (hasDirectText || htmlElement.children.length === 0) {
        elementsToScan.push(htmlElement);
      }
    }

    // Process each element for contact data
    for (const element of elementsToScan) {
      const text = this.extractTextContent(element);
      if (text.length < 5) continue; // Skip very short text

      const extractedContacts = this.extractContactsFromText(text, element);
      contacts.push(...extractedContacts);
      processedElements.add(element);
    }

    return contacts;
  }

  /**
   * Extract contact data from a text string
   * @param text Text to analyze
   * @param sourceElement Source HTML element (optional)
   * @returns Array of contact data found in the text
   */
  private extractContactsFromText(text: string, sourceElement?: HTMLElement): ContactData[] {
    const contacts: ContactData[] = [];
    
    // Extract all patterns from the text
    const emails = this.patternMatcher.extractEmails(text);
    const phones = this.patternMatcher.extractPhones(text);
    const names = this.patternMatcher.extractNames(text);



    // If we found any contact data, try to create contact objects
    if (emails.length > 0 || phones.length > 0 || names.length > 0) {
      // Try to match names with emails/phones
      const matchedContacts = this.matchContactData(names, phones, emails, sourceElement);
      contacts.push(...matchedContacts);
    }

    return contacts;
  }

  /**
   * Match names with phones and emails to create complete contact records
   * @param names Array of found names
   * @param phones Array of found phones
   * @param emails Array of found emails
   * @param sourceElement Source HTML element
   * @returns Array of matched contact data
   */
  private matchContactData(
    names: string[], 
    phones: string[], 
    emails: string[], 
    sourceElement?: HTMLElement
  ): ContactData[] {
    const contacts: ContactData[] = [];
    const source = window.location.href;
    const timestamp = new Date();

    // Strategy 1: If we have equal numbers of names, phones, and emails, match them in order
    if (names.length === phones.length && phones.length === emails.length && names.length > 0) {
      for (let i = 0; i < names.length; i++) {
        contacts.push({
          name: names[i],
          phone: phones[i],
          email: emails[i],
          source,
          timestamp
        });
      }
      return contacts;
    }

    // Strategy 2: Create contacts with available data
    const maxLength = Math.max(names.length, phones.length, emails.length);
    
    for (let i = 0; i < maxLength; i++) {
      const contact: ContactData = {
        name: names[i] || '',
        phone: phones[i] || '',
        email: emails[i] || '',
        source,
        timestamp
      };

      // Only add contact if it has at least name + (phone or email)
      if (contact.name && (contact.phone || contact.email)) {
        contacts.push(contact);
      }
    }

    // Strategy 3: If we have orphaned emails or phones without names, create contacts
    if (contacts.length === 0) {
      // Create contacts for emails without names
      emails.forEach(email => {
        contacts.push({
          name: '',
          phone: '',
          email,
          source,
          timestamp
        });
      });

      // Create contacts for phones without names
      phones.forEach(phone => {
        contacts.push({
          name: '',
          phone,
          email: '',
          source,
          timestamp
        });
      });
    }

    return contacts;
  }

  /**
   * Remove duplicate contacts based on email or phone
   * @param contacts Array of contacts to deduplicate
   * @returns Array of unique contacts
   */
  private removeDuplicateContacts(contacts: ContactData[]): ContactData[] {
    const seen = new Set<string>();
    const unique: ContactData[] = [];

    for (const contact of contacts) {
      // Create a key based on email and phone
      const key = `${contact.email.toLowerCase()}|${contact.phone}`;
      
      // Skip if we've seen this combination before
      if (seen.has(key)) {
        continue;
      }

      // Also check for partial matches (same email or same phone)
      let isDuplicate = false;
      for (const existingContact of unique) {
        if ((contact.email && contact.email.toLowerCase() === existingContact.email.toLowerCase()) ||
            (contact.phone && contact.phone === existingContact.phone)) {
          // Merge data if the existing contact has missing fields
          if (!existingContact.name && contact.name) {
            existingContact.name = contact.name;
          }
          if (!existingContact.phone && contact.phone) {
            existingContact.phone = contact.phone;
          }
          if (!existingContact.email && contact.email) {
            existingContact.email = contact.email;
          }
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.add(key);
        unique.push(contact);
      }
    }

    return unique;
  }

  /**
   * Extract contact data from structured elements like tables and lists
   * @returns Array of contact data from structured sources
   */
  private extractFromStructuredData(): ContactData[] {
    const contacts: ContactData[] = [];

    // Extract from tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const tableContacts = this.extractFromTable(table);
      contacts.push(...tableContacts);
    });

    // Extract from lists
    const lists = document.querySelectorAll('ul, ol, dl');
    lists.forEach(list => {
      const listContacts = this.extractFromList(list);
      contacts.push(...listContacts);
    });

    return contacts;
  }

  /**
   * Extract contact data from a table element
   * @param table Table element to process
   * @returns Array of contact data from the table
   */
  private extractFromTable(table: HTMLTableElement): ContactData[] {
    const contacts: ContactData[] = [];
    const rows = table.querySelectorAll('tr');

    // Try to identify header row to understand column structure
    const headerInfo = this.analyzeTableHeaders(table);

    for (const row of rows) {
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 0) continue;

      // Skip header rows
      if (row.querySelector('th') && !row.querySelector('td')) {
        continue;
      }

      // Strategy 1: Use header information to map columns
      if (headerInfo.hasHeaders && cells.length >= headerInfo.minColumns) {
        const structuredContact = this.extractStructuredTableRow(cells, headerInfo);
        if (structuredContact) {
          contacts.push(structuredContact);
          continue;
        }
      }

      // Strategy 2: Analyze each cell individually and try to associate data
      const cellData = this.analyzeCellData(cells);
      if (cellData.hasContactData) {
        const associatedContact = this.associateTableRowData(cellData);
        if (associatedContact) {
          contacts.push(associatedContact);
          continue;
        }
      }

      // Strategy 3: Fallback to text extraction from entire row
      const rowText = Array.from(cells)
        .map(cell => this.extractTextContent(cell as HTMLElement))
        .join(' ');

      const rowContacts = this.extractContactsFromText(rowText, row as HTMLElement);
      contacts.push(...rowContacts);
    }

    return contacts;
  }

  /**
   * Extract contact data from a list element
   * @param list List element to process
   * @returns Array of contact data from the list
   */
  private extractFromList(list: HTMLElement): ContactData[] {
    const contacts: ContactData[] = [];

    // Handle different list types
    if (list.tagName === 'DL') {
      // Definition list - associate dt with dd
      const definitionContacts = this.extractFromDefinitionList(list);
      contacts.push(...definitionContacts);
    } else {
      // Regular lists (ul, ol)
      const items = list.querySelectorAll('li');
      
      for (const item of items) {
        // Check if this list item contains structured data (nested elements)
        const structuredContact = this.extractFromStructuredListItem(item as HTMLElement);
        if (structuredContact) {
          contacts.push(structuredContact);
          continue;
        }

        // Fallback to text extraction
        const itemText = this.extractTextContent(item as HTMLElement);
        if (itemText.length < 5) continue;

        const itemContacts = this.extractContactsFromText(itemText, item as HTMLElement);
        contacts.push(...itemContacts);
      }
    }

    return contacts;
  }

  /**
   * Extract contact data from a definition list (dl element)
   * @param dl Definition list element
   * @returns Array of contact data
   */
  private extractFromDefinitionList(dl: HTMLElement): ContactData[] {
    const contacts: ContactData[] = [];
    const source = window.location.href;
    const timestamp = new Date();

    // Group dt and dd elements
    const children = Array.from(dl.children);
    let currentContact: Partial<ContactData> = { source, timestamp };
    
    for (const child of children) {
      const text = this.extractTextContent(child as HTMLElement);
      
      if (child.tagName === 'DT') {
        // Definition term - might be a label or the data itself
        const names = this.patternMatcher.extractNames(text);
        const phones = this.patternMatcher.extractPhones(text);
        const emails = this.patternMatcher.extractEmails(text);
        
        if (names.length > 0 && !currentContact.name) {
          currentContact.name = names[0];
        }
        if (phones.length > 0 && !currentContact.phone) {
          currentContact.phone = phones[0];
        }
        if (emails.length > 0 && !currentContact.email) {
          currentContact.email = emails[0];
        }
      } else if (child.tagName === 'DD') {
        // Definition description - usually contains the actual data
        const names = this.patternMatcher.extractNames(text);
        const phones = this.patternMatcher.extractPhones(text);
        const emails = this.patternMatcher.extractEmails(text);
        
        if (names.length > 0 && !currentContact.name) {
          currentContact.name = names[0];
        }
        if (phones.length > 0 && !currentContact.phone) {
          currentContact.phone = phones[0];
        }
        if (emails.length > 0 && !currentContact.email) {
          currentContact.email = emails[0];
        }
      }
    }

    // Create contact with all collected data at the end
    if ((currentContact.name && (currentContact.phone || currentContact.email)) ||
        (currentContact.phone || currentContact.email)) {
      contacts.push({
        name: currentContact.name || '',
        phone: currentContact.phone || '',
        email: currentContact.email || '',
        source: currentContact.source!,
        timestamp: currentContact.timestamp!
      });
    }

    return contacts;
  }

  /**
   * Extract contact data from a structured list item
   * @param listItem List item element
   * @returns Contact data or null if extraction failed
   */
  private extractFromStructuredListItem(listItem: HTMLElement): ContactData | null {
    const source = window.location.href;
    const timestamp = new Date();

    // Look for nested elements that might contain different types of data
    const childElements = listItem.querySelectorAll('*');
    
    let name = '';
    let phone = '';
    let email = '';

    // Check if child elements have semantic meaning (classes, tags, etc.)
    for (const child of childElements) {
      const element = child as HTMLElement;
      const text = this.extractTextContent(element);
      const className = element.className.toLowerCase();
      const tagName = element.tagName.toLowerCase();

      // Check for semantic indicators in class names or tag names
      if (className.includes('name') || className.includes('nome') || 
          tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || 
          tagName === 'strong' || tagName === 'b') {
        const names = this.patternMatcher.extractNames(text);
        if (names.length > 0 && !name) {
          name = names[0];
        }
      }

      if (className.includes('phone') || className.includes('telefone') || 
          className.includes('tel') || tagName === 'tel') {
        const phones = this.patternMatcher.extractPhones(text);
        if (phones.length > 0 && !phone) {
          phone = phones[0];
        }
      }

      if (className.includes('email') || className.includes('mail') || 
          tagName === 'a' && element.getAttribute('href')?.startsWith('mailto:')) {
        const emails = this.patternMatcher.extractEmails(text);
        if (emails.length > 0 && !email) {
          email = emails[0];
        }
        
        // Also check href for mailto links
        const href = element.getAttribute('href');
        if (href?.startsWith('mailto:')) {
          const mailtoEmail = href.substring(7);
          if (this.patternMatcher.validateEmail(mailtoEmail) && !email) {
            email = mailtoEmail;
          }
        }
      }
    }

    // If we didn't find structured data, try extracting from the entire item
    if (!name && !phone && !email) {
      const itemText = this.extractTextContent(listItem);
      const names = this.patternMatcher.extractNames(itemText);
      const phones = this.patternMatcher.extractPhones(itemText);
      const emails = this.patternMatcher.extractEmails(itemText);
      
      name = names[0] || '';
      phone = phones[0] || '';
      email = emails[0] || '';
    }

    // Return contact if we have meaningful data
    if (name && (phone || email)) {
      return { name, phone, email, source, timestamp };
    }

    if (phone || email) {
      return { name, phone, email, source, timestamp };
    }

    return null;
  }

  /**
   * Highlight elements that contain contact data
   * @param elements Array of HTML elements to highlight
   */
  highlightElements(elements: HTMLElement[]): void {
    // Inject CSS styles if not already present
    this.injectHighlightStyles();

    elements.forEach(element => {
      if (element && element.classList) {
        element.classList.add(DOMScanner.HIGHLIGHT_CLASS);
        this.highlightedElements.add(element);
      }
    });
  }

  /**
   * Remove highlights from all previously highlighted elements
   */
  removeHighlights(): void {
    this.highlightedElements.forEach(element => {
      if (element && element.classList) {
        element.classList.remove(DOMScanner.HIGHLIGHT_CLASS);
      }
    });
    this.highlightedElements.clear();
  }

  /**
   * Inject CSS styles for highlighting into the document
   */
  private injectHighlightStyles(): void {
    const styleId = 'web-data-extractor-styles';
    
    // Check if styles are already injected
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${DOMScanner.HIGHLIGHT_CLASS} {
        background-color: rgba(255, 235, 59, 0.3) !important;
        border: 2px solid #FFC107 !important;
        border-radius: 3px !important;
        box-shadow: 0 0 5px rgba(255, 193, 7, 0.5) !important;
        position: relative !important;
        z-index: 1000 !important;
        transition: all 0.2s ease-in-out !important;
      }

      .${DOMScanner.HIGHLIGHT_CLASS}:hover {
        background-color: rgba(255, 235, 59, 0.5) !important;
        box-shadow: 0 0 10px rgba(255, 193, 7, 0.8) !important;
      }

      .${DOMScanner.HIGHLIGHT_CLASS}::before {
        content: "📞" !important;
        position: absolute !important;
        top: -8px !important;
        left: -8px !important;
        background: #FFC107 !important;
        color: #000 !important;
        border-radius: 50% !important;
        width: 16px !important;
        height: 16px !important;
        font-size: 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 1001 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
      }

      /* Ensure highlighting works with different display types */
      .${DOMScanner.HIGHLIGHT_CLASS}.inline-highlight {
        display: inline-block !important;
        padding: 2px 4px !important;
        margin: 1px !important;
      }

      .${DOMScanner.HIGHLIGHT_CLASS}.block-highlight {
        display: block !important;
        padding: 8px !important;
        margin: 4px 0 !important;
      }

      /* Special styling for table cells */
      td.${DOMScanner.HIGHLIGHT_CLASS},
      th.${DOMScanner.HIGHLIGHT_CLASS} {
        background-color: rgba(255, 235, 59, 0.2) !important;
        border: 2px solid #FFC107 !important;
      }

      /* Special styling for list items */
      li.${DOMScanner.HIGHLIGHT_CLASS} {
        background-color: rgba(255, 235, 59, 0.2) !important;
        border-left: 4px solid #FFC107 !important;
        padding-left: 8px !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Highlight specific elements that contain contact data
   * @param contacts Array of contact data with source elements
   */
  highlightContactElements(contacts: ContactData[]): void {
    const elementsToHighlight: HTMLElement[] = [];

    // For each contact, try to find and highlight the source element
    contacts.forEach(contact => {
      // Find elements that contain the contact's data
      const elements = this.findElementsContainingContact(contact);
      elementsToHighlight.push(...elements);
    });

    this.highlightElements(elementsToHighlight);
  }

  /**
   * Find HTML elements that contain the given contact's data
   * @param contact Contact data to search for
   * @returns Array of HTML elements containing the contact data
   */
  private findElementsContainingContact(contact: ContactData): HTMLElement[] {
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
      if (DOMScanner.EXCLUDED_TAGS.has(htmlElement.tagName)) {
        continue;
      }

      const elementText = this.extractTextContent(htmlElement);
      
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
   * Clean up all highlights and injected styles when tool exits
   */
  cleanup(): void {
    // Remove all highlights
    this.removeHighlights();

    // Remove injected styles
    const styleElement = document.getElementById('web-data-extractor-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }

  /**
   * Analyze table headers to understand column structure
   * @param table Table element to analyze
   * @returns Header analysis information
   */
  private analyzeTableHeaders(table: HTMLTableElement): {
    hasHeaders: boolean;
    nameColumn: number;
    phoneColumn: number;
    emailColumn: number;
    minColumns: number;
  } {
    const headerInfo = {
      hasHeaders: false,
      nameColumn: -1,
      phoneColumn: -1,
      emailColumn: -1,
      minColumns: 0
    };

    // Look for header row (first tr with th elements)
    const headerRow = table.querySelector('tr:has(th)') || table.querySelector('thead tr');
    if (!headerRow) {
      return headerInfo;
    }

    const headers = headerRow.querySelectorAll('th, td');
    if (headers.length === 0) {
      return headerInfo;
    }

    headerInfo.hasHeaders = true;
    headerInfo.minColumns = headers.length;

    // Analyze header text to identify columns
    headers.forEach((header, index) => {
      const headerText = this.extractTextContent(header as HTMLElement).toLowerCase();
      

      
      // Name column indicators
      if (headerText.includes('nome') || headerText.includes('name') || 
          headerText.includes('contato') || headerText.includes('contact') ||
          headerText.includes('pessoa') || headerText.includes('person')) {
        headerInfo.nameColumn = index;
      }
      
      // Phone column indicators
      if (headerText.includes('telefone') || headerText.includes('phone') || 
          headerText.includes('celular') || headerText.includes('mobile') ||
          headerText.includes('fone') || headerText.includes('tel')) {
        headerInfo.phoneColumn = index;
      }
      
      // Email column indicators
      if (headerText.includes('email') || headerText.includes('e-mail') || 
          headerText.includes('mail') || headerText.includes('correio')) {
        headerInfo.emailColumn = index;
      }
    });



    return headerInfo;
  }

  /**
   * Extract structured contact data from a table row using header information
   * @param cells Table cells in the row
   * @param headerInfo Header analysis information
   * @returns Contact data or null if extraction failed
   */
  private extractStructuredTableRow(
    cells: NodeListOf<Element>, 
    headerInfo: { nameColumn: number; phoneColumn: number; emailColumn: number }
  ): ContactData | null {
    const source = window.location.href;
    const timestamp = new Date();
    
    let name = '';
    let phone = '';
    let email = '';

    // Extract data from specific columns
    if (headerInfo.nameColumn >= 0 && headerInfo.nameColumn < cells.length) {
      const nameText = this.extractTextContent(cells[headerInfo.nameColumn] as HTMLElement);
      const names = this.patternMatcher.extractNames(nameText);
      name = names[0] || '';
    }

    if (headerInfo.phoneColumn >= 0 && headerInfo.phoneColumn < cells.length) {
      const phoneText = this.extractTextContent(cells[headerInfo.phoneColumn] as HTMLElement);
      const phones = this.patternMatcher.extractPhones(phoneText);
      phone = phones[0] || '';
    }

    if (headerInfo.emailColumn >= 0 && headerInfo.emailColumn < cells.length) {
      const emailText = this.extractTextContent(cells[headerInfo.emailColumn] as HTMLElement);
      const emails = this.patternMatcher.extractEmails(emailText);
      email = emails[0] || '';
    }

    // If we couldn't extract from specific columns, or if some columns weren't identified, 
    // try extracting from all cells
    if (!name || !phone || !email) {
      // Try to extract missing data from all cells
      for (let i = 0; i < cells.length; i++) {
        const cellText = this.extractTextContent(cells[i] as HTMLElement);
        
        if (!name) {
          const names = this.patternMatcher.extractNames(cellText);
          if (names.length > 0) name = names[0];
        }
        
        if (!phone) {
          const phones = this.patternMatcher.extractPhones(cellText);
          if (phones.length > 0) phone = phones[0];
        }
        
        if (!email) {
          const emails = this.patternMatcher.extractEmails(cellText);
          if (emails.length > 0) email = emails[0];
        }
      }
    }

    // Only return contact if we have at least name + (phone or email)
    if (name && (phone || email)) {
      return { name, phone, email, source, timestamp };
    }

    return null;
  }

  /**
   * Analyze individual cells to extract contact data types
   * @param cells Table cells to analyze
   * @returns Analysis of cell data
   */
  private analyzeCellData(cells: NodeListOf<Element>): {
    hasContactData: boolean;
    cellTypes: Array<{ index: number; type: 'name' | 'phone' | 'email' | 'unknown'; data: string }>;
  } {
    const cellTypes: Array<{ index: number; type: 'name' | 'phone' | 'email' | 'unknown'; data: string }> = [];
    let hasContactData = false;

    cells.forEach((cell, index) => {
      const cellText = this.extractTextContent(cell as HTMLElement);
      if (cellText.length < 2) {
        cellTypes.push({ index, type: 'unknown', data: cellText });
        return;
      }

      // Check what type of data this cell contains
      const emails = this.patternMatcher.extractEmails(cellText);
      const phones = this.patternMatcher.extractPhones(cellText);
      const names = this.patternMatcher.extractNames(cellText);

      if (emails.length > 0) {
        cellTypes.push({ index, type: 'email', data: emails[0] });
        hasContactData = true;
      } else if (phones.length > 0) {
        cellTypes.push({ index, type: 'phone', data: phones[0] });
        hasContactData = true;
      } else if (names.length > 0) {
        cellTypes.push({ index, type: 'name', data: names[0] });
        hasContactData = true;
      } else {
        cellTypes.push({ index, type: 'unknown', data: cellText });
      }
    });

    return { hasContactData, cellTypes };
  }

  /**
   * Associate data from analyzed table row cells into a contact
   * @param cellData Analyzed cell data
   * @returns Contact data or null if association failed
   */
  private associateTableRowData(cellData: {
    cellTypes: Array<{ index: number; type: 'name' | 'phone' | 'email' | 'unknown'; data: string }>;
  }): ContactData | null {
    const source = window.location.href;
    const timestamp = new Date();

    let name = '';
    let phone = '';
    let email = '';

    // Extract data by type - take the first of each type found
    cellData.cellTypes.forEach(cell => {
      switch (cell.type) {
        case 'name':
          if (!name) name = cell.data;
          break;
        case 'phone':
          if (!phone) phone = cell.data;
          break;
        case 'email':
          if (!email) email = cell.data;
          break;
      }
    });



    // Only return contact if we have meaningful data
    if (name && (phone || email)) {
      return { name, phone, email, source, timestamp };
    }

    // If we have email or phone without name, still create contact
    if (phone || email) {
      return { name, phone, email, source, timestamp };
    }

    return null;
  }
}