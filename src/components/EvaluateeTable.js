// components/EvaluateeTable.js
import React from "react";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEdit, FaBan } from "react-icons/fa";
import "./EvaluateeTable.css"; // อย่าลืมสร้าง CSS ด้วย (หรือใช้ของเดิม)

export default function EvaluateeTable({
  evaluatees,
  showFeedbackColumn = true,
  onEvaluate,
  onSkip,
  onContinue
}) {
  return (
    <table className="evaluate-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Status</th>
          {showFeedbackColumn && <th>Feedback</th>}
        </tr>
      </thead>
      <tbody>
        {evaluatees.map(e => (
          <tr key={e.id} className={e.id.startsWith("self-") ? "self-eval-row" : ""}>
            <td>
              {e.name}
              {e.id.startsWith("self-") && <span className="self-label"> (Self)</span>}
            </td>
            <td>{e.role}</td>
            <td className={
              e.status === "completed" ? "status-completed" :
              e.status === "inprogress" ? "status-inprogress" : "status-incompleted"
            }>
              {e.status === "completed" ? (
                <><FaCheckCircle className="icon-complete" /> Completed</>
              ) : e.status === "inprogress" ? (
                <><FaHourglassHalf className="icon-inprogress" /> In Progress</>
              ) : (
                <><FaTimesCircle className="icon-incomplete" /> Incompleted</>
              )}
            </td>
            {showFeedbackColumn && (
              <td>
                {e.status === "completed" ? (
                  e.feedbackSaved ? (
                    <button className="action-button btn-edit" onClick={() => onContinue(e.id)}>
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <span className="cannot-evaluate-text">Cannot Evaluate</span>
                  )
                ) : e.status === "inprogress" ? (
                  <button className="action-button btn-feedback" onClick={() => onContinue(e.id)}>
                    <FaEdit /> Continue
                  </button>
                ) : (
                  <>
                    <button className="action-button btn-feedback" onClick={() => onEvaluate(e.id)}>
                      <FaEdit /> Evaluate
                    </button>
                    {!e.id.startsWith("self-") && (
                      <button className="action-button btn-skip" onClick={() => onSkip(e.id)}>
                        <FaBan /> Not Evaluate
                      </button>
                    )}
                  </>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
