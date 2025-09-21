# 📱 WhatsApp AI Bot

Uma aplicação completa para conectar seu WhatsApp via QR Code e automatizar respostas com Inteligência Artificial.

## 🚀 Funcionalidades

### ✅ Implementadas
- 🔗 **Conexão WhatsApp via QR Code** usando Baileys
- 💬 **Interface de conversas em tempo real**
- 🤖 **Sistema de IA para respostas automáticas**
- 📱 **Design responsivo e moderno**
- 🌓 **Modo escuro/claro**
- ⚡ **WebSocket para comunicação em tempo real**
- 📋 **Lista de conversas dinâmica**
- 🔍 **Busca em conversas**
- ⚙️ **Toggle para ativar/desativar IA por conversa**

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Servidor principal
- **Express.js** - Framework web
- **Socket.IO** - Comunicação real-time
- **@whiskeysockets/baileys** - API WhatsApp
- **QRCode** - Geração de QR codes

### Frontend
- **HTML5 + CSS3** - Interface base
- **Tailwind CSS** - Framework de estilos
- **JavaScript (ES6+)** - Lógica do cliente
- **Socket.IO Client** - Comunicação com servidor

## 📦 Instalação

### 1. Pré-requisitos
- **Node.js** 16+ instalado
- **npm** ou **yarn**

### 2. Clonar/Baixar o projeto
```bash
# Se usando git
git clone <url-do-repositorio>
cd whatsapp-ai

# Ou baixe e extraia os arquivos para a pasta whatsapp-ai
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Executar o servidor
```bash
# Modo produção
npm start

# Ou modo desenvolvimento (com auto-reload)
npm run dev
```

### 5. Acessar a aplicação
Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📱 Como Usar

### 1. Conectar WhatsApp
1. Acesse `http://localhost:3000`
2. Clique em **"Conectar WhatsApp"**
3. Um QR Code será gerado
4. Abra o WhatsApp no seu celular
5. Vá em **Menu (3 pontos) > Aparelhos conectados**
6. Toque em **"Conectar um aparelho"**
7. Escaneie o QR Code

### 2. Gerenciar Conversas
1. Após conectar, clique em **"Acessar Conversas"**
2. Suas conversas aparecerão na barra lateral
3. Clique em uma conversa para abrir
4. Digite mensagens normalmente

### 3. Ativar IA
1. Abra uma conversa
2. Use o toggle **"IA Ativa"** no cabeçalho
3. A IA responderá automaticamente às mensagens recebidas
4. Você pode ativar/desativar para cada conversa individualmente

## 🤖 Sistema de IA

### Recursos da IA
- **Respostas contextuais** baseadas no histórico da conversa
- **Personalidade configurável** (casual, formal, amigável)
- **Respostas em português brasileiro**
- **Fallback inteligente** para quando não entende a mensagem
- **Delay natural** entre 2-5 segundos para parecer humano

### Configuração Avançada
Para usar **OpenAI GPT** (opcional):
1. Crie uma conta na [OpenAI](https://openai.com)
2. Obtenha sua API Key
3. Configure a variável de ambiente:
```bash
export OPENAI_API_KEY=sua_chave_aqui
```

**Sem API Key:** O sistema usa um gerador de respostas local inteligente.

## 📁 Estrutura do Projeto

```
whatsapp-ai/
├── package.json              # Dependências e scripts
├── server.js                 # Servidor principal
├── README.md                 # Este arquivo
├── src/
│   ├── whatsapp-client.js    # Cliente Baileys
│   └── ai-service.js         # Serviço de IA
├── public/
│   ├── connect.html          # Tela de conexão
│   └── chat.html             # Tela de conversas
└── auth/                     # Dados de autenticação (auto-criado)
```

## 🔧 Configurações

### Personalizar IA
Edite `src/ai-service.js` para alterar:
```javascript
this.personality = {
    name: 'Seu Bot',
    description: 'Descrição do comportamento',
    style: 'casual', // casual, formal, friendly
    maxTokens: 150,
    temperature: 0.8
};
```

### Configurar Porta
Altere no `server.js` ou use variável de ambiente:
```bash
export PORT=3001
```

## 🛡️ Segurança

### Dados de Autenticação
- Mantidos localmente na pasta `auth/`
- **Nunca** compartilhe estes arquivos
- Para resetar: delete a pasta `auth/` e reconecte

### API Keys
- Use variáveis de ambiente para chaves sensíveis
- **Nunca** commite API keys no código

## ❗ Problemas Comuns

### QR Code não aparece
1. Verifique se o servidor está rodando
2. Abra as ferramentas do desenvolvedor (F12)
3. Verifique por erros no console

### WhatsApp não conecta
1. Certifique-se que o WhatsApp Web não está aberto
2. Delete a pasta `auth/` e tente novamente
3. Use um celular diferente se necessário

### IA não responde
1. Verifique se o toggle está ativado
2. Veja os logs do servidor no terminal
3. Teste enviando uma mensagem simples primeiro

### Conversas não aparecem
1. Envie uma mensagem pelo celular primeiro
2. Atualize a página
3. Verifique a conexão com o WhatsApp

## 🔄 Atualizações

### Próximas Funcionalidades
- 📎 **Upload de arquivos e mídia**
- 📊 **Dashboard com estatísticas**
- 🔔 **Notificações push**
- 👥 **Suporte a grupos**
- 📅 **Agendamento de mensagens**
- 🏷️ **Sistema de tags e categorias**

## 📝 Logs

### Visualizar logs do servidor
```bash
npm start
# Logs aparecem no terminal
```

### Arquivos de log (opcional)
Adicione ao `server.js` para salvar logs:
```javascript
const fs = require('fs');
const logStream = fs.createWriteStream('app.log', { flags: 'a' });
```

## 🆘 Suporte

### Reporting Bugs
1. Descreva o problema detalhadamente
2. Inclua logs do servidor
3. Mencione seu sistema operacional
4. Passos para reproduzir

### Solicitações de Funcionalidades
1. Descreva a funcionalidade desejada
2. Explique o caso de uso
3. Sugira a implementação

## 📜 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

## 🎯 Desenvolvido por SBT

---

**🚨 Aviso Legal:** Este projeto é para fins educacionais e de automação pessoal. Use responsavelmente e respeite os termos de uso do WhatsApp.
