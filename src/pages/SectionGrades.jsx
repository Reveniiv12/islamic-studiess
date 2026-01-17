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
import DailyAttendanceModal from "../components/DailyAttendanceModal.jsx";
import TroubledStudentsModal from "../components/TroubledStudentsModal.jsx";
import CustomDialog from "../components/CustomDialog";
import VerificationModal from "../components/VerificationModal.jsx";
import CustomModal from "../components/CustomModal.jsx";
import AnnouncementsModal from "../components/AnnouncementsModal";
import VisitLogModal from "../components/VisitLogModal.jsx";
import RewardRequestsModal from '../components/RewardRequestsModal'; 
import RewardRequestsButton from '../components/RewardRequestsButton'; 
import { QRCodeSVG } from 'qrcode.react';
import { getHijriToday } from '../utils/recitationUtils';
import StudentControlPanel from '../components/StudentControlPanel'; 
import FilterGradesModal from "../components/FilterGradesModal";
import { FaCogs } from "react-icons/fa"; 

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
  FaCalendarCheck,
  FaFilter,
  FaGift 
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

// **********************************************************
// دوال الهيكلة والتهيئة
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
            className={`${sizes[size]} ${index < count ? `text-${color}-400` : 'text-gray-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

// هيكلية فترة واحدة (فارغة)
const createEmptyGradesStructure = () => ({
    tests: Array(2).fill(null),
    homework: Array(10).fill(null),
    performanceTasks: Array(4).fill(null), 
    participation: Array(10).fill(null),
    quranRecitation: Array(5).fill(null),
    quranMemorization: Array(5).fill(null),
    classInteraction: Array(4).fill(null), 
});

// هيكلية فصل دراسي كامل (فترتين + ملاحظات + نجوم)
const createEmptySemesterStructure = () => ({
    period1: createEmptyGradesStructure(),
    period2: createEmptyGradesStructure(),
    weeklyNotes: Array(20).fill(null),
    stars: { acquired: 0, consumed: 0 } // إضافة هيكل النجوم لكل فصل
});


const SectionGrades = () => {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();
  const gradesSectionRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("المعلم الافتراضي");
  const [schoolName, setSchoolName] = useState("مدرسة متوسطة الطرف");
  const [currentSemesterName, setCurrentSemesterName] = useState("الفصل الدراسي الأول");
  
  // ==========================================================
  // States for Periods and Semester
  const [currentPeriod, setCurrentPeriod] = useState("period1"); // 'period1' or 'period2'
  const [activeSemesterKey, setActiveSemesterKey] = useState("semester1"); // 'semester1' or 'semester2'
  const [showPeriodSelection, setShowPeriodSelection] = useState(true); 
  
  const [fullCurriculum, setFullCurriculum] = useState({ period1: [], period2: [] });
  const [fullHomeworkCurriculum, setFullHomeworkCurriculum] = useState({ period1: [], period2: [] });
  // ==========================================================
  
  const [curriculum, setCurriculum] = useState([]); 
  const [homeworkCurriculum, setHomeworkCurriculum] = useState([]); 
  
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showHomeworkCurriculumModal, setShowHomeworkCurriculumModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showStarsModal, setShowStarsModal] = useState(false);
  // NEW: Reward Requests State
  const [showRewardRequestsModal, setShowRewardRequestsModal] = useState(false); 
  
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
  const [qrCodesPerPage, setQrCodesPerPage] = useState(9); // (ملاحظة: هذا المتغير يمكن إهماله أو تحديثه للنظام الجديد)
  
  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [showVisitLogModal, setShowVisitLogModal] = useState(false);
  
  const gradeName = getGradeNameById(gradeId);
  const sectionName = getSectionNameById(sectionId);
  const [showControlPanel, setShowControlPanel] = useState(false); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // **********************************************
  // حالة جديدة لتحديد الطلاب لطباعة QR
  // **********************************************
  const [selectedQrStudentIds, setSelectedQrStudentIds] = useState(new Set()); 


  // ==========================================================
  // دالة التحقق من وجود المنهج لتلوين الخانات
  // ==========================================================
  const checkCurriculumExists = (category, index) => {
    if (category === 'classInteraction' || category === 'participation') {
      return true;
    }

    let items = [];
    const safeCurriculum = Array.isArray(curriculum) ? curriculum : [];
    const safeHomework = Array.isArray(homeworkCurriculum) ? homeworkCurriculum : [];

    if (category === 'quranRecitation') {
      items = safeCurriculum.filter(c => c.type === 'recitation');
    } else if (category === 'quranMemorization') {
      items = safeCurriculum.filter(c => c.type === 'memorization');
    } else if (category === 'homework') {
      items = safeHomework.filter(c => c.type === 'homework');
    } else if (category === 'performanceTasks') {
      items = safeHomework.filter(c => c.type === 'performanceTask');
    } else if (category === 'tests') {
      items = safeHomework.filter(c => c.type === 'test');
    }

    return index < items.length;
  };

  const getInputStyle = (hasCurriculum, activeColorRing) => {
    return hasCurriculum
      ? `bg-gray-800 text-white border-gray-600 focus:ring-${activeColorRing}-500` 
      : `bg-black/50 text-gray-500 border-gray-800 focus:ring-gray-600 cursor-default placeholder-gray-700`;
  };

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

      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'general')
        .single();
      
      let savedPeriod = 'period1';
      let periodSelected = false;
      let currentSemesterKey = "semester1";
      
      if (settingsData) {
        setTeacherName(settingsData.teacher_name || "المعلم الافتراضي");
        setSchoolName(settingsData.school_name || "مدرسة متوسطة الطرف");
        setCurrentSemesterName(settingsData.current_semester || "الفصل الدراسي الأول");
        setTestCalculationMethod(settingsData.test_method || 'average');
        savedPeriod = settingsData.current_period || 'period1';
        currentSemesterKey = settingsData.active_semester_key || "semester1";
        
        if (settingsData.current_period) {
            periodSelected = true;
        }
      }

      setCurrentPeriod(savedPeriod);
      setActiveSemesterKey(currentSemesterKey);
      setShowPeriodSelection(!periodSelected);

      const { data: curriculumData } = await supabase
        .from('curriculum')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .eq('teacher_id', user.id)
        .single();
      
      let recitationCurriculum = [];
      let homeworkCurriculumData = [];

      if (curriculumData) {
          const recitation = curriculumData.recitation?.[currentSemesterKey] || {};
          const homework = curriculumData.homework?.[currentSemesterKey] || {};
          
          if (currentSemesterKey === 'semester1' && !curriculumData.recitation?.semester1) {
             const oldRecitation = curriculumData.recitation || {};
             recitationCurriculum = Array.isArray(oldRecitation) ? (savedPeriod === 'period1' ? oldRecitation : []) : (oldRecitation[savedPeriod] || []);
             
             const oldHomework = curriculumData.homework || {};
             homeworkCurriculumData = Array.isArray(oldHomework) ? (savedPeriod === 'period1' ? oldHomework : []) : (oldHomework[savedPeriod] || []);
          } else {
             recitationCurriculum = recitation[savedPeriod] || [];
             homeworkCurriculumData = homework[savedPeriod] || [];
          }
      }
      
      setFullCurriculum(curriculumData?.recitation || {});
      setFullHomeworkCurriculum(curriculumData?.homework || {});
      setCurriculum(recitationCurriculum);
      setHomeworkCurriculum(homeworkCurriculumData);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*, absences(*), book_absences(*)')
        .eq('grade_level', gradeId)
        .eq('section', sectionId)
        .eq('teacher_id', user.id)
        .order('name');

      if (studentsError) throw studentsError;

      const { data: prizesData } = await supabase.from('prizes').select('*').eq('teacher_id', user.id).order('cost');
      setPrizes(prizesData || []);

      const { data: announcementsData } = await supabase.from('announcements').select('*').eq('grade_id', gradeId).eq('section_id', sectionId).eq('teacher_id', user.id).order('created_at', { ascending: false });
      setAnnouncements(announcementsData || []);

      const parsedStudents = (studentsData || []).map(student => {
        
        let rawGrades = student.grades || {};
        let semesterGrades;

        if (!rawGrades.semester1 && !rawGrades.semester2) {
             const oldWeeklyNotes = rawGrades.weeklyNotes || rawGrades.weekly_notes || Array(20).fill(null);
             const period1Data = rawGrades.period1 || {};
             const period2Data = rawGrades.period2 || {};
             const p1 = Object.keys(period1Data).length > 0 ? period1Data : (rawGrades.tests ? rawGrades : createEmptyGradesStructure());

             const oldStars = {
                 acquired: student.acquired_stars || 0,
                 consumed: student.consumed_stars || 0
             };

             semesterGrades = {
                 semester1: {
                     period1: p1,
                     period2: period2Data,
                     weeklyNotes: oldWeeklyNotes,
                     stars: oldStars 
                 },
                 semester2: createEmptySemesterStructure()
             };
        } else {
            semesterGrades = {
                semester1: rawGrades.semester1 || createEmptySemesterStructure(),
                semester2: rawGrades.semester2 || createEmptySemesterStructure()
            };
        }

        const activeSemesterData = semesterGrades[currentSemesterKey];
        const activePeriodData = activeSemesterData[savedPeriod] || createEmptyGradesStructure();
        
        const semesterStars = activeSemesterData.stars || { acquired: 0, consumed: 0 };
        
        if (currentSemesterKey === 'semester1' && !activeSemesterData.stars) {
             semesterStars.acquired = student.acquired_stars || 0;
             semesterStars.consumed = student.consumed_stars || 0;
        }

        const safeGrades = {
            tests: ensureGradesArraySize(activePeriodData.tests, 2),
            homework: ensureGradesArraySize(activePeriodData.homework, 10),
            performanceTasks: ensureGradesArraySize(activePeriodData.performanceTasks || activePeriodData.performance_tasks, 4),
            participation: ensureGradesArraySize(activePeriodData.participation, 10),
            quranRecitation: ensureGradesArraySize(activePeriodData.quranRecitation || activePeriodData.quran_recitation, 5),
            quranMemorization: ensureGradesArraySize(activePeriodData.quranMemorization || activePeriodData.quran_memorization, 5),
            classInteraction: ensureGradesArraySize(activePeriodData.classInteraction || activePeriodData.oralTest || activePeriodData.oral_test, 4),
            weeklyNotes: ensureGradesArraySize(activeSemesterData.weeklyNotes, 20),
        };

        const studentWithStars = {
          ...student,
          id: student.id.toString(),
          grades: safeGrades, 
          fullGradesStructure: semesterGrades,
          
          acquiredStars: semesterStars.acquired,
          consumedStars: semesterStars.consumed, 
          stars: semesterStars.acquired - semesterStars.consumed, 
          
          viewKey: student.view_key || `/grades/${gradeId}/sections/${sectionId}/students/${student.id}`,
          absences: (student.absences || []).map(a => a.absence_date),
          bookAbsences: (student.book_absences || []).map(b => b.absence_date), 
          nationalId: student.national_id,
          parentPhone: student.parent_phone,
          phone: student.phone,
          photo: student.photo,
          teacher_id: student.teacher_id,
        };

        if (!studentWithStars.viewKey) {
          studentWithStars.viewKey = `/student-view/${student.id}-${Date.now()}`;
        }
        return studentWithStars;
      }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

      setStudents(parsedStudents);

    } catch (error) {
      console.error("Error fetching data:", error);
      handleDialog("خطأ", "حدث خطأ أثناء جلب البيانات", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDataFromSupabase();
  }, [gradeId, sectionId]);

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

  const handlePeriodChange = (period) => {
      setCurrentPeriod(period);
      handleSaveCurrentPeriod(period);
      
      const recCurriculum = fullCurriculum[activeSemesterKey]?.[period] || [];
      const hwCurriculum = fullHomeworkCurriculum[activeSemesterKey]?.[period] || [];
      setCurriculum(recCurriculum);
      setHomeworkCurriculum(hwCurriculum);

      const updatedStudents = students.map(student => {
          const activeSemesterData = student.fullGradesStructure[activeSemesterKey];
          const activePeriodData = activeSemesterData[period] || createEmptyGradesStructure();
          
          const safeGrades = {
            tests: ensureGradesArraySize(activePeriodData.tests, 2),
            homework: ensureGradesArraySize(activePeriodData.homework, 10),
            performanceTasks: ensureGradesArraySize(activePeriodData.performanceTasks || activePeriodData.performance_tasks, 4),
            participation: ensureGradesArraySize(activePeriodData.participation, 10),
            quranRecitation: ensureGradesArraySize(activePeriodData.quranRecitation || activePeriodData.quran_recitation, 5),
            quranMemorization: ensureGradesArraySize(activePeriodData.quranMemorization || activePeriodData.quran_memorization, 5),
            classInteraction: ensureGradesArraySize(activePeriodData.classInteraction || activePeriodData.oralTest || activePeriodData.oral_test, 4),
            weeklyNotes: ensureGradesArraySize(activeSemesterData.weeklyNotes, 20),
          };
          return { ...student, grades: safeGrades };
      });
      setStudents(updatedStudents);
      setShowPeriodSelection(false); 
  };
  
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
    }
  };

  const updateStudentsData = async (updatedStudents) => {
    if (!teacherId) {
      handleDialog("خطأ", "لا يمكن حفظ البيانات. معرف المعلم غير متوفر.", "error");
      return;
    }
    try {
        const sortedStudents = [...updatedStudents].sort((a, b) => b.name.localeCompare(a.name, 'ar'));
        
        const studentsToUpdate = sortedStudents.map(student => {
            const fullStructure = { ...student.fullGradesStructure };
            
            const currentPeriodGrades = {
                tests: student.grades.tests,
                classInteraction: student.grades.classInteraction, 
                homework: student.grades.homework,
                performance_tasks: student.grades.performanceTasks,
                participation: student.grades.participation,
                quran_recitation: student.grades.quranRecitation,
                quran_memorization: student.grades.quranMemorization,
            };

            if (!fullStructure[activeSemesterKey]) {
                fullStructure[activeSemesterKey] = createEmptySemesterStructure();
            }

            fullStructure[activeSemesterKey][currentPeriod] = currentPeriodGrades;
            fullStructure[activeSemesterKey].weeklyNotes = student.grades.weeklyNotes;
            
            fullStructure[activeSemesterKey].stars = {
                acquired: student.acquiredStars || 0,
                consumed: student.consumedStars || 0
            };

            return {
                id: student.id,
                name: student.name,
                national_id: student.nationalId,
                phone: student.phone,
                parent_phone: student.parentPhone,
                photo: student.photo,
                recitation_history: student.recitation_history, 
                grades: fullStructure, 
                
                stars: (student.acquiredStars || 0) - (student.consumedStars || 0),
                acquired_stars: student.acquiredStars,
                consumed_stars: student.consumedStars,

                grade_level: gradeId,
                section: sectionId,
                teacher_id: teacherId,
            };
        });

        const studentsWithUpdatedFullGrades = sortedStudents.map(s => {
             const studentToUpdate = studentsToUpdate.find(u => u.id === s.id);
             return studentToUpdate ? { ...s, fullGradesStructure: studentToUpdate.grades } : s;
        });
        setStudents(studentsWithUpdatedFullGrades);

        const { error } = await supabase
            .from('students')
            .upsert(studentsToUpdate, { onConflict: 'national_id' });

        if (error) {
            console.error("Error:", error);
            handleDialog("خطأ", "حدث خطأ أثناء حفظ البيانات", "error");
        }
    } catch (error) {
        console.error("Error:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حفظ البيانات", "error");
    }
  };

  const updateCurriculumData = async (updatedCurriculum) => {
    // ... logic remains same, currently not used in main flow but good to keep
  };

  const updateHomeworkCurriculumData = async (updatedCurriculum) => {
     // ... logic remains same
  };

  const handleDeleteNote = (studentId, weekIndex, noteIndex) => {
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
    // ... camera logic
  };

  const stopCamera = () => {
    // ... stop camera logic
  };

  const capturePhoto = () => {
    // ... capture logic
  };

  const handleFileUpload = async (e, isNewStudent) => {
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
    // ... existing Excel logic
  };

  const handleFileImport = async (e) => {
    // ... existing Import logic
  };


const handleAddStudent = async () => {
    // ... existing add student logic
  };

  const updateStudentGrade = async (studentId, category, index, value) => {
    // ... existing grade update logic
  };

  const updateStudentStars = async (updatedStudents) => {
    // ... existing star update logic
  };

  const updateRecitationData = async (updatedStudents) => {
    // ... existing recitation logic
  };

  const updateNotesData = async (updatedStudents) => {
    // ... existing notes logic
  };

  const handleSaveAttendance = async (updatedStudents) => {
    if (!teacherId) return;
    try {
      for (const student of updatedStudents) {
        const { error: delAbs } = await supabase.from('absences').delete().eq('student_id', student.id).eq('teacher_id', teacherId);
        if (delAbs) throw delAbs;
        
        const newAbsences = (student.absences || []).map(date => ({
          student_id: student.id,
          absence_date: date,
          teacher_id: teacherId
        }));
        if (newAbsences.length > 0) {
          const { error: insAbs } = await supabase.from('absences').insert(newAbsences);
          if (insAbs) throw insAbs;
        }

        const { error: delBk } = await supabase.from('book_absences').delete().eq('student_id', student.id).eq('teacher_id', teacherId);
        if (delBk) throw delBk;
        
        const newBookAbsences = (student.bookAbsences || []).map(date => ({
          student_id: student.id,
          absence_date: date,
          teacher_id: teacherId
        }));
        if (newBookAbsences.length > 0) {
          const { error: insBk } = await supabase.from('book_absences').insert(newBookAbsences);
          if (insBk) throw insBk;
        }
      }

      setStudents(updatedStudents);
      handleDialog("نجاح", "تم حفظ التحضير اليومي بنجاح", "success");
      
    } catch (error) {
      console.error("Error saving attendance:", error);
      handleDialog("خطأ", "فشل في حفظ بيانات التحضير", "error");
    }
  };

  const getTroubledStudents = () => {
     // ... logic remains same
  };

  const handleEditStudent = async () => {
    // ... logic remains same
  };

  const filteredStudents = students
    .filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQrClick = (student) => {
    handleDialog(
      "تأكيد الانتقال",
      `هل تريد الانتقال إلى صفحة الطالب ${student.name}؟`,
      "confirm",
      () => window.open(student.viewKey, '_blank')
    );
  };

  const copyStudentLink = (viewKey) => {
    navigator.clipboard.writeText(`${window.location.origin}${viewKey}`);
    handleDialog("نجاح", "تم نسخ الرابط بنجاح!", "success");
  };

  // *****************************************************************
  // دوال إدارة تحديد الطلاب لطباعة الـ QR
  // *****************************************************************
  const toggleQrSelection = (id) => {
    const newSet = new Set(selectedQrStudentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedQrStudentIds(newSet);
  };

  const handleSelectAllQr = () => {
    if (selectedQrStudentIds.size === filteredStudents.length) {
      setSelectedQrStudentIds(new Set()); // إلغاء تحديد الكل
    } else {
      setSelectedQrStudentIds(new Set(filteredStudents.map(s => s.id))); // تحديد الكل
    }
  };

  // *****************************************************************
  // دالة تصدير الـ QR المعدلة (16 في الصفحة، أفقي)
  // *****************************************************************
const handleExportQRCodes = async () => {
  const studentsToExport = filteredStudents.filter(s => selectedQrStudentIds.has(s.id));

  if (studentsToExport.length === 0) {
    handleDialog("تنبيه", "يرجى اختيار طالب واحد على الأقل للطباعة.", "warning");
    return;
  }

  try {
    handleDialog("جاري التصدير", "جاري إنشاء ملف Word (ملء الصفحة بالكامل)...", "info");

    const [{ Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType, TextRun, BorderStyle, HeightRule, VerticalAlign, TableLayoutType }, { toDataURL }, { saveAs }] = await Promise.all([
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

    const mainTableRows = [];
    const cellsPerBatch = 2; // عمودين
    const ROWS_PER_PAGE = 8; // عدد الصفوف في الصفحة

    // حساب الارتفاع الآمن: 
    // ارتفاع A4 الكامل هو 16838.
    // 16838 / 8 = 2104.75
    // نستخدم 2090 لنترك هامش أمان بسيط جداً (حوالي 1 ملم) في الأسفل لمنع فتح صفحة جديدة
    const EXACT_ROW_HEIGHT = 2090; 

    // 1. تجميع البيانات في صفوف
    let allRowsData = [];
    for (let i = 0; i < studentsToExport.length; i += cellsPerBatch) {
      allRowsData.push(studentsToExport.slice(i, i + cellsPerBatch));
    }

    // 2. إكمال الصفوف الفارغة لضمان امتلاء الصفحة بـ 8 صفوف
    // إذا كان لدينا صفحة واحدة أو نريد ملء الصفحة الأخيرة
    while (allRowsData.length % ROWS_PER_PAGE !== 0 || allRowsData.length === 0) {
       allRowsData.push([]); // إضافة صف فارغ
    }
    // ملاحظة: إذا كنت تريد صفحة واحدة فقط بحد أقصى 16 طالب، يمكنك استخدام الشرط:
    // while (allRowsData.length < ROWS_PER_PAGE) { allRowsData.push([]); }


    // 3. بناء هيكل الجدول
    for (const batch of allRowsData) {
      const rowCells = [];

      // معالجة الخلايا في الصف (طالبين أو فراغ)
      for (let k = 0; k < cellsPerBatch; k++) {
        const student = batch[k]; // قد يكون undefined إذا كان الصف تكميلياً

        if (student) {
          // --- يوجد طالب: إنشاء البطاقة ---
          try {
            const qrDataUrl = await toDataURL(`${window.location.origin}${student.viewKey}`, {
              errorCorrectionLevel: 'M',
              type: 'image/png',
              width: 200,
              margin: 0
            });
            const qrImage = dataURLToUint8Array(qrDataUrl);

            const innerTable = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    // QR Code Cell
                    new TableCell({
                      width: { size: 35, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new ImageRun({ data: qrImage, transformation: { width: 90, height: 90 } })], // تصغير طفيف للصورة
                        }),
                      ],
                    }),
                    // Text Data Cell
                    new TableCell({
                      width: { size: 65, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: student.name, bold: true, size: 22, font: "Arial" })],
                          spacing: { after: 0 }, // إزالة المسافات الزائدة
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: `السجل: ${student.nationalId}`, size: 18, font: "Arial" })],
                          spacing: { before: 50, after: 0 },
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [new TextRun({ text: `${gradeName} - ${sectionName}`, size: 16, font: "Arial" })],
                          spacing: { before: 20, after: 0 },
                        }),
                        new Paragraph({
  children: [
    new TextRun({
      text: "المادة: القرآن الكريم و الدراسات الإسلامية ",
      size: 14,
    }),
  ],
  alignment: AlignmentType.RIGHT,
}),
new Paragraph({
  children: [
    new TextRun({
      text: " معلم المادة: أحمد فهد البديوي",
      size: 14,
    }),
  ],
  alignment: AlignmentType.RIGHT,
}),


                      ],
                      margins: { right: 80, left: 20 },
                    }),
                  ],
                }),
              ],
            });

            rowCells.push(new TableCell({
              children: [innerTable],
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              },
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              verticalAlign: VerticalAlign.CENTER,
            }));

          } catch (error) {
            console.error(`Error processing student ${student.name}:`, error);
            // في حالة الخطأ، أضف خلية فارغة للحفاظ على التنسيق
            rowCells.push(new TableCell({ children: [], width: { size: 50, type: WidthType.PERCENTAGE } }));
          }
        } else {
          // --- لا يوجد طالب (مكان فارغ) ---
          // نقوم برسم الحدود أيضاً حتى تظهر الشبكة فارغة
          rowCells.push(new TableCell({
            children: [new Paragraph({})],
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
          }));
        }
      }

      // إضافة الصف إلى الجدول الرئيسي بارتفاع ثابت
      mainTableRows.push(new TableRow({
        children: rowCells,
        height: { value: EXACT_ROW_HEIGHT, rule: HeightRule.EXACT }
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 exact dimensions
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 },
          },
        },
        children: [
          new Table({
            rows: mainTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED, // إجبار الجدول على الالتزام بالأبعاد
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `QR_Cards_FullGrid_${sectionName}.docx`);
      handleDialog("نجاح", "تم تصدير الملف بنجاح!", "success");
    });

  } catch (error) {
    console.error(error);
    handleDialog("خطأ", "حدث خطأ أثناء تصدير الملف.", "error");
  }
};

  const handleDownloadImage = async () => {
    // ... logic remains same
  };

  const handleUpdatePrizes = (updatedPrizes) => {
    setPrizes(updatedPrizes);
  };

  const handleAddGrade = () => {
    // ... logic remains same
  };

  const handleResetDataClick = () => {
    handleDialog(
      "تأكيد حذف البيانات",
      "هل أنت متأكد من تصفير درجات ونجوم هذا الفصل الدراسي فقط؟",
      "confirm",
      () => {
        setShowVerificationModal(true);
      }
    );
  };

  const onVerificationSuccess = async (user) => {
    // ... logic remains same
  };
  
  // ==========================================================
  // دوال حساب المجاميع
  // ==========================================================
  const calculateMajorAssessments = (grades) => {
      const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum'));
      const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average'));
      const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average'));
      return (testsScore + recitationScore + memorizationScore).toFixed(2);
  };

  const calculateCoursework = (grades) => {
      const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum'));
      const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum'));
      const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best'));
      const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best'));
      return (homeworkScore + participationScore + performanceScore + classInteractionScore).toFixed(2);
  };
  
  const calculateFinalTotalScore = (grades) => {
      const majorAssessments = parseFloat(calculateMajorAssessments(grades));
      const coursework = parseFloat(calculateCoursework(grades));
      return (majorAssessments + coursework).toFixed(2);
  };
  
  const PeriodSelectionScreen = () => (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] border-2 border-blue-600/50 max-w-lg mx-auto mt-10 md:mt-20 text-center animate-fadeIn">
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2 tracking-wider">
            {currentSemesterName}
        </h2>
        <p className="text-gray-400 mb-6 font-bold">{activeSemesterKey === 'semester1' ? '(الفصل الدراسي الأول)' : '(الفصل الدراسي الثاني)'}</p>
        
        <p className="text-lg text-gray-300 mb-10 border-b border-gray-700 pb-6">
            أنت الآن في فصل <strong className="text-blue-300">{gradeName} - {sectionName}</strong>.
            يرجى اختيار الفترة التي تود العمل عليها.
        </p>
        <div className="flex flex-col gap-6">
            <button
                onClick={() => handlePeriodChange("period1")}
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
      
      <div className="flex justify-start mb-4">
        <button
          onClick={() => setShowPeriodSelection(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-sm"
        >
          <FaArrowLeft /> الرجوع لتحديد الفترة
        </button>
      </div>


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
          
          <RewardRequestsButton
            teacherId={teacherId}
            students={students} 
            onClick={() => setShowRewardRequestsModal(true)}
            activeSemester={activeSemesterKey} 
          />
          
          <button onClick={() => setShowGradesModal(true)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors shadow-md text-xs md:text-sm">
            <FaTable /> إدارة الدرجات
          </button>
          <button
            onClick={() => setShowQrList(!showQrList)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaQrcode /> {showQrList ? "إخفاء QR" : "طباعة QR"}
          </button>
          <button
            onClick={() => setShowTransferDeleteModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaUserMinus /> نقل و حذف
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
            <FaTimesCircle /> تصفير درجات هذا الفصل
          </button>
          <button
            onClick={() => setShowControlPanel(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-gray-800 text-blue-400 border border-blue-500 rounded-lg hover:bg-gray-700 transition-colors shadow-md text-xs md:text-sm font-bold"
          >
            <FaCogs /> لوحة تحكم الطالب
          </button>
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors shadow-md text-xs md:text-sm font-bold"
          >
            <FaCalendarCheck /> كشف الغياب و الكتب
          </button>
          <button 
  onClick={() => setShowFilterModal(true)} 
  className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-cyan-700 text-white rounded-lg hover:bg-cyan-600 transition-colors shadow-md text-xs md:text-sm"
>
  <FaFilter /> احصائيات الطلاب
</button>
        </div>
      </div>

<div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
  <h4 className="font-bold text-lg text-white">
   {currentSemesterName}
  </h4>

  <span className="hidden md:inline text-gray-600">|</span>

  <h4 className="font-bold text-lg text-blue-400">
    الفترة النشطة: {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'}
  </h4>
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
            inputMode="text"
          />
        </div>
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

      {/* عرض قائمة QR المعدلة */}
      {showQrList && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-700 pb-4">
            <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white text-center md:text-right">طباعة رموز QR</h2>
                <p className="text-gray-400 text-sm mt-1">اضغط على بطاقة الطالب لتحديده للطباعة (سيظهر باللون الأزرق)</p>
            </div>
             <div className="flex flex-wrap items-center gap-3 justify-center">
                 <button
                    onClick={handleSelectAllQr}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm font-bold"
                 >
                   {selectedQrStudentIds.size === filteredStudents.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                 </button>
                 <div className="bg-gray-900 px-4 py-2 rounded-lg text-blue-300 font-mono font-bold">
                    محدد: {selectedQrStudentIds.size}
                 </div>
                 <button
                    onClick={() => handleExportQRCodes()}
                    disabled={selectedQrStudentIds.size === 0}
                    className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg shadow-md text-sm font-bold transition-all
                        ${selectedQrStudentIds.size > 0 
                            ? "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105" 
                            : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
                 >
                   <FaFileWord className="text-lg" /> تصدير المحدد ({selectedQrStudentIds.size})
                 </button>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredStudents.map(student => {
              const isSelected = selectedQrStudentIds.has(student.id);
              return (
                <div 
                    key={student.id} 
                    onClick={() => toggleQrSelection(student.id)}
                    className={`relative p-4 rounded-lg shadow-md flex flex-col items-center transition-all transform cursor-pointer border-2
                        ${isSelected 
                            ? "bg-blue-900/30 border-blue-500 scale-[1.02]" 
                            : "bg-gray-700 border-transparent hover:bg-gray-600"}`}
                >
                  <h4 className="text-base font-bold text-blue-400 mb-2 mt-2 break-words text-center">{student.name}</h4>
                  <StudentQrCode viewKey={`/grades/${gradeId}/sections/${sectionId}/students/${student.id}`} size={120} />
                  <span className="mt-2 text-sm text-gray-400 break-words text-center">{student.nationalId}</span>
                  
                  {/* أزرار الإجراءات داخل البطاقة (مع منع انتشار الحدث) */}
                  <div className="flex gap-2 mt-3 w-full justify-center border-t border-gray-600 pt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyStudentLink(`/grades/${gradeId}/sections/${sectionId}/students/${student.id}`);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs"
                      title="نسخ الرابط"
                    >
                      <FaCopy />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQrClick(student);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs"
                      title="فتح الصفحة"
                    >
                      <FaExternalLinkAlt />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!showGradeSheet && !showBriefSheet && !showQrList && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
          <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">
            الطلاب في {gradeName} - {sectionName} ({currentSemesterName} - الفترة {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'})
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
                {selectedStudent.grades.tests.slice(0, 2).map((grade, i) => {
                  const hasCurriculum = checkCurriculumExists('tests', i);
                  return (
                    <input 
                      key={i} 
                      type="text" 
                      inputMode="numeric" 
                      placeholder={`--`} 
                      title={hasCurriculum ? "" : "لا يوجد منهج"}
                      value={grade === null ? '' : grade} 
                      onChange={(e) => updateStudentGrade(selectedStudent.id, "tests", i, e.target.value)} 
                      className={`w-20 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'green')}`}
                      style={{ touchAction: 'manipulation' }} 
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaMicrophone className="text-3xl text-yellow-400" /> التفاعل الصفي  <span className="text-yellow-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'classInteraction', 'best')} / 10</span>
              </h4>
             <div className="flex flex-wrap gap-2">
                {selectedStudent.grades.classInteraction.slice(0, 4).map((grade, i) => {
                  // التفاعل الصفي دائماً true، ولكن نستخدم الدالة للتوحيد
                  const hasCurriculum = checkCurriculumExists('classInteraction', i);
                  return (
                    <input 
                      key={i} 
                      type="text" 
                      inputMode="numeric" 
                      placeholder={`--`} 
                      value={grade === null ? '' : grade} 
                      onChange={(e) => updateStudentGrade(selectedStudent.id, "classInteraction", i, e.target.value)} 
                      className={`w-16 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'yellow')}`}
                      style={{ touchAction: 'manipulation' }} 
                    />
                  );
                })}
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
                {selectedStudent.grades.homework.slice(0, 10).map((grade, i) => {
                  const hasCurriculum = checkCurriculumExists('homework', i);
                  return (
                    <input 
                      key={i} 
                      type="text" 
                      inputMode="numeric" 
                      placeholder={`--`} 
                      title={hasCurriculum ? "" : "لا يوجد منهج"}
                      value={grade === null ? '' : grade} 
                      onChange={(e) => updateStudentGrade(selectedStudent.id, "homework", i, e.target.value)} 
                      className={`w-10 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'purple')}`}
                      style={{ touchAction: 'manipulation' }} 
                    />
                  );
                })}
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
                {selectedStudent.grades.performanceTasks.slice(0, 4).map((grade, i) => {
                  const hasCurriculum = checkCurriculumExists('performanceTasks', i);
                  return (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      placeholder={`--`}
                      title={hasCurriculum ? "" : "لا يوجد منهج"}
                      value={grade === null ? '' : grade}
                      onChange={(e) => updateStudentGrade(selectedStudent.id, "performanceTasks", i, e.target.value)}
                      className={`w-16 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'rose')}`}
                      style={{ touchAction: 'manipulation' }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaCommentDots className="text-3xl text-cyan-400" /> المشاركة  <span className="text-cyan-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'participation', 'sum')} / 10</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.grades.participation.slice(0, 10).map((grade, i) => {
                   // المشاركة دائماً true
                   const hasCurriculum = checkCurriculumExists('participation', i);
                   return (
                    <input 
                      key={i} 
                      type="text" 
                      inputMode="numeric" 
                      placeholder={`--`} 
                      value={grade === null ? '' : grade} 
                      onChange={(e) => updateStudentGrade(selectedStudent.id, "participation", i, e.target.value)} 
                      className={`w-10 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'cyan')}`}
                      style={{ touchAction: 'manipulation' }} 
                    />
                  );
                })}
              </div>
            </div>

<div className="col-span-full md:col-span-2 lg:col-span-3 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
  <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
    <FaQuran className="text-3xl text-blue-400" /> القرآن الكريم
    <span className="text-blue-400 font-bold mr-2 text-2xl">
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
                    {selectedStudent.grades.quranRecitation.slice(0, 5).map((grade, i) => {
                      const hasCurriculum = checkCurriculumExists('quranRecitation', i);
                      return (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          placeholder={`--`}
                          title={hasCurriculum ? "" : "لا يوجد منهج"}
                          value={grade === null ? '' : grade}
                          onChange={(e) => updateStudentGrade(selectedStudent.id, "quranRecitation", i, e.target.value)}
                          className={`w-12 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'blue')}`}
                          style={{ touchAction: 'manipulation' }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-100">حفظ القرآن </h5>
                    {getStatusInfo(selectedStudent, 'memorization', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(selectedStudent, 'memorization', curriculum).text})
                    </span>
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(selectedStudent.grades, 'quranMemorization', 'average')} / 10</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.grades.quranMemorization.slice(0, 5).map((grade, i) => {
                      const hasCurriculum = checkCurriculumExists('quranMemorization', i);
                      return (
                        <input
                          key={i}
                          type="text"
                          inputMode="numeric"
                          placeholder={`--`}
                          title={hasCurriculum ? "" : "لا يوجد منهج"}
                          value={grade === null ? '' : grade}
                          onChange={(e) => updateStudentGrade(selectedStudent.id, "quranMemorization", i, e.target.value)}
                          className={`w-12 p-2 border rounded-lg text-center text-base focus:outline-none focus:ring-2 transition-colors ${getInputStyle(hasCurriculum, 'blue')}`}
                          style={{ touchAction: 'manipulation' }}
                        />
                      );
                    })}
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
          onSave={(updatedStudents) => updateStudentsData(updatedStudents)}
          prizes={prizes}
          onUpdatePrizes={handleUpdatePrizes}
          teacherId={teacherId}
        />
      )}
      
      {showRewardRequestsModal && (
        <RewardRequestsModal
          show={showRewardRequestsModal}
          onClose={() => setShowRewardRequestsModal(false)}
          students={students}
          handleDialog={handleDialog}
          updateStudentsData={updateStudentsData}
          fetchDataFromSupabase={fetchDataFromSupabase}
          activeSemester={activeSemesterKey}
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
          currentPeriod={currentPeriod}
          activeSemester={activeSemesterKey}
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
          homeworkCurriculum={homeworkCurriculum}
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
          currentPeriod={currentPeriod}
          activeSemester={activeSemesterKey}
          onClose={() => {
            setShowHomeworkCurriculumModal(false);
            fetchDataFromSupabase();
          }}
          handleDialog={handleDialog}
        />
      )}

      {showGradeSheet && (
        <GradesSheet
          students={students}
          calculateTotalScore={calculateFinalTotalScore} 
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemesterName}
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
          calculateTotalScore={calculateFinalTotalScore} 
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemesterName}
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

      {showTroubledStudentsModal && (
        <TroubledStudentsModal
          students={students}
          onClose={() => setShowTroubledStudentsModal(false)}
          homeworkCurriculum={homeworkCurriculum}
          recitationCurriculum={curriculum}
          gradeName={gradeName}
          sectionName={sectionName}
          onSave={updateNotesData} 
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
      
{showAnnouncementsModal && (
  <AnnouncementsModal
    announcements={announcements}
    onClose={() => setShowAnnouncementsModal(false)}
    gradeId={gradeId}
    sectionId={sectionId}
    teacherId={teacherId}
    onSave={setAnnouncements}
    handleDialog={handleDialog}
    activeSemester={activeSemesterKey} 
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

{/* مودال التحضير اليومي الجديد */}
{showAttendanceModal && (
  <DailyAttendanceModal
    students={students}
    activeSemester={activeSemesterKey} 
    onClose={() => setShowAttendanceModal(false)}
    onSave={handleSaveAttendance} 
  />
)}

{showFilterModal && (
  <FilterGradesModal
    students={students}
    onClose={() => setShowFilterModal(false)}
    onSave={updateStudentsData}
    calculateTotalScore={calculateFinalTotalScore}
    gradeName={gradeName}
    sectionName={sectionName}
    schoolName={schoolName}
    teacherName={teacherName}
    currentSemester={currentSemesterName}
  />
)}

      {showControlPanel && (
  <StudentControlPanel
    show={showControlPanel}
    onClose={() => setShowControlPanel(false)}
    handleDialog={handleDialog}
    teacherId={teacherId}
  />
)}

    </div>
  );
};


export default SectionGrades;
