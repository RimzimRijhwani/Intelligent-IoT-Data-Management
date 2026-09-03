const express = require('express');
const router = express.Router();

const {
  getAllDatasets,
  getDatasetById,
  createDataset,
} = require('../controllers/datasetsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/datasets
router.get('/datasets', getAllDatasets);

// GET /api/datasets/:id
router.get('/datasets/:id', getDatasetById);

// POST /api/datasets
router.post('/datasets', authMiddleware, createDataset);

module.exports = router;
