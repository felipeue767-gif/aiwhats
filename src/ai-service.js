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
            description: 'Opine, aja como um humano. Escreva naturalmente informal como um humano. Opine. Nao foque apenas em ajudar.',
            style: 'casual', // casual, formal, friendly
            maxTokens: 1500,
            temperature: 1
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
                content: `Você é ${this.personality.name}. ${this.personality.description} 
                         Responda de forma ${this.personality.style}. 
                         Aja como se você fosse uma pessoa real, com personalidade descontraída, divertida e cheia de opinião. Suas respostas devem ser informais, usando gírias, expressões populares, emojis (se quiser), e falando como um amigo da vida real — sem parecer um robô ou professor.

Você deve responder de forma natural, com leveza, bom humor e autenticidade, como se estivesse trocando ideia com um parça. Pode usar memes, piadas, sarcasmo leve e referências da cultura pop se fizer sentido.

Evite linguagem técnica ou formal demais, a não ser que o contexto peça. Sempre que possível, dê sua opinião real, com frases tipo "mano, na moral", "eu acho que...", "véi", "sem zoeira", "papo reto", etc.

Sua vibe deve ser parecida com a de um(a) amigo(a) legal, daqueles que topa qualquer assunto e manda a real sem enrolar. Se precisar explicar algo complicado, simplifique como se estivesse explicando pra alguém na resenha, sem deixar de ser claro.

Importante: você é divertido(a), gente fina e não tem medo de mostrar personalidade. Responda sempre com autenticidade e bom senso.`
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
                content: `Você é ${this.personality.name}. ${this.personality.description} 
                         Responda de forma ${this.personality.style}. 
                         Lembre-se da conversa anterior e mantenha continuidade.
                         Responda sempre em português brasileiro.
                         Você pode analisar imagens e descrever o que vê nelas de forma natural e útil.
                         Seja expressivo e use emojis quando apropriado.`
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
                'Olá! Como posso ajudar você hoje? 😊',
                'Oi! Tudo bem? Em que posso ser útil?',
                'Hey! Como está? Posso ajudar com alguma coisa?',
                'Olá! É um prazer falar com você! 👋'
            ];
            return this.getRandomResponse(greetings);
        }
        
        // Perguntas sobre como está
        if (this.containsAny(lowerMessage, ['como vai', 'como está', 'tudo bem', 'como anda', 'td bem'])) {
            const statusResponses = [
                'Estou indo muito bem, obrigado por perguntar! E você, como está?',
                'Tudo ótimo por aqui! Como tem passado?',
                'Indo super bem! E aí, como andam as coisas?',
                'Muito bem, obrigado! Espero que você também esteja bem! 😊'
            ];
            return this.getRandomResponse(statusResponses);
        }
        
        // Perguntas sobre o que é/quem é
        if (this.containsAny(lowerMessage, ['quem é você', 'o que você é', 'quem e voce', 'que você faz'])) {
            const aboutResponses = [
                'Sou um assistente inteligente aqui para ajudar você! 🤖',
                'Eu sou uma IA criada para conversar e ajudar com o que precisar!',
                'Sou seu assistente virtual, sempre pronto para uma boa conversa! ✨',
                'Um assistente digital que adora ajudar e conversar! 😄'
            ];
            return this.getRandomResponse(aboutResponses);
        }
        
        // Agradecimentos
        if (this.containsAny(lowerMessage, ['obrigado', 'obrigada', 'valeu', 'thanks', 'vlw', 'brigadão'])) {
            const thanksResponses = [
                'Por nada! Sempre que precisar, estarei aqui! 😊',
                'Disponha! Foi um prazer ajudar!',
                'Imagina! Fico feliz em poder ajudar! ✨',
                'De nada! Qualquer coisa é só chamar! 👍'
            ];
            return this.getRandomResponse(thanksResponses);
        }
        
        // Despedidas
        if (this.containsAny(lowerMessage, ['tchau', 'bye', 'até logo', 'até mais', 'falou', 'xau'])) {
            const goodbyeResponses = [
                'Até mais! Foi ótimo conversar com você! 👋',
                'Tchau! Volte sempre que quiser conversar!',
                'Até logo! Tenha um ótimo dia! ✨',
                'Falou! Até a próxima! 😊'
            ];
            return this.getRandomResponse(goodbyeResponses);
        }
        
        // Perguntas sobre clima/tempo
        if (this.containsAny(lowerMessage, ['tempo', 'clima', 'chuva', 'sol', 'frio', 'calor'])) {
            const weatherResponses = [
                'Infelizmente não tenho acesso aos dados meteorológicos no momento. Que tal verificar um app de clima?',
                'Para informações sobre o tempo, recomendo consultar um site de meteorologia confiável! 🌤️',
                'Não consigo verificar o clima agora, mas espero que esteja um dia agradável aí! ☀️'
            ];
            return this.getRandomResponse(weatherResponses);
        }
        
        // Perguntas genéricas
        if (lowerMessage.includes('?')) {
            const questionResponses = [
                'Essa é uma pergunta interessante! Infelizmente não tenho todas as respostas, mas posso tentar ajudar de outras formas!',
                'Hmm, boa pergunta! O que mais gostaria de saber sobre isso?',
                'Interessante! Você poderia me dar mais detalhes sobre o que está procurando?',
                'Essa é uma questão complexa! Vamos ver... o que especificamente você gostaria de entender melhor?'
            ];
            return this.getRandomResponse(questionResponses);
        }
        
        // Resposta padrão
        const defaultResponses = [
            'Interessante! Me conte mais sobre isso.',
            'Entendi! Como posso ajudar você com essa questão?',
            'Bacana! Gostaria de conversar mais sobre esse assunto?',
            'Legal! O que mais você gostaria de compartilhar?',
            'Que interessante! Continue, estou ouvindo! 😊',
            'Compreendo! Há algo específico em que posso ajudar?'
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
            'Desculpe, não consegui processar sua mensagem no momento. Pode tentar novamente?',
            'Ops! Tive um pequeno problema aqui. O que você gostaria de saber?',
            'Parece que algo deu errado. Como posso ajudar você?',
            'Humm, não entendi bem. Pode reformular sua pergunta?'
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
