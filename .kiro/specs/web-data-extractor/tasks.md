# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Create directory structure for classes, utilities, and assets
  - Define TypeScript interfaces for ContactData and ExtractionResult
  - Set up build configuration for minification and bundling
  - _Requirements: 4.1, 4.2_

- [x] 2. Implement Pattern Matcher class
  - [x] 2.1 Create regex patterns for Brazilian phone formats
    - Write regex for formats: (11) 99999-9999, 11 99999-9999, +55 11 99999-9999
    - Implement phone validation and formatting functions
    - Create unit tests for phone pattern matching
    - _Requirements: 5.1_

  - [x] 2.2 Implement email detection and validation
    - Write regex for standard email formats
    - Create email validation function with domain checking
    - Write unit tests for email pattern matching
    - _Requirements: 5.2_

  - [x] 2.3 Create name pattern recognition
    - Write regex for Portuguese name patterns with proper capitalization
    - Implement name validation considering Brazilian naming conventions
    - Create unit tests for name pattern matching
    - _Requirements: 5.3_

- [x] 3. Implement DOM Scanner class
  - [x] 3.1 Create page scanning functionality
    - Write DOM traversal logic to find text nodes
    - Implement element filtering to avoid script/style tags
    - Create function to extract text content from various element types
    - _Requirements: 1.1, 5.4_

  - [x] 3.2 Implement visual highlighting system
    - Create CSS styles for highlighting found elements
    - Write functions to add/remove highlight classes
    - Implement highlight cleanup on tool exit
    - _Requirements: 1.2_

  - [x] 3.3 Add structured data extraction
    - Implement table and list parsing for organized contact data
    - Create logic to associate related data (name + phone + email in same row)
    - Write tests for structured data extraction
    - _Requirements: 5.4_

- [x] 4. Create Data Manager class
  - [x] 4.1 Implement contact storage and management
    - Write functions for adding, updating, and removing contacts
    - Create data validation before storage
    - Implement duplicate detection and handling
    - _Requirements: 1.4, 2.3_

  - [x] 4.2 Add session persistence
    - Implement localStorage for maintaining data across page navigation
    - Create functions to save/load extraction sessions
    - Write cleanup logic for old session data
    - _Requirements: 3.3_

- [x] 5. Build UI Controller class
  - [x] 5.1 Create review modal interface
    - Write HTML template for contact review modal
    - Implement modal show/hide functionality with proper z-index
    - Create responsive CSS that works within Pipedrive interface
    - _Requirements: 2.1, 4.2_

  - [x] 5.2 Implement inline editing functionality
    - Create editable fields for name, phone, and email
    - Add input validation with real-time feedback
    - Implement save/cancel functionality for edits
    - _Requirements: 2.2, 2.4_

  - [x] 5.3 Add contact management UI
    - Create buttons for removing individual contacts
    - Implement select all/none functionality
    - Add confirmation dialogs for destructive actions
    - _Requirements: 2.3_

- [x] 6. Implement CSV Exporter class
  - [x] 6.1 Create CSV generation functionality
    - Write function to convert contact array to CSV format
    - Implement proper CSV escaping for special characters
    - Add UTF-8 BOM for Excel compatibility
    - _Requirements: 3.1_

  - [x] 6.2 Implement file download mechanism
    - Create Blob-based file download using browser APIs
    - Generate timestamp-based filenames
    - Add fallback for browsers without download support
    - _Requirements: 3.2_

- [x] 7. Create main application controller
  - [x] 7.1 Implement application initialization
    - Write main app class that coordinates all components
    - Create initialization sequence for DOM ready state
    - Implement error handling and user notifications
    - _Requirements: 4.3_

  - [x] 7.2 Add keyboard shortcuts and activation
    - Implement keyboard shortcut (Ctrl+Shift+E) for tool activation
    - Create activation button that can be injected into pages
    - Add tool state management (active/inactive)
    - _Requirements: 4.3_

- [x] 8. Build bookmarklet deployment system
  - [x] 8.1 Create bookmarklet wrapper
    - Write JavaScript loader that injects main script
    - Implement script caching to avoid repeated downloads
    - Create minified bookmarklet code for browser bookmark
    - _Requirements: 4.1_

  - [x] 8.2 Set up hosted script delivery
    - Create build process for script minification and bundling
    - Set up GitHub Pages or CDN hosting for main script
    - Implement version checking and auto-updates
    - _Requirements: 4.1_

- [x] 9. Implement error handling and notifications
  - [x] 9.1 Create notification system
    - Write toast notification component with different message types
    - Implement notification positioning that doesn't conflict with page content
    - Add auto-dismiss functionality with configurable timing
    - _Requirements: 2.4, 3.4_

  - [x] 9.2 Add comprehensive error handling
    - Implement try-catch blocks around all major operations
    - Create error logging system for debugging
    - Add user-friendly error messages with suggested actions
    - _Requirements: 4.2_

- [x] 10. Create comprehensive test suite
  - [x] 10.1 Write unit tests for all classes
    - Create tests for PatternMatcher with various input formats
    - Write tests for DataManager CRUD operations
    - Implement tests for CSVExporter with edge cases
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 10.2 Create integration test pages
    - Build HTML test pages with different contact layouts
    - Create pages with dynamic content loading
    - Implement test pages with various Brazilian contact formats
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 10.3 Add end-to-end testing
    - Write automated tests for complete extraction workflow
    - Create tests for UI interaction and data editing
    - Implement tests for CSV export functionality
    - _Requirements: 1.4, 2.2, 3.2_