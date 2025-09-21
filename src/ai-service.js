const axios = require('axios');

class AIService {
    constructor() {
        // Configuração Requesty API com Google Gemini
        this.apiUrl = 'https://router.requesty.ai/v1/chat/completions';
        this.apiKey = 'sk-8m1OmA6JQ6eHYDG7OHCoGFZNBL1Pr4nF90fys8dcHCkTCGcEJ/+AAqt72xJ0GBlIGfXgdXhYKecpgQKJSrr7JDHchx2/nU5gMJAZdjJM7AY=';
        this.model = 'google/gemini-1.5-flash-8b';
        
        // Headers para Requesty
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'WhatsApp AI Bot'
        };
        
        // Configurações da personalidade da IA
        this.personality = {
            name: 'Assistente WhatsApp',
            description: 'Fala como um amigo novo, descolado, tipo gente da nova geração. Usa gírias atuais, memes, é irônico quando cabe, mas sempre natural. Nada de "kkk" forçado ou piadas batidas. É o cara que manda bem na resenha, zoa de leve, mas nunca força a barra.',
            style: 'casual', // casual, formal, friendly
            maxTokens: 1300, // Menos tokens = respostas mais diretas
            temperature: 0.9
        };
        
        console.log('🤖 IA configurada: Google Gemini 1.5 Flash 8B via Requesty');
    }
    
    async generateResponse(message, conversationHistory = []) {
        try {
            // Usar Gemini via Requesty
            console.log('🧠 Gerando resposta com Gemini para:', message.substring(0, 50) + '...');
            return await this.generateGeminiResponse(message, conversationHistory);
            
        } catch (error) {
            console.error('❌ Erro ao gerar resposta da IA:', error);
            console.log('🔄 Usando fallback local...');
            return await this.generateLocalResponse(message, conversationHistory);
        }
    }
    
    async generateResponseWithImage(message, imageBase64, conversationHistory = []) {
        try {
            console.log('🖼️ Gerando resposta com imagem usando Gemini...');
            return await this.generateGeminiResponseWithImage(message, imageBase64, conversationHistory);
            
        } catch (error) {
            console.error('❌ Erro ao processar imagem com IA:', error);
            // Fallback para resposta sem imagem
            return await this.generateLocalResponse(
                message + ' (Desculpe, não consegui processar a imagem no momento)', 
                conversationHistory
            );
        }
    }
    
    async generateGeminiResponse(message, conversationHistory) {
        const messages = [
            {
                role: 'system',
                content: `${this.personality.description}
                         Responde tipo um brother novo, usa gírias da hora tipo "mano", "tipo assim", "na moral", "de boa", "tranquilo".
                         Ironia sutil quando cabe, mas nunca forçado. É natural, como se tivesse no zap com um amigo.
                         Nada de "kkk" o tempo todo ou "hahaha". Ri quando é engraçado de verdade.
                         Memes só se encaixarem naturalmente. Zero texto gigante ou explicação desnecessária.
                         Se for chato, diz "bla bla bla" ou "sei lá mano".`
            }
        ];
        
        // Adicionar histórico mais extenso (últimas 15 mensagens ou 4000 tokens)
        const recentHistory = this.getRelevantHistory(conversationHistory, 15, 4000);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.fromMe ? 'assistant' : 'user',
                content: msg.text || (msg.hasImage ? '📷 [Imagem enviada]' : '[Mensagem sem texto]')
            });
        });
        
        // Adicionar mensagem atual
        messages.push({
            role: 'user',
            content: message
        });
        
        const requestData = {
            model: this.model,
            messages: messages,
            max_tokens: this.personality.maxTokens,
            temperature: this.personality.temperature
        };
        
        console.log('📤 Enviando request para Gemini:', {
            model: this.model,
            messagesCount: messages.length,
            maxTokens: this.personality.maxTokens
        });
        
        const response = await axios.post(this.apiUrl, requestData, {
            headers: this.headers,
            timeout: 30000 // 30 segundos timeout
        });
        
        console.log('📥 Resposta recebida do Gemini:', {
            status: response.status,
            hasChoices: !!response.data.choices?.length
        });
        
        if (response.data.choices && response.data.choices.length > 0) {
            const aiResponse = response.data.choices[0].message.content;
            console.log('✅ Resposta da IA:', aiResponse.substring(0, 100) + '...');
            return aiResponse;
        } else {
            throw new Error('Resposta inválida da API Gemini');
        }
    }
    
    async generateGeminiResponseWithImage(message, imageBase64, conversationHistory) {
        const messages = [
            {
                role: 'system',
                content: `${this.personality.description}
                         Responde tipo um brother novo, usa gírias da hora tipo "mano", "tipo assim", "na moral", "de boa", "tranquilo".
                         Ironia sutil quando cabe, mas nunca forçado. É natural, como se tivesse no zap com um amigo.
                         Nada de "kkk" o tempo todo ou "hahaha". Ri quando é engraçado de verdade.
                         Memes só se encaixarem naturalmente. Zero texto gigante ou explicação desnecessária.
                         Se for chato, diz "bla bla bla" ou "sei lá mano".

                         IMPORTANTE: Se for sticker, comenta naturalmente tipo "daora esse ai" ou "que isso brother". NÃO oferece criar figurinha automaticamente.
                         Só cria figurinha se a pessoa pedir explicitamente "cria figurinha" junto com uma imagem.`
            }
        ];
        
        // Adicionar histórico mais extenso mesmo para imagens (últimas 10 mensagens)
        const recentHistory = this.getRelevantHistory(conversationHistory, 10, 3000);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.fromMe ? 'assistant' : 'user',
                content: msg.text || (msg.hasImage ? '📷 [Imagem enviada anteriormente]' : '[Mensagem sem texto]')
            });
        });
        
        // Adicionar mensagem atual com imagem
        const userMessage = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: message
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`,
                        detail: 'high'
                    }
                }
            ]
        };
        
        messages.push(userMessage);
        
        const requestData = {
            model: this.model,
            messages: messages,
            max_tokens: this.personality.maxTokens * 2, // Mais tokens para análise de imagem
            temperature: this.personality.temperature
        };
        
        console.log('📤 Enviando imagem para Gemini:', {
            model: this.model,
            messagesCount: messages.length,
            maxTokens: requestData.max_tokens,
            imageSize: Math.round(imageBase64.length / 1024) + 'KB'
        });
        
        const response = await axios.post(this.apiUrl, requestData, {
            headers: this.headers,
            timeout: 45000 // 45 segundos para imagem
        });
        
        console.log('📥 Resposta com imagem recebida do Gemini:', {
            status: response.status,
            hasChoices: !!response.data.choices?.length
        });
        
        if (response.data.choices && response.data.choices.length > 0) {
            const aiResponse = response.data.choices[0].message.content;
            console.log('✅ Resposta da IA com imagem:', aiResponse.substring(0, 150) + '...');
            return aiResponse;
        } else {
            throw new Error('Resposta inválida da API Gemini para imagem');
        }
    }
    
    // Método para obter histórico relevante sem exceder limites
    getRelevantHistory(conversationHistory, maxMessages = 15, maxTokens = 4000) {
        if (!conversationHistory || conversationHistory.length === 0) {
            return [];
        }
        
        // Pegar as mensagens mais recentes
        const recentMessages = conversationHistory.slice(-maxMessages);
        
        // Estimar tokens e cortar se necessário
        let totalTokens = 0;
        const relevantHistory = [];
        
        // Processar de trás para frente (mais recentes primeiro)
        for (let i = recentMessages.length - 1; i >= 0; i--) {
            const msg = recentMessages[i];
            const messageText = msg.text || '';
            const estimatedTokens = Math.ceil(messageText.length / 4); // Aproximação: 4 chars = 1 token
            
            if (totalTokens + estimatedTokens <= maxTokens) {
                relevantHistory.unshift(msg); // Adicionar no início para manter ordem
                totalTokens += estimatedTokens;
            } else {
                break; // Parar se exceder limite de tokens
            }
        }
        
        console.log(`📚 Histórico carregado: ${relevantHistory.length} mensagens, ~${totalTokens} tokens`);
        return relevantHistory;
    }
    
    async generateLocalResponse(message, conversationHistory) {
        // Gerador de respostas simples baseado em padrões
        const lowerMessage = message.toLowerCase();
        
        // Saudações
        if (this.containsAny(lowerMessage, ['oi', 'olá', 'ola', 'hey', 'hi', 'hello', 'bom dia', 'boa tarde', 'boa noite'])) {
            const greetings = [
                'E aí, tudo na paz?',
                'Fala brother, de boa?',
                'Oi mano, que rolê?',
                'Hey, tranquilo?',
                'Salve, como tá?'
            ];
            return this.getRandomResponse(greetings);
        }
        
        // Perguntas sobre como está
        if (this.containsAny(lowerMessage, ['como vai', 'como está', 'tudo bem', 'como anda', 'td bem'])) {
            const statusResponses = [
                'De boa, e você? Tranquilo?',
                'Tudo na paz, mano. E aí, como tá?',
                'Tranquilo, tipo assim, normal. E vc?',
                'De boa, brother. Que rolê?',
                'Tô de boa, na moral. E você?'
            ];
            return this.getRandomResponse(statusResponses);
        }
        
        // Perguntas sobre o que é/quem é
        if (this.containsAny(lowerMessage, ['quem é você', 'o que você é', 'quem e voce', 'que você faz'])) {
            const aboutResponses = [
                'Sou tipo um brother que sabe de tudo, mano. Pergunta aí!',
                'Tô aqui pra ajudar no que rolar, tipo um assistente maneiro.',
                'Sou o cara que responde suas dúvidas, na moral.',
                'Um bot daora que conversa e ajuda, tipo assim, normal.',
                'Aqui ó, pra bater papo e resolver o que precisar!'
            ];
            return this.getRandomResponse(aboutResponses);
        }
        
        // Agradecimentos
        if (this.containsAny(lowerMessage, ['obrigado', 'obrigada', 'valeu', 'thanks', 'vlw', 'brigadão'])) {
            const thanksResponses = [
                'Tranquilo, brother! De boa!',
                'Na moral, qualquer coisa é só chamar!',
                'Por nada mano, tipo assim, normal.',
                'Valeu! Tô aqui quando precisar.',
                'De boa, na paz!'
            ];
            return this.getRandomResponse(thanksResponses);
        }
        
        // Despedidas
        if (this.containsAny(lowerMessage, ['tchau', 'bye', 'até logo', 'até mais', 'falou', 'xau'])) {
            const goodbyeResponses = [
                'Falou brother, até mais!',
                'Tranquilo, na paz!',
                'Valeu, qualquer coisa é só chamar!',
                'De boa mano, até depois!',
                'É nóis, tipo assim, normal!'
            ];
            return this.getRandomResponse(goodbyeResponses);
        }
        
        // Perguntas sobre clima/tempo
        if (this.containsAny(lowerMessage, ['tempo', 'clima', 'chuva', 'sol', 'frio', 'calor'])) {
            const weatherResponses = [
                'Sei lá mano, não tô vendo o tempo aqui. Olha no Google!',
                'Tipo assim, não tenho como saber o clima agora. Confere no app!',
                'Na moral, não consigo ver o tempo. Dá uma olhada no celular!',
                'Brother, tô sem ver o tempo. Checa no seu app de clima!'
            ];
            return this.getRandomResponse(weatherResponses);
        }
        
        // Perguntas genéricas
        if (lowerMessage.includes('?')) {
            const questionResponses = [
                'Sei lá mano, pergunta complicada essa aí. Me explica melhor!',
                'Tipo assim, não manjo muito disso. Me dá mais detalhes!',
                'Na moral, não sei te dizer. Mas tipo, o que você acha?',
                'Brother, tô por fora dessa. Me conta mais sobre isso!'
            ];
            return this.getRandomResponse(questionResponses);
        }
        
        // Resposta padrão
        const defaultResponses = [
            'Interessante isso que você falou, mano.',
            'Tipo assim, me conta mais sobre isso.',
            'Na moral, que rolê hein!',
            'Brother, tô ligado no que você tá falando.',
            'De boa, me explica melhor então!',
            'Tranquilo, tipo assim, normal.'
        ];
        
        return this.getRandomResponse(defaultResponses);
    }
    
    containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getFallbackResponse(message) {
        const fallbacks = [
            'Brother, deu um bug aqui. Tenta de novo?',
            'Na moral, não rolou agora. Me manda outra mensagem!',
            'Tipo assim, não entendi direito. Reformula aí!',
            'Deu erro mano, tenta novamente!'
        ];

        return this.getRandomResponse(fallbacks);
    }
    
    // Método para configurar chave da API Requesty
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.headers.Authorization = `Bearer ${apiKey}`;
        console.log('🔑 API Key atualizada para Requesty');
    }
    
    // Método para atualizar personalidade da IA
    updatePersonality(newPersonality) {
        this.personality = { ...this.personality, ...newPersonality };
        console.log('🎭 Personalidade da IA atualizada:', newPersonality);
    }
}

module.exports = AIService;
