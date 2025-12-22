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
import StudentView from "./pages/StudentView";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { supabase } from "./supabaseClient"; 
import Portfolio from "./pages/Portfolio";
import PortfolioPublic from "./pages/PortfolioPublic";
import ReportGenerator from "./pages/ReportGenerator";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* الصفحة الرئيسية الجديدة - لوحة تحكم المعلم (مسار محمي) */}
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

            {/* صفحة درجات الطالب العامة (بدون حماية) */}
            <Route path="/student-grades/:id" element={<StudentGradesPublic />} />

            {/* مسار الصفوف (مسار محمي) */}
            <Route
              path="/grades/:gradeId"
              element={
                <ProtectedRoute>
                  <SectionsPage />
                </ProtectedRoute>
              }
            />
            
            {/* مسار صفحة درجات الفصل (مسار محمي) */}
            <Route
              path="/grades/:gradeId/sections/:sectionId"
              element={
                <ProtectedRoute>
                  <SectionGrades />
                </ProtectedRoute>
              }
            />

            {/* لوحة تحكم الطالب (مسار محمي) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* عرض قائمة الطلاب لفصل معين (مسار محمي) */}
            <Route
              path="/grades/:gradeId/sections/:sectionId/students"
              element={
                <ProtectedRoute>
                  <StudentList />
                </ProtectedRoute>
              }
            />

            {/* عرض درجات طالب معين (مسار عام لروابط الـ QR) - تم إزالة ProtectedRoute منه */}
            <Route
              path="/grades/:gradeId/sections/:sectionId/students/:studentId"
              element={<StudentView />}
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

<Route path="/reports" element={<ReportGenerator />} />

            {/* مسار ملف الإنجاز العام (بدون حماية) */}
            <Route path="/portfolio/:userId" element={<PortfolioPublic />} />

            {/* إعادة توجيه أي مسار غير معروف. تم تعديلها لتوجيه المستخدمين إلى المسار المحمي "/" */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}
