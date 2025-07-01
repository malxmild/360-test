import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserHome from "./pages/UserHome";
import EvaluationForm from "./pages/EvaluationForm";
import AdminHome from "./pages/AdminHome";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/Login";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />                    
        <Route path="/userhome" element={<UserHome />} />
        <Route path="/evaluate/:id" element={<EvaluationForm />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin-dashboard/:evaluatorId" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}