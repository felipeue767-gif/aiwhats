const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { AIService, StickerService } = require('./src/ai-service');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Instâncias dos serviços
const whatsappClient = new WhatsAppClient(io);
const aiService = new AIService();
const StickerService = require('./src/sticker-service');
const imageService = new ImageService();

// Variáveis globais
let isConnected = false;
let conversations = new Map();
let aiEnabled = new Map(); // Armazena se AI está ativada para cada chat
let currentQrCode = null; // Armazenar QR code atual

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// API Endpoints
app.get('/api/status', (req, res) => {
    res.json({ connected: isConnected });
});

app.get('/api/conversations', (req, res) => {
    const conversationsArray = Array.from(conversations.entries()).map(([id, data]) => ({
        id,
        ...data,
        aiEnabled: aiEnabled.get(id) || false
    }));
    res.json(conversationsArray);
});

app.post('/api/send-message', async (req, res) => {
    try {
        const { chatId, message } = req.body;
        await whatsappClient.sendMessage(chatId, message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/toggle-ai', (req, res) => {
    const { chatId, enabled } = req.body;
    aiEnabled.set(chatId, enabled);
    res.json({ success: true, aiEnabled: enabled });
});

// Socket.IO events
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Enviar status atual
    socket.emit('connection-status', isConnected);
    
    // Se já tiver QR code, enviar imediatamente
    if (currentQrCode && !isConnected) {
        console.log('Enviando QR code existente para novo cliente');
        socket.emit('qr-code', currentQrCode);
    }
    
    socket.on('start-connection', async () => {
        try {
            console.log('Cliente solicitou inicialização da conexão');
            await whatsappClient.initialize();
        } catch (error) {
            socket.emit('connection-error', error.message);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Event handlers do WhatsApp
whatsappClient.on('qr', (qr) => {
    console.log('QR Code gerado - emitindo para clientes');
    currentQrCode = qr; // Armazenar QR code
    io.emit('qr-code', qr);
});

whatsappClient.on('ready', () => {
    console.log('WhatsApp conectado!');
    isConnected = true;
    currentQrCode = null; // Limpar QR code quando conectado
    io.emit('connection-status', true);
});

whatsappClient.on('disconnected', () => {
    console.log('WhatsApp desconectado');
    isConnected = false;
    io.emit('connection-status', false);
});

whatsappClient.on('message', async (message) => {
    try {
        // Atualizar conversas
        const chatId = message.key.remoteJid;
        const contact = await whatsappClient.getContact(chatId);
        
        if (!conversations.has(chatId)) {
            conversations.set(chatId, {
                name: contact.name || contact.pushName || chatId.split('@')[0],
                avatar: contact.profilePictureUrl || '',
                lastMessage: message.message?.conversation || message.message?.extendedTextMessage?.text || '',
                timestamp: new Date(message.messageTimestamp * 1000),
                messages: []
            });
        }
        
        const conversation = conversations.get(chatId);
        
        // Extrair texto da mensagem
        let messageText = '';
        if (message.message?.conversation) {
            messageText = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
            messageText = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage) {
            messageText = message.message.imageMessage.caption || '📷 Imagem';
        } else if (message.message?.stickerMessage) {
            messageText = '🎭 Sticker';
        }
        
        const messageObj = {
            id: message.key.id,
            text: messageText,
            fromMe: message.key.fromMe,
            timestamp: new Date(message.messageTimestamp * 1000),
            type: message.messageType || 'text'
        };
        
        // Adicionar dados da imagem ou sticker se houver
        if ((message.messageType === 'image' || message.messageType === 'sticker') && message.imageData) {
            messageObj.hasImage = true;
            messageObj.imageBase64 = message.imageData.toString('base64');
            messageObj.isSticker = message.messageType === 'sticker';
            console.log(`${message.messageType === 'sticker' ? '🎭 Sticker' : '📷 Imagem'} processada e adicionada à mensagem`);
        }
        
        conversation.messages.push(messageObj);
        conversation.lastMessage = messageText || '📷 Imagem';
        conversation.timestamp = new Date(message.messageTimestamp * 1000);
        
        // Enviar para clientes conectados
        io.emit('new-message', {
            chatId,
            conversation: {
                id: chatId,
                ...conversation,
                aiEnabled: aiEnabled.get(chatId) || false
            }
        });
        
        // Verificar se deve responder com AI
        if (!message.key.fromMe && aiEnabled.get(chatId)) {
            console.log('🤖 Gerando resposta AI para:', chatId);
            
            // Preparar dados para a IA
            const currentMessage = messageObj;
            
            if (currentMessage.text || currentMessage.hasImage) {
                
                // Verificar se é solicitação de imagem
                if (currentMessage.text && imageService.detectImageRequest(currentMessage.text)) {
                    console.log('🎨 Pedido de geração de imagem detectado!');

                    try {
                        // Extrair o prompt da mensagem
                        const prompt = imageService.extractPrompt(currentMessage.text);

                        // Enviar mensagem de processamento
                        const processingMsg = `🎨 Gerando imagem: "${prompt}"... Um momento!`;
                        await whatsappClient.sendMessage(chatId, processingMsg);

                        // Gerar a imagem
                        const imageResult = await imageService.generateImage(prompt);

                        if (imageResult.success) {
                            // Adicionar aos dados da mensagem para a IA
                            currentMessage.hasImage = true;
                            currentMessage.imageBase64 = imageResult.imageBase64;
                            currentMessage.imageMimeType = imageResult.mimeType;
                            currentMessage.generatedImage = true;
                            currentMessage.imagePrompt = prompt;

                            // Enviar a imagem
                            await whatsappClient.sendMessage(chatId, {
                                image: Buffer.from(imageResult.imageBase64, 'base64'),
                                caption: imageService.generateImageDescription(prompt)
                            });

                            console.log('✅ Imagem gerada e enviada com sucesso!');

                        } else {
                            await whatsappClient.sendMessage(chatId, '😔 Ops! Não consegui gerar a imagem. Tenta com outro prompt?');
                        }

                    } catch (error) {
                        console.error('❌ Erro ao gerar imagem:', error);
                        await whatsappClient.sendMessage(chatId, '😔 Deu erro na geração da imagem. Tenta novamente!');
                    }

                } else {
                    // Verificar se é solicitação de sticker
                    if (currentMessage.hasImage && stickerService.detectStickerRequest(currentMessage.text) && !currentMessage.isSticker) {
                        console.log('🎨 Solicitação de sticker detectada!');

                        try {
                            // Enviar mensagem de processamento
                            const processingMsg = stickerService.generateStickerResponse();
                            await whatsappClient.sendMessage(chatId, processingMsg);

                            // Processar imagem para sticker
                            const stickerPath = await stickerService.processImageToSticker(
                                Buffer.from(currentMessage.imageBase64, 'base64'),
                                `sticker_${chatId.split('@')[0]}`
                            );

                            // Aguardar um pouco e enviar sticker
                            setTimeout(async () => {
                                await whatsappClient.sendSticker(chatId, stickerPath);

                                // Enviar mensagem de sucesso
                                const successMsg = stickerService.generateSuccessResponse();
                                await whatsappClient.sendMessage(chatId, successMsg);

                                // Limpar arquivo temporário
                                await stickerService.cleanupTempFile(stickerPath);
                            }, 3000);

                        } catch (error) {
                            console.error('❌ Erro ao criar sticker:', error);
                            await whatsappClient.sendMessage(chatId, '😔 Ops! Não consegui criar a figurinha. Tente novamente!');
                        }

                    } else {
                        // Processamento normal da IA
                        let aiResponse;

                        if (currentMessage.hasImage) {
                            const prompt = currentMessage.isSticker ?
                                (currentMessage.text || 'que sticker é esse?') :
                                (currentMessage.text || 'que que tem na imagem?');

                            console.log(`${currentMessage.isSticker ? '🎭 Enviando sticker' : '🖼️ Enviando imagem'} para IA analisar...`);
                            aiResponse = await aiService.generateResponseWithImage(
                                prompt,
                                currentMessage.imageBase64,
                                conversation.messages
                            );
                        } else {
                            aiResponse = await aiService.generateResponse(currentMessage.text, conversation.messages);
                        }

                        // Aguardar um pouco para parecer mais natural
                        setTimeout(async () => {
                            await whatsappClient.sendMessage(chatId, aiResponse);
                        }, 2000 + Math.random() * 3000); // 2-5 segundos
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});
