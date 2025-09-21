const axios = require('axios');

class ImageService {
    constructor() {
        this.baseUrl = 'https://pollinations.ai/p/';
        console.log('🎨 Serviço de geração de imagens configurado com Pollinations.ai');
    }

    // Detecta se a mensagem é um pedido para gerar imagem
    detectImageRequest(message) {
        const imageKeywords = [
            'cria', 'crie', 'criar', 'gere', 'gera', 'gerar', 'generate', 'create',
            'imagem', 'image', 'foto', 'picture', 'drawing', 'art', 'arte',
            'desenha', 'desenhe', 'draw', 'pinta', 'pinte', 'paint',
            'ilustra', 'ilustre', 'illustrate', 'mostra', 'mostre', 'show'
        ];

        const lowerMessage = message.toLowerCase();
        return imageKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    // Extrai o prompt da mensagem
    extractPrompt(message) {
        // Remove palavras de comando e limpa o texto
        let prompt = message
            .replace(/\b(cria|crie|criar|gere|gera|gerar|generate|create)\b/gi, '')
            .replace(/\b(imagem|image|foto|picture|drawing|art|arte)\b/gi, '')
            .replace(/\b(desenha|desenhe|draw|pinta|pinte|paint)\b/gi, '')
            .replace(/\b(ilustra|ilustre|illustrate|mostra|mostre|show)\b/gi, '')
            .replace(/\b(uma|um|uns?|umas?|da|de|do|pra|para|com|sem)\b/gi, ' ')
            .trim();

        // Se o prompt ficou muito curto, usa a mensagem original
        if (prompt.length < 5) {
            prompt = message;
        }

        return prompt;
    }

    // Gera a imagem usando Pollinations.ai
    async generateImage(prompt, seed = null) {
        try {
            // Codifica o prompt para URL
            const encodedPrompt = encodeURIComponent(prompt);
            let imageUrl = `${this.baseUrl}${encodedPrompt}`;

            // Adiciona parâmetros opcionais
            const params = new URLSearchParams();
            params.append('nologo', 'true'); // Remove o logo
            params.append('width', '1024');
            params.append('height', '1024');

            if (seed) {
                params.append('seed', seed.toString());
            }

            imageUrl += '?' + params.toString();

            console.log('🎨 Gerando imagem com prompt:', prompt);
            console.log('🔗 URL da imagem:', imageUrl);

            // Faz a requisição para gerar a imagem
            const response = await axios.get(imageUrl, {
                timeout: 30000,
                responseType: 'arraybuffer'
            });

            // Converte para base64
            const base64 = Buffer.from(response.data, 'binary').toString('base64');
            const mimeType = response.headers['content-type'] || 'image/jpeg';

            console.log('✅ Imagem gerada com sucesso!');

            return {
                success: true,
                imageBase64: base64,
                mimeType: mimeType,
                prompt: prompt,
                url: imageUrl
            };

        } catch (error) {
            console.error('❌ Erro ao gerar imagem:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Gera uma descrição da imagem
    generateImageDescription(prompt) {
        const descriptions = [
            `Aqui tá a imagem que você pediu: "${prompt}"`,
            `Criei essa arte pra você: "${prompt}"`,
            `Olha só que imagem daora: "${prompt}"`,
            `Tipo assim, fiz essa imagem: "${prompt}"`,
            `Na moral, que tal essa aqui: "${prompt}"`
        ];

        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }
}

module.exports = ImageService;
