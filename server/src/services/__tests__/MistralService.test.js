const HttpClientService = require('../HttpClientService');
const RequestLimitQueueService = require('../RequestLimitQueueService');

jest.mock('./../HttpClientService');
jest.mock('./../RequestLimitQueueService');
jest.mock('../../config/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
}));

const originalEnv = process.env;

describe('MistralService', () => {
    let mistralService;
    const dummyApiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        // Set env variable for api key
        process.env.MISTRAL_API_KEY = dummyApiKey;

        // Clear all instances and calls to constructor and all methods:
        HttpClientService.mockClear();
        RequestLimitQueueService.mockClear();

        // Create stubs for the instance methods
        const postMock = jest.fn();
        HttpClientService.mockImplementation(() => {
            return {
                post: postMock,
            };
        });

        const startTaskMock = jest.fn();
        RequestLimitQueueService.mockImplementation(() => {
            return {
                startTask: startTaskMock,
            };
        });

        // Because our module exports an instance, we reset modules to get a fresh instance each time.
        jest.resetModules();
        mistralService = require('../MistralService');

        // Override the httpClient and limitQueueService with our mocks for clarity.
        mistralService.httpClient = new HttpClientService();
        mistralService.limitQueueService = new RequestLimitQueueService();

        // Attach our mocks to variables for easier access in tests
        mistralService.httpClient.post = postMock;
        mistralService.limitQueueService.startTask = startTaskMock;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('generatePrompt', () => {
        it('should format text messages correctly', () => {
            const messages = [
                {role: 'system', type: 'text', message: 'You are a helpful assistant'},
                {role: 'user', type: 'text', message: 'Hello'}
            ];

            const result = mistralService.generatePrompt(messages);

            expect(result).toEqual([
                {
                    role: 'system',
                    content: [{type: 'text', text: 'You are a helpful assistant'}]
                },
                {
                    role: 'user',
                    content: [{type: 'text', text: 'Hello'}]
                }
            ]);
        });

        it('should format type image messages correctly', () => {
            const messages = [
                {role: 'user', type: 'text', message: 'What is in this image?'},
                {role: 'user', type: 'image', message: 'data:image/jpeg;base64,abc123'}
            ];

            const result = mistralService.generatePrompt(messages);

            expect(result).toEqual([
                {
                    role: 'user',
                    content: [
                        {type: 'text', text: 'What is in this image?'},
                        {type: 'image_url', image_url: 'data:image/jpeg;base64,abc123'}
                    ]
                }
            ]);
        });

        it('should combine multiple messages with the same role', () => {
            const messages = [
                {role: 'user', type: 'text', message: 'Hello'},
                {role: 'user', type: 'text', message: 'How are you?'}
            ];

            const result = mistralService.generatePrompt(messages);

            expect(result).toEqual([
                {
                    role: 'user',
                    content: [
                        {type: 'text', text: 'Hello'},
                        {type: 'text', text: 'How are you?'}
                    ]
                }
            ]);
        });

        it('should handle mixed message types correctly', () => {
            const messages = [
                {role: 'system', type: 'text', message: 'You are a helpful assistant'},
                {role: 'user', type: 'text', message: 'What is in this image?'},
                {role: 'user', type: 'image', message: 'data:image/jpeg;base64,abc123'},
                {role: 'assistant', type: 'text', message: 'I see a cat.'},
                {role: 'user', type: 'text', message: 'What color is it?'}
            ];

            const result = mistralService.generatePrompt(messages);

            expect(result).toEqual([
                {
                    role: 'system',
                    content: [
                        {type: 'text', text: 'You are a helpful assistant'}
                    ]
                },
                {
                    role: 'user',
                    content: [
                        {type: 'text', text: 'What is in this image?'},
                        {type: 'image_url', image_url: 'data:image/jpeg;base64,abc123'},
                        {type: 'text', text: 'What color is it?'}
                    ]
                },
                {
                    role: 'assistant',
                    content: [
                        {type: 'text', text: 'I see a cat.'}
                    ]
                }
            ]);
        });
    });

    describe('sendMessage', () => {
        const samplePrompt = [{role: 'user', content: [{type: 'text', text: 'Hello'}]}];

        it('should return content from a valid response', async () => {
            const validResponse = {
                choices: [
                    {
                        message: {
                            content: 'Response content from Mistral'
                        }
                    }
                ]
            };

            mistralService.limitQueueService.startTask.mockImplementation(async (fn) => {
                return await fn();
            });

            mistralService.httpClient.post.mockResolvedValue(validResponse);

            const result = await mistralService.sendMessage(samplePrompt);

            expect(mistralService.httpClient.post).toHaveBeenCalledWith(
                'https://api.mistral.ai/v1/chat/completions',
                {
                    model: 'pixtral-12b-2409',
                    max_tokens: 300,
                    response_format: {type: "text"},
                    messages: samplePrompt,
                },
                {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dummyApiKey}`,
                }
            );

            expect(result).toBe('Response content from Mistral');
        });

        it('should rethrow error when httpClient.post throws', async () => {
            const error = new Error('Network error');

            mistralService.limitQueueService.startTask.mockImplementation(async (fn) => {
                return await fn();
            });
            mistralService.httpClient.post.mockRejectedValue(error);

            await expect(mistralService.sendMessage(samplePrompt))
                .rejects.toThrow(error);
        });
    });
});