const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../app');

jest.mock('../../config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
}));

jest.mock('../../services/MistralService', () => ({
    generatePrompt: jest.fn().mockReturnValue([]),
    sendMessage: jest.fn().mockResolvedValue('Pawn → e4')
}));

const getTestImage = () => {
    const testImagePath = path.join(__dirname, './test.png');
    if (!fs.existsSync(testImagePath)) {
        const buffer = Buffer.alloc(100 * 100 * 3);
        fs.writeFileSync(testImagePath, buffer);
    }
    return fs.readFileSync(testImagePath);
};

describe('POST /api/chess-assistant', () => {
    let testImage;

    beforeAll(() => {
        testImage = getTestImage();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll((done) => {
        done();
    });

    it('should return 400 when no file is uploaded', async () => {
        const response = await request(app)
            .post('/api/chess-assistant')
            .field('playerSide', 'white');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when no playerSide is provided', async () => {
        const response = await request(app)
            .post('/api/chess-assistant')
            .attach('chessboard', testImage, 'test.png');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Select playerSide property');
    });

    it('should return 400 when file is too large', async () => {
        const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB file

        const response = await request(app)
            .post('/api/chess-assistant')
            .attach('chessboard', largeBuffer, 'large.jpg')
            .field('playerSide', 'black');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('File is too large. Maximum size is 2MB');
    });

    it('should return 400 when file is not an image', async () => {
        const textBuffer = Buffer.from('This is not an image');

        const response = await request(app)
            .post('/api/chess-assistant')
            .attach('chessboard', textBuffer, 'not-an-image.txt')
            .field('playerSide', 'black');

        expect(response.status).not.toBe(200);
    });

    it('should return 200 with a chess suggestion when request is valid', async () => {
        const response = await request(app)
            .post('/api/chess-assistant')
            .attach('chessboard', testImage, 'test.png')
            .field('playerSide', 'white');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('suggestion');
    });
});