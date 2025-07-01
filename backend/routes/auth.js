const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// เส้นทางสำหรับ POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
