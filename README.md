# 📞 Web Data Extractor

Um bookmarklet poderoso para extrair informações de contato de páginas web brasileiras e exportar para CSV.

## 🎯 Funcionalidades

- ✅ **Extração Automática**: Detecta automaticamente nomes, telefones e emails em páginas web
- ✅ **Formatos Brasileiros**: Suporte completo para formatos de telefone brasileiros
- ✅ **Interface Intuitiva**: Modal para revisar e editar contatos antes da exportação
- ✅ **Exportação CSV**: Exporta dados em formato CSV compatível com Excel
- ✅ **Detecção de Duplicatas**: Remove automaticamente contatos duplicados
- ✅ **Atalhos de Teclado**: `Ctrl+Shift+E` para ativar rapidamente
- ✅ **Cache Inteligente**: Sistema de cache para melhor performance
- ✅ **Atualizações Automáticas**: Verifica e baixa atualizações automaticamente

## 🚀 Instalação

### Opção 1: Instalação Rápida
1. Visite a [página de instalação](https://rarinside.github.io/webscrapy/bookmarklet.html)
2. Arraste o botão do bookmarklet para sua barra de favoritos
3. Pronto! Agora você pode usar em qualquer site

### Opção 2: Instalação Manual
1. Copie o código do bookmarklet da [página de instalação](https://rarinside.github.io/webscrapy/bookmarklet.html)
2. Crie um novo favorito no seu navegador
3. Cole o código como URL do favorito
4. Nomeie como "Web Data Extractor"

## 📱 Como Usar

1. **Ative o Extrator**:
   - Clique no bookmarklet na barra de favoritos, OU
   - Use o atalho `Ctrl+Shift+E`

2. **Extraia Contatos**:
   - O sistema automaticamente escaneará a página
   - Contatos encontrados serão destacados

3. **Revise e Edite**:
   - Uma janela modal mostrará todos os contatos encontrados
   - Edite informações clicando nos campos
   - Remova contatos indesejados

4. **Exporte para CSV**:
   - Clique em "Exportar CSV"
   - O arquivo será baixado automaticamente
   - Abra no Excel ou Google Sheets

## 🎮 Atalhos de Teclado

- `Ctrl+Shift+E` - Ativar/Desativar extrator
- `Ctrl+Shift+H` - Mostrar ajuda
- `Escape` - Fechar modal/desativar extrator
- `Enter` - Salvar edição de campo
- `Escape` - Cancelar edição de campo

## 🔧 Funcionalidades Técnicas

### Formatos de Telefone Suportados
- `(11) 99999-9999` - Celular com parênteses
- `11 99999-9999` - Celular com espaço
- `+55 11 99999-9999` - Internacional
- `(11) 3333-4444` - Fixo
- `11999999999` - Apenas números

### Formatos de Email Suportados
- Emails padrão: `usuario@dominio.com`
- Emails brasileiros: `usuario@empresa.com.br`
- Emails com caracteres especiais: `user+tag@domain.org`

### Formatos de Nome Suportados
- Nomes simples: `João Silva`
- Nomes compostos: `Ana Paula Santos`
- Nomes com partículas: `José da Silva`, `Maria das Graças`

## 🏗️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- NPM

### Instalação Local
```bash
git clone https://github.com/rarinside/webscrapy.git
cd webscrapy
npm install
```

### Desenvolvimento
```bash
# Servidor de desenvolvimento
npm run dev

# Executar testes
npm test

# Build para produção
npm run build:all
```

### Estrutura do Projeto
```
src/
├── classes/           # Classes principais
├── bookmarklet/       # Sistema de bookmarklet
├── test/             # Testes abrangentes
├── assets/           # Estilos CSS
└── types/            # Definições TypeScript

dist/                 # Arquivos de produção
docs/                 # Documentação
scripts/              # Scripts de build
```

## 🧪 Testes

O projeto inclui uma suíte de testes abrangente:

- **Testes Unitários**: Todas as classes principais
- **Testes de Integração**: Páginas HTML reais
- **Testes E2E**: Fluxo completo de extração
- **Testes de Performance**: Datasets grandes

```bash
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
```

## 🌐 Compatibilidade

### Navegadores Suportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Sites Testados
- ✅ Páginas de contato empresariais
- ✅ Diretórios online
- ✅ Listas de fornecedores
- ✅ Páginas de equipe
- ✅ Redes sociais profissionais

## 🔒 Privacidade e Segurança

- **Processamento Local**: Todos os dados são processados no seu navegador
- **Sem Envio de Dados**: Nenhuma informação é enviada para servidores externos
- **Código Aberto**: Todo o código é público e auditável
- **Sem Rastreamento**: Não coletamos dados de uso

## 📊 Estatísticas do Projeto

- **322 Testes**: Cobertura abrangente
- **12 Arquivos de Teste**: Incluindo E2E e integração
- **5 Páginas de Teste**: HTML reais para validação
- **Suporte a 10+ Formatos**: Telefones e emails brasileiros

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### v1.0.0 (2024)
- ✅ Sistema de extração de contatos
- ✅ Interface de revisão e edição
- ✅ Exportação para CSV
- ✅ Suporte a formatos brasileiros
- ✅ Sistema de cache inteligente
- ✅ Testes abrangentes (322 testes)
- ✅ Deploy automático via GitHub Pages

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/rarinside/webscrapy/issues)
- **Instalação**: [Página de Instalação](https://rarinside.github.io/webscrapy/bookmarklet.html)

## 🎉 Agradecimentos

- Desenvolvido com foco na comunidade brasileira
- Testado em cenários reais de uso
- Otimizado para máxima compatibilidade

---

**🚀 [Instalar Agora](https://rarinside.github.io/webscrapy/bookmarklet.html)** | **📖 [Documentação](docs/)** | **🐛 [Reportar Bug](https://github.com/rarinside/webscrapy/issues)**