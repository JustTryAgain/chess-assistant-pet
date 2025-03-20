const ChessService = require('../ChessService');

describe('ChessService', () => {
    let chessService;
    let mockModel;

    beforeEach(() => {
        mockModel = {
            generatePrompt: jest.fn(),
            sendMessage: jest.fn()
        };
        chessService = new ChessService(mockModel);
    });

    describe('getChessSuggestionByImg', () => {
        const mockImageBuffer = Buffer.from('test-image-data');
        const base64Image = mockImageBuffer.toString('base64');
        const mockImage = { buffer: mockImageBuffer };

        it('should format the image and call the model with correct prompt', async () => {
            const mockPlayer = 'white';
            const mockResponse = 'Pawn → d5';

            const expectedPrompt = [
                {
                    role: 'system',
                    type: 'text',
                    message:
                        'You are a chess assistant that analyzes chessboard images and suggests the best next move for Player.' +
                        ' Your response must always be **only one of the following strings**:\n\n1.' +
                        ' If the position is valid and there is a legal move, return the move in the format: \'Piece → Position\'.\n2.' +
                        ' If the image does not contain a recognizable chessboard, return exactly: \'Failed to recognize the chessboard\'.\n3.' +
                        ' If there are no legal moves because the game is over or the board is set up incorrectly, return exactly: \'There isn’t any move here\'.\n\n' +
                        'Do not return anything else—only one of these three outputs.'
                },
                {
                    role: 'user',
                    type: 'text',
                    message: `Suggest best move for ${mockPlayer}`
                },
                {
                    role: 'user',
                    type: 'image',
                    message: `data:image/jpeg;base64,${base64Image}`
                }
            ];

            mockModel.generatePrompt.mockReturnValue('formatted-prompt');
            mockModel.sendMessage.mockResolvedValue(mockResponse);

            const result = await chessService.getChessSuggestionByImg(mockImage, mockPlayer);

            expect(mockModel.generatePrompt).toHaveBeenCalledWith(expectedPrompt);
            expect(mockModel.sendMessage).toHaveBeenCalledWith('formatted-prompt');
            expect(result).toBe(mockResponse);
        });

        it('should propagate errors from the model', async () => {
            const mockPlayer = 'black';
            const mockError = new Error('Model error');

            mockModel.generatePrompt.mockReturnValue('formatted-prompt');
            mockModel.sendMessage.mockRejectedValue(mockError);

            await expect(chessService.getChessSuggestionByImg(mockImage, mockPlayer))
                .rejects.toThrow(mockError);

            expect(mockModel.generatePrompt).toHaveBeenCalled();
            expect(mockModel.sendMessage).toHaveBeenCalledWith('formatted-prompt');
        });
    });
});
