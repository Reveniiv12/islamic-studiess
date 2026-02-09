// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import SectionsPage from "./pages/SectionsPage";
import SectionGrades from "./pages/SectionGrades";
import StudentList from "./pages/StudentList";
import StudentView from "./pages/StudentView";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Portfolio from "./pages/Portfolio"; // القديم إذا كنت تستخدمه
import PortfolioPublic from "./pages/PortfolioPublic"; // القديم
import ReportGenerator from "./pages/ReportGenerator";

// --- الاستيرادات الجديدة ---
import StudentPortfolio from "./pages/StudentPortfolio";
import SectionPortfoliosViewer from "./pages/SectionPortfoliosViewer";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* الصفحة الرئيسية - لوحة تحكم المعلم (محمية) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* المصادقة */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* عرض الأقسام لصف معين (محمية) */}
            <Route
              path="/grades/:gradeId"
              element={
                <ProtectedRoute>
                  <SectionsPage />
                </ProtectedRoute>
              }
            />

            {/* لوحة درجات القسم (محمية) */}
            <Route
              path="/grades/:gradeId/sections/:sectionId"
              element={
                <ProtectedRoute>
                  <SectionGrades />
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

            {/* عرض واجهة الطالب (التي تحتوي على زر ملف الإنجاز) */}
            <Route
              path="/student-view/:studentId"
              element={<StudentView />}
            />
            
            {/* وأيضاً المسار الطويل القديم لضمان عمل الروابط القديمة */}
            <Route
              path="/grades/:gradeId/sections/:sectionId/students/:studentId"
              element={<StudentView />}
            />

            {/* ======================================================== */}
            {/* مسارات ملف الإنجاز الجديدة                */}
            {/* ======================================================== */}

            {/* 1. صفحة الطالب (لرفع الملفات) */}
            <Route 
              path="/student-portfolio/:studentId" 
              element={<StudentPortfolio />} 
            />

            {/* 2. صفحة المعلم (لعرض الملفات والموافقة على الحذف) */}
            <Route 
              path="/section-portfolios/:gradeId/:sectionId" 
              element={<SectionPortfoliosViewer />} 
            />

            {/* 3. صفحة المشرف (للعرض فقط وتسجيل الزيارة) - المسار القديم */}
            <Route 
              path="/supervisor/section/:gradeId/:sectionId" 
              element={<SectionPortfoliosViewer />} 
            />

            {/* 4. مسار المشرف الجديد (المتوافق مع QR Code للفصل) - تمت إضافته سابقاً */}
            <Route 
              path="/section-portfolios/:gradeId/:sectionId/supervisor" 
              element={<SectionPortfoliosViewer />} 
            />

            {/* 5. مسار المشرف الموحد للصف (جديد) - يختار المشرف الفصل من الداخل */}
            <Route 
              path="/supervisor/grade/:gradeId" 
              element={<SectionPortfoliosViewer />} 
            />

            {/* ======================================================== */}


            {/* مسارات أخرى (التقارير وغيرها) */}
            <Route path="/reports" element={<ReportGenerator />} />
            
            {/* مسارات قديمة (إذا كنت لا تزال تستخدمها) */}
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/portfolio/:userId" element={<PortfolioPublic />} />

            {/* إعادة توجيه أي مسار خاطئ للرئيسية */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}