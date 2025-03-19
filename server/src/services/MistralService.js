const HttpClientService = require('./HttpClientService');
const logger = require('../config/logger');
const {BadRequestError} = require('../config/errors');
const RequestLimitQueueService = require('./RequestLimitQueueService');

class MistralService {
    #maxTokens = 300;
    #mistralApiKey = process.env.MISTRAL_API_KEY;
    #mistralModel = 'pixtral-12b-2409';
    #mistralUrl = 'https://api.mistral.ai/v1/chat/completions';

    constructor() {
        this.httpClient = new HttpClientService();
        this.limitQueueService = new RequestLimitQueueService();
    }

    generatePrompt(messages = []) {
        return messages.reduce((acc, {type, role, message}) => {
            let content;
            if (type === 'image') {
                content = {type: 'image_url', image_url: message};
            } else {
                content = {type: 'text', text: message};
            }

            const currentIndex = acc.findIndex((msg) => msg.role === role);

            if (currentIndex !== -1) {
                acc[currentIndex].content.push(content);
            } else {
                acc.push({role, content: [content]});
            }

            return acc;
        }, []);
    }

    async sendMessage(prompt) {
        try {
            const response = await this.limitQueueService.startTask(() => this.httpClient.post(
                this.#mistralUrl,
                {
                    model: this.#mistralModel,
                    max_tokens: this.#maxTokens,
                    response_format: {type: "text"},
                    messages: prompt
                },
                {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.#mistralApiKey}`
                }
            ));

            logger.info(response);

            if (!response || !response.choices || !response.choices.length) {
                throw new BadRequestError("Invalid response from Mistral API");
            }

            return response.choices[0].message.content;
        } catch (err) {
            logger.error('mistral error: ', err);
            throw err;
        }
    }
}

module.exports = new MistralService();
