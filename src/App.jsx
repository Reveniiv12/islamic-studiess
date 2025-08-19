// src/App.jsx

import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          {/*
            <Suspense> يقوم بإظهار محتوى احتياطي (fallback)
            أثناء تحميل المكونات التي تم استيرادها باستخدام lazy
          */}
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
          </Suspense>
        </Router>
      </AuthProvider>
    </div>
  );
}
