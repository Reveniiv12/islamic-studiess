import React from "react";
import { FaFileExcel, FaDownload, FaUpload, FaQuran, FaMicrophone, FaStar, FaStickyNote, FaUserPlus, FaTable, FaPencilAlt, FaTasks, FaBookOpen, FaCommentDots, FaAward, FaUserCircle, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle, FaArrowLeft, FaHome, FaSyncAlt, FaSearch } from "react-icons/fa";

const GradesButtons = ({
    setShowAddForm, showAddForm, exportToExcel, fileInputRef, handleFileImport, setShowCurriculumModal,
    setShowRecitationModal, setShowHomeworkCurriculumModal, setShowHomeworkModal, setShowNotesModal,
    setShowStarsModal, setShowGradesModal, showGradeSheet, setShowGradeSheet, setShowBriefSheet,
    showBriefSheet, setSelectedStudent, navigate, gradeId, fetchDataFromLocalStorage, isRefreshing
}) => {
    return (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaUserPlus /> {showAddForm ? "إلغاء إضافة" : "إضافة طالب"}
                </button>
                <button onClick={exportToExcel} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaDownload /> تصدير Excel
                </button>
                <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaUpload /> استيراد Excel
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
                </button>
                <button onClick={() => setShowCurriculumModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaQuran /> منهج التلاوة
                </button>
                <button onClick={() => setShowRecitationModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaMicrophone /> كشف التسميع
                </button>
                <button onClick={() => setShowHomeworkCurriculumModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaTasks /> الواجبات والمهام
                </button>
                <button onClick={() => setShowHomeworkModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaPencilAlt /> كشف الواجبات
                </button>
                <button onClick={() => setShowNotesModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-400 transition-colors shadow-md text-xs md:text-sm">
                    <FaStickyNote /> إدارة الملاحظات
                </button>
                <button onClick={() => setShowStarsModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-400 transition-colors shadow-md text-xs md:text-sm">
                    <FaStar /> إدارة النجوم
                </button>
                <button onClick={() => setShowGradesModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-md text-xs md:text-sm">
                    <FaTable /> إدارة الدرجات
                </button>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4 md:mb-6 mt-6">
                <div className="flex gap-4">
                    <button onClick={() => { setShowGradeSheet(!showGradeSheet); setShowBriefSheet(false); setSelectedStudent(null); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-sm">
                        <FaTable /> {showGradeSheet ? "إخفاء الكشف" : "كشف الدرجات الشامل"}
                    </button>
                    <button onClick={() => { setShowBriefSheet(!showBriefSheet); setShowGradeSheet(false); setSelectedStudent(null); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-sm">
                        <FaTable /> {showBriefSheet ? "إخفاء الكشف" : "كشف مختصر"}
                    </button>
                    <button onClick={() => navigate(`/grades/${gradeId}`)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-sm">
                        <FaArrowLeft /> العودة للفصول
                    </button>
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm">
                        <FaHome /> الصفحة الرئيسية
                    </button>
                    <button onClick={fetchDataFromLocalStorage} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm">
                        <FaSyncAlt className={isRefreshing ? "animate-spin" : ""} /> تحديث البيانات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradesButtons;