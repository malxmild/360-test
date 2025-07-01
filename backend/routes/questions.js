const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET /api/questions?form_id=1
router.get('/', async (req, res) => {
  const formId = req.query.form_id;

  try {
    const result = await pool.query(
      `SELECT * FROM questions WHERE form_id = $1 ORDER BY order_no`,
      [formId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

module.exports = router;
