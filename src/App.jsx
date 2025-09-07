import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentGradesPublic from "./pages/StudentGradesPublic";
import SectionsPage from "./pages/SectionsPage";
import SectionGrades from "./pages/SectionGrades";
import StudentList from "./pages/StudentList";
import StudentView from "./pages/StudentView";
import ConnectedUsersPage from "./pages/ConnectedUsersPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabase } from "./supabaseClient"; 
import Portfolio from "./pages/Portfolio";
import PortfolioPublic from "./pages/PortfolioPublic";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* المسارات العامة التي لا تتطلب تسجيل الدخول */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/student-grades/:id" element={<StudentGradesPublic />} />
            <Route 
              path="/grades/:gradeId/sections/:sectionId/students/:studentId" 
              element={<StudentView />} 
            />
            <Route path="/portfolio/:userId" element={<PortfolioPublic />} />

            {/* المسارات المحمية التي تتطلب تسجيل الدخول */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/:gradeId"
              element={
                <ProtectedRoute>
                  <SectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/:gradeId/sections/:sectionId"
              element={
                <ProtectedRoute>
                  <SectionGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/:gradeId/sections/:sectionId/students"
              element={
                <ProtectedRoute>
                  <StudentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/:gradeId/sections/:sectionId/connected-users"
              element={
                <ProtectedRoute>
                  <ConnectedUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />

            {/* إعادة توجيه أي مسار غير معروف إلى صفحة تسجيل الدخول */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}
