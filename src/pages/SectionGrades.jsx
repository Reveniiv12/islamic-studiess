// src/SectionGrades.jsx

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
import GradesSheet from '../pages/GradesSheet';
import BriefSheet from '../pages/BriefSheet';
import AbsenceModal from "../components/AbsenceModal.jsx";
import TroubledStudentsModal from "../components/TroubledStudentsModal.jsx";
import CustomDialog from "../components/CustomDialog";
import { QRCodeSVG } from 'qrcode.react';
import ReactDOM from 'react-dom';

// استيراد Firebase
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase"; // تأكد من أن هذا المسار صحيح

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
  FaTimes
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

const SectionGrades = () => {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();
  const gradesSectionRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [teacherName, setTeacherName] = useState("المعلم الافتراضي");
  const [schoolName, setSchoolName] = useState("مدرسة متوسطة الطرف");
  const [currentSemester, setCurrentSemester] = useState("الفصل الدراسي الأول");
  const [curriculum, setCurriculum] = useState([]);
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
  const [showTroubledStudentsModal, setShowTroubledStudentsModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const filePhotoInputRef = useRef(null);
  const newStudentFilePhotoInputRef = useRef(null);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("info");
  const [dialogAction, setDialogAction] = useState(null);

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

  // دالة لجلب البيانات من Firebase Firestore
  const fetchDataFromFirebase = async () => {
    setIsRefreshing(true);
    
    try {
      // جلب بيانات الطلاب
      const studentsQuery = query(
        collection(db, "grades", gradeId, "sections", sectionId, "students")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // جلب بيانات المنهج
      const curriculumDocRef = doc(db, "grades", gradeId, "sections", sectionId, "curriculum");
      const curriculumDoc = await getDoc(curriculumDocRef);
      let curriculumData = [];
      let homeworkCurr = [];
      
      if (curriculumDoc.exists()) {
        const data = curriculumDoc.data();
        curriculumData = data.recitation || [];
        homeworkCurr = data.homework || [];
      }
      
      // جلب بيانات الإعدادات
      const settingsDocRef = doc(db, "settings", "general");
      const settingsDoc = await getDoc(settingsDocRef);
      let savedTeacherName = "المعلم الافتراضي";
      let savedSchoolName = "مدرسة متوسطة الطرف";
      let savedSemester = "الفصل الدراسي الأول";
      let savedTestMethod = 'average';
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        savedTeacherName = data.teacherName || savedTeacherName;
        savedSchoolName = data.schoolName || savedSchoolName;
        savedSemester = data.currentSemester || savedSemester;
        savedTestMethod = data.testMethod || savedTestMethod;
      }
      
      // تحديث الحالة
      setTeacherName(savedTeacherName);
      setSchoolName(savedSchoolName);
      setCurrentSemester(savedSemester);
      setHomeworkCurriculum(homeworkCurr);
      setCurriculum(curriculumData);
      setTestCalculationMethod(savedTestMethod);
      
      // معالجة بيانات الطلاب
      const parsedStudents = studentsData.map(student => {
        const ensureArraySize = (array, size) => {
          const newArray = Array(size).fill(null);
          if (array && Array.isArray(array)) {
            for (let i = 0; i < Math.min(array.length, size); i++) {
              newArray[i] = array[i];
            }
          }
          return newArray;
        };

        const studentGrades = {
          ...student.grades,
          tests: ensureArraySize(student.grades?.tests, 2),
          homework: ensureArraySize(student.grades?.homework, 10),
          performanceTasks: ensureArraySize(student.grades?.performanceTasks, 5),
          participation: ensureArraySize(student.grades?.participation, 10),
          quranRecitation: ensureArraySize(student.grades?.quranRecitation, 5),
          quranMemorization: ensureArraySize(student.grades?.quranMemorization, 5),
          oralTest: ensureArraySize(student.grades?.oralTest, 5),
          weeklyNotes: ensureArraySize(student.grades?.weeklyNotes, 20),
        };

        const studentWithStars = {
          ...student,
          grades: studentGrades,
          viewKey: student.viewKey || `/student/${student.id}`,
          acquiredStars: student.acquiredStars !== undefined ? student.acquiredStars : student.stars || 0,
          consumedStars: student.consumedStars || 0,
          stars: (student.acquiredStars !== undefined ? student.acquiredStars : student.stars || 0) - (student.consumedStars || 0),
          absences: student.absences || [] // Initialize new absences array
        };

        if (!studentWithStars.viewKey) {
          studentWithStars.viewKey = `/student-view/${student.id}-${Date.now()}`;
        }
        return studentWithStars;
      }).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

      setStudents(parsedStudents);
      
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
      handleDialog("خطأ", "حدث خطأ أثناء جلب البيانات من قاعدة البيانات", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // دالة لحفظ بيانات الطلاب في Firebase
  const updateStudentsData = async (updatedStudents) => {
    try {
      const batch = writeBatch(db);
      const sortedStudents = [...updatedStudents].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      
      // تحديث كل طالب في الدفعة
      sortedStudents.forEach(student => {
        const studentRef = doc(db, "grades", gradeId, "sections", sectionId, "students", student.id);
        batch.set(studentRef, student);
      });
      
      await batch.commit();
      setStudents(sortedStudents);
    } catch (error) {
      console.error("Error updating students data:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات", "error");
    }
  };

  // دالة لحفظ بيانات المنهج في Firebase
  const updateCurriculumData = async (updatedCurriculum) => {
    try {
      const curriculumRef = doc(db, "grades", gradeId, "sections", sectionId, "curriculum");
      await setDoc(curriculumRef, { 
        recitation: updatedCurriculum,
        homework: homeworkCurriculum 
      }, { merge: true });
      
      setCurriculum(updatedCurriculum);
    } catch (error) {
      console.error("Error updating curriculum:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ المنهج في قاعدة البيانات", "error");
    }
  };

  // دالة لحفظ بيانات واجبات المنهج في Firebase
  const updateHomeworkCurriculumData = async (updatedCurriculum) => {
    try {
      const curriculumRef = doc(db, "grades", gradeId, "sections", sectionId, "curriculum");
      await setDoc(curriculumRef, { 
        recitation: curriculum,
        homework: updatedCurriculum 
      }, { merge: true });
      
      setHomeworkCurriculum(updatedCurriculum);
    } catch (error) {
      console.error("Error updating homework curriculum:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ واجبات المنهج في قاعدة البيانات", "error");
    }
  };

  // دالة لحفظ طريقة حساب الاختبارات في Firebase
  const handleTestCalculationMethodChange = async (method) => {
    try {
      const settingsRef = doc(db, "settings", "general");
      await setDoc(settingsRef, { testMethod: method }, { merge: true });
      
      setTestCalculationMethod(method);
    } catch (error) {
      console.error("Error saving test method:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ طريقة حساب الاختبارات", "error");
    }
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

  useEffect(() => {
    fetchDataFromFirebase();
  }, [gradeId, sectionId]);

  useEffect(() => {
    if (selectedStudent && gradesSectionRef.current) {
      gradesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedStudent]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

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

  const exportToExcel = async () => {
    try {
      const [{ utils, write }, { saveAs }] = await Promise.all([
        import('xlsx'),
        import('file-saver')
      ]);

      const data = students.map(student => ({
        'اسم الطالب': student.name,
        'السجل المدني': student.nationalId,
        'رقم ولي الأمر': student.parentPhone,
      }));

      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "الطلاب");

      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `بيانات_${gradeId}_${sectionId}.xlsx`);
      handleDialog("نجاح", "تم تصدير الملف بنجاح!", "success");
    } catch (error) {
      handleDialog("خطأ", 'حدث خطأ أثناء تصدير الملف: ' + error.message, "error");
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const [{ read, utils }] = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet);

          const updatedStudents = jsonData.map(row => ({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: row['اسم الطالب'] || '',
            nationalId: row['السجل المدني'] || '',
            parentPhone: row['رقم ولي الأمر'] || '',
            viewKey: `/student-view/${Date.now() + Math.random()}-${Date.now()}`
          }));

          updateStudentsData(updatedStudents);
          handleDialog("نجاح", "تم استيراد البيانات بنجاح!", "success");
        } catch (error) {
          handleDialog("خطأ", 'حدث خطأ أثناء استيراد الملف: ' + error.message, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      handleDialog("خطأ", 'حدث خطأ في تحميل مكتبة XLSX: ' + error.message, "error");
    }
  };

const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.nationalId) {
      handleDialog("خطأ", "يرجى إدخال الاسم والسجل المدني", "error");
      return;
    }
    
    try {
      const newId = Date.now() + Math.random().toString(36).substr(2, 9);
      const studentToAdd = {
        id: newId,
        ...newStudent,
        photo: newStudent.photo || '/images/1.webp',
        stars: 0,
        acquiredStars: 0,
        consumedStars: 0,
        recitationHistory: [],
        viewKey: `/student-view/${newId}-${Date.now()}`,
        grades: {
          tests: Array(2).fill(null),
          homework: Array(10).fill(null),
          performanceTasks: Array(5).fill(null),
          participation: Array(10).fill(null),
          quranRecitation: Array(5).fill(null),
          quranMemorization: Array(5).fill(null),
          oralTest: Array(5).fill(null),
          weeklyNotes: Array(20).fill(null),
        },
        absences: [], // Initialize absences array for new student
      };
      
      // إضافة الطالب إلى Firebase
      const studentRef = doc(db, "grades", gradeId, "sections", sectionId, "students", newId);
      await setDoc(studentRef, studentToAdd);
      
      setShowAddForm(false);
      setNewStudent({ name: "", nationalId: "", phone: "", parentPhone: "", photo: "" });
      handleDialog("نجاح", "تم إضافة الطالب بنجاح!", "success");
      
      // تحديث قائمة الطلاب
      fetchDataFromFirebase();
    } catch (error) {
      console.error("Error adding student:", error);
      handleDialog("خطأ", "حدث خطأ أثناء إضافة الطالب", "error");
    }
  };

  const updateStudentGrade = async (studentId, category, index, value) => {
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
      handleDialog("خطأ", errorMessage, "error");
      return;
    }
    
    try {
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
      
      await updateStudentsData(updatedStudents);
      const updatedSelectedStudent = updatedStudents.find(s => s.id === studentId);
      if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    } catch (error) {
      console.error("Error updating grade:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث الدرجة", "error");
    }
  };

  const updateStudentStars = async (updatedStudents) => {
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
    try {
      await updateStudentsData(updatedStudents);
      const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
      if (updatedSelectedStudent) { setSelectedStudent(updatedSelectedStudent); }
    } catch (error) {
      console.error("Error updating notes:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث الملاحظات", "error");
    }
  };

  const updateAbsenceData = async (updatedStudents) => {
    try {
      await updateStudentsData(updatedStudents);
      const updatedSelectedStudent = updatedStudents.find(s => s.id === selectedStudent?.id);
      if (updatedSelectedStudent) {
        setSelectedStudent(updatedSelectedStudent);
      }
    } catch (error) {
      console.error("Error updating absence:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تحديث بيانات الغياب", "error");
    }
  };

  const getTroubledStudents = () => {
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
      setShowEditForm(false);
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

  const handleExportQRCodes = async () => {
    try {
      handleDialog("جاري التصدير", "جاري إنشاء ملف الوورد، الرجاء الانتظار...", "info");
      const [{ Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType }] = await Promise.all([
        import('docx')
      ]);
      const [{ toDataURL }] = await import('qrcode');
      const [{ saveAs }] = await import('file-saver');

      const sections = [];

      for (let i = 0; i < filteredStudents.length; i += 9) {
        const batch = filteredStudents.slice(i, i + 9);
        const studentCells = [];

        for (const student of batch) {
          try {
            const qrDataUrl = await toDataURL(`${window.location.origin}${student.viewKey}`, {
              errorCorrectionLevel: 'H',
              type: 'image/png',
              width: 150,
            });

            const response = await fetch(qrDataUrl);
            const blob = await response.blob();
            const qrImage = new Uint8Array(await blob.arrayBuffer());

            studentCells.push(
              new TableCell({
                children: [
                  new Paragraph({ text: student.name, alignment: AlignmentType.CENTER }),
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: qrImage,
                        transformation: { width: 120, height: 120 },
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                  new Paragraph({ text: student.nationalId || "-", alignment: AlignmentType.CENTER }),
                  new Paragraph({
                    text: `النجوم: ${student.stars || 0}`,
                    alignment: AlignmentType.CENTER
                  }),
                  new Paragraph({ text: `${gradeName} - ${sectionName}`, alignment: AlignmentType.CENTER }),
                ],
                margins: { top: 200, bottom: 200, left: 200, right: 200 },
              })
            );
          } catch (error) {
            console.error(`Error processing student ${student.name}:`, error);
          }
        }

        const rows = [];
        for (let j = 0; j < studentCells.length; j += 3) {
          rows.push(
            new TableRow({
              children: studentCells.slice(j, j + 3),
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
              text: `كشوفات طلاب ${gradeName} - ${sectionName}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.RIGHT
            }),
            new Paragraph({ text: `المدرسة: ${schoolName}`, alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: `المعلم: ${teacherName}`, alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: `الفصل الدراسي: ${currentSemester}`, alignment: AlignmentType.RIGHT }),
            new Paragraph({ text: " " }),
            table,
          ],
        });
      }

      const doc = new Document({ sections });

      Packer.toBlob(doc).then((blob) => {
        saveAs(blob, `طلاب_${gradeName}_${sectionName}.docx`);
        handleDialog("نجاح", "تم تصدير الملف بنجاح!", "success");
      });
    } catch (error) {
      console.error("Error exporting document:", error);
      handleDialog("خطأ", "حدث خطأ أثناء تصدير الملف. الرجاء المحاولة مرة أخرى.", "error");
    }
  };

  const handleDownloadImage = async () => {
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
    setPrizes(updatedPrizes);
  };

  const handleAddGrade = () => {
    if (newGrade && selectedHomework) {
      const newGradeEntry = createGradeEntry(parseInt(newGrade, 10), sectionTitle, new Date().toISOString().slice(0, 10));
      onAddGrade(selectedHomework, newGradeEntry);

      onUpdateHomeworkStatus(selectedHomework, 'تم الحل');

      setNewGrade('');
      setSelectedHomework('');
    }
  };

  const totalScore = calculateTotalScore(grades.map(g => g.score));
  const averageScore = calculateAverage(grades.map(g => g.score));
  const performanceLevel = determinePerformanceLevel(averageScore);

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
          <button onClick={() => setShowQrList(!showQrList)} className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors shadow-md text-xs md:text-sm">
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
            onClick={() => setShowTroubledStudentsModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-md text-xs md:text-sm"
          >
            <FaExclamationTriangle /> كشف المتعثرين
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
          <button
            onClick={() => {
              setShowGradeSheet(!showGradeSheet);
              setShowBriefSheet(false);
              setSelectedStudent(null);
              setShowQrList(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-sm"
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-sm"
          >
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
          <div className="flex flex-col gap-2 mb-4">
            <label className="block text-sm font-medium text-gray-300 text-right">إضافة صورة الطالب:</label>
            <div className="flex gap-2">
              <button onClick={() => newStudentFilePhotoInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm" >
                <FaUpload /> رفع صورة
              </button>
              <input type="file" ref={newStudentFilePhotoInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => { setShowCamera(true); startCamera(); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm" >
                <FaCamera /> التقاط صورة
              </button>
            </div>
          </div>
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
          <input type="text" placeholder="اسم الطالب" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="السجل المدني" value={editingStudent.nationalId} onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="رقم التواصل" value={editingStudent.phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <input type="text" placeholder="رقم ولي الأمر" value={editingStudent.parentPhone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
          <div className="flex flex-col gap-2 mb-4">
            <label className="block text-sm font-medium text-gray-300 text-right">تغيير صورة الطالب:</label>
            <div className="flex gap-2">
              <button onClick={() => filePhotoInputRef.current.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm" >
                <FaUpload /> رفع صورة
              </button>
              <input type="file" ref={filePhotoInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => { setShowCamera(true); startCamera(); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm" >
                <FaCamera /> التقاط صورة
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleEditStudent} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm" >
              حفظ التغييرات
            </button>
            <button onClick={() => { setShowEditForm(false); setEditingStudent(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm" >
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
            <div className="flex justify-between gap-4">
              <button onClick={capturePhoto} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm">
                التقاط
              </button>
              <button onClick={() => { stopCamera(); setShowCamera(false); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrList && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-4 md:mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-white text-center">رموز QR للطلاب</h2>
            <button 
              onClick={() => handleExportQRCodes()} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
            >
              <FaFileWord /> تصدير QR كملف Word
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredStudents.map(student => (
              <div key={student.id} className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center transition-transform transform hover:scale-105">
                <h4 className="text-lg font-bold text-blue-400 mb-2">{student.name}</h4>
                <div className="flex items-center gap-1 mb-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{student.stars || 0}</span>
                </div>
                <Link to={student.viewKey} target="_blank" rel="noopener noreferrer">
                  <StudentQrCode viewKey={student.viewKey} size={150} />
                </Link>
                <span className="mt-2 text-sm text-gray-400">{student.nationalId}</span>
                <span className="text-sm text-gray-300">{gradeName} - {sectionName}</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyStudentLink(student.viewKey);
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
            الطلاب في {gradeName} - {sectionName}
          </h3>
          <div className="flex flex-wrap justify-start gap-4 pb-4 md:pb-6 mb-4 md:mb-6">
            {filteredStudents.length === 0 ? (
              <p className="text-gray-400 text-lg text-center w-full">لا يوجد طلاب في هذا الفصل حاليًا. يمكنك إضافة طالب جديد أو استيراد بيانات.</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} onClick={() => setSelectedStudent(student)} className={`flex items-center gap-4 p-4 border rounded-xl w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-sm ${selectedStudent?.id === student.id ? "border-blue-500 bg-gray-700 shadow-lg" : "border-gray-700 bg-gray-800 hover:bg-gray-700"}`}>
                  <div className="flex-shrink-0">
                    <img src={student.photo || '/images/1.webp'} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                  </div>
                  <div className="flex-grow text-right">
                    <h4 className="font-bold text-lg text-white truncate">{student.name}</h4>
                    <p className="text-sm text-gray-400 truncate">السجل: {student.nationalId}</p>
                    <div className="flex items-center justify-between mt-1">
                      {student.parentPhone && (
                        <p className="text-xs text-gray-400 truncate">ولي الأمر: {student.parentPhone}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
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

      {selectedStudent && !showGradeSheet && !showBriefSheet && !showQrList && (
        <div ref={gradesSectionRef} className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 border border-gray-700" dir="rtl">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-700">
            <div className="flex flex-col text-right">
              <h3 className="text-xl md:text-2xl font-bold text-blue-400">
                درجات الطالب: {selectedStudent.name}
              </h3>
              <p className="text-sm md:text-md text-gray-400">السجل المدني: {selectedStudent.nationalId}</p>
              <p className="text-sm md:text-md text-gray-400">رقم ولي الأمر: {selectedStudent.parentPhone}</p>
            </div>
            <div className="relative">
              <img src={selectedStudent.photo || '/images/1.webp'} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* بطاقة المجموع النهائي */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                  <span className="text-xl md:text-2xl font-bold text-green-500">{calculateTotalScore(selectedStudent.grades, testCalculationMethod)} / 60</span>
                </div>
                <FaAward className="text-4xl text-green-400" />
              </div>
            </div>

            {/* بطاقة النجوم */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 col-span-1 flex flex-col items-center justify-center">
              <h4 className="font-semibold text-gray-100 text-lg mb-4">النجوم</h4>
              <div className="flex flex-col items-center justify-center w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-3xl text-yellow-400" />
                    <span className="text-md font-semibold text-yellow-400">الكلية</span>
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

            {/* بقية بطاقات الدرجات */}
          <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
              <FaBookOpen className="text-3xl text-red-400" /> الاختبارات
              <span className="text-red-400 font-bold mr-2 text-2xl">
                {calculateCategoryScore(selectedStudent.grades, 'tests', 'best')} / 15
              </span>
            </h4>
                        <div className="flex items-center gap-2 mb-2">
              <h5 className="font-medium text-gray-100">حالة الاختبارات</h5>
              {taskStatusUtils(selectedStudent, homeworkCurriculum, 'test').icon}
              <span className="text-sm text-gray-400">
                ({taskStatusUtils(selectedStudent, homeworkCurriculum, 'test').text})
              </span>
            </div>
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

          <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
              <FaTasks className="text-3xl text-green-400" /> الواجبات
              <span className="text-green-400 font-bold mr-2 text-2xl">
                {calculateCategoryScore(selectedStudent.grades, 'homework', 'average')} / 10
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
                {selectedStudent.grades.homework.slice(0, 10).map((grade, i) => (
                  <input key={i} type="number" min="0" max="1" placeholder="--" value={grade === null ? '' : grade} onChange={(e) => updateStudentGrade(selectedStudent.id, "homework", i, e.target.value)} className="w-10 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
                {selectedStudent.grades.performanceTasks.slice(0, 3).map((grade, i) => (
                  <input 
                    key={i} 
                    type="number" 
                    min="0" 
                    max="5"
                    placeholder="--" 
                    value={grade === null ? '' : grade} 
                    onChange={(e) => updateStudentGrade(selectedStudent.id, "performanceTasks", i, e.target.value)} 
                    className="w-16 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500" 
                  />
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaCommentDots className="text-3xl text-cyan-400" /> المشاركة (10) <span className="text-cyan-400 font-bold text-2xl">{calculateCategoryScore(selectedStudent.grades, 'participation', 'sum')} / 10</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.grades.participation.slice(0, 10).map((grade, i) => (
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
                    {getStatusInfo(selectedStudent, 'recitation', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(selectedStudent, 'recitation', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(selectedStudent, 'recitation', curriculum).text})
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
                    {getStatusInfo(selectedStudent, 'memorization', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(selectedStudent, 'memorization', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(selectedStudent, 'memorization', curriculum).text})
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
      <div key={weekIndex} className="bg-gray-800 p-3 rounded-lg border border-gray-600 min-h-[120px] relative">
        <h5 className="font-bold text-gray-200 mb-1 text-center">الأسبوع {weekIndex + 1}</h5>
        <div className="h-px bg-gray-600 mb-2"></div>
        {notes && notes.length > 0 ? (
          <ul className="list-disc pr-4 text-gray-300 text-sm space-y-1">
            {notes.map((note, noteIndex) => (
              <li key={noteIndex} className="pb-1 flex justify-between items-start">
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

      {/* المكونات المنبثقة */}
      {showNotesModal && (
        <NotesModal
          students={students}
          onClose={() => setShowNotesModal(false)}
          onSave={updateStudentsData}
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
          curriculum={curriculum}
          onClose={() => setShowCurriculumModal(false)}
          onSave={updateCurriculumData}
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
          homeworkCurriculum={homeworkCurriculum}
          onClose={() => setShowHomeworkCurriculumModal(false)}
          onSave={updateHomeworkCurriculumData}
        />
      )}

      {showGradeSheet && (
        <GradesSheet
          students={students}
          calculateTotalScore={calculateTotalScore}
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemester}
          testCalculationMethod={testCalculationMethod}
          handleTestCalculationMethodChange={handleTestCalculationMethodChange}
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
          calculateTotalScore={calculateTotalScore}
          calculateCategoryScore={calculateCategoryScore}
          gradeName={gradeName}
          sectionName={sectionName}
          schoolName={schoolName}
          teacherName={teacherName}
          currentSemester={currentSemester}
          testCalculationMethod={testCalculationMethod}
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
        />
      )}

      {showAbsenceModal && (
        <AbsenceModal
          students={students}
          onClose={() => setShowAbsenceModal(false)}
          onSave={updateAbsenceData}
        />
      )}

      {showTroubledStudentsModal && (
        <TroubledStudentsModal
          students={students}
          onClose={() => setShowTroubledStudentsModal(false)}
          homeworkCurriculum={homeworkCurriculum}
          recitationCurriculum={curriculum}
          getTroubledStudents={getTroubledStudents}
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
        />
      )}
    </div>
  );
};


export default SectionGrades;



