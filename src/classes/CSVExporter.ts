/**
 * CSVExporter class for converting contact data to CSV format and handling file downloads
 */

import { ContactData } from '../types/interfaces';
import { ErrorHandler, ErrorType, ErrorSeverity } from './ErrorHandler.js';

export class CSVExporter {
  private static readonly UTF8_BOM = '\uFEFF';
  private static readonly CSV_HEADERS = ['Nome', 'Telefone', 'Email', 'Fonte', 'Data de Extração'];
  private errorHandler?: ErrorHandler;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Converts an array of ContactData to CSV format
   * @param contacts Array of contact data to convert
   * @returns CSV formatted string with UTF-8 BOM
   */
  public generateCSV(contacts: ContactData[]): string {
    try {
      if (!contacts || contacts.length === 0) {
        this.errorHandler?.handleError(
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'Nenhum contato fornecido para exportação',
          undefined,
          { contactsLength: contacts?.length }
        );
        throw new Error('Nenhum contato fornecido para exportação');
      }

      // Start with UTF-8 BOM for Excel compatibility
      let csvContent = CSVExporter.UTF8_BOM;
      
      // Add headers
      csvContent += CSVExporter.CSV_HEADERS.join(',') + '\n';
      
      // Add contact data rows
      contacts.forEach((contact, index) => {
        try {
          const row = [
            this.escapeCSVField(contact.name),
            this.escapeCSVField(contact.phone),
            this.escapeCSVField(contact.email),
            this.escapeCSVField(contact.source),
            this.escapeCSVField(this.formatTimestamp(contact.timestamp))
          ];
          csvContent += row.join(',') + '\n';
        } catch (error) {
          this.errorHandler?.handleError(
            ErrorType.DATA_STORAGE,
            ErrorSeverity.LOW,
            'Erro ao processar contato para CSV',
            error as Error,
            { contact, index }
          );
        }
      });

      return csvContent;
    } catch (error) {
      this.errorHandler?.handleError(
        ErrorType.DATA_STORAGE,
        ErrorSeverity.HIGH,
        'Erro geral na geração de CSV',
        error as Error,
        { contactsCount: contacts?.length }
      );
      throw error;
    }
  }

  /**
   * Properly escapes CSV fields to handle special characters
   * @param field The field value to escape
   * @returns Escaped field value
   */
  private escapeCSVField(field: string): string {
    if (!field) {
      return '""';
    }

    // Convert to string if not already
    const stringField = String(field);
    
    // Check if field contains special characters that require quoting
    const needsQuoting = stringField.includes(',') || 
                        stringField.includes('"') || 
                        stringField.includes('\n') || 
                        stringField.includes('\r');

    if (needsQuoting) {
      // Escape existing quotes by doubling them
      const escapedField = stringField.replace(/"/g, '""');
      return `"${escapedField}"`;
    }

    return stringField;
  }

  /**
   * Formats timestamp for CSV export
   * @param timestamp Date object to format
   * @returns Formatted date string
   */
  private formatTimestamp(timestamp: Date): string {
    if (!timestamp || !(timestamp instanceof Date)) {
      return '';
    }

    // Format as DD/MM/YYYY HH:MM:SS (Brazilian format)
    const day = timestamp.getDate().toString().padStart(2, '0');
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const year = timestamp.getFullYear();
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Downloads CSV content as a file using browser APIs
   * @param csvContent The CSV content to download
   * @param filename Optional custom filename (will generate timestamp-based if not provided)
   */
  public downloadCSV(csvContent: string, filename?: string): void {
    if (!csvContent) {
      throw new Error('Conteúdo CSV vazio para download');
    }

    const finalFilename = filename || this.generateTimestampFilename();
    
    try {
      // Try modern download approach with Blob
      this.downloadWithBlob(csvContent, finalFilename);
    } catch (error) {
      console.warn('Blob download failed, trying fallback:', error);
      try {
        // Fallback to data URL approach
        this.downloadWithDataURL(csvContent, finalFilename);
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError);
        // Final fallback - copy to clipboard
        this.copyToClipboard(csvContent);
        throw new Error('Download não suportado. Dados copiados para área de transferência.');
      }
    }
  }

  /**
   * Downloads CSV using Blob API (modern browsers)
   * @param csvContent CSV content to download
   * @param filename Filename for the download
   */
  private downloadWithBlob(csvContent: string, filename: string): void {
    // Create blob with proper MIME type
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Cleanup
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads CSV using data URL (fallback for older browsers)
   * @param csvContent CSV content to download
   * @param filename Filename for the download
   */
  private downloadWithDataURL(csvContent: string, filename: string): void {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', encodedUri);
    downloadLink.setAttribute('download', filename);
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  /**
   * Copies CSV content to clipboard as final fallback
   * @param csvContent CSV content to copy
   */
  private copyToClipboard(csvContent: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(csvContent).catch(error => {
        console.error('Clipboard copy failed:', error);
        this.fallbackCopyToClipboard(csvContent);
      });
    } else {
      this.fallbackCopyToClipboard(csvContent);
    }
  }

  /**
   * Fallback clipboard copy using textarea selection
   * @param csvContent CSV content to copy
   */
  private fallbackCopyToClipboard(csvContent: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = csvContent;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Fallback clipboard copy failed:', error);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Generates timestamp-based filename for CSV export
   * @returns Formatted filename with timestamp
   */
  private generateTimestampFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `contatos_${year}${month}${day}_${hours}${minutes}${seconds}.csv`;
  }

  /**
   * Convenience method to generate and download CSV in one call
   * @param contacts Array of contact data to export
   * @param filename Optional custom filename
   */
  public exportContacts(contacts: ContactData[], filename?: string): void {
    const csvContent = this.generateCSV(contacts);
    this.downloadCSV(csvContent, filename);
  }
}