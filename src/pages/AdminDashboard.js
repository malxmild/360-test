import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const location = useLocation();
  const initialTeam = location.state?.team;
  const { evaluatorId } = useParams();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [evaluator, setEvaluator] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [allEvaluations, setAllEvaluations] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/users`)
      .then((res) => res.json())
      .then((data) => {
        setAllUsers(data);
        const foundEvaluator = data.find((user) => user.userid === evaluatorId);
        setEvaluator(foundEvaluator);

        if (!selectedTeam) {
          if (initialTeam) {
            setSelectedTeam(initialTeam);
            sessionStorage.setItem("selectedTeam", initialTeam);
          } else if (foundEvaluator) {
            setSelectedTeam(foundEvaluator.department);
            sessionStorage.setItem("selectedTeam", foundEvaluator.department);
          }
        }
      });
  }, [evaluatorId, initialTeam, selectedTeam]);

  useEffect(() => {
    const fetchEvaluations = () => {
      fetch(`${process.env.REACT_APP_API_URL}/api/evaluation_relations`)
        .then((res) => res.json())
        .then((data) => setAllEvaluations(data))
        .catch((err) => console.error("Error fetching evaluations:", err));
    };
    fetchEvaluations();
    const intervalId = setInterval(fetchEvaluations, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const evaluateesWithStatus = useMemo(() => {
    if (!allUsers.length || !allEvaluations.length || !selectedTeam) return [];

    const teamMembers = allUsers.filter(
      (u) => u.department === selectedTeam
    );

    const myEvals = allEvaluations.filter(
      (e) => e.evaluator_id === evaluatorId && e.team_name === selectedTeam
    );

    const membersWithStatus = teamMembers.map((member) => {
      const entry = myEvals.find((e) => e.evaluatee_id === member.userid);
      let status = "incompleted";
      if (entry?.status === "Completed") status = "completed";
      else if (entry?.status === "In Progress") status = "inprogress";
      return {
        ID: member.userid,
        name: member.name,
        Role: member.position,
        status,
        isSelf: member.userid === evaluatorId,
      };
    });

    const hasSelf = membersWithStatus.some((m) => m.isSelf);
      if (!hasSelf && evaluator) {
        const selfEval = myEvals.find((e) => e.evaluatee_id === evaluatorId);
        let status = "incompleted";
        if (selfEval?.status === "Completed") status = "completed";
        else if (selfEval?.status === "In Progress") status = "inprogress";

        membersWithStatus.unshift({
          ID: evaluator.userid,
          name: evaluator.name,
          Role: evaluator.position,
          status,
          isSelf: true,
        });
      }

    return membersWithStatus;
  }, [allUsers, allEvaluations, evaluatorId, selectedTeam]);

  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    sessionStorage.setItem("selectedTeam", team);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="left">
          <h2>{evaluator?.name}</h2>
          <div>Role: {evaluator?.position}</div>
          <div>ID: {evaluator?.userid}</div>
        </div>
        <div className="right">
          <label>Select Team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
          >
            {[...new Set(allUsers.filter((u) => u.userid === evaluatorId).map((u) => u.department))].map(
              (team, idx) => (
                <option key={idx} value={team}>
                  {team}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <table className="evaluatee-status-table">
        <thead>
          <tr>
            <th>Evaluatee ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {evaluateesWithStatus.map((e) => (
            <tr key={e.ID} className={e.isSelf ? "self-eval-row" : ""}>
              <td>{e.ID}</td>
              <td>
                {e.name} {e.isSelf && <span className="self-label">(Self)</span>}
              </td>
              <td>{e.Role}</td>
              <td>
                {e.status === "completed" ? (
                  <span className="status completed">
                    <FaCheckCircle color="green" /> Completed
                  </span>
                ) : e.status === "inprogress" ? (
                  <span className="status inprogress">
                    <FaHourglassHalf color="orange" /> In Progress
                  </span>
                ) : (
                  <span className="status incompleted">
                    <FaTimesCircle color="red" /> Incomplete
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
};

export default AdminDashboard;
