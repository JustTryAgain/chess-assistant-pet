const axios = require('axios');
const HttpClientService = require('../HttpClientService');
const { UnauthorizedError, AppError } = require('../../config/errors');
const delay = require('../../utils/delay');

jest.mock('axios');
jest.mock('../../utils/delay', () => jest.fn(() => Promise.resolve()));
jest.mock('../../config/logger', () => ({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn()
}));

describe('HttpClientService', () => {
    let httpClient;

    beforeEach(() => {
        jest.clearAllMocks();
        httpClient = new HttpClientService({
            maxRetries: 3,
            retryDelay: 100,
            timeout: 5000
        });
    });

    describe('request', () => {
        it('should make a successful request', async () => {
            const mockResponse = { data: { result: 'success' } };
            axios.mockResolvedValueOnce(mockResponse);

            const result = await httpClient.request('get', 'https://api.example.com', null, {});

            expect(axios).toHaveBeenCalledWith({
                method: 'get',
                url: 'https://api.example.com',
                data: null,
                headers: {},
                timeout: 5000
            });
            expect(result).toEqual(mockResponse.data);
        });

        it('should retry on retryable errors', async () => {
            const serverError = {
                response: { status: 500, data: { error: 'Server error' } }
            };

            const mockResponse = { data: { result: 'success' } };

            axios.mockRejectedValueOnce(serverError);
            axios.mockRejectedValueOnce(serverError);
            axios.mockResolvedValueOnce(mockResponse);

            const result = await httpClient.request('get', 'https://api.example.com');

            expect(axios).toHaveBeenCalledTimes(3);
            expect(delay).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockResponse.data);
        });

        it('should not retry on non-retryable errors', async () => {
            const clientError = {
                response: { status: 400, data: { error: 'Bad request' } }
            };

            axios.mockRejectedValueOnce(clientError);

            await expect(httpClient.request('get', 'https://api.example.com'))
                .rejects.toThrow(AppError);

            expect(axios).toHaveBeenCalledTimes(1);
            expect(delay).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedError on 401 status', async () => {
            const authError = {
                response: { status: 401, data: { error: 'Unauthorized' } }
            };

            axios.mockRejectedValueOnce(authError);

            await expect(httpClient.request('get', 'https://api.example.com'))
                .rejects.toThrow(UnauthorizedError);
        });

        it('should throw AppError on rate limit (429) status', async () => {
            const rateLimitError = {
                response: { status: 429, data: { error: 'Rate limit exceeded' } }
            };

            axios.mockRejectedValueOnce(rateLimitError);
            axios.mockRejectedValueOnce(rateLimitError);
            axios.mockRejectedValueOnce(rateLimitError);

            await expect(httpClient.request('get', 'https://api.example.com'))
                .rejects.toThrow(AppError);

            expect(axios).toHaveBeenCalledTimes(3);
        });

        it('should throw AppError on network errors', async () => {
            const networkError = {
                request: {},
                message: 'Network Error'
            };

            axios.mockRejectedValueOnce(networkError);
            axios.mockRejectedValueOnce(networkError);
            axios.mockRejectedValueOnce(networkError);

            await expect(httpClient.request('get', 'https://api.example.com'))
                .rejects.toThrow(AppError);

            expect(axios).toHaveBeenCalledTimes(3);
        });

        it('should throw AppError on configuration errors', async () => {
            const configError = new Error('Invalid URL');

            axios.mockRejectedValueOnce(configError);

            await expect(httpClient.request('get', 'https://api.example.com'))
                .rejects.toThrow(AppError);
        });
    });

    describe('helper methods', () => {
        it('should call request with correct parameters for post', async () => {
            const spy = jest.spyOn(httpClient, 'request').mockResolvedValue({ result: 'success' });

            await httpClient.post('https://api.example.com', { data: 'test' }, { header: 'value' });

            expect(spy).toHaveBeenCalledWith('post', 'https://api.example.com', { data: 'test' }, { header: 'value' });
        });

        it('should call request with correct parameters for get', async () => {
            const spy = jest.spyOn(httpClient, 'request').mockResolvedValue({ result: 'success' });

            await httpClient.get('https://api.example.com', { header: 'value' });

            expect(spy).toHaveBeenCalledWith('get', 'https://api.example.com', null, { header: 'value' });
        });

        it('should call request with correct parameters for put', async () => {
            const spy = jest.spyOn(httpClient, 'request').mockResolvedValue({ result: 'success' });

            await httpClient.put('https://api.example.com', { data: 'test' }, { header: 'value' });

            expect(spy).toHaveBeenCalledWith('put', 'https://api.example.com', { data: 'test' }, { header: 'value' });
        });

        it('should call request with correct parameters for delete', async () => {
            const spy = jest.spyOn(httpClient, 'request').mockResolvedValue({ result: 'success' });

            await httpClient.delete('https://api.example.com', { header: 'value' });

            expect(spy).toHaveBeenCalledWith('delete', 'https://api.example.com', null, { header: 'value' });
        });
    });

    describe('isRetryableError', () => {
        it('should return true for network errors', () => {
            const networkError = { request: {}, message: 'Network Error' };
            expect(httpClient.isRetryableError(networkError)).toBe(true);
        });

        it('should return true for 500 errors', () => {
            const serverError = { response: { status: 500 } };
            expect(httpClient.isRetryableError(serverError)).toBe(true);
        });

        it('should return true for 429 errors', () => {
            const rateLimitError = { response: { status: 429 } };
            expect(httpClient.isRetryableError(rateLimitError)).toBe(true);
        });

        it('should return false for 400 errors', () => {
            const clientError = { response: { status: 400 } };
            expect(httpClient.isRetryableError(clientError)).toBe(false);
        });
    });

    describe('getBackoffDelay', () => {
        it('should calculate exponential backoff with jitter', () => {
            jest.spyOn(Math, 'random').mockReturnValue(0.5);

            const result = httpClient.getBackoffDelay(100, 2);
            // This is how it should calc - Base delay: 100 * 2^2 = 400, Jitter: 0.5 * 100 = 50, Total: 450
            expect(result).toBe(450);
        });
    });
});