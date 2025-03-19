// Main goal of this service is scalability and fast change on others models in future
class ChessService {
    constructor(model) {
        this.model = model;
    }

    async getChessSuggestionByImg(image, player) {
        const base64Image = image.buffer.toString('base64');
        // always the same format here [{role, type, message}]
        // types - "text", "image", "file", "url"
        const prompt = this.model.generatePrompt([
            {
                role: 'system',
                type: 'text',
                message: 'You are a chess assistant that analyzes chessboard images and suggests the best next move for Player.' +
                    ' Your response must always be **only one of the following strings**:\n\n1.' +
                    ' If the position is valid and there is a legal move, return the move in the format: \'Piece → Position\'.\n2.' +
                    ' If the image does not contain a recognizable chessboard, return exactly: \'Failed to recognize the chessboard\'.\n3.' +
                    ' If there are no legal moves because the game is over or the board is set up incorrectly, return exactly: \'There isn’t any move here\'.\n\n' +
                    'Do not return anything else—only one of these three outputs.'
            },
            {
                role: 'user',
                type: 'text',
                message: `Suggest best move for ${player}`
            },
            {
                role: 'user',
                type: 'image',
                message: `data:image/jpeg;base64,${base64Image}`
            }
        ]);

        return await this.model.sendMessage(prompt);
    }
}

module.exports = ChessService;