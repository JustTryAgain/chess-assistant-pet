const ChessService = require('../services/ChessService');
const MistralService = require('../services/MistralService');
const {AppError} = require('../config/errors');

const chessAssistantController = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Invalid file. Please upload an image not exceeding 2MB." });
        }
        const playerSide = req.body.playerSide;

        if (!playerSide) {
            return res.status(400).json({error: "Select playerSide property."});
        }

        const chessAssistant = new ChessService(MistralService);
        const result = await chessAssistant.getChessSuggestionByImg(req.file, playerSide);

        return res.status(200).json({ suggestion: result });
    } catch (error) {
        return next(error);
    }
}

module.exports = chessAssistantController;