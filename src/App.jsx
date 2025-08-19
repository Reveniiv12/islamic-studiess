// src/App.jsx

import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { isMobile } from 'react-device-detect'; // استيراد دالة الكشف عن الجوال
import MobileErrorPage from "./pages/MobileErrorPage"; // استيراد صفحة الخطأ

// استيراد المكونات الرئيسية (Pages) بشكل كسول باستخدام React.lazy
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const StudentGradesPublic = lazy(() => import("./pages/StudentGradesPublic"));
const SectionsPage = lazy(() => import("./pages/SectionsPage"));
const SectionGrades = lazy(() => import("./pages/SectionGrades"));
const StudentList = lazy(() => import("./pages/StudentList"));
const StudentGrades = lazy(() => import("./pages/StudentGrades"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const PortfolioPublic = lazy(() => import("./pages/PortfolioPublic"));

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  // إذا كان الجهاز جوالاً، اعرض صفحة الخطأ فقط
  if (isMobile) {
    return <MobileErrorPage />;
  }

  // إذا كان الجهاز كمبيوتراً، اعرض التطبيق بالكامل
  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div>جاري التحميل...</div>}>
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
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/student/:studentId" element={<StudentGradesPublic />} />
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
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class/:gradeId/:classId"
                element={
                  <ProtectedRoute>
                    <StudentList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-grades/:studentId"
                element={
                  <ProtectedRoute>
                    <StudentGrades />
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
              <Route path="/portfolio/:userId" element={<PortfolioPublic />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </div>
  );
}
