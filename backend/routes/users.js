const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// Route: GET /api/users?role=...&department=...
router.get('/', async (req, res) => {
  const { role, department } = req.query;

  try {
    let query = 'SELECT userid, name, position, department FROM users';
    let params = [];
    let conditions = [];

    if (role) {
      conditions.push(`position = $${params.length + 1}`);
      params.push(role);
    }

    if (department) {
      conditions.push(`department ILIKE $${params.length + 1}`);
      params.push(department);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Route: GET /api/users/:userid
router.get('/:userid', async (req, res) => {
  const { userid } = req.params;
  try {
    const result = await pool.query(
      'SELECT userid, name, position, department FROM users WHERE userid = $1',
      [userid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

