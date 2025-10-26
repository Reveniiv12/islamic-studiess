// src/pages/SectionGrades.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import NotesModal from "../components/NotesModal";
import StarsModal from "../components/StarsModal";
import RecitationModal from "../components/RecitationModal";
import CurriculumModal from "../components/CurriculumModal.jsx";
import HomeworkModal from "../components/HomeworkModal.jsx";
import HomeworkCurriculumModal from "../components/HomeworkCurriculumModal.jsx";
import GradesModal from "../components/GradesModal";
import TransferDeleteModal from "../components/TransferDeleteModal";
import StudentQrCode from "../components/StudentQrCode.jsx";
import GradesSheet from './GradesSheet';
import BriefSheet from './BriefSheet';
import AbsenceModal from "../components/AbsenceModal.jsx";
import BookAbsenceModal from "../components/BookAbsenceModal.jsx";
import TroubledStudentsModal from "../components/TroubledStudentsModal.jsx";
import CustomDialog from "../components/CustomDialog";
import VerificationModal from "../components/VerificationModal.jsx";
import CustomModal from "../components/CustomModal.jsx";
import AnnouncementsModal from "../components/AnnouncementsModal";
import VisitLogModal from "../components/VisitLogModal.jsx";
import { QRCodeSVG } from 'qrcode.react';
import { getHijriToday } from '../utils/recitationUtils';

// استيراد Supabase من الملف الموجود
import { supabase } from "../supabaseClient";
// استيراد مكتبة ضغط الصور
import imageCompression from 'browser-image-compression';

import {
  FaFileExcel,
  FaDownload,
  FaUpload,
  FaQuran,
  FaMicrophone,
  FaStar,
  FaStickyNote,
  FaUserPlus,
  FaTable,
  FaPencilAlt,
  FaTasks,
  FaBookOpen,
  FaCommentDots,
  FaAward,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaQuestionCircle,
  FaArrowLeft,
  FaHome,
  FaSyncAlt,
  FaSearch,
  FaArrowUp,
  FaCamera,
  FaQrcode,
  FaCopy,
  FaExternalLinkAlt,
  FaFileWord,
  FaUserMinus,
  FaCoins,
  FaRegStar,
  FaCalendarTimes,
  FaExclamationTriangle,
  FaTimes,
  FaCalendarAlt, 
  FaCalendarCheck 
} from "react-icons/fa";

import {
  getGradeNameById,
  getSectionNameById,
  calculateAverage,
  calculateBest,
  calculateCategoryScore,
  calculateSum,
  calculateTotalScore,
  getStatusInfo,
  getStatusColor,
  getTaskStatus,
  taskStatusUtils,
  determinePerformanceLevel
} from "../utils/gradeUtils";

import { getRecitationStatus } from "../utils/recitationUtils";
import { resetStudentData } from '../utils/resetDataUtils';

const convertToEnglishNumbers = (input) => {
  if (input === null || input === undefined) {
    return null;
  }
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  let output = String(input);
  for (let i = 0; i < arabicNumbers.length; i++) {
    output = output.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i]);
  }
  return output;
};


const StarRating = ({ count, max = 10, color = "yellow", size = "md" }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className="flex gap-1 items-center">
      <span className={`${sizes[size]} font-bold mr-2 text-${color}-400`}>{count}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, index) => (
          <FaStar
            key={index}
            className={`${sizes[size]} ${index < count ? 'text-${color}-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

// تم التعديل:
// performanceTasks: 4 مربعات (لتطبيق احسن درجة)
// oralTest تغيرت إلى classInteraction: 4 مربعات (الحد الأقصى 10)
const createEmptyGradesStructure = () => ({
    tests: Array(2).fill(null),
    homework: Array(10).fill(null),
    performanceTasks: Array(4).fill(null), // تم تعديل الحجم إلى 4
    participation: Array(10).fill(null),
    quranRecitation: Array(5).fill(null),
    quranMemorization: Array(5).fill(null),
    classInteraction: Array(4).fill(null), // تم تغيير oralTest إلى classInteraction
    // weeklyNotes: Array(20).fill(null), // تم إزالته
});


const SectionGrades = () => {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();
  const gradesSectionRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("المعلم الافتراضي");
  const [schoolName, setSchoolName] = useState("مدرسة متوسطة الطرف");
  const [currentSemester, setCurrentSemester] = useState("الفصل الدراسي الأول");
  
  // ==========================================================
  // NEW: حالات إدارة الفترات والمناهج الكاملة
  const [currentPeriod, setCurrentPeriod] = useState("period1"); // 'period1' or 'period2'
  const [showPeriodSelection, setShowPeriodSelection] = useState(true); 
  const [fullCurriculum, setFullCurriculum] = useState({ period1: [], period2: [] });
  const [fullHomeworkCurriculum, setFullHomeworkCurriculum] = useState({ period1: [], period2: [] });
  // ==========================================================
  
  const [curriculum, setCurriculum] = useState([]); // المنهج النشط
  const [homeworkCurriculum, setHomeworkCurriculum] = useState([]); // واجبات المنهج النشط
  
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showHomeworkCurriculumModal, setShowHomeworkCurriculumModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [showRecitationModal, setShowRecitationModal] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [testCalculationMethod, setTestCalculationMethod] = useState('average');
  const [newStudent, setNewStudent] = useState({
    name: "",
    nationalId: "",
    phone: "",
    parentPhone: "",
    photo: "",
  });
  const [newGrade, setNewGrade] = useState('');
  const [selectedHomework, setSelectedHomework] = useState('');
  const [homeworks, setHomeworks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [showTransferDeleteModal, setShowTransferDeleteModal] = useState(false);
  const [showGradeSheet, setShowGradeSheet] = useState(false);
  const [showBriefSheet, setShowBriefSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQrList, setShowQrList] = useState(false);
  const fileInputRef = useRef(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showBookAbsenceModal, setShowBookAbsenceModal] = useState(false);
  const [showTroubledStudentsModal, setShowTroubledStudentsModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const filePhotoInputRef = useRef(null);
  const newStudentFilePhotoInputRef = useRef(null);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("info");
  const [dialogAction, setDialogAction] = useState(null);

  const [facingMode, setFacingMode] = useState('user');
  const [qrCodesPerPage, setQrCodesPerPage] = useState(9);
  
  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showVisitLogModal, setShowVisitLogModal] = useState(false);
  
  const gradeName = getGradeNameById(gradeId);
  const sectionName = getSectionNameById(sectionId);

  const handleDialog = (title, message, type, action = null) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setDialogAction(() => action);
    setShowDialog(true);
  };

  const handleConfirmAction = () => {
    if (dialogAction) {
      dialogAction();
    }
    setShowDialog(false);
  };

  // دالة لجلب البيانات من Supabase
  const fetchDataFromSupabase = async () => {
    setIsRefreshing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        setIsRefreshing(false);
        return;
      }
      setTeacherId(user.id);

      // تأكد من جلب absences و book_absences بشكل صحيح
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*, absences(*), book_absences(*)')
        .eq('grade_level', gradeId)
        .eq('section', sectionId)
        .eq('teacher_id', user.id)
        .order('name');

      if (studentsError) throw studentsError;

      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .eq('teacher_id', user.id)
        .single();
      
      // ==========================================================
      // NEW: منطق جلب وتهيئة المناهج والفترات
      // ==========================================================
      let recitationCurriculum = { period1: [], period2: [] };
      let homeworkCurriculumData = { period1: [], period2: [] };
      let savedPeriod = 'period1';
      let savedTestMethod = 'average';
      let savedTeacherName = "المعلم الافتراضي";
      let savedSchoolName = "مدرسة متوسطة الطرف";
      let savedSemester = "الفصل الدراسي الأول";
      let periodSelected = false; // لتحديد ما إذا تم اختيار فترة من قبل

      if (curriculumData) {
          // التحقق من تنسيق المنهج وتغليفه (إذا كان قديماً)
          const recitation = curriculumData.recitation;
          const homework = curriculumData.homework;

          if (Array.isArray(recitation)) {
              recitationCurriculum = { period1: recitation, period2: [] };
          } else {
              recitationCurriculum = { 
                  period1: recitation?.period1 || [],
                  period2: recitation?.period2 || [],
              };
          }

          if (Array.isArray(homework)) {
               homeworkCurriculumData = { period1: homework, period2: [] };
          } else {
              homeworkCurriculumData = {
                  period1: homework?.period1 || [],
                  period2: homework?.period2 || [],
              };
          }
      }
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'general')
        .single();

      if (settingsData) {
        savedTeacherName = settingsData.teacher_name || savedTeacherName;
        savedSchoolName = settingsData.school_name || savedSchoolName;
        savedSemester = settingsData.current_semester || savedSemester;
        savedTestMethod = settingsData.test_method || savedTestMethod;
        savedPeriod = settingsData.current_period || 'period1'; 
        
        // ******************** التعديل لحل مشكلة ظهور شاشة التحديد دائماً ********************
        if (settingsData.current_period) {
            periodSelected = true;
        }
        // *********************************************************************************
      }

      setTeacherName(savedTeacherName);
      setSchoolName(savedSchoolName);
      setCurrentSemester(savedSemester);
      setTestCalculationMethod(savedTestMethod);
      setCurrentPeriod(savedPeriod); // تعيين الفترة الحالية

      // ******************** التعديل لحل مشكلة ظهور شاشة التحديد دائماً ********************
      setShowPeriodSelection(!periodSelected); // نعرض شاشة التحديد فقط إذا لم يتم اختيار فترة من قبل
      // *********************************************************************************

      setFullCurriculum(recitationCurriculum);
      setFullHomeworkCurriculum(homeworkCurriculumData);
      setCurriculum(recitationCurriculum[savedPeriod]);
      setHomeworkCurriculum(homeworkCurriculumData[savedPeriod]);
      
      // ==========================================================
      
      const { data: prizesData, error: prizesError } = await supabase
        .from('prizes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('cost');

      if (prizesError) throw prizesError;
      setPrizes(prizesData);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (announcementsError) {
        console.error("Error fetching announcements:", announcementsError);
      } else {
        setAnnouncements(announcementsData || []);
      }

      const parsedStudents = (studentsData || []).map(student => {
        
        // **********************************************************
        // الإصلاح الجذري: دالة قوية لضمان حجم المصفوفة ونقل البيانات
        // **********************************************************
        const ensureGradesArraySize = (array, size) => {
            const newArray = Array(size).fill(null);
            const sourceArray = array && Array.isArray(array) ? array : [];
            
            // نقل القيم الموجودة من المصفوفة المصدر إلى المصفوفة الجديدة
            for (let i = 0; i < Math.min(sourceArray.length, size); i++) {
                newArray[i] = sourceArray[i];
            }
            return newArray;
        };

        // ==========================================================
        // NEW: منطق تهيئة وتغليف الدرجات للفترتين (الملاحظات موحدة)
        // ==========================================================
        let grades = student.grades || {};
        let fullGrades;
        
        // استخلاص الملاحظات الأسبوعية الموحدة أولاً
        let weeklyNotes = grades.weeklyNotes || grades.weekly_notes || Array(20).fill(null);

        // التحقق والتغليف لـ grades
        if (!grades.period1 && !grades.period2 && Object.keys(grades).length > 0) {
            // هذا هو التنسيق القديم، نحذف weeklyNotes قبل التغليف لتوحيدها
            const { weeklyNotes: _, weekly_notes: __, ...oldGradesWithoutNotes } = grades;

            // تطبيق التهيئة على الهيكل القديم أيضاً لضمان التوافق مع الأحجام الجديدة
            const oldPeriod1 = {
                tests: ensureGradesArraySize(oldGradesWithoutNotes.tests, 2),
                homework: ensureGradesArraySize(oldGradesWithoutNotes.homework, 10),
                // **تأكيد قراءة المهام الأدائية من المفتاحين (camelCase أو snake_case)**
                performanceTasks: ensureGradesArraySize(oldGradesWithoutNotes.performanceTasks || oldGradesWithoutNotes.performance_tasks, 4), 
                participation: ensureGradesArraySize(oldGradesWithoutNotes.participation, 10),
                // FIX: قراءة الحقول بالصيغة snake_case أو camelCase (للتوافق)
                quranRecitation: ensureGradesArraySize(oldGradesWithoutNotes.quranRecitation || oldGradesWithoutNotes.quran_recitation, 5),
                quranMemorization: ensureGradesArraySize(oldGradesWithoutNotes.quranMemorization || oldGradesWithoutNotes.quran_memorization, 5),
                // FIX: جلب بيانات oralTest القديمة (classInteraction)
                classInteraction: ensureGradesArraySize(oldGradesWithoutNotes.classInteraction || oldGradesWithoutNotes.oralTest || oldGradesWithoutNotes.oral_test, 4), 
            };

            fullGrades = {
                period1: oldPeriod1,
                period2: createEmptyGradesStructure(),
            };
        } else {
            // تطبيق التهيئة على البيانات المحفوظة في period1 و period2
            fullGrades = {
                period1: {
                    tests: ensureGradesArraySize(grades.period1?.tests, 2),
                    homework: ensureGradesArraySize(grades.period1?.homework, 10),
                     // **تأكيد قراءة المهام الأدائية من المفتاحين (camelCase أو snake_case)**
                    performanceTasks: ensureGradesArraySize(grades.period1?.performanceTasks || grades.period1?.performance_tasks, 4),
                    participation: ensureGradesArraySize(grades.period1?.participation, 10),
                    // FIX: قراءة الحقول بالصيغة snake_case أو camelCase (للتوافق)
                    quranRecitation: ensureGradesArraySize(grades.period1?.quranRecitation || grades.period1?.quran_recitation, 5),
                    quranMemorization: ensureGradesArraySize(grades.period1?.quranMemorization || grades.period1?.quran_memorization, 5),
                    // FIX: جلب بيانات classInteraction أو oralTest القديمة
                    classInteraction: ensureGradesArraySize(grades.period1?.classInteraction || grades.period1?.oralTest || grades.period1?.oral_test, 4),
                },
                period2: {
                    tests: ensureGradesArraySize(grades.period2?.tests, 2),
                    homework: ensureGradesArraySize(grades.period2?.homework, 10),
                     // **تأكيد قراءة المهام الأدائية من المفتاحين (camelCase أو snake_case)**
                    performanceTasks: ensureGradesArraySize(grades.period2?.performanceTasks || grades.period2?.performance_tasks, 4),
                    participation: ensureGradesArraySize(grades.period2?.participation, 10),
                    // FIX: قراءة الحقول بالصيغة snake_case أو camelCase (للتوافق)
                    quranRecitation: ensureGradesArraySize(grades.period2?.quranRecitation || grades.period2?.quran_recitation, 5),
                    quranMemorization: ensureGradesArraySize(grades.period2?.quranMemorization || grades.period2?.quran_memorization, 5),
                    // FIX: جلب بيانات classInteraction أو oralTest القديمة
                    classInteraction: ensureGradesArraySize(grades.period2?.classInteraction || grades.period2?.oralTest || grades.period2?.oral_test, 4),
                },
            };
        }

        const activeGrades = fullGrades[savedPeriod]; // استخدام الدرجات النشطة

        const studentGrades = {
          // تعيين حقول الدرجات (في الـ State) مع الأحجام الجديدة
          tests: activeGrades?.tests,
          homework: activeGrades?.homework,
          performanceTasks: activeGrades?.performanceTasks, // الدرجات النشطة
          participation: activeGrades?.participation,
          quranRecitation: activeGrades?.quranRecitation, 
          quranMemorization: activeGrades?.quranMemorization, 
          classInteraction: activeGrades?.classInteraction, 
          weeklyNotes: ensureGradesArraySize(weeklyNotes, 20), // استخدام الملاحظات الموحدة
        };
        
        // تعديل الهيكل الكامل ليعكس التسمية الجديدة عند الجلب (للتمرير لـ updateStudentsData)
        const fullGradesUpdated = {
             period1: fullGrades.period1,
             period2: fullGrades.period2,
             weeklyNotes: studentGrades.weeklyNotes
        }
        // ==========================================================

        const studentWithStars = {
          ...student,
          id: student.id.toString(),
          grades: studentGrades, // الدرجات النشطة المعروضة
          acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
          // *** الإصلاح: تغيير consumed_consumedStars إلى consumed_stars ***
          consumedStars: student.consumed_stars || 0, 
          // *** الإصلاح: التأكد من استخدام consumed_stars ***
          stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0), 
          fullGrades: fullGradesUpdated, // الهيكل الكامل المحدث
          viewKey: student.view_key || `/grades/${gradeId}/sections/${sectionId}/students/${student.id}`,
          absences: (student.absences || []).map(a => a.absence_date),
          bookAbsences: (student.book_absences || []).map(b => b.absence_date), 
          nationalId: student.national_id,
          parentPhone: student.parent_phone,
          phone: student.phone,
          photo: student.photo
        };

        if (!studentWithStars.viewKey) {
          studentWithStars.viewKey = `/student-view/${student.id}-${Date.now()}`;
        }
        return studentWithStars;
      }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

      setStudents(parsedStudents);

    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
      handleDialog("خطأ", "حدث خطأ أثناء جلب البيانات من قاعدة البيانات", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDataFromSupabase();
  }, [gradeId, sectionId]);

  // NEW: دالة لحفظ طريقة حساب الاختبارات (إصلاح الخطأ)
  const handleTestCalculationMethodChange = async (method) => { 
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ الإعدادات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'general',
          test_method: method
        }, { onConflict: 'id' });

      if (error) throw error;

      setTestCalculationMethod(method);
    } catch (error) {
      console.error("Error saving test method:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ طريقة حساب الاختبارات", "error");
    }
  };

  // NEW: دالة للتبديل بين الفترات
  const handlePeriodChange = (period) => {
      // 1. تحديث الفترة النشطة وحفظها في الإعدادات
      setCurrentPeriod(period);
      handleSaveCurrentPeriod(period);
      
      // 2. تحديث المنهج المعروض
      const newRecitationCurriculum = fullCurriculum[period];
      const newHomeworkCurriculum = fullHomeworkCurriculum[period];
      
      setCurriculum(newRecitationCurriculum);
      setHomeworkCurriculum(newHomeworkCurriculum);
      
      // 3. تحديث بيانات الطلاب المعروضة
      const updatedStudents = students.map(student => {
          // هنا لا حاجة لإعادة التهيئة، فقط استخدام البيانات المحدثة التي تم جلبها في fetchDataFromSupabase
          const activeGrades = student.fullGrades[period]; 
          
          const studentGrades = {
            tests: activeGrades?.tests,
            homework: activeGrades?.homework,
            performanceTasks: activeGrades?.performanceTasks,
            participation: activeGrades?.participation,
            quranRecitation: activeGrades?.quranRecitation,
            quranMemorization: activeGrades?.quranMemorization,
            classInteraction: activeGrades?.classInteraction,
            weeklyNotes: student.fullGrades.weeklyNotes,
          };
          
          return { ...student, grades: studentGrades };
      });
      setStudents(updatedStudents);

      // ******************** التعديل لحل مشكلة عدم تحديث الطالب المختار ********************
      if (selectedStudent) {
          const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent.id);
          setSelectedStudent(updatedSelectedStudent);
      }
      // *********************************************************************************
      
      setShowPeriodSelection(false); // الانتقال إلى واجهة الدرجات
  };
  
  // NEW: دالة لحفظ الفترة النشطة في الإعدادات
  const handleSaveCurrentPeriod = async (period) => {
    if (!teacherId) return;
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'general',
          current_period: period 
        }, { onConflict: 'id' });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving current period:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ الفترة النشطة", "error");
    }
  };


  // دالة لتحديث بيانات الطلاب في Supabase (تم التعديل لدمج الفترتين)
  const updateStudentsData = async (updatedStudents) => {
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ البيانات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
        const sortedStudents = [...updatedStudents].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        
        // 1. إعادة بناء الدرجات الكاملة قبل الحفظ
        const studentsToUpdate = sortedStudents.map(student => {
            
            // دمج الدرجات المعدلة في الهيكل الكامل (fullGrades)
            const updatedFullGrades = {
                ...(student.fullGrades || {}),
                // حفظ التعديلات في الفترة النشطة (currentPeriod)
                [currentPeriod]: { 
                    tests: student.grades.tests,
                    classInteraction: student.grades.classInteraction, // NEW: حفظ التفاعل الصفي
                    homework: student.grades.homework,
                    performance_tasks: student.grades.performanceTasks, // **الحفظ بصيغة snake_case ليتوافق مع DB**
                    participation: student.grades.participation,
                    quran_recitation: student.grades.quranRecitation, // FIX: snake_case
                    quran_memorization: student.grades.quranMemorization, // FIX: snake_case
                }
            };
            
            return {
                id: student.id,
                name: student.name,
                national_id: student.nationalId,
                phone: student.phone,
                parent_phone: student.parentPhone,
                photo: student.photo,
                // *** الإصلاح: استخدام acquiredStars و consumedStars للحساب ***
                stars: (student.acquiredStars || 0) - (student.consumedStars || 0),
                acquired_stars: student.acquiredStars,
                consumed_stars: student.consumedStars, 
                recitation_history: student.recitation_history, 
                grades: {
                    period1: updatedFullGrades.period1,
                    period2: updatedFullGrades.period2,
                    weeklyNotes: student.grades.weeklyNotes, // NEW: حفظ الملاحظات على مستوى الجذر (موحدة)
                },
                grade_level: gradeId,
                section: sectionId,
                teacher_id: teacherId,
            };
        });

        // 2. تحديث الحالة المحلية بالهيكل الجديد (لضمان التزامن الفوري)
        const studentsWithUpdatedFullGrades = sortedStudents.map(s => {
             const studentToUpdate = studentsToUpdate.find(u => u.id === s.id);
             if (studentToUpdate) {
                 const fullGradesData = studentToUpdate.grades;
                 const activePeriodGradesFromDB = fullGradesData[currentPeriod];

                 return { 
                     ...s, 
                     // *** الإصلاح: تحديث acquiredStars و consumedStars و stars بناءً على القيم المحدثة ***
                     acquiredStars: studentToUpdate.acquired_stars,
                     consumedStars: studentToUpdate.consumed_stars,
                     stars: studentToUpdate.stars, // قيمة النجوم الحالية المحسوبة بشكل صحيح
                     // تحديث fullGrades
                     fullGrades: { period1: fullGradesData.period1, period2: fullGradesData.period2, weeklyNotes: fullGradesData.weeklyNotes },
                     // تحديث الدرجات النشطة بما في ذلك الملاحظات الموحدة
                     grades: { 
                         ...s.grades, 
                         weeklyNotes: fullGradesData.weeklyNotes,
                         tests: activePeriodGradesFromDB.tests,
                         classInteraction: activePeriodGradesFromDB.classInteraction, 
                         // **التعديل لضمان قراءة المفتاح المحفوظ (performance_tasks) وتعيينه للحالة المحلية (performanceTasks)**
                         performanceTasks: activePeriodGradesFromDB.performance_tasks,
                         participation: activePeriodGradesFromDB.participation,
                         quranRecitation: activePeriodGradesFromDB.quran_recitation, 
                         quranMemorization: activePeriodGradesFromDB.quran_memorization,
                         homework: activePeriodGradesFromDB.homework,
                     }
                 };
             }
             return s;
        });
        setStudents(studentsWithUpdatedFullGrades);


        // 3. حفظ البيانات في Supabase
        const { error } = await supabase
            .from('students')
            .upsert(studentsToUpdate, { onConflict: 'national_id' });

        if (error) {
            console.error("Error updating students data:", error);
            handleDialog("خطأ", "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات", "error");
            fetchDataFromSupabase(); 
        } else {
            console.log("Students data saved successfully!");
        }
    } catch (error) {
        console.error("Error updating students data:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات", "error");
    }
  };

  // دالة لتحديث منهج التلاوة (تم التعديل لدمج الفترتين)
  const updateCurriculumData = async (updatedCurriculum) => {
    // ... (الكود الأصلي هنا)
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ المنهج. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
        // دمج المنهج الجديد في الهيكل الكامل للفترتين
        const updatedFullCurriculum = {
            ...fullCurriculum,
            [currentPeriod]: updatedCurriculum // تحديث الفترة النشطة
        };

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_level: gradeId,
                section: sectionId,
                recitation: updatedFullCurriculum, // حفظ الهيكل الكامل
                homework: fullHomeworkCurriculum, // حفظ واجبات المنهج الحالي
                teacher_id: teacherId,
            }, { onConflict: 'grade_level,section' });

        if (error) throw error;

        setFullCurriculum(updatedFullCurriculum);
        setCurriculum(updatedCurriculum); // تحديث الحالة المعروضة
    } catch (error) {
      console.error("Error updating curriculum:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ المنهج في قاعدة البيانات", "error");
    }
  };

  // دالة لتحديث منهج الواجبات (تم التعديل لدمج الفترتين)
  const updateHomeworkCurriculumData = async (updatedCurriculum) => {
    // ... (الكود الأصلي هنا)
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ الواجبات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
        // دمج المنهج الجديد في الهيكل الكامل للفترتين
        const updatedFullHomeworkCurriculum = {
            ...fullHomeworkCurriculum,
            [currentPeriod]: updatedCurriculum // تحديث الفترة النشطة
        };

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_level: gradeId,
                section: sectionId,
                recitation: fullCurriculum, // حفظ منهج التلاوة الحالي
                homework: updatedFullHomeworkCurriculum, // حفظ الهيكل الكامل
                teacher_id: teacherId,
            }, { onConflict: 'grade_level,section' });

        if (error) throw error;

        setFullHomeworkCurriculum(updatedFullHomeworkCurriculum);
        setHomeworkCurriculum(updatedCurriculum); // تحديث الحالة المعروضة
    } catch (error) {
      console.error("Error updating homework curriculum:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ واجبات المنهج في قاعدة البيانات", "error");
    }
  };

  const handleDeleteNote = (studentId, weekIndex, noteIndex) => {
    // ... (الكود الأصلي هنا)
    handleDialog(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذه الملاحظة؟",
      "confirm",
      async () => {
        try {
          const updatedStudents = students.map(s => {
            if (s.id === studentId) {
              const updatedNotes = [...(s.grades.weeklyNotes || [])];
              if (updatedNotes[weekIndex]) {
                updatedNotes[weekIndex] = updatedNotes[weekIndex].filter((_, i) => i !== noteIndex);
              }
              return {
                ...s,
                grades: {
                  ...s.grades,
                  weeklyNotes: updatedNotes
                }
              };
            }
            return s;
          });

          await updateStudentsData(updatedStudents);
          setSelectedStudent(updatedStudents.find(s => s.id === studentId));
          handleDialog("نجاح", "تم حذف الملاحظة بنجاح", "success");
        } catch (error) {
          console.error("Error deleting note:", error);
          handleDialog("خطأ", "حدث خطأ أثناء حذف الملاحظة", "error");
        }
      }
    );
  };


  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    if (gradesSectionRef.current) {
        gradesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const startCamera = async () => {
    // ... (الكود الأصلي هنا)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode
        }
       });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("خطأ في الوصول إلى الكاميرا: ", err);
      handleDialog("خطأ", "لا يمكن الوصول إلى الكاميرا. تأكد من إعطاء الصلاحيات.", "error");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    // ... (الكود الأصلي هنا)
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    // ... (الكود الأصلي هنا)
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

  const handleFileUpload = async (e, isNewStudent) => {
    // ... (الكود الأصلي هنا)
    const file = e.target.files[0];
    if (file) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        const compressedFile = await imageCompression(file, options);

        const reader = new FileReader();
        reader.onloadend = () => {
          if (isNewStudent) {
            setNewStudent({ ...newStudent, photo: reader.result });
          } else {
            setEditingStudent({ ...editingStudent, photo: reader.result });
          }
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("خطأ في ضغط الصورة:", error);
        handleDialog("خطأ", "حدث خطأ أثناء معالجة الصورة.", "error");
      }
    }
  };

  const exportToExcel = async () => {
    // تم تعديل هذه الدالة لتعكس المنطق الجديد للاحتساب
    try {
      const [{ utils, write }, { saveAs }] = await Promise.all([
        import('xlsx'),
        import('file-saver')
      ]);
      
      const gradesHeaders = {
        tests: ["اختبار 1 (20)", "اختبار 2 (20)"], 
        homework: Array.from({ length: 10 }, (_, i) => `واجب ${i + 1} (1)`),
        performanceTasks: Array.from({ length: 4 }, (_, i) => `مهمة أدائية ${i + 1} (10)`), 
        participation: Array.from({ length: 10 }, (_, i) => `مشاركة ${i + 1} (1)`),
        quranRecitation: Array.from({ length: 5 }, (_, i) => `تلاوة ${i + 1} (10)`),
        quranMemorization: Array.from({ length: 5 }, (_, i) => `حفظ ${i + 1} (10)`), 
        classInteraction: Array.from({ length: 4 }, (_, i) => `تفاعل صفي ${i + 1} (10)`), 
      };

      const data = students.map(student => {
        const studentRow = {
          'اسم الطالب': student.name,
          'السجل المدني': student.nationalId,
          'رقم ولي الأمر': student.parentPhone,
          'الفترة النشطة': currentPeriod === 'period1' ? 'الأولى' : 'الثانية',
        };

        Object.keys(gradesHeaders).forEach(category => {
          const categoryKey = category === 'classInteraction' ? 'classInteraction' : category;
          gradesHeaders[category].forEach((header, index) => {
            studentRow[header] = student.grades[categoryKey]?.[index] ?? '';
          });
        });

        // 1. الاختبارات: المجموع الكلي (Sum)
        const testsScore = parseFloat(calculateCategoryScore(student.grades, 'tests', 'sum'));
        studentRow['مجموع الاختبارات (40)'] = testsScore;

        // 2. الواجبات: المجموع (Sum)
        const homeworkScore = parseFloat(calculateCategoryScore(student.grades, 'homework', 'sum'));
        studentRow['مجموع الواجبات (10)'] = homeworkScore;

        // 3. المهام الأدائية: أفضل درجة (Best)
        const performanceScore = parseFloat(calculateCategoryScore(student.grades, 'performanceTasks', 'best'));
        studentRow['مجموع المهام الأدائية (10)'] = performanceScore;

        // 4. المشاركات: المجموع (Sum)
        const participationScore = parseFloat(calculateCategoryScore(student.grades, 'participation', 'sum'));
        studentRow['مجموع المشاركات (10)'] = participationScore;
        
        // 5. التفاعل الصفي: أفضل درجة (Best)
        const classInteractionScore = parseFloat(calculateCategoryScore(student.grades, 'classInteraction', 'best'));
        studentRow['مجموع التفاعل الصفي (10)'] = classInteractionScore;

        // 6. القرآن: التلاوة (Average) + الحفظ (Average) (تم التعديل)
        const quranRecitationScore = parseFloat(calculateCategoryScore(student.grades, 'quranRecitation', 'average'));
        const quranMemorizationScore = parseFloat(calculateCategoryScore(student.grades, 'quranMemorization', 'average')); 
        studentRow['مجموع التلاوة (10)'] = quranRecitationScore.toFixed(2);
        studentRow['مجموع الحفظ (10)'] = quranMemorizationScore.toFixed(2);
        studentRow['مجموع القرآن (20)'] = (quranRecitationScore + quranMemorizationScore).toFixed(2);
        
        // **الإصلاح للمجموع النهائي:**
        const totalScore = testsScore + homeworkScore + performanceScore + participationScore + classInteractionScore + quranRecitationScore + quranMemorizationScore;
        studentRow['المجموع النهائي (100)'] = totalScore.toFixed(2);
        studentRow['النجوم الحالية'] = student.stars;

        return studentRow;
      });

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, `الطلاب والدرجات - الفترة ${currentPeriod === 'period1' ? 'الأولى' : 'الثانية'}`);

      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `بيانات_ودرجات_${gradeName}_${sectionName}_${currentPeriod}.xlsx`);
      handleDialog("نجاح", "تم تصدير الملف بنجاح!", "success");
    } catch (error) {
      handleDialog("خطأ", 'حدث خطأ أثناء تصدير الملف: ' + error.message, "error");
    }
  };

  const handleFileImport = async (e) => {
    // ... (الكود الأصلي هنا)
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      const xlsx = await import('xlsx');
      const { read, utils } = xlsx;
  
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
  
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet);
  
          const updatedStudents = [];
          
          const { data: studentsFromDB, error: fetchError } = await supabase
            .from('students')
            .select('national_id')
            .eq('grade_level', gradeId)
            .eq('section', sectionId)
            .eq('teacher_id', teacherId);
  
          if (fetchError) throw fetchError;
          const existingNationalIds = new Set(studentsFromDB.map(s => s.national_id));
  
          let importedCount = 0;
          let skippedCount = 0;
          let skippedIds = [];
  
          for (const row of jsonData) {
            const nationalId = String(row['السجل المدني']);
            if (!nationalId || nationalId.length < 5) {
              console.warn(`Skipping row with invalid national ID: ${JSON.stringify(row)}`);
              skippedCount++;
              continue;
            }
  
            if (existingNationalIds.has(nationalId)) {
              skippedCount++;
              skippedIds.push(nationalId);
              continue;
            }
  
            // NEW: إنشاء هيكل درجات كامل
            const emptyGrades = createEmptyGradesStructure();

            const studentToAdd = {
              name: row['اسم الطالب'] || '',
              national_id: nationalId,
              phone: row['رقم الهاتف'] || '',
              parent_phone: row['رقم ولي الأمر'] || '',
              photo: row['صورة الطالب'] || '/images/1.webp',
              stars: 0,
              acquired_stars: 0,
              consumed_stars: 0,
              recitation_history: [],
              grades: {
                  period1: emptyGrades,
                  period2: emptyGrades,
                  weeklyNotes: Array(20).fill(null), // الملاحظات موحدة
              },
              absences: [],
              book_absences: [],
              grade_level: gradeId,
              section: sectionId,
              teacher_id: teacherId,
            };
            updatedStudents.push(studentToAdd);
            importedCount++;
          }
  
          if (importedCount > 0) {
            // لا نحتاج لـ updateStudentsData لأننا هنا نضيف طلاب جدد
            const { error: insertError } = await supabase.from('students').insert(updatedStudents);
            if (insertError) throw insertError;

            handleDialog("نجاح", `تم استيراد ${importedCount} طالب بنجاح!`, "success");
            fetchDataFromSupabase();
          }
  
          if (skippedCount > 0) {
            handleDialog("تحذير", `تم تجاهل ${skippedCount} طالب بسبب وجودهم مسبقًا أو بيانات غير صالحة.`, "warning");
          }
  
          if (importedCount === 0 && skippedCount === 0) {
            handleDialog("تحذير", "لم يتم العثور على أي طلاب جدد صالحين للاستيراد.", "warning");
          }
  
        } catch (error) {
          console.error("Error importing file:", error);
          handleDialog("خطأ", `حدث خطأ أثناء استيراد الملف: ${error.message}`, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      handleDialog("خطأ", `حدث خطأ في تحميل مكتبة XLSX: ${error.message}`, "error");
    }
  };


const handleAddStudent = async () => {
    // ... (الكود الأصلي هنا)
    if (!newStudent.name || !newStudent.nationalId) {
      handleDialog("خطأ", "يرجى إدخال الاسم والسجل المدني", "error");
      return;
    }
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن إضافة الطالب. معرف المعلم غير متوفر.", "error");
      return;
    }

    try {
      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('national_id', newStudent.nationalId)
        .eq('teacher_id', teacherId)
        .single();

      if (existingStudent) {
        handleDialog("خطأ", "هذا السجل المدني مسجل مسبقًا لطالب آخر", "error");
        return;
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // NEW: إنشاء هيكل درجات كامل
      const emptyGrades = createEmptyGradesStructure();

      const studentToAdd = {
        name: newStudent.name,
        national_id: newStudent.nationalId,
        phone: newStudent.phone,
        parent_phone: newStudent.parentPhone,
        photo: newStudent.photo || '/images/1.webp',
        stars: 0,
        acquired_stars: 0,
        consumed_stars: 0,
        recitation_history: [],
        grades: {
            period1: emptyGrades,
            period2: emptyGrades,
            weeklyNotes: Array(20).fill(null), // الملاحظات موحدة
        },
        grade_level: gradeId,
        section: sectionId,
        teacher_id: teacherId,
      };

      const { error } = await supabase
        .from('students')
        .insert([studentToAdd]);

      if (error) throw error;

      setShowAddStudentModal(false);
      setNewStudent({ name: "", nationalId: "", phone: "", parentPhone: "", photo: "" });
      handleDialog("نجاح", "تم إضافة الطالب بنجاح!", "success");

      fetchDataFromSupabase();
    } catch (error) {
      console.error("Error adding student:", error);
      handleDialog("خطأ", "حدث خطأ أثناء إضافة الطالب", "error");
    }
  };

  const updateStudentGrade = async (studentId, category, index, value) => {
    // تم تعديل منطق تحديد الحد الأقصى
    const englishValue = convertToEnglishNumbers(value);
    const numValue = englishValue === '' ? null : Number(englishValue);
    let maxLimit = 0;
    let errorMessage = '';

    switch(category) {
      case 'tests': maxLimit = 20; errorMessage = "خطأ: درجة الاختبار لا يمكن أن تتجاوز 20."; break; // تم التعديل
      case 'classInteraction': maxLimit = 10; errorMessage = "خطأ: درجة التفاعل الصفي لا يمكن أن تتجاوز 10."; break; // تم التعديل (مكان oralTest)
      case 'homework': maxLimit = 1; errorMessage = "خطأ: درجة الواجب لا يمكن أن تتجاوز 1."; break;
      case 'performanceTasks': maxLimit = 10; errorMessage = "خطأ: درجة المهمة الأدائية لا يمكن أن تتجاوز 10."; break; // تم التعديل
      case 'participation': maxLimit = 1; errorMessage = "خطأ: درجة المشاركة لا يمكن أن تتجاوز 1."; break;
      case 'quranRecitation': maxLimit = 10; errorMessage = "خطأ: درجة تلاوة القرآن لا يمكن أن تتجاوز 10."; break;
      case 'quranMemorization': maxLimit = 10; errorMessage = "خطأ: درجة حفظ القرآن لا يمكن أن تتجاوز 10."; break; // تم التعديل
      default: break;
    }
    
    // التحقق من صلاحية القيمة المدخلة
    if (numValue !== null && (numValue > maxLimit || numValue < 0)) {
      handleDialog("خطأ", errorMessage, "error");
      
      // مسح القيمة من الحقل في الواجهة فقط
      const updatedStudents = students.map(s => {
        if (s.id === studentId) {
          const newGrades = [...(s.grades[category] || [])];
          newGrades[index] = null;
          return {
            ...s,
            grades: {
              ...s.grades,
              [category]: newGrades,
            },
          };
        }
        return s;
      });
      setStudents(updatedStudents);
      // لا نحتاج لـ updateStudentsData هنا لأن القيمة غير صالحة
      return;
    }

    try {
      const updatedStudents = students.map((student) => {
        if (student.id === studentId) {
          const updatedGrades = { ...student.grades };
          if (Array.isArray(updatedGrades[category])) {
            // منطق إزالة المربعات من اليسار (إذا كان الحجم الحالي أكبر من الحجم المطلوب)
            const requiredSize = updatedGrades[category].length; 
            if (index < requiredSize) {
                updatedGrades[category][index] = numValue;
            }
          } else {
            updatedGrades[category] = numValue;
          }
          
          // تحديث بيانات الطالب المختار لتعكس التغيير فوراً
          if (selectedStudent && selectedStudent.id === studentId) {
             setSelectedStudent({ ...student, grades: updatedGrades });
          }
          
          return { ...student, grades: updatedGrades };
        }
        return student;
      });

      setStudents(updatedStudents);
      await updateStudentsData(updatedStudents); // الحفظ يتضمن منطق دمج الفترات
      const updatedSelectedStudent = updatedStudents.find(s => s.id === studentId);
      if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    } catch (error) {
      console.error("Error updating grade:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث الدرجة", "error");
    }
  };

  const updateStudentStars = async (updatedStudents) => {
    // ... (الكود الأصلي هنا)
    try {
      const studentsWithCalculatedStars = updatedStudents.map(student => ({
        ...student,
        stars: (student.acquiredStars || 0) - (student.consumedStars || 0)
      }));

      await updateStudentsData(studentsWithCalculatedStars);
      if (selectedStudent) {
        const updatedStudent = studentsWithCalculatedStars.find(s => s.id === selectedStudent.id);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }

      setShowStarsModal(false);
    } catch (error) {
      console.error("Error updating stars:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث النجوم", "error");
    }
  };

  const updateRecitationData = async (updatedStudents) => {
    // ... (الكود الأصلي هنا)
    try {
      await updateStudentsData(updatedStudents);
      const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
      if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    } catch (error) {
      console.error("Error updating recitation:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث بيانات التسميع", "error");
    }
  };

  const updateNotesData = async (updatedStudents) => {
    // ... (الكود الأصلي هنا)
    try {
      // قم بتحديث الحالة المحلية أولاً
      setStudents(updatedStudents);
      
      // ثم قم بحفظ البيانات في قاعدة البيانات
      await updateStudentsData(updatedStudents);
      
      const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
      if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    } catch (error) {
      console.error("Error updating notes:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث الملاحظات", "error");
    }
  };


const updateAbsenceData = async (updatedStudents) => {
    // ... (الكود الأصلي هنا)
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ البيانات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
      for (const student of updatedStudents) {
        // نحتاج إلى استخدام البيانات الأصلية من studentBaseData (student.id) للحفظ في الجداول المنفصلة
        // ولكن لا يوجد studentBaseData هنا، لذا نعتمد على student.id
        const { error: deleteError } = await supabase
          .from('absences')
          .delete()
          .eq('student_id', student.id)
          .eq('teacher_id', teacherId);
        
        if (deleteError) throw deleteError;
        
        // استخدام student.absences المعدل من الـ Modal
        const newAbsences = (student.absences || []).map(date => ({
          student_id: student.id,
          absence_date: date,
          teacher_id: teacherId
        }));

        if (newAbsences.length > 0) {
          const { error: insertError } = await supabase
            .from('absences')
            .insert(newAbsences);
          
          if (insertError) throw insertError;
        }
      }
      
      // يجب إعادة جلب البيانات لضمان تحديث الـ state
      await fetchDataFromSupabase();
      handleDialog("نجاح", "تم تحديث بيانات الغياب بنجاح!", "success");

    } catch (error) {
      console.error("Error updating absence:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث بيانات الغياب", "error");
    }
  };

const updateBookAbsenceData = async (updatedStudents) => {
    // ... (الكود الأصلي هنا)
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ البيانات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
      for (const student of updatedStudents) {
        // حذف جميع السجلات الحالية في جدول book_absences لهذا الطالب
        const { error: deleteError } = await supabase
          .from('book_absences')
          .delete()
          .eq('student_id', student.id)
          .eq('teacher_id', teacherId);

        if (deleteError) throw deleteError;

        // إدراج السجلات الجديدة (المعدلة من الـ Modal)
        const newBookAbsences = (student.bookAbsences || []).map(date => ({
          student_id: student.id,
          absence_date: date,
          teacher_id: teacherId
        }));
        
        if (newBookAbsences.length > 0) {
          const { error: insertError } = await supabase
            .from('book_absences')
            .insert(newBookAbsences);
          
          if (insertError) throw insertError;
        }
      }
      
      // يجب إعادة جلب البيانات لضمان تحديث الـ state وعرضها بشكل صحيح في الـ Modal
      await fetchDataFromSupabase();
      handleDialog("نجاح", "تم تحديث بيانات عدم إحضار الكتاب بنجاح!", "success");

    } catch (error) {
      console.error("Error updating book absence:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث بيانات عدم إحضار الكتاب", "error");
    }
  };

  const getTroubledStudents = () => {
    // ... (الكود الأصلي هنا)
    const troubled = new Set();
    students.forEach(student => {
      const homeworkStatus = taskStatusUtils(student, homeworkCurriculum, 'homework');
      if (homeworkStatus.text === 'لم يحل' || homeworkStatus.text === 'متأخر' || homeworkStatus.text === 'حل جزئي') {
        troubled.add({ student, reason: `متعثر في الواجبات` });
      }

      const performanceStatus = taskStatusUtils(student, homeworkCurriculum, 'performanceTask');
      if (performanceStatus.text === 'لم يحل' || performanceStatus.text === 'متأخر' || performanceStatus.text === 'حل جزئي') {
        troubled.add({ student, reason: `متعثر في المهام الأدائية` });
      }

      const recitationStatus = getRecitationStatus(student, 'recitation', curriculum);
      if (recitationStatus.status === 'not_memorized' || recitationStatus.status === 'late') {
        troubled.add({ student, reason: `متعثر في التلاوة` });
      }

      const memorizationStatus = getRecitationStatus(student, 'memorization', curriculum);
      if (memorizationStatus.status === 'not_memorized' || memorizationStatus.status === 'late') {
        troubled.add({ student, reason: `متعثر في الحفظ` });
      }
    });
    return Array.from(troubled);
  };

  const handleEditStudent = async () => {
    // ... (الكود الأصلي هنا)
    if (!editingStudent.name || !editingStudent.nationalId) {
      handleDialog("خطأ", "يرجى إدخال الاسم والسجل المدني", "error");
      return;
    }

    try {
      const updatedStudents = students.map(student =>
        student.id === editingStudent.id ? {
          ...editingStudent,
          stars: (editingStudent.acquiredStars || 0) - (editingStudent.consumedStars || 0)
        } : student
      );

      await updateStudentsData(updatedStudents);
      setShowEditStudentModal(false);
      setEditingStudent(null);
      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent({
          ...editingStudent,
          stars: (editingStudent.acquiredStars || 0) - (editingStudent.consumedStars || 0)
        });
      }
      handleDialog("نجاح", "تم تعديل بيانات الطالب بنجاح!", "success");
    } catch (error) {
      console.error("Error editing student:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تعديل بيانات الطالب", "error");
    }
  };

  const filteredStudents = students
    .filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQrClick = (student) => {
    // ... (الكود الأصلي هنا)
    handleDialog(
      "تأكيد الانتقال",
      `هل تريد الانتقال إلى صفحة الطالب ${student.name}؟`,
      "confirm",
      () => window.open(student.viewKey, '_blank')
    );
  };

  const copyStudentLink = (viewKey) => {
    // ... (الكود الأصلي هنا)
    navigator.clipboard.writeText(`${window.location.origin}${viewKey}`);
    handleDialog("نجاح", "تم نسخ الرابط بنجاح!", "success");
  };

  const dataURLToUint8Array = (dataURL) => {
    // ... (الكود الأصلي هنا)
    const base64 = dataURL.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

const handleExportQRCodes = async () => {
  // ... (الكود الأصلي هنا)
  try {
    handleDialog("جاري التصدير", "جاري إنشاء ملف الوورد، الرجاء الانتظار...", "info");
    const [{ Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType }, { toDataURL }, { saveAs }] = await Promise.all([
      import('docx'),
      import('qrcode'),
      import('file-saver')
    ]);

    const dataURLToUint8Array = (dataUrl) => {
      const base64 = dataUrl.split(',')[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const sections = [];

    let columns;
    if (qrCodesPerPage === 1) {
      columns = 1;
    } else if (qrCodesPerPage === 9) {
      columns = 3;
    } else {
      columns = 4;
    }

    for (let i = 0; i < filteredStudents.length; i += qrCodesPerPage) {
      const batch = filteredStudents.slice(i, i + qrCodesPerPage);
      const studentCells = [];

      for (const student of batch) {
        try {
          const qrDataUrl = await toDataURL(`${window.location.origin}${student.viewKey}`, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 150,
          });

          const qrImage = dataURLToUint8Array(qrDataUrl);

          studentCells.push(
            new TableCell({
              children: [
                new Paragraph({ text: student.name, alignment: AlignmentType.CENTER, style: 'studentName' }),
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: qrImage,
                      transformation: { width: 120, height: 120 },
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: `${gradeName} - ${sectionName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `المدرسة: ${schoolName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `المعلم: ${teacherName}`, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `${currentSemester}`, alignment: AlignmentType.CENTER }),
              ],
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
            })
          );
        } catch (error) {
          console.error(`Error processing student ${student.name}:`, error);
        }
      }

      const rows = [];
      for (let j = 0; j < studentCells.length; j += columns) {
        rows.push(
          new TableRow({
            children: studentCells.slice(j, j + columns),
          })
        );
      }

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      });

      sections.push({
        properties: {},
        children: [
          new Paragraph({
            text: `كشوفات طلاب ${gradeName} - ${sectionName} - الفترة ${currentPeriod === 'period1' ? 'الأولى' : 'الثانية'}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph({ text: " " }),
          table,
        ],
      });
    }

    // FIX: تم إصلاح خطأ doc.styles غير المعرف، وذلك بإزالة الكود
    // doc.styles ...
    // واستبداله بتهيئة بسيطة لـ Document
    const doc = new Document({
      sections: sections,
    });


    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `بيانات_ودرجات_${gradeId}_${sectionId}_${currentPeriod}.docx`);
      handleDialog("نجاح", "تم تصدير الملف بنجاح!", "success");
    });
  } catch (error) {
    handleDialog("خطأ", "حدث خطأ أثناء تصدير الملف. الرجاء المحاولة مرة أخرى.", "error");
    }
  };

  const handleDownloadImage = async () => {
    // ... (الكود الأصلي هنا)
    handleDialog("جاري التنزيل", "الرجاء الانتظار، جاري تحويل ورقة القوائم إلى صورة...", "info");
    try {
      const [{ toPng }] = await Promise.all([
        import('html-to-image')
      ]);
      const [{ saveAs }] = await import('file-saver');
      const node = document.getElementById("grades-sheet-to-image");
      const dataUrl = await toPng(node);
      const blob = await fetch(dataUrl).then(res => res.blob());
      saveAs(blob, 'student-grades-sheet.png');
      handleDialog("نجاح", "تم تنزيل الصورة بنجاح!", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تنزيل الصورة. الرجاء المحاولة مرة أخرى.", "error");
    }
  };

  const handleUpdatePrizes = (updatedPrizes) => {
    // ... (الكود الأصلي هنا)
    setPrizes(updatedPrizes);
  };

  const handleAddGrade = () => {
    // ... (الكود الأصلي هنا)
    if (newGrade && selectedHomework) {
      const newGradeEntry = createGradeEntry(parseInt(newGrade, 10), sectionTitle, new Date().toISOString().slice(0, 10));
      onAddGrade(selectedHomework, newGradeEntry);

      onUpdateHomeworkStatus(selectedHomework, 'تم الحل');

      setNewGrade('');
      setSelectedHomework('');
    }
  };

  // تم تحديث الدوال لحساب المجموع الجديد (من 100)
  // **تم إزالة الدوال الغير مستخدمة**

  const handleResetDataClick = () => {
    // ... (الكود الأصلي هنا)
    handleDialog(
      "تأكيد حذف البيانات",
      "هل أنت متأكد من حذف درجات وملاحظات جميع الطلاب؟ لا يمكن التراجع عن هذا الإجراء.",
      "confirm",
      () => {
        setShowVerificationModal(true);
      }
    );
  };

  const onVerificationSuccess = async (user) => {
    // ... (الكود الأصلي هنا)
    if (user.id !== teacherId) {
      handleDialog("خطأ", "بيانات الاعتماد غير صحيحة أو لا تطابق حسابك.", "error");
      return;
    }

    setShowVerificationModal(false);
    await resetStudentData(students, teacherId, handleDialog, fetchDataFromSupabase);
  };
  
  // ==========================================================
  // NEW: دوال حساب المجاميع الفرعية (لحل مشكلة المجموع النهائي)
  // ==========================================================

  // 1. حساب التقييمات الرئيسية (الاختبارات + القرآن) (Max 60)
  const calculateMajorAssessments = (grades) => {
      // الاختبارات: المجموع (Max 40)
      const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum'));
      // التلاوة: المتوسط (Max 10)
      const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average'));
      // الحفظ: المتوسط (Max 10)
      const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average'));

      return (testsScore + recitationScore + memorizationScore).toFixed(2);
  };

  // 2. حساب أعمال السنة (Homework, Participation, Performance, Interaction) (Max 40)
  const calculateCoursework = (grades) => {
      // الواجبات: المجموع (Max 10)
      const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum'));
      // المشاركة: المجموع (Max 10)
      const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum'));
      // المهام الأدائية: أفضل درجة (Max 10)
      const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best'));
      // التفاعل الصفي: أفضل درجة (Max 10)
      const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best'));
      
      return (homeworkScore + participationScore + performanceScore + classInteractionScore).toFixed(2);
  };
  
  // **حل مشكلة المجموع النهائي: استخدام المجاميع الفرعية الجديدة**
  const calculateFinalTotalScore = (grades) => {
      const majorAssessments = parseFloat(calculateMajorAssessments(grades));
      const coursework = parseFloat(calculateCoursework(grades));
      
      // يجب إضافة الواجبات والقرآن من أعمال السنة الكبرى لحساب المجموع الكلي (100)
      // المجموع = الاختبارات (40) + الواجبات (10) + المهام الأدائية (10) + المشاركة (10) + التفاعل الصفي (10) + التلاوة (10) + الحفظ (10) = 100
      
      // نعتمد على دالة calculateTotalScore الأصلية في gradeUtils للتأكد
      const totalScoreFromUtils = parseFloat(calculateTotalScore(grades, testCalculationMethod));
      
      // نستخدم الحساب اليدوي لضمان التوافق مع الشاشة الجديدة
      const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum'));
      const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average'));
      const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average'));
      const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum'));
      const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum'));
      const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best'));
      const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best'));

      const finalTotal = testsScore + recitationScore + memorizationScore + homeworkScore + participationScore + performanceScore + classInteractionScore;
      
      return finalTotal.toFixed(2);
  };
  
  // ==========================================================
  // NEW: واجهة تحديد الفترة - تم تحديثها بالكامل
  // ==========================================================
  const PeriodSelectionScreen = () => (
    // تم تعديل الخلفية من bg-gray-800 إلى تدرج لوني
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] border-2 border-blue-600/50 max-w-lg mx-auto mt-10 md:mt-20 text-center animate-fadeIn">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6 tracking-wider">
            اختر فترة التقييم
        </h2>
        <p className="text-lg text-gray-300 mb-10 border-b border-gray-700 pb-6">
            أنت الآن في فصل <strong className="text-blue-300">{gradeName} - {sectionName}</strong>.
            يرجى اختيار الفترة التي تود العمل عليها.
        </p>
        <div className="flex flex-col gap-6">
            <button
                onClick={() => handlePeriodChange("period1")}
                // تم تحديث تنسيقات الأزرار لتكون أكثر جاذبية
                className={`w-full py-4 text-xl font-extrabold rounded-xl transition-all duration-300 transform hover:scale-[1.02] 
                    shadow-xl flex items-center justify-center gap-3
                    ${currentPeriod === "period1" 
                        ? "bg-gradient-to-r from-green-600 to-teal-500 text-white shadow-green-700/50 ring-4 ring-teal-400/50" 
                        : "bg-gray-700 text-green-400 hover:bg-gray-600 border border-green-500 hover:shadow-2xl hover:shadow-green-500/30"
                    }`}
            >
                <FaCalendarAlt className="text-2xl" /> 
                <span className="text-xl">الفترة</span>
                <span className="text-lg">(الأولى)</span>
            </button>
            <button
                onClick={() => handlePeriodChange("period2")}
                // تم تحديث تنسيقات الأزرار لتكون أكثر جاذبية
                className={`w-full py-4 text-xl font-extrabold rounded-xl transition-all duration-300 transform hover:scale-[1.02] 
                    shadow-xl flex items-center justify-center gap-3
                    ${currentPeriod === "period2" 
                        ? "bg-gradient-to-r from-green-600 to-teal-500 text-white shadow-green-700/50 ring-4 ring-teal-400/50" 
                        : "bg-gray-700 text-green-400 hover:bg-gray-600 border border-green-500 hover:shadow-2xl hover:shadow-green-500/30"
                    }`}
            >
                <FaCalendarCheck className="text-2xl" /> 
                <span className="text-xl">الفترة</span>
                <span className="text-lg">(الثانية)</span>
            </button>
        </div>
        <button
          onClick={() => navigate(`/grades/${gradeId}`)}
          className="mt-10 flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-lg text-sm mx-auto hover:ring-2 ring-red-300"
        >
          <FaArrowLeft /> العودة للفصول
        </button>
    </div>
  );
  
  if (showPeriodSelection) {
      return (
          <div className="p-4 md:p-8 max-w-8xl mx-auto font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen" dir="rtl">
              <header className="flex flex-col md:flex-row justify-center items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center">
                  <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-0">
                      <div className="flex flex-col">
                          <h1 className="text-xl md:text-3xl font-extrabold text-blue-400">{schoolName}</h1>
                          <p className="text-sm md:text-lg font-medium text-gray-400">{teacherName}</p>
                      </div>
                      <img src="/images/moe_logo_white.png" alt="شعار وزارة التعليم" className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
              </header>
              <style>{`
                /* Simple fade-in animation for the main container */
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                  animation: fadeIn 0.5s ease-out;
                }
              `}</style>
              <PeriodSelectionScreen />
          </div>
      );
  }


  return (
    <div className="p-4 md:p-8 max-w-8xl mx-auto font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen" dir="rtl">
      <header className="flex flex-col md:flex-row justify-center items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700">
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
      
      {/* ========================================================== */}
      {/* زر الرجوع إلى واجهة تحديد الفترة */}
      {/* ========================================================== */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => setShowPeriodSelection(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-sm"
        >
          <FaArrowLeft /> الرجوع لتحديد الفترة
        </button>
      </div>
      {/* ========================================================== */}


      <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          <button onClick={() => setShowAddStudentModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm">
            <FaUserPlus /> إضافة طالب
          </button>
          <button onClick={exportToExcel} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-xs md:text-sm">
            <FaDownload /> تصدير Excel
          </button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm">
            <FaUpload /> استيراد Excel
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" />
          </button>
          <button onClick={() => setShowCurriculumModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-md text-xs md:text-sm">
            <FaQuran /> منهج القران الكريم
          </button>
          <button onClick={() => setShowRecitationModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors shadow-md text-xs md:text-sm">
            <FaMicrophone /> كشف التسميع
          </button>
          <button onClick={() => setShowHomeworkCurriculumModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-xs md:text-sm">
            <FaTasks /> الواجبات و المهام و الاختبارات
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
          <button
            onClick={() => setShowQrList(!showQrList)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaQrcode /> {showQrList ? "إخفاء QR" : "عرض QR"}
          </button>
          <button
            onClick={() => setShowTransferDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaUserMinus /> نقل و حذف
          </button>
          <button
            onClick={() => setShowAbsenceModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaCalendarTimes /> كشف الغياب
          </button>
          <button
            onClick={() => setShowBookAbsenceModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaBookOpen /> كشف الكتب
          </button>
          <button
            onClick={() => setShowTroubledStudentsModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaExclamationTriangle /> كشف المتعثرين
          </button>
          <button
            onClick={() => setShowAnnouncementsModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaStickyNote /> إعلانات هامة
          </button>
          <button
            onClick={() => setShowVisitLogModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-400 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaClock /> سجل الزيارات
          </button>
          <button
            onClick={handleResetDataClick}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaTimesCircle /> حذف كل الدرجات والملاحظات
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* الفترة الحالية (لإظهارها داخل الصفحة بعد التحديد) */}
      {/* ========================================================== */}
      <div className="flex justify-center gap-4 mb-4 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <h4 className="font-bold text-lg text-white">الفترة النشطة: {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'}</h4>
      </div>
      {/* ========================================================== */}


      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 md:mb-6">
        <div className="relative flex items-center w-full md:w-auto mt-4 md:mt-0">
          <FaSearch className="absolute right-3 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-2 pr-10 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
            inputMode="text"
          />
        </div>
        {/* الحاوية الجديدة مع التنسيق المقترح */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:justify-end md:gap-4 md:flex-grow">
          <button
            onClick={() => {
              setShowGradeSheet(!showGradeSheet);
              setShowBriefSheet(false);
              setSelectedStudent(null);
              setShowQrList(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-xs sm:text-sm"
          >
            <FaTable /> {showGradeSheet ? "إخفاء الكشف" : "كشف الدرجات الشامل"}
          </button>
          <button
            onClick={() => {
              setShowBriefSheet(!showBriefSheet);
              setShowGradeSheet(false);
              setSelectedStudent(null);
              setShowQrList(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-xs sm:text-sm"
          >
            <FaTable /> {showBriefSheet ? "إخفاء الكشف" : "كشف مختصر"}
          </button>
          <button onClick={() => navigate(`/grades/${gradeId}`)} className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-xs sm:text-sm">
            <FaArrowLeft /> العودة للفصول
          </button>
          <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-xs sm:text-sm">
            <FaHome /> الصفحة الرئيسية
          </button>
          <button onClick={fetchDataFromSupabase} className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-xs sm:text-sm">
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

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <CustomModal title="إضافة طالب جديد" onClose={() => { setShowAddStudentModal(false); setNewStudent({ name: "", nationalId: "", phone: "", parentPhone: "", photo: "" }); }}>
          <div className="flex items-center justify-center mb-4">
            <img src={newStudent.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
          </div>
          <input type="text" placeholder="اسم الطالب" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="السجل المدني" value={newStudent.nationalId} onChange={(e) => setNewStudent({ ...newStudent, nationalId: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="رقم ولي الأمر" value={newStudent.parentPhone} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <div className="flex flex-col gap-2 mb-4">
            <label className="block text-sm font-medium text-gray-300 text-right">إضافة صورة الطالب:</label>
            <button onClick={() => newStudentFilePhotoInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm" >
              <FaUpload /> رفع صورة
            </button>
            <input type="file" ref={newStudentFilePhotoInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddStudent} className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm">
              حفظ الطالب
            </button>
            <button onClick={() => setShowAddStudentModal(false)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm" >
              إلغاء
            </button>
          </div>
        </CustomModal>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <CustomModal title="تعديل بيانات الطالب" onClose={() => { setShowEditStudentModal(false); setEditingStudent(null); }}>
          <div className="flex items-center justify-center mb-4">
            <img src={editingStudent.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
          </div>
          <input type="text" placeholder="اسم الطالب" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="السجل المدني" value={editingStudent.nationalId} onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="رقم ولي الأمر" value={editingStudent.parentPhone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <div className="flex flex-col gap-2 mb-4">
            <label className="block text-sm font-medium text-gray-300 text-right">تغيير صورة الطالب:</label>
            <button onClick={() => filePhotoInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm" >
              <FaUpload /> رفع صورة
            </button>
            <input type="file" ref={filePhotoInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, false)} className="hidden" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleEditStudent} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm" >
              حفظ التغييرات
            </button>
            <button onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm" >
              إلغاء
            </button>
          </div>
        </CustomModal>
      )}

      {showQrList && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white text-center">رموز QR للطلاب</h2>
             <div className="flex items-center gap-4">
                 <label htmlFor="qr-count" className="text-sm font-medium text-gray-300">
                     رموز لكل صفحة:
                 </label>
                 <select
                     id="qr-count"
                     value={qrCodesPerPage}
                     onChange={(e) => setQrCodesPerPage(Number(e.target.value))}
                     className="bg-gray-700 text-white text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                     <option value={1}>1</option>
                     <option value={9}>9</option>
                     <option value={12}>12</option>
                 </select>
                 <button
                    onClick={() => handleExportQRCodes()}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-xs md:text-sm"
                 >
                   <FaFileWord /> تصدير QR كملف Word
                 </button>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredStudents.map(student => (
              <div key={student.id} onClick={() => handleQrClick(student)} className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center transition-transform transform hover:scale-105 cursor-pointer">
                {/* تم تعديل حجم الخط إلى text-base */}
                <h4 className="text-base font-bold text-blue-400 mb-2 break-words text-center">{student.name}</h4>
                <StudentQrCode viewKey={`/grades/${gradeId}/sections/${sectionId}/students/${student.id}`} size={150} />
                {/* تم تعديل حجم الخط إلى text-sm */}
                <span className="mt-2 text-sm text-gray-400 break-words text-center">{student.nationalId}</span>
                <span className="text-sm text-gray-300 break-words text-center">{gradeName} - {sectionName}</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyStudentLink(`/grades/${gradeId}/sections/${sectionId}/students/${student.id}`);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-xs"
                  >
                    <FaCopy /> نسخ الرابط
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQrClick(student);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-xs"
                  >
                    <FaExternalLinkAlt /> فتح الصفحة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showGradeSheet && !showBriefSheet && !showQrList && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-700">
          <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">
            الطلاب في {gradeName} - {sectionName} (الفترة {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'})
          </h3>
          <div className="flex flex-wrap justify-start gap-4 pb-4 md:pb-6 mb-4 md:mb-6">
            {filteredStudents.length === 0 ? (
              <p className="text-gray-400 text-lg text-center w-full">لا يوجد طلاب في هذا الفصل حاليًا. يمكنك إضافة طالب جديد أو استيراد بيانات.</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} onClick={() => handleSelectStudent(student)} className={`flex items-center gap-4 p-4 border rounded-xl w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-sm ${selectedStudent?.id === student.id ? "border-blue-500 bg-gray-700 shadow-lg" : "border-gray-700 bg-gray-800 hover:bg-gray-700"}`}>
                  <div className="flex-shrink-0">
                    <img src={student.photo || '/images/1.webp'} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                  </div>
                  {/* تم تعديل حجم الخط للعنوان إلى text-base */}
                  <div className="flex-grow text-right min-w-0">
                    <h4 className="font-bold text-base text-white break-words">{student.name}</h4>
                    <p className="text-sm text-gray-400 break-words">السجل: {student.nationalId}</p>
                    <div className="flex items-center justify-between mt-1">
                      {student.parentPhone && (
                        <p className="text-xs text-gray-400 break-words">ولي الأمر: {student.parentPhone}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                          setShowNotesModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="الملاحظات"
                      >
                        <FaStickyNote />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStudent(student);
                          setShowEditStudentModal(true);
                        }}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
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

      {selectedStudent && !showGradeSheet && !showBriefSheet && !showQrList && (
        <div ref={gradesSectionRef} className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 border border-gray-700" dir="rtl">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
            {/* إصلاح مشكلة الأقواس واستخدام Template Literals */}
            <div className="flex flex-col text-right min-w-0 flex-grow">
              <h3 className="text-xl md:text-2xl font-bold text-blue-400 break-words">
                {`درجات الطالب: ${selectedStudent.name} (الفترة ${currentPeriod === 'period1' ? 'الأولى' : 'الثانية'})`}
              </h3>
              <p className="text-sm md:text-md text-gray-400 break-words">السجل المدني: {selectedStudent.nationalId}</p>
              <p className="text-sm md:text-md text-gray-400 break-words">رقم ولي الأمر: {selectedStudent.parentPhone}</p>
            </div>
            <div className="relative flex-shrink-0">
              <img src={selectedStudent.photo || '/images/1.webp'} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* 1. المجموع النهائي (100) */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                  {/* **تطبيق دالة الحساب الجديدة/المؤكدة للمجموع النهائي** */}
                  <span className="text-xl md:text-2xl font-bold text-green-500">{calculateFinalTotalScore(selectedStudent.grades)} / 100</span>
                </div>
                <FaAward className="text-4xl text-green-400" />
              </div>
            </div>

            {/* 3. أعمال السنة (40) */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المهام الأدائية والمشاركة والتفاعل الصفي
</h4>
                  <span className="text-xl md:text-2xl font-bold text-yellow-400">{calculateCoursework(selectedStudent.grades)} / 40</span>
                </div>
                <FaTasks className="text-4xl text-yellow-400" />
              </div>
            </div>

            {/* 2. التقييمات الرئيسية (الاختبارات + القرآن) (60) */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">تقويمات شفهية وتحريرية</h4>
                  <span className="text-xl md:text-2xl font-bold text-blue-400">{calculateMajorAssessments(selectedStudent.grades)} / 60</span>
                </div>
                <FaBookOpen className="text-4xl text-blue-400" />
              </div>
            </div>
            
                        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 col-span-1 flex flex-col items-center justify-center">
              <h4 className="font-semibold text-gray-100 text-lg mb-4">النجوم</h4>
              <div className="flex flex-col items-center justify-center w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-3xl text-yellow-400" />
                    <span className="text-md font-semibold text-yellow-400">الحالية</span>
                    <span className="text-lg font-bold text-yellow-400">({selectedStudent.stars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={`total-${i}`}
                        className={`text-xl ${i < (selectedStudent.stars || 0) ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-3xl text-green-400" />
                    <span className="text-md font-semibold text-green-400">المكتسبة</span>
                    <span className="text-lg font-bold text-green-400">({selectedStudent.acquiredStars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={`acquired-${i}`}
                        className={`text-xl ${i < (selectedStudent.acquiredStars || 0) ? 'text-green-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FaRegStar className="text-3xl text-red-400" />
                    <span className="text-md font-semibold text-red-400">المستهلكة</span>
                    <span className="text-lg font-bold text-red-400">({selectedStudent.consumedStars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={`consumed-${i}`}
                        className={`text-xl ${i < (selectedStudent.consumedStars || 0) ? 'text-red-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* --- المجاميع الفرعية التفصيلية --- */}

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaBookOpen className="text-3xl text-red-400" /> الاختبارات
                <span className="text-red-400 font-bold mr-2 text-2xl">
                  {/* تم التعديل: استخدام المجموع الكلي 'sum' */}
                  {calculateCategoryScore(selectedStudent.grades, 'tests', 'sum')} / 40
                </span>
              </h4>
                          <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة الاختبارات</h5>
                {taskStatusUtils(selectedStudent, homeworkCurriculum, 'test').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(selectedStudent, homeworkCurriculum, 'test').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                {selectedStudent.grades.tests.slice(0, 2).map((grade, i) => (
                  <input key={i} type="text" inputMode="numeric" placeholder={`--`} value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "tests", i, e.target.value)} className="w-20 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" style={{ touchAction: 'manipulation' }} />
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaMicrophone className="text-3xl text-yellow-400" /> التفاعل الصفي  <span className="text-yellow-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'classInteraction', 'best')} / 10</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                {selectedStudent.grades.classInteraction.slice(0, 4).map((grade, i) => (
                  <input key={i} type="text" inputMode="numeric" placeholder={`--`} value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "classInteraction", i, e.target.value)} className="w-16 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500" style={{ touchAction: 'manipulation' }} />
                ))}
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaTasks className="text-3xl text-green-400" /> الواجبات
                <span className="text-green-400 font-bold mr-2 text-2xl">
                  {calculateCategoryScore(selectedStudent.grades, 'homework', 'sum')} / 10
                </span>
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة الواجبات</h5>
                {taskStatusUtils(selectedStudent, homeworkCurriculum, 'homework').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(selectedStudent, homeworkCurriculum, 'homework').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                {selectedStudent.grades.homework.slice(0, 10).map((grade, i) => (
                  <input key={i} type="text" inputMode="numeric" placeholder={`--`} value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "homework", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" style={{ touchAction: 'manipulation' }} />
                ))}
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaPencilAlt className="text-3xl text-purple-400" /> المهام الأدائية
                <span className="text-purple-400 font-bold mr-2 text-2xl">
                  {calculateCategoryScore(selectedStudent.grades, 'performanceTasks', 'best')} / 10
                </span>
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة المهام</h5>
                {taskStatusUtils(selectedStudent, homeworkCurriculum, 'performanceTask').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(selectedStudent, homeworkCurriculum, 'performanceTask').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                {selectedStudent.grades.performanceTasks.slice(0, 4).map((grade, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    placeholder={`--`}
                    value={grade === null ? '' : grade}
                    onChange={(e) => updateStudentGrade(selectedStudent.id, "performanceTasks", i, e.target.value)}
                    className="w-16 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    style={{ touchAction: 'manipulation' }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaCommentDots className="text-3xl text-cyan-400" /> المشاركة  <span className="text-cyan-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'participation', 'sum')} / 10</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                {selectedStudent.grades.participation.slice(0, 10).map((grade, i) => (
                  <input key={i} type="text" inputMode="numeric" placeholder={`--`} value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "participation", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" style={{ touchAction: 'manipulation' }} />
                ))}
              </div>
            </div>

<div className="col-span-full md:col-span-2 lg:col-span-3 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
  <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
    <FaQuran className="text-3xl text-blue-400" /> القرآن الكريم
    <span className="text-blue-400 font-bold mr-2 text-2xl">
      {/* تم التعديل: التلاوة (Average) + الحفظ (Average) */}
      {(parseFloat(calculateCategoryScore(selectedStudent.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(selectedStudent.grades, 'quranMemorization', 'average'))).toFixed(2)} / 20
    </span>
  </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-100">تلاوة القرآن </h5>
                    {getStatusInfo(selectedStudent, 'recitation', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(selectedStudent, 'recitation', curriculum).text})
                    </span>
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(selectedStudent.grades, 'quranRecitation', 'average')} / 10</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                    {selectedStudent.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        placeholder={`--`}
                        value={grade === null ? '' : grade}
                        onChange={(e) => updateStudentGrade(selectedStudent.id, "quranRecitation", i, e.target.value)}
                        className="w-12 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ touchAction: 'manipulation' }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-100">حفظ القرآن </h5>
                    {getStatusInfo(selectedStudent, 'memorization', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(selectedStudent, 'memorization', curriculum).text})
                    </span>
                    {/* تم التعديل: أصبح Average */}
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(selectedStudent.grades, 'quranMemorization', 'average')} / 10</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* تم تغيير text-sm إلى text-base وإضافة touchAction: 'manipulation' */}
                    {selectedStudent.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        placeholder={`--`}
                        value={grade === null ? '' : grade}
                        onChange={(e) => updateStudentGrade(selectedStudent.id, "quranMemorization", i, e.target.value)}
                        className="w-12 p-2 border border-gray-600 rounded-lg text-center text-base bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ touchAction: 'manipulation' }}
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
  {/* NEW: Last 5 Notes Section */}
  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
    <h5 className="font-bold text-gray-200 mb-2">آخر الملاحظات</h5>
    <div className="h-px bg-gray-600 mb-2"></div>
    {selectedStudent.grades.weeklyNotes?.reduce((acc, notes, weekIndex) => {
      notes?.forEach(note => {
        acc.push({ note, weekIndex });
      });
      return acc;
    }, []).reverse().slice(0, 5).length > 0 ? (
      selectedStudent.grades.weeklyNotes.reduce((acc, notes, weekIndex) => {
        notes?.forEach(note => {
          acc.push({ note, weekIndex });
        });
        return acc;
      }, []).reverse().slice(0, 5).map((item, index) => (
        <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
          <p className="text-sm text-gray-300">
            <span className="font-bold">الأسبوع {item.weekIndex + 1}:</span> {item.note}
          </p>
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-sm text-center">لا توجد ملاحظات حاليًا.</p>
    )}
  </div>
  {/* END OF NEW SECTION */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
    {(selectedStudent.grades.weeklyNotes || []).map((notes, weekIndex) => (
      <div key={weekIndex} className="bg-gray-800 p-3 rounded-lg border border-gray-600 min-h-[120px] relative">
        <h5 className="font-bold text-gray-200 mb-1 text-center">الأسبوع {weekIndex + 1}</h5>
        <div className="h-px bg-gray-600 mb-2"></div>
        {notes && notes.length > 0 ? (
          <ul className="list-none pr-0 text-gray-300 text-sm space-y-1">
            {notes.map((note, noteIndex) => (
              <li key={noteIndex} className="pb-1 flex justify-between items-start border-b border-gray-700 last:border-b-0">
                <span>{note}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(selectedStudent.id, weekIndex, noteIndex);
                  }}
                  className="text-red-400 hover:text-red-300 text-xs p-1"
                  title="حذف الملاحظة"
                >
                  <FaTimesCircle />
                </button>
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
      )}

      <button
        onClick={scrollToTop}
        className="fixed bottom-8 left-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-colors z-50"
        aria-label="العودة لأعلى الصفحة"
      >
        <FaArrowUp />
      </button>

      {showNotesModal && (
        <NotesModal
          students={students}
          onClose={() => setShowNotesModal(false)}
          onSave={updateNotesData}
          onConfirmNotesClear={(action) => handleDialog("تأكيد الحذف", "هل أنت متأكد من حذف الملاحظات الأسبوعية للطلاب المحددين؟", "confirm", action)}
        />
      )}

      {showStarsModal && (
        <StarsModal
          students={students}
          onClose={() => setShowStarsModal(false)}
          onSave={updateStudentStars}
          prizes={prizes}
          onUpdatePrizes={handleUpdatePrizes}
          teacherId={teacherId}
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

      {showCurriculumModal && (
        <CurriculumModal
          gradeId={gradeId}
          sectionId={sectionId}
          currentPeriod={currentPeriod} // تمرير الفترة
          onClose={() => {
            setShowCurriculumModal(false);
            fetchDataFromSupabase();
          }}
        />
      )}

      {showGradesModal && (
        <GradesModal
          students={students}
          curriculum={curriculum}
          onClose={() => setShowGradesModal(false)}
          onSave={updateStudentsData}
          testCalculationMethod={testCalculationMethod}
          onTestCalculationMethodChange={handleTestCalculationMethodChange}
        />
      )}

      {showHomeworkCurriculumModal && (
        <HomeworkCurriculumModal
          gradeId={gradeId}
          sectionId={sectionId}
          currentPeriod={currentPeriod} // تمرير الفترة
          onClose={() => {
            setShowHomeworkCurriculumModal(false);
            fetchDataFromSupabase();
          }}
        />
      )}

      {showGradeSheet && (
        <GradesSheet
          students={students}
          calculateTotalScore={calculateFinalTotalScore} // استخدام دالة الحساب الجديدة
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemester}
          testCalculationMethod={testCalculationMethod}
          onTestCalculationMethodChange={handleTestCalculationMethodChange}
          updateStudentGrade={updateStudentGrade}
          getRecitationStatus={getRecitationStatus}
          taskStatusUtils={taskStatusUtils}
          getStatusColor={getStatusColor}
          curriculum={curriculum}
          homeworkCurriculum={homeworkCurriculum}
        />
      )}

      {showBriefSheet && (
        <BriefSheet
          students={students}
          calculateTotalScore={calculateFinalTotalScore} // استخدام دالة الحساب الجديدة
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemester}
          handleTestCalculationMethodChange={handleTestCalculationMethodChange}
        />
      )}

      {showDialog && (
        <CustomDialog
          title={dialogTitle}
          message={dialogMessage}
          type={dialogType}
          onConfirm={handleConfirmAction}
          onClose={() => setShowDialog(false)}
        />
      )}

      {showTransferDeleteModal && (
        <TransferDeleteModal
          show={showTransferDeleteModal}
          onClose={() => setShowTransferDeleteModal(false)}
          students={students}
          updateStudentsData={updateStudentsData}
          handleDialog={handleDialog}
          gradeId={gradeId}
          sectionId={sectionId}
          teacherId={teacherId}
        />
      )}

{showAbsenceModal && (
    <AbsenceModal
        students={students}
        onClose={() => {
            setShowAbsenceModal(false);
            fetchDataFromSupabase();
        }}
        onSave={updateAbsenceData}
        handleDialog={handleDialog}
    />
)}

{showBookAbsenceModal && (
    <BookAbsenceModal
        students={students}
        onClose={() => {
            setShowBookAbsenceModal(false);
            fetchDataFromSupabase();
        }}
        onSave={updateBookAbsenceData}
        handleDialog={handleDialog}
    />
)}
      {/* **الاستدعاء الصحيح لمودال الطلاب المتعثرين (تم حل مشكلة التنسيق)** */}
      {showTroubledStudentsModal && (
        <TroubledStudentsModal
          students={students}
          onClose={() => setShowTroubledStudentsModal(false)}
          homeworkCurriculum={homeworkCurriculum}
          recitationCurriculum={curriculum}
          gradeName={gradeName}
          sectionName={sectionName}
          onSave={updateNotesData} 
          // **هنا تم تمرير الدالة handleDialog**
          handleDialog={handleDialog} 
        />
      )}

      {showHomeworkModal && (
        <HomeworkModal
          students={students}
          onClose={() => setShowHomeworkModal(false)}
          onSave={updateStudentsData}
          homeworkCurriculum={homeworkCurriculum}
        />
      )}

      {showVerificationModal && (
        <VerificationModal
          onClose={() => setShowVerificationModal(false)}
          onVerificationSuccess={onVerificationSuccess}
          teacherId={teacherId}
        />
      )}
      
      {/* New Modal for Announcements */}
      {showAnnouncementsModal && (
        <AnnouncementsModal
          announcements={announcements}
          onClose={() => setShowAnnouncementsModal(false)}
          gradeId={gradeId}
          sectionId={sectionId}
          teacherId={teacherId}
          onSave={setAnnouncements}
          handleDialog={handleDialog}
        />
      )}
      
      {showVisitLogModal && (
        <VisitLogModal
          show={showVisitLogModal}
          onClose={() => setShowVisitLogModal(false)}
          students={students}
          teacherId={teacherId}
        />
      )}

    </div>
  );
};


export default SectionGrades;
