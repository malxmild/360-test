import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaEdit, FaBan, FaHourglassHalf } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './UserHome.css';

export default function UserHome() {
  const [userInfo, setUserInfo] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [skipCandidateId, setSkipCandidateId] = useState(null);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [showConfirmEvaluate, setShowConfirmEvaluate] = useState(false);
  const [evaluateId, setEvaluateId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const questionIds = Array.from({ length: 20 }, (_, i) => i + 1);  
  const answers = questionIds.map(qid => ({
    question_id: qid,
    score: null,
    answer_text: 'n'
  }));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        id: decoded.userid,
        name: decoded.name,
        role: decoded.role
      });
    } catch (err) {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (!userInfo) return;
    fetch(`${process.env.REACT_APP_API_URL}/api/users/${userInfo.id}`)
      .then(res => res.json())
      .then(data => {
        const myMemberships = Array.isArray(data) ? data : [data];
        const roles = myMemberships.map(item => ({
          team: item.department,
          role: item.position
        }));
        setMemberships(roles);

        const saved = localStorage.getItem("selectedMembership");
        let selected = roles[0];
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (roles.some(r => r.team === parsed.team && r.role === parsed.role)) {
              selected = parsed;
            }
          } catch {}
        }
        setSelectedMembership(selected);
        localStorage.setItem("selectedMembership", JSON.stringify(selected));
      })
      .catch(err => console.error("Failed to load user memberships:", err));
  }, [userInfo]);

  useEffect(() => {
    if (!userInfo || !selectedMembership) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/users?department=${encodeURIComponent(selectedMembership.team)}`)
      .then(res => res.json())
      .then(async teamMembers => {
        const evalRes = await fetch(`${process.env.REACT_APP_API_URL}/api/evaluation_relations`);
        const evals = await evalRes.json();

        const evaluatees = teamMembers.map(user => {
          const evalData = evals.find(e =>
            e.evaluatee_id === user.userid && e.evaluator_id === userInfo.id
          );

          const isNotEvaluate = evalData?.feedback === "n";

          return {
            id: user.userid,
            name: user.name,
            role: user.position,
            status: isNotEvaluate ? "Completed" : (evalData?.status || "Incompleted"),
            feedbackSaved: evalData?.feedback || null,
          };
        });

        const selfId = userInfo.id;
        const selfEvalData = evals.find(e =>
          e.evaluatee_id === userInfo.id &&
          e.evaluator_id === userInfo.id &&
          e.team_name === selectedMembership.team &&
          e.relationship_role === selectedMembership.role
        );

        const selfEval = {
          id: userInfo.id,
          name: (
            <span>
              {userInfo.name} <span className="self-highlight">(Self)</span>
            </span>
          ),
          role: selectedMembership.role,
          status: selfEvalData?.status || "Incompleted",
          feedbackSaved: selfEvalData?.feedback || null,
        };

        const filtered = evaluatees.filter(u => {
          if (u.id === userInfo.id) return false;
          const r = selectedMembership.role;
          if (r === "Sponsor") return ["Member", "Co-Sponsor", "Main Sponsor", "Sponsor"].includes(u.role);
          if (r === "Co-Sponsor") return ["Member", "Sponsor", "Main Sponsor", "Co-Sponsor"].includes(u.role);
          if (r === "Member") return ["Member", "Sponsor", "Main Sponsor", "Co-Sponsor"].includes(u.role);
          if (r === "Main sponsor") return ["Co-Sponsor", "Member"].includes(u.role);
          return false;
        });

        setAllUsers([selfEval, ...filtered]);
      })
      .catch(console.error);
  }, [userInfo, selectedMembership]);

  useEffect(() => {
    if (location.state?.refresh) {
      window.location.reload();
    }
  }, [location]);

  const confirmEvaluate = () => {
    setShowConfirmEvaluate(false);

    fetch(`${process.env.REACT_APP_API_URL}/api/evaluation_relations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluatee_id: evaluateId,
        evaluator_id: userInfo.id,
        relationship_role: selectedMembership.role,
        team_name: selectedMembership.team,
        status: "In Progress",
        feedback: answers,
        answers: answers
      })
    })
      .then(() => navigate(`/evaluate/${evaluateId}`, {
        state: {
          evaluatorId: userInfo.id,
          team: selectedMembership.team,
          role: selectedMembership.role,
          evaluateeId: evaluateId
        }
      }))

      .catch(() => {
        alert("Error setting status to inprogress");
        navigate(`/evaluate/${evaluateId}`); // ยอมให้เข้าแม้ fail
      });
  };


  const confirmSkip = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/evaluation_relations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({




        
        evaluator_id: userInfo.id,
        evaluatee_id: skipCandidateId,
        relationship_role: selectedMembership.role,
        team_name: selectedMembership.team,
        status: "Completed",
        feedback: "n",
        answers: answers  // เพิ่มตรงนี้ให้ insert 'n' ลง answer ด้วย
      })
    })
      .then(() => window.location.reload())
      .catch(() => alert("Skip failed"));
  };

  const getStatusDisplay = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return "Completed";
    if (s === "in progress" || s === "inprogress") return "In Progress";
    return "Incomplete";
  };

  if (!userInfo || !selectedMembership) return <div>Loading data, please wait...</div>;

  return (
    <div className="user-home-container">
      <div className="header">
        <div className="header-left">Team: {selectedMembership.team}</div>
        <div className="header-right">
          <div className="name">{userInfo.name}</div>
          <div className="role-id">{selectedMembership.role} (ID: {userInfo.id})</div>
        </div>
      </div>

      <div className="membership-selector">
        <label>Select Membership:</label>
        <select
          className="role-select"
          value={JSON.stringify(selectedMembership)}
          onChange={(e) => {
            const newMembership = JSON.parse(e.target.value);
            setSelectedMembership(newMembership);
            localStorage.setItem("selectedMembership", JSON.stringify(newMembership));
          }}
        >
          {memberships.map((m, idx) => (
            <option key={idx} value={JSON.stringify(m)}>
              {m.team} - {m.role}
            </option>
          ))}
        </select>
      </div>

      <table className="evaluate-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Feedback</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map(e => (
            <tr key={e.id} className={e.id.startsWith("self-") ? "self-eval-row" : ""}>
              <td>{e.name}</td>
              <td>{e.role}</td>
              <td>
                {getStatusDisplay(e.status) === "Completed" && (
                  <span className="text-green-600 status-text">
                    <FaCheckCircle /> Completed
                  </span>
                )}
                {getStatusDisplay(e.status) === "In Progress" && (
                  <span className="text-orange-500 status-text">
                    <FaHourglassHalf /> In Progress
                  </span>
                )}
                {getStatusDisplay(e.status) === "Incomplete" && (
                  <span className="text-red-500 status-text">
                    <FaTimesCircle /> Incomplete
                  </span>
                )}
              </td>
              <td>
              {getStatusDisplay(e.status) === "Completed" && e.feedbackSaved === "n" ? (
                <span style={{ color: "gray" }}>Cannot Evaluate</span>
              ) : getStatusDisplay(e.status) === "Completed" ? (
                <button
                  className="action-button btn-edit"
                  onClick={() => navigate(`/evaluate/${e.id}`, {
                    state: {
                      evaluatorId: userInfo.id,
                      team: selectedMembership.team,
                      role: selectedMembership.role,
                      evaluateeId: e.id,
                      isEdit: true // ถ้ามี
                    }
                  })}
                >

                  <FaEdit /> Edit
                </button>
              ) : getStatusDisplay(e.status) === "In Progress" ? (
                <button
                  className="action-button btn-feedback"
                  onClick={() => navigate(`/evaluate/${e.id}`, {
                    state: {
                      evaluatorId: userInfo.id,
                      team: selectedMembership.team,
                      role: selectedMembership.role,
                      evaluateeId: e.id,
                      isEdit: true // ถ้ามี
                    }
                  })}
                >
                  <FaEdit /> Continue
                </button>
              ) : (
                <>
                  <button className="action-button btn-feedback" onClick={() => {
                    if (e.id.startsWith("self-")) {
                      localStorage.setItem("selfInfo", JSON.stringify({
                        userId: userInfo.id,
                        fullName: userInfo.name
                      }));
                    }
                    setEvaluateId(e.id);
                    setShowConfirmEvaluate(true);
                  }}>
                    <FaEdit /> Evaluate
                  </button>
                  {e.id !== userInfo.id && (
                    <button className="action-button btn-skip" onClick={() => {
                      setSkipCandidateId(e.id);
                      setShowConfirmSkip(true);
                    }}>
                      <FaBan /> Not Evaluate
                    </button>
                  )}

                </>
              )}
            </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="skip-explanation">* Not evaluate: ใช้ในกรณีที่ไม่สามารถประเมินผลการดำเนินงานได้</div>

      {showConfirmEvaluate && (
        <div className="confirm-evaluate-overlay">
          <div className="confirm-evaluate-modal">
            <p>เริ่มดำเนินการประเมินผล?</p>
            <div className="confirm-evaluate-buttons">
              <button className="btn-yes" onClick={confirmEvaluate}>Yes</button>
              <button className="btn-no" onClick={() => {
                setShowConfirmEvaluate(false);
                setEvaluateId(null);
              }}>No</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmSkip && (
        <div className="confirm-skip-overlay">
          <div className="confirm-skip-modal">
            <p>ไม่สามารถดำเนินการประเมินผลได้</p>
            <div className="confirm-skip-buttons">
              <button className="btn-yes" onClick={confirmSkip}>Yes</button>
              <button className="btn-no" onClick={() => {
                setShowConfirmSkip(false);
                setSkipCandidateId(null);
              }}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

