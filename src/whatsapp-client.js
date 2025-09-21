const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { EventEmitter } = require('events');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppClient extends EventEmitter {
    constructor(io) {
        super();
        this.io = io;
        this.sock = null;
        this.isConnected = false;
        this.authDir = path.join(__dirname, '..', 'auth');
        
        // Garantir que o diretório de auth existe
        fs.ensureDirSync(this.authDir);
    }
    
    async initialize() {
        try {
            console.log('Inicializando cliente WhatsApp...');
            
            // Configurar autenticação
            const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
            
            // Criar socket
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                browser: ['WhatsApp AI Bot', 'Chrome', '1.0.0'],
                generateHighQualityLinkPreview: true,
                markOnlineOnConnect: false
            });
            
            // Event listeners
            this.sock.ev.on('creds.update', saveCreds);
            
            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    console.log('QR Code gerado');
                    this.emit('qr', qr);
                }
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log('Conexão fechada:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
                    
                    this.isConnected = false;
                    this.emit('disconnected');
                    
                    if (shouldReconnect) {
                        setTimeout(() => {
                            this.initialize();
                        }, 5000);
                    }
                } else if (connection === 'open') {
                    console.log('WhatsApp conectado com sucesso!');
                    this.isConnected = true;
                    this.emit('ready');
                }
            });
            
            // Listener para mensagens
            this.sock.ev.on('messages.upsert', (m) => {
                m.messages.forEach(async (message) => {
                    if (message.message) {
                        // Processar imagem se houver
                        if (message.message.imageMessage) {
                            console.log('📷 Imagem recebida, processando...');
                            try {
                                const imageBuffer = await this.downloadMediaMessage(message);
                                message.imageData = imageBuffer;
                                message.messageType = 'image';
                            } catch (error) {
                                console.error('Erro ao processar imagem:', error);
                            }
                        } else {
                            message.messageType = 'text';
                        }
                        
                        this.emit('message', message);
                    }
                });
            });
            
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
            throw error;
        }
    }
    
    async sendMessage(chatId, text) {
        if (!this.sock || !this.isConnected) {
            throw new Error('WhatsApp não está conectado');
        }
        
        try {
            await this.sock.sendMessage(chatId, { text });
            console.log('Mensagem enviada para:', chatId);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }
    
    async getContact(jid) {
        if (!this.sock || !this.isConnected) {
            return { name: jid.split('@')[0] };
        }
        
        try {
            // Tentar obter informações do contato
            const contact = await this.sock.onWhatsApp(jid);
            if (contact && contact.length > 0) {
                // Tentar obter foto do perfil
                let profilePictureUrl = '';
                try {
                    profilePictureUrl = await this.sock.profilePictureUrl(jid, 'image');
                } catch (err) {
                    // Ignore se não conseguir obter a foto
                }
                
                return {
                    name: contact[0].name || jid.split('@')[0],
                    profilePictureUrl: profilePictureUrl || '',
                    pushName: contact[0].pushName || ''
                };
            }
            
            return { name: jid.split('@')[0] };
        } catch (error) {
            console.error('Erro ao obter contato:', error);
            return { name: jid.split('@')[0] };
        }
    }
    
    async getChats() {
        if (!this.sock || !this.isConnected) {
            return [];
        }
        
        try {
            const chats = await this.sock.getOrderedChats();
            return chats.map(chat => ({
                id: chat.id,
                name: chat.name || chat.id.split('@')[0],
                lastMessage: chat.lastMessage,
                unreadCount: chat.unreadCount || 0
            }));
        } catch (error) {
            console.error('Erro ao obter chats:', error);
            return [];
        }
    }
    
    async downloadMediaMessage(message) {
        if (!this.sock || !this.isConnected) {
            throw new Error('WhatsApp não está conectado');
        }
        
        try {
            console.log('⬇️ Baixando mídia da mensagem...');
            const buffer = await downloadMediaMessage(message, 'buffer', {}, {
                logger: undefined,
                reuploadRequest: this.sock.updateMediaMessage
            });
            console.log('✅ Mídia baixada com sucesso, tamanho:', buffer.length, 'bytes');
            return buffer;
        } catch (error) {
            console.error('❌ Erro ao baixar mídia:', error);
            throw error;
        }
    }
    
    disconnect() {
        if (this.sock) {
            this.sock.end();
            this.sock = null;
            this.isConnected = false;
        }
    }
}

module.exports = WhatsAppClient;
