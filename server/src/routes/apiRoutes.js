const {Router} = require('express');
const chessAssistantController = require("../controllers/chessAssistantController.js");
const handleMulterUpload = require('../middleware/handleFileUpload');

const router = Router();

router.post('/chess-assistant', handleMulterUpload, chessAssistantController);

module.exports = router;