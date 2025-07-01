const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// ✅ ฟังก์ชัน Normalize Status ให้ตรงตาม Constraint ของ DB
const normalizeStatus = (inputStatus) => {
  if (!inputStatus) return 'Not Started';
  const lower = inputStatus.toLowerCase();
  if (lower === 'not started' || lower === 'incomplete' || lower === 'incompleted') return 'Not Started';
  if (lower === 'inprogress' || lower === 'in progress') return 'In Progress';
  if (lower === 'complete' || lower === 'completed') return 'Completed';
  return inputStatus;
};

router.put('/', async (req, res) => {
  const {
    evaluator_id,
    evaluatee_id,
    relationship_role,
    status,
    feedback,
    team_name,
    answers
  } = req.body;

  const statusNormalized = normalizeStatus(status);

  try {
    const existing = await pool.query(
      `SELECT id FROM evaluation_relations 
      WHERE evaluator_id = $1 AND evaluatee_id = $2 AND team_name = $3 AND relationship_role = $4`,
      [evaluator_id, evaluatee_id, team_name, relationship_role]
    );


    let relationId;
    if (existing.rows.length > 0) {
      relationId = existing.rows[0].id;

      const currentStatusRes = await pool.query(
        'SELECT status FROM evaluation_relations WHERE id = $1',
        [relationId]
      );
      const currentStatus = currentStatusRes.rows[0]?.status;

      // ถ้าเดิมคือ Completed → ห้ามลดระดับลง
      let finalStatusToUpdate = statusNormalized;
      if (currentStatus === 'Completed' && statusNormalized !== 'Completed') {
        finalStatusToUpdate = 'Completed';
        console.log("⚠️ Status downgrade prevented: keeping 'Completed'");
      }

      await pool.query(
        `UPDATE evaluation_relations 
        SET status = $1, feedback = $2, updated_at = NOW()
        WHERE id = $3`,
        [
          finalStatusToUpdate,
          typeof feedback === "object" || feedback === null ? JSON.stringify(feedback || {}) : feedback,
          relationId
        ]
      );
    } else {
      const insertRes = await pool.query(
        `INSERT INTO evaluation_relations 
         (evaluator_id, evaluatee_id, relationship_role, status, feedback, updated_at, team_name)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id`,
        [
          evaluator_id,
          evaluatee_id,
          relationship_role,
          statusNormalized,
          typeof feedback === "object" ? JSON.stringify(feedback) : feedback,
          team_name
        ]
      );
      relationId = insertRes.rows[0].id;
    }

    // ✅ เพิ่ม/อัปเดตคำตอบ
    if (answers && Array.isArray(answers)) {
      await pool.query('DELETE FROM answers WHERE evaluation_relation_id = $1', [relationId]);

      const values = [];
      const params = [];
      let paramIndex = 1;

      answers.forEach(a => {
        values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        params.push(
          relationId,
          a.question_id,
          a.score !== null ? a.score : null,
          a.answer_text !== null && a.answer_text !== undefined ? a.answer_text : 'n'
        );
      });

      const query = `
        INSERT INTO answers (evaluation_relation_id, question_id, score, answer_text)
        VALUES ${values.join(', ')}
      `;

      await pool.query(query, params);
    }


    res.json({ message: 'Evaluation relation saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
