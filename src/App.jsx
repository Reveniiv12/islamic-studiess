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
import StudentGrades from "./pages/StudentGrades";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { auth } from "./firebase";
import Portfolio from "./pages/Portfolio";
import PortfolioPublic from "./pages/PortfolioPublic";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* الصفحة الرئيسية الجديدة - لوحة تحكم المعلم */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* صفحة تسجيل الدخول */}
            <Route path="/login" element={<Login />} />

            {/* صفحة إنشاء حساب جديد */}
            <Route path="/register" element={<Register />} />

            {/* عرض درجات الطالب بدون تسجيل دخول */}
            <Route path="/student/:studentId" element={<StudentGradesPublic />} />

            {/* عرض قائمة الفصول الخاصة بدرجة معينة */}
            <Route
              path="/grades/:gradeId"
              element={
                <ProtectedRoute>
                  <SectionsPage />
                </ProtectedRoute>
              }
            />

            {/* عرض درجات فصل معين */}
            <Route
              path="/grades/:gradeId/sections/:sectionId"
              element={
                <ProtectedRoute>
                  <SectionGrades />
                </ProtectedRoute>
              }
            />

            {/* لوحة تحكم الطالب */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* عرض قائمة الطلاب لفصل معين (المسار الجديد مع gradeId + classId) */}
            <Route
              path="/class/:gradeId/:classId"
              element={
                <ProtectedRoute>
                  <StudentList />
                </ProtectedRoute>
              }
            />

            {/* عرض درجات طالب معين */}
            <Route
              path="/student-grades/:studentId"
              element={
                <ProtectedRoute>
                  <StudentGrades />
                </ProtectedRoute>
              }
            />

            {/* مسار ملف الإنجاز المحمي */}
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              }
            />

            {/* مسار ملف الإنجاز العام (بدون حماية) */}
            <Route path="/portfolio/:userId" element={<PortfolioPublic />} />

            {/* إعادة توجيه أي مسار غير معروف إلى لوحة تحكم المعلم */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}