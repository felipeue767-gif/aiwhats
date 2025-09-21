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

    // Gera a imagem usando Pollinations.ai com prompt otimizado
    async generateImage(optimizedPrompt) {
        try {
            console.log('🎨 Gerando imagem com prompt otimizado:', optimizedPrompt);
            
            // Codifica o prompt para URL
            const encodedPrompt = encodeURIComponent(optimizedPrompt);
            
            // URL mais simples e direta do Pollinations
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
            
            console.log('🔗 URL da imagem:', imageUrl);

            // Headers para requisição mais robusta
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            };

            // Faz a requisição para gerar a imagem
            const response = await axios.get(imageUrl, {
                timeout: 45000, // 45 segundos
                responseType: 'arraybuffer',
                headers: headers,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });

            console.log('📥 Resposta recebida, status:', response.status);
            console.log('📄 Content-Type:', response.headers['content-type']);
            console.log('📊 Tamanho da imagem:', response.data.length, 'bytes');

            if (response.data.length < 1000) {
                throw new Error('Imagem muito pequena, provavelmente inválida');
            }

            // Converte para base64
            const base64 = Buffer.from(response.data).toString('base64');
            const mimeType = response.headers['content-type'] || 'image/jpeg';

            console.log('✅ Imagem gerada com sucesso! Tamanho base64:', base64.length);

            return {
                success: true,
                imageBase64: base64,
                mimeType: mimeType,
                prompt: optimizedPrompt,
                url: imageUrl
            };

        } catch (error) {
            console.error('❌ Erro detalhado ao gerar imagem:');
            console.error('❌ Mensagem:', error.message);
            console.error('❌ Status:', error.response?.status);
            console.error('❌ Data:', error.response?.data?.toString().substring(0, 200));
            
            return {
                success: false,
                error: error.message,
                status: error.response?.status,
                details: error.response?.data?.toString().substring(0, 200)
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
