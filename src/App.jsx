import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentGradesPublic from "./pages/StudentGradesPublic";
import SectionsPage from "./pages/SectionsPage";
import SectionGrades from "./pages/SectionGrades";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
<link href="https://fonts.googleapis.com/css2?family=Tajawal&display=swap" rel="stylesheet" />

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* صفحة تسجيل الدخول */}
          <Route path="/" element={<Login />} />

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

          {/* لوحة تحكم الطالب (محمية) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* لوحة تحكم المعلم (محمية) */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* إعادة توجيه أي مسار غير معروف إلى صفحة المعلم */}
          <Route path="*" element={<Navigate to="/teacher" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
