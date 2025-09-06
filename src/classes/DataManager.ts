import { ContactData } from '../types/interfaces.js';
import { ErrorHandler, ErrorType, ErrorSeverity } from './ErrorHandler.js';

/**
 * DataManager class handles contact storage, management, and persistence
 * Provides CRUD operations for contacts with duplicate detection and validation
 */
export class DataManager {
  private contacts: ContactData[] = [];
  private readonly STORAGE_KEY = 'web-data-extractor-contacts';
  private readonly SESSION_KEY = 'web-data-extractor-session';
  private errorHandler?: ErrorHandler;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler;
    this.loadFromStorage();
  }

  /**
   * Add a new contact with validation and duplicate detection
   * @param contact Contact data to add
   * @returns true if contact was added, false if duplicate or invalid
   */
  addContact(contact: ContactData): boolean {
    try {
      // Validate contact data
      if (!this.validateContact(contact)) {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Dados de contato inválidos',
          undefined,
          { contact }
        );
        return false;
      }

      // Check for duplicates
      if (this.isDuplicate(contact)) {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Contato duplicado detectado',
          undefined,
          { contact }
        );
        return false;
      }

      // Add timestamp if not provided
      if (!contact.timestamp) {
        contact.timestamp = new Date();
      }

      this.contacts.push(contact);
      this.saveToStorage();
      return true;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.DATA_STORAGE,
        ErrorSeverity.MEDIUM,
        'Erro ao adicionar contato',
        error as Error,
        { contact }
      );
      return false;
    }
  }

  /**
   * Remove contact at specified index
   * @param index Index of contact to remove
   * @returns true if contact was removed, false if index invalid
   */
  removeContact(index: number): boolean {
    try {
      if (index < 0 || index >= this.contacts.length) {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Índice de contato inválido',
          undefined,
          { index, totalContacts: this.contacts.length }
        );
        return false;
      }

      this.contacts.splice(index, 1);
      this.saveToStorage();
      return true;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.DATA_STORAGE,
        ErrorSeverity.MEDIUM,
        'Erro ao remover contato',
        error as Error,
        { index }
      );
      return false;
    }
  }

  /**
   * Update contact at specified index
   * @param index Index of contact to update
   * @param contact Updated contact data
   * @returns true if contact was updated, false if invalid
   */
  updateContact(index: number, contact: ContactData): boolean {
    if (index < 0 || index >= this.contacts.length) {
      return false;
    }

    if (!this.validateContact(contact)) {
      return false;
    }

    // Check for duplicates (excluding the contact being updated)
    const tempContacts = [...this.contacts];
    tempContacts.splice(index, 1);
    if (this.isDuplicateInArray(contact, tempContacts)) {
      return false;
    }

    this.contacts[index] = { ...contact };
    this.saveToStorage();
    return true;
  }

  /**
   * Get all contacts
   * @returns Array of all contacts
   */
  getAllContacts(): ContactData[] {
    return [...this.contacts];
  }

  /**
   * Get contact by index
   * @param index Index of contact to retrieve
   * @returns Contact data or null if index invalid
   */
  getContact(index: number): ContactData | null {
    if (index < 0 || index >= this.contacts.length) {
      return null;
    }
    return { ...this.contacts[index] };
  }

  /**
   * Get total number of contacts
   * @returns Number of contacts
   */
  getContactCount(): number {
    return this.contacts.length;
  }

  /**
   * Clear all contacts
   */
  clearAll(): void {
    this.contacts = [];
    this.saveToStorage();
  }

  /**
   * Validate contact data
   * @param contact Contact to validate
   * @returns true if valid, false otherwise
   */
  private validateContact(contact: ContactData): boolean {
    // Check required fields
    if (!contact.name || !contact.name.trim()) {
      return false;
    }

    // At least one contact method (phone or email) must be provided
    const hasPhone = contact.phone && contact.phone.trim();
    const hasEmail = contact.email && contact.email.trim();
    
    if (!hasPhone && !hasEmail) {
      return false;
    }

    // Validate email format if provided
    if (hasEmail && !this.isValidEmail(contact.email)) {
      return false;
    }

    // Validate phone format if provided
    if (hasPhone && !this.isValidPhone(contact.phone)) {
      return false;
    }

    return true;
  }

  /**
   * Check if contact is duplicate
   * @param contact Contact to check
   * @returns true if duplicate exists
   */
  private isDuplicate(contact: ContactData): boolean {
    return this.isDuplicateInArray(contact, this.contacts);
  }

  /**
   * Check if contact is duplicate in given array
   * @param contact Contact to check
   * @param contactArray Array to check against
   * @returns true if duplicate exists
   */
  private isDuplicateInArray(contact: ContactData, contactArray: ContactData[]): boolean {
    return contactArray.some(existing => {
      // Consider duplicate if name matches AND at least one contact method matches
      const nameMatch = existing.name.toLowerCase().trim() === contact.name.toLowerCase().trim();
      
      // Only check phone match if both contacts have phone numbers
      const phoneMatch = existing.phone && contact.phone && existing.phone.trim() && contact.phone.trim() &&
        this.normalizePhone(existing.phone) === this.normalizePhone(contact.phone);
      
      // Only check email match if both contacts have email addresses
      const emailMatch = existing.email && contact.email && existing.email.trim() && contact.email.trim() &&
        existing.email.toLowerCase().trim() === contact.email.toLowerCase().trim();

      // Duplicate only if name matches AND at least one contact method matches
      return nameMatch && (phoneMatch || emailMatch);
    });
  }

  /**
   * Normalize phone number for comparison
   * @param phone Phone number to normalize
   * @returns Normalized phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)\+]/g, '');
  }

  /**
   * Validate email format
   * @param email Email to validate
   * @returns true if valid email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate phone format (Brazilian formats)
   * @param phone Phone to validate
   * @returns true if valid phone format
   */
  private isValidPhone(phone: string): boolean {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return false;
    
    // Brazilian phone patterns
    const patterns = [
      /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, // (11) 99999-9999 or (11) 9999-9999
      /^\d{2}\s\d{4,5}-?\d{4}$/, // 11 99999-9999 or 11 9999-9999
      /^\+55\s\d{2}\s\d{4,5}-?\d{4}$/, // +55 11 99999-9999
      /^\d{10,11}$/ // 1199999999 or 11999999999
    ];
    
    return patterns.some(pattern => pattern.test(cleanPhone));
  }

  /**
   * Save contacts to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        contacts: this.contacts,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save contacts to localStorage:', error);
    }
  }

  /**
   * Load contacts from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.contacts && Array.isArray(data.contacts)) {
          // Convert timestamp strings back to Date objects
          this.contacts = data.contacts.map((contact: any) => ({
            ...contact,
            timestamp: new Date(contact.timestamp)
          }));
        }
      }
    } catch (error) {
      console.warn('Failed to load contacts from localStorage:', error);
      this.contacts = [];
    }
  }

  // Session Persistence Methods

  /**
   * Save current extraction session
   * @param sessionData Additional session data to save
   */
  saveSession(sessionData?: { url?: string; extractedCount?: number }): void {
    try {
      const session = {
        contacts: this.contacts,
        sessionData: sessionData || {},
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  /**
   * Load extraction session
   * @returns Session data or null if no session exists
   */
  loadSession(): { contacts: ContactData[]; sessionData: any; timestamp: string; url: string } | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Convert timestamp strings back to Date objects for contacts
        if (session.contacts && Array.isArray(session.contacts)) {
          session.contacts = session.contacts.map((contact: any) => ({
            ...contact,
            timestamp: new Date(contact.timestamp)
          }));
        }
        return session;
      }
    } catch (error) {
      console.warn('Failed to load session:', error);
    }
    return null;
  }

  /**
   * Restore session data (merge with current contacts)
   * @param mergeStrategy 'replace' | 'merge' - how to handle existing contacts
   * @returns true if session was restored
   */
  restoreSession(mergeStrategy: 'replace' | 'merge' = 'merge'): boolean {
    const session = this.loadSession();
    if (!session || !session.contacts) {
      return false;
    }

    if (mergeStrategy === 'replace') {
      this.contacts = session.contacts;
    } else {
      // Merge strategy: add session contacts that aren't duplicates
      session.contacts.forEach(contact => {
        if (!this.isDuplicate(contact)) {
          this.contacts.push(contact);
        }
      });
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  /**
   * Check if a session exists
   * @returns true if session data exists
   */
  hasSession(): boolean {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      return stored !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session age in minutes
   * @returns Age in minutes or null if no session
   */
  getSessionAge(): number | null {
    const session = this.loadSession();
    if (!session || !session.timestamp) {
      return null;
    }

    const sessionTime = new Date(session.timestamp);
    const now = new Date();
    return Math.floor((now.getTime() - sessionTime.getTime()) / (1000 * 60));
  }

  /**
   * Clean up old session data (older than specified hours)
   * @param maxAgeHours Maximum age in hours (default: 24)
   */
  cleanupOldSessions(maxAgeHours: number = 24): void {
    const sessionAge = this.getSessionAge();
    if (sessionAge !== null && sessionAge > (maxAgeHours * 60)) {
      this.clearSession();
    }

    // Also cleanup old contact data
    this.cleanupOldContacts(maxAgeHours * 24); // Convert to days
  }

  /**
   * Clean up old contacts (older than specified days)
   * @param maxAgeDays Maximum age in days (default: 7)
   */
  private cleanupOldContacts(maxAgeDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const initialCount = this.contacts.length;
    this.contacts = this.contacts.filter(contact => 
      contact.timestamp && contact.timestamp > cutoffDate
    );

    if (this.contacts.length !== initialCount) {
      this.saveToStorage();
    }
  }

  /**
   * Export session data for backup
   * @returns Serialized session data
   */
  exportSessionData(): string {
    const exportData = {
      contacts: this.contacts,
      exportTimestamp: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import session data from backup
   * @param jsonData Serialized session data
   * @param mergeStrategy How to handle existing data
   * @returns true if import was successful
   */
  importSessionData(jsonData: string, mergeStrategy: 'replace' | 'merge' = 'merge'): boolean {
    try {
      const importData = JSON.parse(jsonData);
      if (!importData.contacts || !Array.isArray(importData.contacts)) {
        return false;
      }

      // Convert timestamp strings back to Date objects
      const importedContacts = importData.contacts.map((contact: any) => ({
        ...contact,
        timestamp: new Date(contact.timestamp)
      }));

      if (mergeStrategy === 'replace') {
        this.contacts = importedContacts;
      } else {
        // Merge strategy: add imported contacts that aren't duplicates
        importedContacts.forEach((contact: ContactData) => {
          if (!this.isDuplicate(contact)) {
            this.contacts.push(contact);
          }
        });
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.warn('Failed to import session data:', error);
      return false;
    }
  }
}