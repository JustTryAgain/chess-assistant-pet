const request = require('supertest');
const app = require('../app');

jest.mock('../config/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
}));

jest.mock('../services/MistralService', () => ({
    generatePrompt: jest.fn().mockReturnValue([]),
    sendMessage: jest.fn().mockResolvedValue('Pawn → e4')
}));

describe('Server Integration Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll((done) => {
       done();
    });

    describe('Route Not Found', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app).get('/unknown-route');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({error: 'Not Found 4 0 4 SOS'});
        });
    });

    describe('CORS Configuration', () => {
        it('should reject requests from unauthorized origins', async () => {
            const response = await request(app)
                .post('/api/chess-assistant')
                .set('Origin', 'http://unauthorized-origin.com')
                .attach('chessboard', Buffer.alloc(1024), 'test.png')
                .field('playerSide', 'white');
            expect(response.headers['access-control-allow-origin']).not.toBe('http://unauthorized-origin.com');
        });
    });
});