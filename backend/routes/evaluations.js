const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// ✅ GET /api/evaluations → ดึงข้อมูลการประเมินทั้งหมด
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM evaluation_relations');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching evaluation_relations', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ✅ POST /api/evaluations → เพิ่มหรืออัปเดตการประเมิน
router.post('/', async (req, res) => {
  const { evaluatorId, evaluateeId, status } = req.body; // ❌ ตัด feedback ออก

  try {
    // check if already exists
    const exists = await pool.query(
      'SELECT * FROM evaluation_relations WHERE evaluator_id = $1 AND evaluatee_id = $2',
      [evaluatorId, evaluateeId]
    );

    if (exists.rows.length > 0) {
      // update
      await pool.query(
        'UPDATE evaluation_relations SET status = $1, updated_at = NOW() WHERE evaluator_id = $2 AND evaluatee_id = $3',
        [status, evaluatorId, evaluateeId]
      );
    } else {
      // insert
      await pool.query(
        'INSERT INTO evaluation_relations (evaluator_id, evaluatee_id, status, updated_at) VALUES ($1, $2, $3, NOW())',
        [evaluatorId, evaluateeId, status]
      );
    }

    res.json({ message: 'Evaluation saved' });
  } catch (err) {
    console.error('Error saving evaluation relation:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
