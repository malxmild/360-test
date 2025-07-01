const pool = require('../models/db');

const submitEvaluation = async (req, res) => {
  try {
    const { evaluation_relation_id, answers, comments } = req.body;

    if (!evaluation_relation_id || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // บันทึกคะแนนแต่ละคำถาม
    const insertQuery = `
      INSERT INTO answers (evaluation_relation_id, question_id, score, answer_text)
      VALUES ($1, $2, $3, $4)
    `;

    for (const answer of answers) {
      const { question_id, score, answer_text } = answer;

      await pool.query(insertQuery, [
        evaluation_relation_id,
        question_id,
        score || null,
        answer_text || null,
      ]);
    }

    // ถ้ามี comment (optional)
    if (comments) {
      const insertCommentQuery = `
        UPDATE evaluation_relations
        SET
          comment_contribution = $1,
          comment_innovation = $2,
          comment_teamwork = $3,
          comment_strengths = $4,
          comment_development = $5
        WHERE id = $6
      `;

      await pool.query(insertCommentQuery, [
        comments.contribution || null,
        comments.innovation || null,
        comments.teamwork || null,
        comments.strengths || null,
        comments.development_areas || null,
        evaluation_relation_id,
      ]);
    }

    // ตั้งสถานะเป็น complete
    await pool.query(
      `UPDATE evaluation_relations SET status = 'complete' WHERE id = $1`,
      [evaluation_relation_id]
    );

    res.status(200).json({ message: 'Evaluation submitted successfully.' });
  } catch (error) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitEvaluation,
};
