const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

class StickerService {
    constructor() {
        this.tempDir = path.join(__dirname, '..', 'temp');
        this.ensureTempDir();
    }
    
    async ensureTempDir() {
        await fs.ensureDir(this.tempDir);
    }
    
    // Detectar se o usuário quer criar um sticker
    detectStickerRequest(text) {
        if (!text) return false;
        
        const stickerKeywords = [
            'cria uma figurinha',
            'faz uma figurinha',
            'vira figurinha',
            'transforma em figurinha',
            'sticker',
            'figurinha',
            'cria sticker',
            'faz sticker',
            'transforma em sticker',
            'vira sticker'
        ];
        
        const lowerText = text.toLowerCase();
        return stickerKeywords.some(keyword => lowerText.includes(keyword));
    }
    
    // Processar imagem para sticker
    async processImageToSticker(imageBuffer, filename = 'sticker') {
        try {
            console.log('🎨 Processando imagem para sticker...');
            
            // Caminho do arquivo temporário
            const tempPath = path.join(this.tempDir, `${filename}_${Date.now()}.webp`);
            
            // Processar com Sharp
            await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
                })
                .webp({ quality: 80 })
                .toFile(tempPath);
            
            console.log('✅ Sticker processado:', tempPath);
            return tempPath;
            
        } catch (error) {
            console.error('❌ Erro ao processar sticker:', error);
            throw error;
        }
    }
    
    // Limpar arquivo temporário
    async cleanupTempFile(filePath) {
        try {
            await fs.remove(filePath);
            console.log('🗑️ Arquivo temporário removido:', filePath);
        } catch (error) {
            console.error('⚠️ Erro ao remover arquivo temporário:', error);
        }
    }
    
    // Gerar resposta da IA sobre criação do sticker
    generateStickerResponse() {
        const responses = [
            '🎨 Criando sua figurinha! Um momento...',
            '✨ Transformando em sticker para você!',
            '🖼️ Processando a imagem em figurinha...',
            '🎭 Fazendo sua figurinha personalizada!',
            '🚀 Criando sticker... quase pronto!'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Gerar resposta de sucesso
    generateSuccessResponse() {
        const responses = [
            '🎉 Figurinha criada com sucesso!',
            '✅ Sua figurinha está pronta!',
            '🎨 Sticker personalizado criado!',
            '✨ Aqui está sua figurinha!',
            '🚀 Figurinha pronta para uso!'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

module.exports = StickerService;
