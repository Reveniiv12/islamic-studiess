// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gradesData } from "../data/mockData";
import Navbar from "../components/Navbar";
import { FaUserGraduate, FaChartBar, FaBars, FaTimes, FaCog } from "react-icons/fa";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  
  const [totalStudents, setTotalStudents] = useState(0);
  const [averageGrade, setAverageGrade] = useState(0);
  const [studentsPerGrade, setStudentsPerGrade] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherPhoto, setTeacherPhoto] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");

  useEffect(() => {
    const fetchAndCalculateData = () => {
      let allStudents = [];
      let allGrades = [];
      const studentsCountPerGrade = {};

      gradesData.forEach(grade => {
        let studentsInThisGrade = 0;
        const sections = Array.from({ length: 10 }, (_, i) => i + 1);
        sections.forEach(section => {
          const storageKey = `grades_${grade.id}_${section}`;
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const studentsInSection = JSON.parse(savedData);
            allStudents = [...allStudents, ...studentsInSection];
            studentsInThisGrade += studentsInSection.length;
            
            studentsInSection.forEach(student => {
              if (student.grades && student.grades.tests) {
                allGrades.push(...student.grades.tests);
              }
            });
          }
        });
        studentsCountPerGrade[grade.id] = studentsInThisGrade;
      });

      setStudentsPerGrade(studentsCountPerGrade);
      setTotalStudents(allStudents.length);

      if (allGrades.length > 0) {
        const sumOfGrades = allGrades.reduce((acc, grade) => acc + (grade || 0), 0);
        const avg = (sumOfGrades / allGrades.length).toFixed(1);
        setAverageGrade(avg);
      } else {
        setAverageGrade(0);
      }

      setLoading(false);
    };

    const loadTeacherInfo = () => {
      setTeacherName(localStorage.getItem("teacherName") || "المعلم/ة: محمد السعدي");
      setTeacherPhoto(localStorage.getItem("teacherPhoto") || "/images/default_teacher.png");
      setSchoolName(localStorage.getItem("schoolName") || "مدرسة متوسطة الطرف");
      setCurrentSemester(localStorage.getItem("currentSemester") || "الفصل الدراسي الأول");
    };

    fetchAndCalculateData();
    loadTeacherInfo();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleUpdateTeacherInfo = () => {
    const newName = prompt("أدخل اسم المعلم الجديد:", teacherName);
    const newSchool = prompt("أدخل اسم المدرسة الجديد:", schoolName);
    const newSemester = prompt("أدخل الفصل الدراسي الجديد:", currentSemester);
    const newPhoto = prompt("أدخل رابط الصورة الجديدة:", teacherPhoto);

    if (newName !== null) {
      localStorage.setItem("teacherName", newName);
      setTeacherName(newName);
    }
    if (newSchool !== null) {
      localStorage.setItem("schoolName", newSchool);
      setSchoolName(newSchool);
    }
    if (newSemester !== null) {
      localStorage.setItem("currentSemester", newSemester);
      setCurrentSemester(newSemester);
    }
    if (newPhoto !== null) {
      localStorage.setItem("teacherPhoto", newPhoto);
      setTeacherPhoto(newPhoto);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-['Noto_Sans_Arabic',sans-serif]">
      <Navbar />

      <button 
        onClick={toggleMenu} 
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-300"
        aria-label="القائمة الجانبية"
      >
        <FaBars className="h-6 w-6" />
      </button>

      <div 
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
                   ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-blue-400">القائمة</h2>
            <button onClick={toggleMenu} className="text-gray-400 hover:text-white transition-colors duration-300">
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
          
          <div className="text-center mb-8">
            <img src={teacherPhoto} alt="صورة المعلم" className="h-24 w-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-500" />
            <h4 className="text-lg font-bold text-white mb-1">{teacherName}</h4>
            <p className="text-sm text-gray-400">{schoolName}</p>
            <p className="text-sm text-gray-400">{currentSemester}</p>
            <button onClick={handleUpdateTeacherInfo} className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 mx-auto">
              <FaCog /> تعديل البيانات
            </button>
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div 
          onClick={toggleMenu} 
          className="fixed inset-0 bg-black opacity-50 z-30"
        ></div>
      )}

      <div className={`p-4 md:p-8 max-w-7xl mx-auto transition-all duration-300 ${isMenuOpen ? 'md:mr-64' : ''}`}>
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img 
              src="/images/moe_logo_white.png" 
              alt="شعار وزارة التعليم" 
              className="h-24 md:h-32"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-blue-400 leading-tight">{schoolName}</h1>
          <p className="mt-2 text-md md:text-xl text-gray-300">لوحة تحكم المعلم لإدارة الفصول</p>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-4 p-2 bg-gray-800 rounded-full border border-gray-700">
              <img src={teacherPhoto} alt="صورة المعلم" className="h-10 w-10 rounded-full object-cover"/>
              <div>
                <span className="block text-sm font-semibold text-white">{teacherName}</span>
                <span className="block text-xs text-gray-400">{currentSemester}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {gradesData.map((grade) => (
            <div
              key={grade.id}
              onClick={() => navigate(`/grades/${grade.id}`)}
              className="relative rounded-3xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer
                         bg-gray-800 border border-gray-700 hover:border-blue-500"
            >
              <div className="p-8 text-center flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gray-700 text-blue-400 mx-auto mb-6">
                  <FaUserGraduate className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-bold mb-1 text-white">{grade.name}</h3>
                <p className="text-xl font-light opacity-80 text-gray-300">
                  {loading ? '...' : `${studentsPerGrade[grade.id] || 0} طالب`}
                </p>
              </div>
              <div className="flex justify-center items-center bg-gray-700 text-blue-400 py-4">
                <span className="text-md font-semibold">عرض الفصول →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;