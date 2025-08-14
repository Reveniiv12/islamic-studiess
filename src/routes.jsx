// src/routes.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TeacherDashboard from "./pages/TeacherDashboard";
import EditGradesByCategory from "./pages/EditGradesByCategory";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/edit/:grade/:classNumber/:category" element={<EditGradesByCategory />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
