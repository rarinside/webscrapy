# Design Document

## Overview

O Web Data Extractor é uma ferramenta client-side que funciona como bookmarklet ou extensão do navegador para extrair informações de contato de páginas web. A solução utiliza JavaScript puro para análise de DOM, expressões regulares para identificação de padrões e APIs nativas do navegador para geração e download de arquivos CSV.

## Architecture

### Arquitetura Geral
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Page      │    │   Data Extractor │    │   CSV Generator │
│   (DOM)         │───▶│   Engine         │───▶│   & Downloader  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   UI Controller  │
                       │   (Review/Edit)  │
                       └──────────────────┘
```

### Componentes Principais

1. **DOM Scanner**: Analisa elementos da página em busca de padrões de contato
2. **Pattern Matcher**: Identifica e valida nomes, telefones e emails usando regex
3. **UI Controller**: Gerencia interface de revisão e edição de dados
4. **Data Manager**: Armazena e organiza dados extraídos
5. **CSV Exporter**: Gera e faz download do arquivo CSV

## Components and Interfaces

### 1. DOM Scanner
```javascript
class DOMScanner {
  scanPage(): ContactData[]
  highlightElements(elements: HTMLElement[]): void
  removeHighlights(): void
}
```

**Responsabilidades:**
- Percorrer todos os elementos de texto da página
- Identificar elementos que contêm possíveis dados de contato
- Destacar visualmente elementos encontrados

### 2. Pattern Matcher
```javascript
class PatternMatcher {
  extractEmails(text: string): string[]
  extractPhones(text: string): string[]
  extractNames(text: string): string[]
  validateEmail(email: string): boolean
  validatePhone(phone: string): boolean
}
```

**Padrões de Regex:**
- **Email**: `/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g`
- **Telefone BR**: `/(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}[-\s]?[0-9]{4}/g`
- **Nome**: `/\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)+\b/g`

### 3. UI Controller
```javascript
class UIController {
  showReviewModal(contacts: ContactData[]): void
  hideReviewModal(): void
  enableEditing(field: HTMLElement): void
  validateForm(): boolean
  showNotification(message: string, type: 'success' | 'error'): void
}
```

**Interface Modal:**
- Lista editável de contatos encontrados
- Campos: Nome, Telefone, Email
- Botões: Editar, Remover, Exportar, Cancelar
- Validação em tempo real

### 4. Data Manager
```javascript
class DataManager {
  addContact(contact: ContactData): void
  removeContact(index: number): void
  updateContact(index: number, contact: ContactData): void
  getAllContacts(): ContactData[]
  clearAll(): void
}
```

**Estrutura de Dados:**
```javascript
interface ContactData {
  name: string;
  phone: string;
  email: string;
  source: string; // URL da página
  timestamp: Date;
}
```

### 5. CSV Exporter
```javascript
class CSVExporter {
  generateCSV(contacts: ContactData[]): string
  downloadCSV(csvContent: string, filename: string): void
}
```

## Data Models

### ContactData
```javascript
interface ContactData {
  name: string;          // Nome completo do contato
  phone: string;         // Telefone formatado
  email: string;         // Email validado
  source: string;        // URL da página de origem
  timestamp: Date;       // Data/hora da extração
}
```

### ExtractionResult
```javascript
interface ExtractionResult {
  contacts: ContactData[];
  elementsFound: HTMLElement[];
  confidence: number;    // Nível de confiança da extração (0-1)
}
```

## Error Handling

### Estratégias de Tratamento de Erro

1. **DOM Access Errors**
   - Try-catch em todas as operações de DOM
   - Fallback para seletores alternativos
   - Notificação ao usuário em caso de falha

2. **Pattern Matching Errors**
   - Validação de regex antes da execução
   - Sanitização de texto de entrada
   - Log de padrões não reconhecidos

3. **File Generation Errors**
   - Verificação de suporte do navegador para download
   - Fallback para clipboard copy se download falhar
   - Validação de dados antes da geração CSV

4. **UI Errors**
   - Verificação de conflitos com CSS da página
   - Namespace isolado para estilos
   - Cleanup automático em caso de erro

### Error Messages
```javascript
const ERROR_MESSAGES = {
  NO_DATA_FOUND: 'Nenhum dado de contato encontrado na página',
  INVALID_EMAIL: 'Email inválido detectado',
  INVALID_PHONE: 'Telefone em formato inválido',
  EXPORT_FAILED: 'Falha ao gerar arquivo CSV',
  DOM_ACCESS_ERROR: 'Erro ao acessar elementos da página'
};
```

## Testing Strategy

### 1. Unit Tests
- **Pattern Matcher**: Testes de regex com diferentes formatos
- **Data Manager**: Operações CRUD de contatos
- **CSV Exporter**: Geração de CSV com diferentes datasets

### 2. Integration Tests
- **DOM Scanner + Pattern Matcher**: Extração em páginas de teste
- **UI Controller + Data Manager**: Fluxo completo de edição
- **End-to-end**: Extração → Edição → Exportação

### 3. Browser Compatibility Tests
- Chrome, Firefox, Safari, Edge
- Teste em diferentes versões
- Verificação de APIs nativas (Blob, URL.createObjectURL)

### 4. Test Pages
Criar páginas HTML de teste com:
- Diferentes layouts de contato
- Formatos variados de telefone/email
- Conteúdo dinâmico (JavaScript)
- Tabelas e listas estruturadas

### 5. Performance Tests
- Páginas com grande volume de texto
- Tempo de execução da extração
- Uso de memória durante processamento

## Implementation Approach

### Deployment Options

**Opção 1: Bookmarklet**
- Código JavaScript minificado em URL
- Fácil instalação (arrastar para bookmarks)
- Funciona em qualquer navegador
- Limitações de tamanho de código

**Opção 2: Browser Extension**
- Maior flexibilidade de código
- Melhor UX com ícone na toolbar
- Permissões específicas
- Processo de instalação mais complexo

### Recommended: Bookmarklet + Hosted Script
- Bookmarklet carrega script externo
- Código principal hospedado (GitHub Pages/CDN)
- Fácil atualização sem reinstalação
- Melhor manutenibilidade