const express = require('express');
const { generateTrip, getTripHistory } = require('../controllers/tripController');
const { generateAdvisory } = require('../controllers/advisoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', authMiddleware, generateTrip);
router.get('/history', authMiddleware, getTripHistory);
router.post('/advisory', authMiddleware, generateAdvisory);

module.exports = router;
