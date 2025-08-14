// src/SectionGrades.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import NotesModal from "../components/NotesModal";
import StarsModal from "../components/StarsModal";
import RecitationModal from "../components/RecitationModal";
import CurriculumModal from "../components/CurriculumModal.jsx";
import HomeworkModal from "../components/HomeworkModal.jsx";
import HomeworkCurriculumModal from "../components/HomeworkCurriculumModal.jsx";

import GradesModal from "../components/GradesModal";
import { getRecitationStatus } from '../utils/recitationUtils';
import { FaFileExcel, FaDownload, FaUpload, FaQuran, FaMicrophone, FaStar, FaStickyNote, FaUserPlus, FaTable, FaPencilAlt, FaTasks, FaBookOpen, FaCommentDots, FaAward, FaUserCircle, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle, FaArrowLeft, FaHome, FaSyncAlt, FaSearch, FaArrowUp, FaCamera } from "react-icons/fa";

// مكون صغير لعرض النجوم
const StarRating = ({ count }) => {
    return (
        <div className="flex gap-1 text-yellow-400">
            {Array.from({ length: 10 }).map((_, index) => (
                <FaStar key={index} className={index < count ? 'text-yellow-400' : 'text-gray-600'} />
            ))}
        </div>
    );
};

// الدوال الوهمية لجلب اسم الصف والفصل.
// في تطبيقك الحقيقي، ستقوم بجلب هذه البيانات من مصدر بيانات (API، قاعدة بيانات، إلخ).
const getGradeNameById = (gradeId) => {
    const grades = {
        '1': 'الصف الأول المتوسط',
        '2': 'الصف الثاني المتوسط',
        '3': 'الصف الثالث المتوسط',
    };
    return grades[gradeId] || 'غير محدد';
};

const getSectionNameById = (sectionId) => {
    const sections = {
        '1': 'فصل 1',
        '2': 'فصل 2',
        '3': 'فصل 3',
        '4': 'فصل 4',
        '5': 'فصل 5',
        '6': 'فصل 6',
        '7': 'فصل 7',
        '8': 'فصل 8',
        '9': 'فصل 9',
        '10': 'فصل 10',
    };
    return sections[sectionId] || 'غير محدد';
};

const SectionGrades = () => {
    const { gradeId, sectionId } = useParams();
    const navigate = useNavigate();
    const storageKey = `grades_${gradeId}_${sectionId}`;
    const curriculumStorageKey = `curriculum_${gradeId}_${sectionId}`;
    const homeworkCurriculumStorageKey = `homework_curriculum_${gradeId}_${sectionId}`;
    const gradesSectionRef = useRef(null);

    const [students, setStudents] = useState([]);
    // State variables to hold teacher and school info
    const [teacherName, setTeacherName] = useState("المعلم الافتراضي");
    const [schoolName, setSchoolName] = useState("مدرسة متوسطة الطرف");
    const [currentSemester, setCurrentSemester] = useState("الفصل الدراسي الأول");
    const [curriculum, setCurriculum] = useState([]);
    // أضف هذه الحالات الجديدة هنا
    const [homeworkCurriculum, setHomeworkCurriculum] = useState([]);
    const [showHomeworkModal, setShowHomeworkModal] = useState(false);
    const [showHomeworkCurriculumModal, setShowHomeworkCurriculumModal] = useState(false);
    
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showStarsModal, setShowStarsModal] = useState(false);
    const [showRecitationModal, setShowRecitationModal] = useState(false);
    const [showCurriculumModal, setShowCurriculumModal] = useState(false);
    const [showGradesModal, setShowGradesModal] = useState(false);
    const [showGradeSheet, setShowGradeSheet] = useState(false);
    const [showBriefSheet, setShowBriefSheet] = useState(false);
    const [testCalculationMethod, setTestCalculationMethod] = useState('average');
    const [newStudent, setNewStudent] = useState({
        name: "",
        nationalId: "",
        phone: "",
        parentPhone: "",
        photo: "", // Initial photo is empty
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const fileInputRef = useRef(null);
    
    // حالات جديدة لنموذج التعديل
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // حالات ومراجع جديدة لإدارة الكاميرا ورفع الصور
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const filePhotoInputRef = useRef(null);
    
    // A new ref for the photo input specifically for the add form
    const newStudentFilePhotoInputRef = useRef(null);

    // إضافة هنا أسماء الصف والفصل
    const gradeName = getGradeNameById(gradeId);
    const sectionName = getSectionNameById(sectionId);

const fetchDataFromLocalStorage = () => {
    setIsRefreshing(true);
    setTimeout(() => {
        if (gradeId && sectionId) {
            const savedData = localStorage.getItem(storageKey);
            const savedCurriculum = localStorage.getItem(curriculumStorageKey);
            // أضف هذا السطر هنا لتعريف مفتاح التخزين الجديد
            const homeworkCurriculumStorageKey = `homework_curriculum_${gradeId}_${sectionId}`;
            const savedHomeworkCurriculum = localStorage.getItem(homeworkCurriculumStorageKey);
            const savedTestMethod = localStorage.getItem(`testMethod_${gradeId}_${sectionId}`);
            // Fetch teacher and school info from localStorage
            const savedTeacherName = localStorage.getItem("teacherName") || "المعلم الافتراضي";
            const savedSchoolName = localStorage.getItem("schoolName") || "مدرسة متوسطة الطرف";
            const savedSemester = localStorage.getItem("currentSemester") || "الفصل الدراسي الأول";
            
            setTeacherName(savedTeacherName);
            setSchoolName(savedSchoolName);
            setCurrentSemester(savedSemester);
            
            if (savedData) {
                const parsedStudents = JSON.parse(savedData).map(student => {
                    const defaultGrades = {
                        tests: Array(2).fill(null),
                        homework: Array(10).fill(null),
                        participation: Array(10).fill(null),
                        performanceTasks: Array(3).fill(null),
                        quranRecitation: Array(5).fill(null),
                        quranMemorization: Array(5).fill(null),
                        oralTest: Array(5).fill(null),
                        weeklyNotes: Array(16).fill(null)
                    };
                    const studentGrades = { ...defaultGrades, ...student.grades };
                    if (studentGrades.performanceTasks.length !== 3) { studentGrades.performanceTasks = Array(3).fill(null); }
                    if (studentGrades.oralTest.length !== 5) { studentGrades.oralTest = Array(5).fill(null); }
                    if (studentGrades.tests.length !== 2) { studentGrades.tests = Array(2).fill(null); }
                    if (studentGrades.quranRecitation.length !== 5) { studentGrades.quranRecitation = Array(5).fill(null); }
                    if (studentGrades.quranMemorization.length !== 5) { studentGrades.quranMemorization = Array(5).fill(null); }
                    return { ...student, grades: studentGrades };
                });
                setStudents(parsedStudents);
            } else {
                setStudents([]);
            }

            if (savedCurriculum) {
                setCurriculum(JSON.parse(savedCurriculum));
            } else {
                setCurriculum([]);
            }
            // أضف هذا الشرط هنا
            if (savedHomeworkCurriculum) {
                setHomeworkCurriculum(JSON.parse(savedHomeworkCurriculum));
            } else {
                setHomeworkCurriculum([]);
            }

            if (savedTestMethod) {
                setTestCalculationMethod(savedTestMethod);
            }
        }
        setIsRefreshing(false);
    }, 1000);
};

useEffect(() => {
    fetchDataFromLocalStorage();
}, [gradeId, sectionId, storageKey, curriculumStorageKey]);

useEffect(() => {
    if (selectedStudent && gradesSectionRef.current) {
        gradesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
}, [selectedStudent]);

    // دوال جديدة لإدارة الكاميرا ورفع الصور
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("خطأ في الوصول إلى الكاميرا: ", err);
            alert("لا يمكن الوصول إلى الكاميرا. تأكد من إعطاء الصلاحيات.");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    // A single capture function that handles both new and edited student photos
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const photoDataUrl = canvasRef.current.toDataURL('image/png');
            if (editingStudent) {
                setEditingStudent({ ...editingStudent, photo: photoDataUrl });
            } else if (showAddForm) {
                setNewStudent({ ...newStudent, photo: photoDataUrl });
            }
            stopCamera();
            setShowCamera(false);
        }
    };

    // A single file upload function that handles both new and edited student photos
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (editingStudent) {
                    setEditingStudent({ ...editingStudent, photo: reader.result });
                } else if (showAddForm) {
                    setNewStudent({ ...newStudent, photo: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const updateStudentsData = (updatedStudents) => {
        setStudents(updatedStudents);
        localStorage.setItem(storageKey, JSON.stringify(updatedStudents));
    };

    const updateCurriculumData = (updatedCurriculum) => {
        setCurriculum(updatedCurriculum);
        localStorage.setItem(curriculumStorageKey, JSON.stringify(updatedCurriculum));
    };

    const updateHomeworkCurriculumData = (updatedCurriculum) => {
    setHomeworkCurriculum(updatedCurriculum);
    localStorage.setItem(homeworkCurriculumStorageKey, JSON.stringify(updatedCurriculum));
};

    const handleTestCalculationMethodChange = (method) => {
        setTestCalculationMethod(method);
        localStorage.setItem(`testMethod_${gradeId}_${sectionId}`, method);
    };

    const calculateAverage = (arr) => {
        if (!arr || arr.length === 0) return 0;
        const validGrades = arr.filter(g => g !== null && g !== '');
        if (validGrades.length === 0) return 0;
        const sum = validGrades.reduce((acc, val) => acc + Number(val), 0);
        return sum / validGrades.length;
    };

    const calculateSum = (arr) => {
        if (!arr || arr.length === 0) return 0;
        const validGrades = arr.filter(g => g !== null && g !== '');
        if (validGrades.length === 0) return 0;
        return validGrades.reduce((acc, val) => acc + Number(val), 0);
    };
    
    const calculateBest = (arr) => {
        if (!arr || arr.length === 0) return 0;
        const validGrades = arr.filter(g => g !== null && g !== '');
        if (validGrades.length === 0) return 0;
        return Math.max(...validGrades);
    };

    const calculateCategoryScore = (grades, category, method) => {
        let score = 0;
        const gradeArray = grades[category];
        if (!gradeArray) return 0;
        const validGrades = gradeArray.filter(g => g !== null && g !== '');
        if (validGrades.length === 0) return 0;
        switch (method) {
            case 'sum':
                score = validGrades.reduce((acc, val) => acc + Number(val), 0);
                break;
            case 'best':
                score = Math.max(...validGrades);
                break;
            case 'average':
                score = validGrades.reduce((acc, val) => acc + Number(val), 0) / validGrades.length;
                break;
            case 'test':
                score = testCalculationMethod === 'best' ? Math.max(...validGrades) : validGrades.reduce((acc, val) => acc + Number(val), 0) / validGrades.length;
                break;
            default:
                score = 0;
        }
        return isNaN(score) ? 0 : score.toFixed(2);
    };

    const calculateTotalScore = (grades) => {
        let testScore = 0;
        const validTests = grades.tests.filter(g => g !== null && g !== '');
        if (validTests.length > 0) {
             testScore = testCalculationMethod === 'best' ? Math.max(...validTests) : calculateSum(validTests) / validTests.length;
        }
        let homeworkScoreFinal = 0;
        const homeworkSum = calculateSum(grades.homework);
        if (homeworkSum > 0) { homeworkScoreFinal = homeworkSum; }
        let participationScoreFinal = 0;
        const participationSum = calculateSum(grades.participation);
        if (participationSum > 0) { participationScoreFinal = participationSum; }
        let performanceScoreFinal = 0;
        const performanceBest = calculateBest(grades.performanceTasks);
        if (performanceBest > 0) { performanceScoreFinal = performanceBest; }
        let oralTestScoreFinal = 0;
        const oralBest = calculateBest(grades.oralTest);
        if (oralBest > 0) { oralTestScoreFinal = oralBest; }
        let quranRecitationScoreFinal = 0;
        const quranRecitationAverage = calculateAverage(grades.quranRecitation);
        if (quranRecitationAverage > 0) { quranRecitationScoreFinal = quranRecitationAverage; }
        let quranMemorizationScoreFinal = 0;
        const quranMemorizationAverage = calculateAverage(grades.quranMemorization);
        if (quranMemorizationAverage > 0) { quranMemorizationScoreFinal = quranMemorizationAverage; }
        const total = (
            testScore +
            homeworkScoreFinal +
            participationScoreFinal +
            performanceScoreFinal +
            quranRecitationScoreFinal +
            quranMemorizationScoreFinal +
            oralTestScoreFinal
        );
        return isNaN(total) ? 0 : total.toFixed(2);
    };

// تصدير إلى إكسل
const exportToExcel = () => {
    const data = students.map(student => ({
        'اسم الطالب': student.name,
        'السجل المدني': student.nationalId,
        'رقم ولي الأمر': student.parentPhone
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `بيانات_${gradeId}_${sectionId}.xlsx`);
};

// استيراد من إكسل
const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // نقرأ أول ورقة في الملف
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            const updatedStudents = jsonData.map(row => ({
                id: Date.now() + Math.random(),
                name: row['اسم الطالب'] || '',
                nationalId: row['السجل المدني'] || '',
                parentPhone: row['رقم ولي الأمر'] || ''
            }));

            updateStudentsData(updatedStudents);
            alert('تم استيراد البيانات بنجاح!');
        } catch (error) {
            alert('حدث خطأ أثناء استيراد الملف: ' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
};


const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.nationalId) {
        alert("يرجى إدخال الاسم والسجل المدني");
        return;
    }
    const newId = Date.now();
    const studentToAdd = {
        id: newId,
        ...newStudent,
        photo: newStudent.photo || '/images/1.webp',
        stars: 0,
        recitationHistory: [],
        grades: {
            tests: Array(2).fill(null),
            // عدّل هذا السطر ليصبح ديناميكياً بناءً على عدد الواجبات في المنهج
            homework: Array(homeworkCurriculum.filter(c => c.type === 'homework').length).fill(null),
            // وعدّل هذا السطر ليصبح ديناميكياً بناءً على عدد المهام الأدائية في المنهج
            performanceTasks: Array(homeworkCurriculum.filter(c => c.type === 'performanceTask').length).fill(null),
            participation: Array(10).fill(null),
            quranRecitation: Array(5).fill(null),
            quranMemorization: Array(5).fill(null),
            oralTest: Array(5).fill(null),
            weeklyNotes: Array(16).fill(null),
        },
    };
    updateStudentsData([...students, studentToAdd]);
    setShowAddForm(false);
    setNewStudent({ name: "", nationalId: "", phone: "", parentPhone: "", photo: "" });
};

    const updateStudentGrade = (studentId, category, index, value) => {
        const numValue = value === '' ? null : Number(value);
        let maxLimit = 0;
        let errorMessage = '';
        switch(category) {
            case 'tests': maxLimit = 15; errorMessage = "خطأ: درجة الاختبار لا يمكن أن تتجاوز 15."; break;
            case 'oralTest': maxLimit = 5; errorMessage = "خطأ: درجة الاختبار الشفوي لا يمكن أن تتجاوز 5."; break;
            case 'homework': maxLimit = 1; errorMessage = "خطأ: درجة الواجب لا يمكن أن تتجاوز 1."; break;
            case 'performanceTasks': maxLimit = 5; errorMessage = "خطأ: درجة المهمة الأدائية لا يمكن أن تتجاوز 5."; break;
            case 'participation': maxLimit = 1; errorMessage = "خطأ: درجة المشاركة لا يمكن أن تتجاوز 1."; break;
            case 'quranRecitation': maxLimit = 10; errorMessage = "خطأ: درجة تلاوة القرآن لا يمكن أن تتجاوز 10."; break;
            case 'quranMemorization': maxLimit = 5; errorMessage = "خطأ: درجة حفظ القرآن لا يمكن أن تتجاوز 5."; break;
            default: break;
        }
        if (numValue !== null && (numValue > maxLimit || numValue < 0)) {
            alert(errorMessage);
            return;
        }
        const updatedStudents = students.map((student) => {
            if (student.id === studentId) {
                const updatedGrades = { ...student.grades };
                if (Array.isArray(updatedGrades[category])) {
                    updatedGrades[category][index] = numValue;
                } else {
                    updatedGrades[category] = numValue;
                }
                return { ...student, grades: updatedGrades };
            }
            return student;
        });
        updateStudentsData(updatedStudents);
        const updatedSelectedStudent = updatedStudents.find(s => s.id === studentId);
        if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    };

    const updateStudentStars = (updatedStudents) => {
        updateStudentsData(updatedStudents);
        const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
        if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
        setShowStarsModal(false);
    };

    const updateRecitationData = (updatedStudents) => {
        updateStudentsData(updatedStudents);
        const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
        if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    };

    const updateNotesData = (updatedStudents) => {
        updateStudentsData(updatedStudents);
        const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
        if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    };

    const handleEditStudent = () => {
        if (!editingStudent.name || !editingStudent.nationalId) {
            alert("يرجى إدخال الاسم والسجل المدني");
            return;
        }
        const updatedStudents = students.map(student =>
            student.id === editingStudent.id ? editingStudent : student
        );
        updateStudentsData(updatedStudents);
        setShowEditForm(false);
        setEditingStudent(null);
        if (selectedStudent && selectedStudent.id === editingStudent.id) {
            setSelectedStudent(editingStudent);
        }
    };

const getStatusInfo = (type) => {
    if (!selectedStudent || !curriculum) {
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
    }
    const status = getRecitationStatus(selectedStudent, type, curriculum).status;
    switch (status) {
        case 'fully_recited': return { icon: <FaCheckCircle className="text-green-500" />, text: 'تم التسميع' };
        case 'not_memorized': return { icon: <FaTimesCircle className="text-red-500" />, text: 'لم يسمّع' };
        case 'late': return { icon: <FaClock className="text-yellow-500" />, text: 'متأخر' };
        case 'none': return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
        default: return { icon: null, text: '' };
    }
};

// دالة جديدة لحالة الواجبات والمهام الأدائية
const getTaskStatusInfo = (taskType) => {
    if (!selectedStudent || !homeworkCurriculum) {
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
    }

    const status = getTaskStatus(selectedStudent, taskType).status;
    switch (status) {
        case 'fully_completed':
            return { icon: <FaCheckCircle className="text-green-500" />, text: 'تم الحل' };
        case 'not_completed':
            return { icon: <FaTimesCircle className="text-red-500" />, text: 'لم يحل' };
        case 'late':
            return { icon: <FaClock className="text-yellow-500" />, text: 'متأخر' };
        case 'none':
            return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد' };
        default:
            return { icon: null, text: '' };
    }
};



    
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-4 md:p-8 max-w-8xl mx-auto font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen" dir="rtl">
          <header className="flex flex-col md:flex-row justify-center items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center">
                <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-0">
                    <div className="flex flex-col">
                         <h1 className="text-xl md:text-3xl font-extrabold text-blue-400">
                            {schoolName}
                        </h1>
                        <p className="text-sm md:text-lg font-medium text-gray-400">
                            {teacherName}
                        </p>
                    </div>
                    <img src="/images/moe_logo_white.png" alt="شعار وزارة التعليم" className="h-12 w-12 md:h-16 md:w-16" />
                </div>
            </header>

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
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 mb-4 md:mb-6">
                <div className="relative flex items-center w-full md:w-auto mt-4 md:mt-0">
                    <FaSearch className="absolute right-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ابحث بالاسم..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 p-2 pr-10 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                    />
                </div>
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

            {isRefreshing && (
                <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 bg-green-500 text-white py-2 px-4 rounded-xl shadow-lg flex items-center gap-2">
                    <FaSyncAlt className="animate-spin" />
                    <span>يتم تحديث البيانات...</span>
                </div>
            )}

            {showAddForm && (
                <div className="mb-4 md:mb-8 p-4 md:p-6 rounded-xl bg-gray-800 shadow-lg max-w-full md:max-w-lg mx-auto border border-gray-700">
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-400 text-right">إضافة طالب جديد</h3>
                    <div className="flex items-center justify-center mb-4">
                        <img src={newStudent.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                    </div>
                    <input type="text" placeholder="اسم الطالب" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
                    <input type="text" placeholder="السجل المدني" value={newStudent.nationalId} onChange={(e) => setNewStudent({ ...newStudent, nationalId: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
                    <input type="text" placeholder="رقم التواصل" value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
                    <input type="text" placeholder="رقم ولي الأمر" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
                    {/* Add Photo section */}
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="block text-sm font-medium text-gray-300 text-right">إضافة صورة الطالب:</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => newStudentFilePhotoInputRef.current.click()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm"
                            >
                                <FaUpload /> رفع صورة
                            </button>
                            <input
                                type="file"
                                ref={newStudentFilePhotoInputRef}
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => { setShowCamera(true); startCamera(); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
                            >
                                <FaCamera /> التقاط صورة
                            </button>
                        </div>
                    </div>
                    {/* End Add Photo section */}
                    <button onClick={handleAddStudent} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors w-full text-sm">
                        حفظ الطالب
                    </button>
                </div>
            )}
            
            {showEditForm && editingStudent && (
                <div className="mb-4 md:mb-8 p-4 md:p-6 rounded-xl bg-gray-800 shadow-lg max-w-full md:max-w-lg mx-auto border border-gray-700">
                    <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-400 text-right">تعديل بيانات الطالب</h3>
                    <div className="flex items-center justify-center mb-4">
                        <img src={editingStudent.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                    </div>
                    <input
                        type="text"
                        placeholder="اسم الطالب"
                        value={editingStudent.name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                        className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
                    />
                    <input
                        type="text"
                        placeholder="السجل المدني"
                        value={editingStudent.nationalId}
                        onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })}
                        className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
                    />
                    <input
                        type="text"
                        placeholder="رقم التواصل"
                        value={editingStudent.phone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                        className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
                    />
                    <input
                        type="text"
                        placeholder="رقم ولي الأمر"
                        value={editingStudent.parentPhone || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                        className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm"
                    />
                    <div className="flex flex-col gap-2 mb-4">
                        <label className="block text-sm font-medium text-gray-300 text-right">تغيير صورة الطالب:</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => filePhotoInputRef.current.click()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm"
                            >
                                <FaUpload /> رفع صورة
                            </button>
                            <input
                                type="file"
                                ref={filePhotoInputRef}
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => { setShowCamera(true); startCamera(); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
                            >
                                <FaCamera /> التقاط صورة
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditStudent}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm"
                        >
                            حفظ التغييرات
                        </button>
                        <button
                            onClick={() => { setShowEditForm(false); setEditingStudent(null); }}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" dir="rtl">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-blue-400 text-right">التقاط صورة</h3>
                        <video ref={videoRef} autoPlay className="w-full h-auto rounded-lg mb-4 border border-gray-600"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="flex gap-2">
                            <button
                                onClick={capturePhoto}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm"
                            >
                                <FaCamera /> التقاط
                            </button>
                            <button
                                onClick={() => { setShowCamera(false); stopCamera(); }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {!showGradeSheet && !showBriefSheet && (
                <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-700">
                    <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">
                        الطلاب في {gradeName} - {sectionName}
                    </h3>
                    <div className="flex flex-wrap justify-start gap-4 pb-4 md:pb-6 mb-4 md:mb-6">
                        {filteredStudents.length === 0 ? (
                            <p className="text-gray-400 text-lg text-center w-full">لا يوجد طلاب في هذا الفصل حاليًا. يمكنك إضافة طالب جديد أو استيراد بيانات.</p>
                        ) : (
                            filteredStudents.map((student) => (
                                <div key={student.id} onClick={() => setSelectedStudent(student)} className={`flex items-center gap-4 p-4 border rounded-xl w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-sm ${selectedStudent?.id === student.id ? "border-blue-500 bg-gray-700 shadow-lg" : "border-gray-700 bg-gray-800 hover:bg-gray-700"}`}>
                                    <div className="flex-shrink-0">
                                        <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                                    </div>
                                    <div className="flex-grow text-right">
                                        <h4 className="font-bold text-lg text-white truncate">{student.name}</h4>
                                        <p className="text-sm text-gray-400 truncate">السجل: {student.nationalId}</p>
                                        {student.parentPhone && (
                                            <p className="text-sm text-gray-400 truncate">ولي الأمر: {student.parentPhone}</p>
                                        )}
                                        <div className="flex justify-between items-center mt-2">
                                            <Link to={`/student/${student.id}`} className="text-blue-400 text-sm hover:underline block" onClick={(e) => e.stopPropagation()}>
                                                عرض الملف الشخصي
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingStudent(student);
                                                    setShowEditForm(true);
                                                }}
                                                className="text-gray-400 hover:text-blue-400 transition-colors"
                                                title="تعديل بيانات الطالب"
                                            >
                                                <FaPencilAlt />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selectedStudent && !showGradeSheet && !showBriefSheet ? (
                <div ref={gradesSectionRef} className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 border border-gray-700" dir="rtl">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                        <div className="flex flex-col text-right">
                            <h3 className="text-xl md:text-2xl font-bold text-blue-400">
                                درجات الطالب: {selectedStudent.name}
                            </h3>
                            <p className="text-sm md:text-md text-gray-400">السجل المدني: {selectedStudent.nationalId}</p>
                            <p className="text-sm md:text-md text-gray-400">رقم ولي الأمر: {selectedStudent.parentPhone}</p>
                        </div>
                        <FaUserCircle className="text-4xl text-blue-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col text-right">
                                    <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                                    <span className="text-xl md:text-2xl font-bold text-green-500">{calculateTotalScore(selectedStudent.grades)} / 60</span>
                                </div>
                                <FaAward className="text-4xl text-green-400" />
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col text-right">
                                    <h4 className="font-semibold text-gray-100">النجوم المكتسبة</h4>
                                    <StarRating count={selectedStudent.stars || 0} />
                                </div>
                                <FaStar className="text-4xl text-yellow-400" />
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                                <FaPencilAlt className="text-3xl text-green-400" /> الاختبارات (15) <span className="text-green-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'tests', 'test')} / 15</span>
                            </h4>
                            <div className="flex gap-2 mb-3 text-sm">
                                <button
                                    onClick={() => handleTestCalculationMethodChange('best')}
                                    className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                >
                                    أحسن درجة
                                </button>
                                <button
                                    onClick={() => handleTestCalculationMethodChange('average')}
                                    className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'average' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                >
                                    المتوسط
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.tests.slice(0, 2).map((grade, i) => (
                                    <input key={i} type="number" min="0" max="15" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "tests", i, e.target.value)} className="w-16 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                                <FaMicrophone className="text-3xl text-yellow-400" /> الاختبار الشفوي (5) <span className="text-yellow-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'oralTest', 'best')} / 5</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.oralTest.slice(0, 5).map((grade, i) => (
                                    <input key={i} type="number" min="0" max="5" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "oralTest", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                                <FaTasks className="text-3xl text-purple-400" /> الواجبات (10) <span className="text-purple-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'homework', 'sum')} / 10</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.homework.map((grade, i) => (
                                    <input key={i} type="number" min="0" max="1" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "homework", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                                <FaBookOpen className="text-3xl text-rose-400" /> مهام أدائية (5) <span className="text-rose-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'performanceTasks', 'best')} / 5</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.performanceTasks.map((grade, i) => (
                                    <input key={i} type="number" min="0" max="5" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "performanceTasks", i, e.target.value)} className="w-16 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                                <FaCommentDots className="text-3xl text-cyan-400" /> المشاركة (10) <span className="text-cyan-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'participation', 'sum')} / 10</span>
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.participation.map((grade, i) => (
                                    <input key={i} type="number" min="0" max="1" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "participation", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                ))}
                            </div>
                        </div>
                        <div className="col-span-full md:col-span-2 lg:col-span-3 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                                <FaQuran className="text-3xl text-blue-400" /> القرآن الكريم
                                <span className="text-blue-400 font-bold mr-2 text-2xl">
                                    {(parseFloat(calculateCategoryScore(selectedStudent.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(selectedStudent.grades, 'quranMemorization', 'average'))).toFixed(2)} / 15
                                </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium text-gray-100">تلاوة القرآن (10)</h5>
                                        {getStatusInfo('recitation').icon}
                                        <span className={`text-sm ${getStatusInfo('recitation').icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo('recitation').icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo('recitation').icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            ({getStatusInfo('recitation').text})
                                        </span>
                                        <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(selectedStudent.grades, 'quranRecitation', 'average')} / 10</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                                            <input
                                                key={i}
                                                type="number"
                                                min="0"
                                                max="10"
                                                placeholder="--"
                                                value={grade === null ? '' : grade}
                                                onChange={(e) => updateStudentGrade(selectedStudent.id, "quranRecitation", i, e.target.value)}
                                                className="w-12 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium text-gray-100">حفظ القرآن (5)</h5>
                                        {getStatusInfo('memorization').icon}
                                        <span className={`text-sm ${getStatusInfo('memorization').icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo('memorization').icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo('memorization').icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            ({getStatusInfo('memorization').text})
                                        </span>
                                        <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(selectedStudent.grades, 'quranMemorization', 'average')} / 5</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                                            <input
                                                key={i}
                                                type="number"
                                                min="0"
                                                max="5"
                                                placeholder="--"
                                                value={grade === null ? '' : grade}
                                                onChange={(e) => updateStudentGrade(selectedStudent.id, "quranMemorization", i, e.target.value)}
                                                className="w-12 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 col-span-full">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold text-xl flex items-center gap-2 text-gray-100">
                                    <FaStickyNote className="text-2xl text-yellow-400" /> الملاحظات الأسبوعية
                                </h4>
                                <button onClick={() => setShowNotesModal(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors text-sm">
                                    إدارة الملاحظات
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
                                {(selectedStudent.grades.weeklyNotes || []).map((notes, weekIndex) => (
                                    <div key={weekIndex} className="bg-gray-800 p-3 rounded-lg border border-gray-600 min-h-[120px]">
                                        <h5 className="font-bold text-gray-200 mb-1 text-center">الأسبوع {weekIndex + 1}</h5>
                                        <div className="h-px bg-gray-600 mb-2"></div>
                                        {notes && notes.length > 0 ? (
                                            <ul className="list-disc pr-4 text-gray-300 text-sm space-y-1">
                                                {notes.map((note, noteIndex) => (
                                                    <li key={noteIndex} className="pb-1">
                                                      {note}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-400 text-sm text-center">لا توجد ملاحظات</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {showGradeSheet && (
                <div className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 overflow-x-auto border border-gray-700 max-h-[80vh]">
<h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">كشف الدرجات الشامل</h3>
<p className="text-gray-400 mb-4">{schoolName} | {teacherName} | {currentSemester}</p>
                    <div className="flex gap-2 mb-4 text-sm">
                        <span className="text-gray-400 self-center">طريقة حساب الاختبارات:</span>
                        <button
                            onClick={() => handleTestCalculationMethodChange('best')}
                            className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            أحسن درجة
                        </button>
                        <button
                            onClick={() => handleTestCalculationMethodChange('average')}
                            className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'average' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            المتوسط
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-[65vh]">
                        <table className="min-w-full divide-y divide-gray-700" dir="rtl">
                            <thead className="bg-gray-700 sticky-header">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky-col-header">
                                        الاسم
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        المجموع (من 60)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        النجوم
                                    </th>
                                    <th scope="col" colSpan="2" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        الاختبارات (15)
                                    </th>
                                    <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        الشفوي (5)
                                    </th>
                                    <th scope="col" colSpan="10" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        الواجبات (10)
                                    </th>
                                    <th scope="col" colSpan="10" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        المشاركات (10)
                                    </th>
                                    <th scope="col" colSpan="3" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        المهام الأدائية (5)
                                    </th>
                                    <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">
                                        تلاوة القرآن (10)
                                    </th>
                                    <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        حفظ القرآن (5)
                                    </th>
                                </tr>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky-col-header"></th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
                                    {students.length > 0 && students[0].grades.tests.slice(0, 2).map((_, i) => (
                                        <th key={`test_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.oralTest.slice(0, 5).map((_, i) => (
                                        <th key={`ot_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.homework.map((_, i) => (
                                        <th key={`hw_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.participation.map((_, i) => (
                                        <th key={`part_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.performanceTasks.map((_, i) => (
                                        <th key={`pt_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.quranRecitation.slice(0, 5).map((_, i) => (
                                        <th key={`qr_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                    {students.length > 0 && students[0].grades.quranMemorization.slice(0, 5).map((_, i) => (
                                        <th key={`qm_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                                            {i + 1}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
<tbody className="bg-gray-800 divide-y divide-gray-700">
    {students.map((student) => (
        <tr key={student.id} className="hover:bg-gray-700 transition-colors">
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky-col bg-gray-800 text-right">
                {student.name}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                {calculateTotalScore(student.grades)}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                <StarRating count={student.stars || 0} />
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-center">
                {/* Recitation Icon */}
                <span
                    className={`inline-block w-3 h-3 rounded-full mr-1 ${getStatusColor(getRecitationStatus(student, 'recitation', curriculum).status)}`}
                    title={`التسميع: ${getRecitationStatus(student, 'recitation', curriculum).text}`}
                ></span>

                {/* Homework Icon */}
                <span
                    className={`inline-block w-3 h-3 rounded-full mr-1 ${getStatusColor(getTaskStatus(student, 'homework').status)}`}
                    title={`الواجب: ${getTaskStatus(student, 'homework').text}`}
                ></span>

                {/* Performance Task Icon */}
                <span
                    className={`inline-block w-3 h-3 rounded-full ${getStatusColor(getTaskStatus(student, 'performanceTask').status)}`}
                    title={`المهام الأدائية: ${getTaskStatus(student, 'performanceTask').text}`}
                ></span>
            </td>
            {student.grades.tests.slice(0, 2).map((grade, i) => (
                <td key={`test_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                    <input
                        type="number"
                        min="0"
                        max="15"
                        placeholder="--"
                        value={grade === null ? '' : grade}
                        onChange={(e) => updateStudentGrade(student.id, "tests", i, e.target.value)}
                        className="w-16 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </td>
            ))}
                                        {student.grades.oralTest.slice(0, 5).map((grade, i) => (
                                            <td key={`ot_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="5"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "oralTest", i, e.target.value)}
                                                    className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                />
                                            </td>
                                        ))}
                                        {student.grades.homework.map((grade, i) => (
                                            <td key={`hw_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "homework", i, e.target.value)}
                                                    className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </td>
                                        ))}
                                        {student.grades.participation.map((grade, i) => (
                                            <td key={`part_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "participation", i, e.target.value)}
                                                    className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                />
                                            </td>
                                        ))}
                                        {student.grades.performanceTasks.map((grade, i) => (
                                            <td key={`pt_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="5"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "performanceTasks", i, e.target.value)}
                                                    className="w-16 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                />
                                            </td>
                                        ))}
                                        {student.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                                            <td key={`qr_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "quranRecitation", i, e.target.value)}
                                                    className="w-12 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                        ))}
                                        {student.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                                            <td key={`qm_grade_${student.id}_${i}`} className="px-2 py-4 whitespace-nowrap text-sm text-gray-200 text-center border-l border-r border-gray-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="5"
                                                    placeholder="--"
                                                    value={grade === null ? '' : grade}
                                                    onChange={(e) => updateStudentGrade(student.id, "quranMemorization", i, e.target.value)}
                                                    className="w-12 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showBriefSheet && (
                <div className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 overflow-x-auto border border-gray-700 max-h-[80vh]">
<h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">كشف مختصر</h3>
                    <p className="text-gray-400 mb-4">{schoolName} | {teacherName} | {currentSemester}</p>
                    <div className="flex gap-2 mb-4 text-sm">
                        <span className="text-gray-400 self-center">طريقة حساب الاختبارات:</span>
                        <button
                            onClick={() => handleTestCalculationMethodChange('best')}
                            className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            أحسن درجة
                        </button>
                        <button
                            onClick={() => handleTestCalculationMethodChange('average')}
                            className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'average' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                        >
                            المتوسط
                        </button>
                    </div>
                    <div className="overflow-y-auto max-h-[65vh]">
                        <table className="min-w-full divide-y divide-gray-700" dir="rtl">
                            <thead className="bg-gray-700 sticky-header">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky-col-header">
                                        الاسم
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        الاختبارات (15)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        الشفوي (5)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        الواجبات (10)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        المشاركات (10)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        المهام الأدائية (5)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        مجموع القرآن الكريم (15)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        المجموع (من 60)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        النجوم
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky-col bg-gray-800 text-right">
                                            {student.name}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {calculateCategoryScore(student.grades, 'tests', 'test')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {calculateCategoryScore(student.grades, 'oralTest', 'best')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {calculateCategoryScore(student.grades, 'homework', 'sum')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {calculateCategoryScore(student.grades, 'participation', 'sum')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {calculateCategoryScore(student.grades, 'performanceTasks', 'best')}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                            {(parseFloat(calculateCategoryScore(student.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(student.grades, 'quranMemorization', 'average'))).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                                            {calculateTotalScore(student.grades)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                            <StarRating count={student.stars || 0} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {showNotesModal && (
                <NotesModal
                    students={students}
                    onClose={() => setShowNotesModal(false)}
                    onSave={updateNotesData}
                    selectedStudent={selectedStudent}
                />
            )}

            {showStarsModal && (
                <StarsModal
                    students={students}
                    onClose={() => setShowStarsModal(false)}
                    onSave={updateStudentStars}
                    selectedStudent={selectedStudent}
                />
            )}

            {showRecitationModal && (
                <RecitationModal
                    students={students}
                    onClose={() => setShowRecitationModal(false)}
                    onSave={updateRecitationData}
                    curriculum={curriculum}
                />
            )}

            {showHomeworkCurriculumModal && (
    <HomeworkCurriculumModal
        homeworkCurriculum={homeworkCurriculum}
        onClose={() => setShowHomeworkCurriculumModal(false)}
        onSave={updateHomeworkCurriculumData}
    />
)}
{showHomeworkModal && (
    <HomeworkModal
        students={students}
        homeworkCurriculum={homeworkCurriculum}
        onClose={() => setShowHomeworkModal(false)}
        onSave={updateStudentsData}
    />
)}

            {showCurriculumModal && (
                <CurriculumModal
                    curriculum={curriculum}
                    onClose={() => setShowCurriculumModal(false)}
                    onSave={updateCurriculumData}
                />
            )}

            {showGradesModal && (
                <GradesModal
                    students={students}
                    curriculum={curriculum}
                    onClose={() => setShowGradesModal(false)}
                    onSave={updateStudentsData}
                />
            )}
            <button
                onClick={scrollToTop}
                className="fixed bottom-8 left-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-colors z-50"
                aria-label="العودة لأعلى الصفحة"
            >
                <FaArrowUp />
            </button>
            <style jsx="true">{`
                .sticky-header {
                    position: sticky;
                    top: 0;
                    z-index: 30;
                }
                .sticky-col {
                    position: sticky;
                    right: 0;
                    background-color: #1a202c;
                    z-index: 20;
                    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
                }
                .sticky-col-header {
                    position: sticky;
                    top: 0;
                    right: 0;
                    background-color: #2d3748;
                    z-index: 40;
                    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
                }
            `}</style>
        </div>
    );
};

export default SectionGrades;