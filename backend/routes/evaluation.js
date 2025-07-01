const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { submitEvaluation } = require('../controllers/evaluationController');

//การส่งแบบประเมิน
router.post('/submit', authenticate, submitEvaluation);

module.exports = router;
