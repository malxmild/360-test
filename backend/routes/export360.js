const express = require('express');
const router = express.Router();
const pool = require('../models/db');

router.get('/', async (req, res) => {
  const { team } = req.query;
  try {
    // 1. Query การประเมินทั้งหมด
    const evalResult = await pool.query(`
      SELECT
        er.id AS relation_id,
        ue.name AS evaluator_name,
        ue.userid AS evaluator_id,
        ue.position AS evaluator_role,
        er.team_name AS team,
        ui.name AS evaluatee_name,
        ui.userid AS evaluatee_id,
        ui.position AS evaluatee_role,
        er.relationship_role AS relationship,
        er.status AS status,
        er.updated_at AS update_at,
        er.feedback
      FROM evaluation_relations er
      LEFT JOIN users ue ON er.evaluator_id = ue.userid
      LEFT JOIN users ui ON er.evaluatee_id = ui.userid
      ${team ? "WHERE er.team_name = $1" : ""}
    `, team ? [team] : []);
    const evaluations = evalResult.rows;

    // 2. Query answers ทั้งหมดในชุดเดียว
    const allRelationIds = evaluations.map(e => e.relation_id);
    let answersMap = {};
    if (allRelationIds.length > 0) {
      const ansResult = await pool.query(
        `SELECT evaluation_relation_id, question_id, score, answer_text
         FROM answers
         WHERE evaluation_relation_id = ANY($1)`,
        [allRelationIds]
      );
      for (const ans of ansResult.rows) {
        if (!answersMap[ans.evaluation_relation_id]) answersMap[ans.evaluation_relation_id] = {};
        answersMap[ans.evaluation_relation_id][ans.question_id] = ans;
      }
    }

    // 3. สร้าง row export ตามคอลัมน์ใน template
    const exportRows = evaluations.map(ev => {
      let scores = [];
      let row = {
        "ชื่อผู้ประเมิน": ev.evaluator_name,
        "รหัสพนักงานผู้ประเมิน": ev.evaluator_id,
        "ตำแหน่งผู้ประเมิน": ev.evaluator_role,
        "ชื่อทีม": ev.team,
        "ชื่อผู้ถูกประเมิน": ev.evaluatee_name,
        "รหัสพนักงานผู้ถูกประเมิน": ev.evaluatee_id,
        "ตำแหน่งผู้ถูกประเมิน": ev.evaluatee_role,
        "ความสัมพันธ์": ev.relationship,
      };

      // คะแนนข้อ 1-15 (หรือเท่าที่แบบฟอร์มมี)
      for (let i = 1; i <= 15; i++) {
        const ans = answersMap[ev.relation_id]?.[i] || {};
        row[`คะแนนข้อ ${i}`] = ans.score != null ? ans.score : "";
        if (ans.score != null && typeof ans.score === "number") {
          scores.push(ans.score);
        }
      }

      // คอมเมนต์/ข้อเสนอแนะ
      // สมมุติว่าข้อ strengths = ข้อ 16, development = ข้อ 17
      row["ความคิดเห็นจุดแข็ง"] = (answersMap[ev.relation_id]?.[16]?.answer_text) || "";
      row["ข้อเสนอแนะเพื่อการพัฒนา"] = (answersMap[ev.relation_id]?.[17]?.answer_text) || "";

      // Avg/Max/Min
      row["คะแนนเฉลี่ย"] = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "";
      row["คะแนนสูงสุด"] = scores.length > 0 ? Math.max(...scores) : "";
      row["คะแนนต่ำสุด"] = scores.length > 0 ? Math.min(...scores) : "";

      row["สถานะ"] = ev.status || "";
      row["วันเวลาส่งแบบประเมิน"] = ev.update_at ? new Date(ev.update_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "";

      return row;
    });

    res.json(exportRows);

  } catch (err) {
    console.error('Export360 error:', err);
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
});

module.exports = router;
