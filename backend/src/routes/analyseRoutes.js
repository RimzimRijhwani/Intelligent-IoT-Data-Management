const express = require('express');
const router = express.Router();

const { analyse } = require('../controllers/analyseController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/analyse
router.post('/analyse', authMiddleware, analyse);

module.exports = router;
