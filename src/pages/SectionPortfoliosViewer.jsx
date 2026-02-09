// src/pages/SectionPortfoliosViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaUserTie, FaClipboardList, FaArrowLeft, FaFilePdf, FaEye, FaEyeSlash,
  FaExclamationTriangle, FaCheck, FaHistory, FaLayerGroup, 
  FaSchool, FaShapes, FaTrash, FaQrcode, FaFileAlt, FaTimes, FaSearch,
  FaUserSecret, FaUserShield, FaChalkboardTeacher, FaBell, FaTrashAlt, FaCog, FaToggleOn, FaToggleOff, FaSave, FaPen
} from 'react-icons/fa';
import QRCode from "react-qr-code"; 
import StudentPortfolioFileViewer from '../components/StudentPortfolioFileViewer';
import { getGradeNameById } from "../utils/gradeUtils";

const SectionPortfoliosViewer = () => {
  const { gradeId, sectionId: paramSectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isSupervisor = location.pathname.includes('supervisor');
  
  // --- States ---
  const [loading, setLoading] = useState(true);
  
  // Settings (Semester & Period)
  const [activeSemester, setActiveSemester] = useState('semester1');
  const [activePeriod, setActivePeriod] = useState('period1');

  // Sections Management
  const [activeSectionId, setActiveSectionId] = useState(paramSectionId || null);
  const [availableSections, setAvailableSections] = useState([]);
  const [hiddenSections, setHiddenSections] = useState([]); 

  const [students, setStudents] = useState([]);
  const [files, setFiles] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({ name: '', school: '', photo: '' });
  const [searchQuery, setSearchQuery] = useState("");
  
  // UI Controls
  const [isSectionVisible, setIsSectionVisible] = useState(true); 
  const [showDeleteRequestsModal, setShowDeleteRequestsModal] = useState(false);
  const [showSectionSettingsModal, setShowSectionSettingsModal] = useState(false);

  // Supervisor Identity
  const [supervisorName, setSupervisorName] = useState('');
  const [visitorRole, setVisitorRole] = useState('مشرف تربوي');
  const [isSupervisorRegistered, setIsSupervisorRegistered] = useState(false);
  const [supervisorNote, setSupervisorNote] = useState(''); 
  const [currentVisitId, setCurrentVisitId] = useState(null);
  
  // Student Private Notes
  const [studentNotesInput, setStudentNotesInput] = useState({});
  const [fetchedStudentNotes, setFetchedStudentNotes] = useState({});
  const [expandedStudentNotes, setExpandedStudentNotes] = useState({}); 

  // Teacher Specific & UI
  const [visitsLog, setVisitsLog] = useState([]);
  const [latestSupervisorNote, setLatestSupervisorNote] = useState(null);
  const [showNoteAlert, setShowNoteAlert] = useState(false); 
  const [showVisitsModal, setShowVisitsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // File Viewer
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [viewingFiles, setViewingFiles] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  // Grading System States
  const [isGradingMode, setIsGradingMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [batchGradeInput, setBatchGradeInput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState(null);

  // Alert System
  const [alert, setAlert] = useState({
    show: false, type: '', title: '', message: '', 
    onConfirm: null, showCancelButton: true, confirmText: 'موافق'
  });

  const formatSectionName = (secId) => {
    if (!secId) return "فصل غير محدد";
    const number = secId.replace(/\D/g, ''); 
    return number ? `فصل ${number}` : secId;
  };

  useEffect(() => {
    const initPage = async () => {
        setLoading(true);
        await fetchSettingsAndTeacherInfo();
        await fetchHiddenSections();

        if (isSupervisor && !activeSectionId) {
            await fetchSectionsForGrade();
        }
        
        if (activeSectionId) {
            if (!isSupervisor) await fetchSectionsForGrade();
            await fetchData(activeSectionId);
            await fetchVisitsLog(activeSectionId);
            await fetchAllStudentNotes(activeSectionId);
        }

        if (isSupervisor && !activeSectionId) {
            setLoading(false);
        }
    };
    initPage();
  }, [gradeId, activeSectionId, isSupervisor]);

  // --- Fetching Functions ---

  const fetchSettingsAndTeacherInfo = async () => {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 'general').single();
        if (data) {
            setTeacherInfo({
                name: data.teacher_name || "المعلم",
                school: data.school_name || "المدرسة",
                photo: data.teacher_photo || "/default-avatar.png"
            });
            if (data.active_semester_key) setActiveSemester(data.active_semester_key);
            if (data.current_period) setActivePeriod(data.current_period);
        }
      } catch (error) { console.error("Error fetching settings:", error); }
  };

  const fetchHiddenSections = async () => {
      const { data } = await supabase.from('section_visibility').select('section_id').eq('grade_id', gradeId).eq('is_hidden', true);
      if (data) {
          setHiddenSections(data.map(item => item.section_id));
      }
  };

  const fetchSectionsForGrade = async () => {
      try {
          const { data, error } = await supabase
              .from('students')
              .select('section')
              .eq('grade_level', gradeId);
          
          if (!error && data && data.length > 0) {
              const uniqueSectionIds = [...new Set(data.map(item => item.section))];
              uniqueSectionIds.sort();
              const sectionsList = uniqueSectionIds.map(secId => ({
                  id: secId,
                  name: formatSectionName(secId)
              }));
              setAvailableSections(sectionsList);
          } else {
              setAvailableSections([]);
          }
      } catch (err) {
          console.error("Error fetching sections:", err);
      }
  };

  const fetchData = async (secId) => {
    setLoading(true);
    try {
        const { data: studentsData, error: stError } = await supabase
            .from('students')
            .select('*')
            .eq('section', secId)
            .eq('grade_level', gradeId)
            .order('name', { ascending: true });
        if (stError) throw stError;

        const studentIds = studentsData.map(s => s.id);
        if (studentIds.length > 0) {
            const { data: filesData, error: flError } = await supabase
                .from('portfolio_files')
                .select('*')
                .in('student_id', studentIds)
                .neq('status', 'deleted')
                .order('created_at', { ascending: false });
            if (flError) throw flError;
            setFiles(filesData);
        } else {
            setFiles([]);
        }
        setStudents(studentsData);
        setHasUnsavedChanges(false);
        setSelectedStudents([]);
    } catch (error) {
        console.error("Error:", error);
        showAlert({ type: 'error', title: 'خطأ', message: 'فشل تحميل البيانات', showCancelButton: false });
    } finally {
        setLoading(false);
    }
  };

  const fetchAllStudentNotes = async (secId) => {
    try {
        const { data: studentsInSec } = await supabase.from('students').select('id').eq('section', secId).eq('grade_level', gradeId);
        if(!studentsInSec) return;
        const ids = studentsInSec.map(s => s.id);
        
        if (ids.length > 0) {
            const { data } = await supabase
                .from('supervisor_student_notes')
                .select('*')
                .in('student_id', ids)
                .order('created_at', { ascending: false });
            
            const notesMap = {};
            data.forEach(note => {
                if (!notesMap[note.student_id]) notesMap[note.student_id] = [];
                notesMap[note.student_id].push(note);
            });
            setFetchedStudentNotes(notesMap);
        }
    } catch (error) {
        console.error("Error fetching notes", error);
    }
  };

  // --- Logic Helpers ---
  const getFileId = (url) => {
    if (!url) return null;
    const cleanUrl = url.toString().trim();
    const matchStandard = cleanUrl.match(/(?:id=|\/d\/)([\w-]{25,})/);
    if (matchStandard) return matchStandard[1];
    const matchBroken = cleanUrl.match(/picture\/0?([\w-]{25,})/);
    if (matchBroken) return matchBroken[1];
    return null;
  };

  const getOptimizedUrl = (originalUrl, size = 'w800') => {
    const fileId = getFileId(originalUrl);
    if (!fileId) return originalUrl || '/default-avatar.png';
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  };

  const openFileViewer = (selectedFile, contextFiles) => {
      setViewingFiles(contextFiles);
      const index = contextFiles.findIndex(f => f.id === selectedFile.id);
      setCurrentFileIndex(index !== -1 ? index : 0);
  };

  // --- Grading Logic (4 Fields + Fixes) ---

  const getPerformanceTasks = (student) => {
      const semesterData = student.grades?.[activeSemester];
      const periodData = semesterData?.[activePeriod];
      
      const tasks = periodData?.performanceTasks || periodData?.performance_tasks || student.grades?.performanceTasks || [null, null, null, null];
      
      // التأكد من أن المصفوفة بطول 4 عناصر (للعرض)
      const result = [...tasks];
      while(result.length < 4) result.push(null);
      return result.slice(0, 4); // قص الزائد إذا وجد
  };

const handleGradeChange = (studentId, index, value) => {
      // تحويل الأرقام العربية إلى إنجليزية
      const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
      let englishValue = value;
      for (let i = 0; i < arabicNumbers.length; i++) {
          englishValue = englishValue.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i]);
      }

      // التحقق من القيمة
      const numValue = englishValue === '' ? null : Number(englishValue);
      if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
          return; // قيمة غير صالحة
      }

      setStudents(prevStudents => prevStudents.map(student => {
          if (student.id === studentId) {
              // 1. نسخ عميق للهيكل القديم
              const newGrades = JSON.parse(JSON.stringify(student.grades || {}));

              // 2. ضمان وجود المسار
              if (!newGrades[activeSemester]) newGrades[activeSemester] = {};
              if (!newGrades[activeSemester][activePeriod]) newGrades[activeSemester][activePeriod] = {};

              // 3. جلب الدرجات الحالية بدقة (هنا كان الخطأ: تم إضافة performance_tasks)
              const periodData = newGrades[activeSemester][activePeriod];
              // نقرأ من كلا المصدرين المحتملين لتجنب فقدان البيانات
              const currentTasks = periodData.performanceTasks || periodData.performance_tasks || []; 
              
              // 4. بناء مصفوفة جديدة مكونة من 4 خانات مع الحفاظ على القديم
              let tasks = [0, 1, 2, 3].map(i => {
                  if (i === index) return numValue;
                  return currentTasks[i] !== undefined ? currentTasks[i] : null;
              });

              // 5. حفظ المصفوفة الجديدة بالاسم الموحد
              newGrades[activeSemester][activePeriod].performanceTasks = tasks;
              // نقوم بمسح الاسم القديم لتجنب التضارب مستقبلاً
              if (newGrades[activeSemester][activePeriod].performance_tasks) {
                  delete newGrades[activeSemester][activePeriod].performance_tasks;
              }

              return { ...student, grades: newGrades };
          }
          return student;
      }));
      setHasUnsavedChanges(true);
  };

  const toggleStudentSelection = (studentId) => {
      setSelectedStudents(prev => 
          prev.includes(studentId) 
              ? prev.filter(id => id !== studentId) 
              : [...prev, studentId]
      );
  };

  const toggleSelectAll = () => {
      const filtered = students.filter(s => s.name.includes(searchQuery));
      if (selectedStudents.length === filtered.length) {
          setSelectedStudents([]);
      } else {
          setSelectedStudents(filtered.map(s => s.id));
      }
  };

  // دالة الرصد الجماعي (مع منطق التخطي والتنبيه)
const applyBatchGrade = () => {
      if (!batchGradeInput) return;
      
      const numValue = Number(batchGradeInput);
      if (isNaN(numValue) || numValue < 0 || numValue > 10) {
          showAlert({ type: 'error', title: 'خطأ', message: 'الدرجة يجب أن تكون بين 0 و 10', showCancelButton: false });
          return;
      }

      let skippedStudentsNames = [];
      let changesMade = false;

      setStudents(prevStudents => {
          const updatedStudents = prevStudents.map(student => {
              // فقط للطلاب المحددين
              if (selectedStudents.includes(student.id)) {
                  const newGrades = JSON.parse(JSON.stringify(student.grades || {}));
                  
                  if (!newGrades[activeSemester]) newGrades[activeSemester] = {};
                  if (!newGrades[activeSemester][activePeriod]) newGrades[activeSemester][activePeriod] = {};

                  // 1. جلب الدرجات الحالية (التصحيح هنا أيضاً)
                  const periodData = newGrades[activeSemester][activePeriod];
                  const currentTasks = periodData.performanceTasks || periodData.performance_tasks || [];

                  // 2. تجهيز مصفوفة العمل (4 خانات)
                  let tasks = [0, 1, 2, 3].map(i => currentTasks[i] !== undefined ? currentTasks[i] : null);

                  // 3. البحث عن أول خانة فارغة (null أو نص فارغ)
                  // ملاحظة: الرقم 0 يعتبر درجة ولا يعتبر خانة فارغة
                  const firstEmptyIndex = tasks.findIndex(g => g === null || g === '' || g === undefined);
                  
                  if (firstEmptyIndex !== -1) {
                      // وجدنا خانة فارغة -> نضع الدرجة فيها
                      tasks[firstEmptyIndex] = numValue;
                      
                      // تحديث بيانات الطالب وتوحيد المسمى
                      newGrades[activeSemester][activePeriod].performanceTasks = tasks;
                      if (newGrades[activeSemester][activePeriod].performance_tasks) {
                          delete newGrades[activeSemester][activePeriod].performance_tasks;
                      }

                      changesMade = true;
                      return { ...student, grades: newGrades };
                  } else {
                      // جميع الخانات ممتلئة -> نتجاهل الطالب ونحفظ اسمه
                      skippedStudentsNames.push(student.name);
                      return student; // إرجاع الطالب كما هو دون تعديل
                  }
              }
              return student;
          });

          // تأخير عرض التنبيه قليلاً ليظهر بعد تحديث الـ State
          setTimeout(() => {
            if (skippedStudentsNames.length > 0) {
                const namesList = skippedStudentsNames.join('، ');
                showAlert({ 
                    type: 'warning', 
                    title: 'تنبيه امتلاء الخانات', 
                    message: `لم يتم رصد الدرجة للطلاب التاليين لاكتمال خاناتهم: (${namesList})`, 
                    showCancelButton: false 
                });
            } else if (changesMade) {
                showAlert({ type: 'success', title: 'تم', message: 'تم رصد الدرجات للمحدد. اضغط حفظ لاعتماد التغييرات.', showCancelButton: false });
            }
          }, 100);

          if (changesMade) setHasUnsavedChanges(true);

          return updatedStudents;
      });

      setBatchGradeInput('');
  };
  // --- SAVE FUNCTIONS ---

const saveAllGrades = async () => {
      setIsSaving(true);
      try {
          // التعديل هنا: قمنا بإضافة الاسم وبقية البيانات الضرورية لتجنب خطأ القيمة الفارغة
          const updates = students.map(s => ({
              id: s.id,
              name: s.name,           // <--- ضروري جداً لتفادي الخطأ
              section: s.section,     // يفضل إضافته إذا كان إجبارياً في قاعدة البيانات
              grade_level: s.grade_level, // يفضل إضافته إذا كان إجبارياً
              grades: s.grades
          }));

          // استخدام onConflict للتأكيد على أن التحديث يتم بناءً على المعرف
          const { error } = await supabase
              .from('students')
              .upsert(updates, { onConflict: 'id' });

          if (error) throw error;
          
          setHasUnsavedChanges(false);
          showAlert({ type: 'success', title: 'نجاح', message: 'تم حفظ الدرجات لجميع الطلاب.', showCancelButton: false });
      } catch (error) {
          console.error("Save error:", error);
          showAlert({ type: 'error', title: 'خطأ', message: `فشل حفظ الدرجات: ${error.message}`, showCancelButton: false });
      } finally {
          setIsSaving(false);
      }
  };

  const saveStudentGrades = async (studentId) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      setSavingStudentId(studentId); 
      try {
          const { error } = await supabase
              .from('students')
              .update({ grades: student.grades })
              .eq('id', studentId);

          if (error) throw error;

          showAlert({ type: 'success', title: 'تم الحفظ', message: `تم حفظ درجات ${student.name} بنجاح.`, showCancelButton: false });
          
      } catch (error) {
          console.error("Single save error:", error);
          showAlert({ type: 'error', title: 'خطأ', message: 'فشل حفظ الدرجات لهذا الطالب.', showCancelButton: false });
      } finally {
          setSavingStudentId(null);
      }
  };


  // --- Toggle Section Visibility ---
  const toggleSectionVisibility = async (secId) => {
      const isCurrentlyHidden = hiddenSections.includes(secId);
      const newStatus = !isCurrentlyHidden;
      if (newStatus) {
          setHiddenSections([...hiddenSections, secId]);
      } else {
          setHiddenSections(hiddenSections.filter(id => id !== secId));
      }
      try {
          const { error } = await supabase
            .from('section_visibility')
            .upsert({ 
                grade_id: gradeId, 
                section_id: secId, 
                is_hidden: newStatus 
            }, { onConflict: 'grade_id, section_id' });
          if (error) console.error("Failed to update visibility", error);
      } catch (err) { console.error(err); }
  };

  // --- Supervisor Actions ---
  const handleSupervisorLogin = async () => {
    if (!supervisorName.trim()) return;
    setIsSupervisorRegistered(true);
  };

  const handleSelectSection = async (secId) => {
      setActiveSectionId(secId);
      setLoading(true);
      const displayName = `${supervisorName} (${visitorRole})`;
      try {
        const { data, error } = await supabase.from('supervisor_visits').insert({
            supervisor_name: displayName,
            section_id: secId,
            grade_id: gradeId,
            visit_date: new Date().toISOString(),
            notes: ''
        }).select().single();
        if (!error && data) {
            setCurrentVisitId(data.id);
            await fetchData(secId);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
  };

  const submitSupervisorGeneralNote = async () => {
    if (!currentVisitId || !supervisorNote.trim()) return;
    const { error } = await supabase
        .from('supervisor_visits')
        .update({ notes: supervisorNote })
        .eq('id', currentVisitId);
    if (!error) showAlert({ type: 'success', title: 'نجاح', message: 'تم إرسال الملاحظة.', showCancelButton: false });
  };

  const saveStudentNote = async (studentId) => {
      const note = studentNotesInput[studentId];
      if (!note || !note.trim()) return;
      const displayName = `${supervisorName} (${visitorRole})`;
      try {
          const { error } = await supabase.from('supervisor_student_notes').insert({
              student_id: studentId,
              supervisor_name: displayName,
              note: note
          });
          if (!error) {
              showAlert({ type: 'success', title: 'تم الحفظ', message: 'تم حفظ الملاحظة بنجاح.', showCancelButton: false });
              setStudentNotesInput({ ...studentNotesInput, [studentId]: '' });
          } else {
              showAlert({ type: 'error', title: 'خطأ', message: `فشل الحفظ: ${error.message}`, showCancelButton: false });
          }
      } catch (err) {
          showAlert({ type: 'error', title: 'خطأ', message: 'حدث خطأ غير متوقع', showCancelButton: false });
      }
  };

  // --- Teacher Actions ---
  const fetchVisitsLog = async (secId) => {
      const { data } = await supabase
        .from('supervisor_visits')
        .select('*')
        .eq('section_id', secId)
        .order('visit_date', { ascending: false });
      if (data) {
          setVisitsLog(data);
          const lastNote = data.find(v => v.notes && v.notes.trim() !== "");
          if (lastNote) {
             const hiddenVisitId = localStorage.getItem('hidden_visit_id');
             if (hiddenVisitId !== lastNote.id.toString()) {
                 setLatestSupervisorNote(lastNote);
                 setShowNoteAlert(true);
             }
          }
      }
  };
  
  const handleCloseNoteAlert = () => {
      if (latestSupervisorNote) {
          localStorage.setItem('hidden_visit_id', latestSupervisorNote.id.toString());
      }
      setShowNoteAlert(false);
  };

  const toggleStudentNotes = (studentId) => {
      setExpandedStudentNotes(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };
  
  const handleDeleteStudentNote = (noteId, studentId) => {
    showAlert({
        type: 'confirm',
        title: 'حذف الملاحظة',
        message: 'هل أنت متأكد من حذف هذه الملاحظة؟',
        onConfirm: async () => {
            const { error } = await supabase.from('supervisor_student_notes').delete().eq('id', noteId);
            if (!error) {
                setFetchedStudentNotes(prev => ({
                    ...prev,
                    [studentId]: prev[studentId].filter(n => n.id !== noteId)
                }));
                showAlert({ type: 'success', title: 'تم الحذف', message: 'تم حذف الملاحظة.', showCancelButton: false });
            }
        }
    });
  };

  const handleDeleteFile = (fileId) => {
    showAlert({
        type: 'confirm',
        title: 'حذف الملف',
        message: 'هل أنت متأكد من حذف هذا الملف؟',
        confirmText: 'حذف',
        onConfirm: async () => {
            const { error } = await supabase
                .from('portfolio_files')
                .update({ status: 'deleted' }) 
                .eq('id', fileId);
            
            if (!error) {
                setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
                showAlert({ type: 'success', title: 'نجاح', message: 'تم حذف الملف.', showCancelButton: false });
            } else {
                console.error(error);
                showAlert({ type: 'error', title: 'خطأ', message: 'حدث خطأ أثناء الحذف.', showCancelButton: false });
            }
        }
    });
  };

  const pendingDeleteFiles = files.filter(f => f.status === 'pending_delete');
  const showAlert = (opts) => setAlert({ ...alert, show: true, ...opts });
  const closeAlert = () => setAlert({ ...alert, show: false });
  
  const AlertModal = () => {
    if (!alert.show) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAlert}></div>
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
                <div className={`h-2 ${alert.type === 'success' ? 'bg-green-500' : alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-600'}`}></div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{alert.title}</h3>
                    <p className="text-slate-300 mb-6">{alert.message}</p>
                    <div className="flex justify-end gap-3">
                        {alert.showCancelButton && (
                            <button onClick={closeAlert} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">إلغاء</button>
                        )}
                        <button onClick={() => { if(alert.onConfirm) alert.onConfirm(); closeAlert(); }} className="px-4 py-2 rounded-lg text-white bg-blue-600">
                            {alert.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // --- RENDER START ---
  if (isSupervisor && !isSupervisorRegistered) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-cairo relative overflow-hidden" dir="rtl">
            <AlertModal />
            <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md text-center border border-white/10 shadow-2xl relative z-10">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                    <FaUserTie className="text-3xl text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">تسجيل دخول الزائر</h2>
                <div className="space-y-4">
                    <div className="text-right">
                        <label className="text-xs text-slate-400 mr-2 mb-1 block">الصفة</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setVisitorRole('مشرف تربوي')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${visitorRole === 'مشرف تربوي' ? 'bg-yellow-500 text-slate-900 border-yellow-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                <FaUserSecret /> مشرف تربوي
                            </button>
                            <button onClick={() => setVisitorRole('مدير المدرسة')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${visitorRole === 'مدير المدرسة' ? 'bg-orange-500 text-white border-orange-500 font-bold' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                <FaUserShield /> مدير المدرسة
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <label className="text-xs text-slate-400 mr-2 mb-1 block">الاسم الكريم</label>
                        <input type="text" placeholder="اكتب اسمك هنا..." className="w-full p-4 rounded-xl bg-slate-800/50 text-white border border-slate-700 focus:border-yellow-500 outline-none transition-all" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
                    </div>
                    <button onClick={handleSupervisorLogin} disabled={loading || !supervisorName.trim()} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 font-bold py-3.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 mt-4">
                        متابعة
                    </button>
                </div>
            </div>
        </div>
    );
  }

  if (isSupervisor && isSupervisorRegistered && !activeSectionId) {
      const visibleSections = availableSections.filter(sec => !hiddenSections.includes(sec.id));
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-cairo" dir="rtl">
             <h2 className="text-3xl font-bold text-white mb-2">اختر الفصل</h2>
             <p className="text-slate-400 mb-8">يرجى اختيار الفصل الذي تود زيارته</p>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
                 {visibleSections.length > 0 ? (
                     visibleSections.map(sec => (
                         <button 
                            key={sec.id}
                            onClick={() => handleSelectSection(sec.id)}
                            className="bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-white p-6 rounded-2xl transition-all shadow-lg flex flex-col items-center gap-3 group"
                         >
                             <div className="bg-slate-700 group-hover:bg-blue-500 p-4 rounded-full transition-colors">
                                 <FaChalkboardTeacher size={24} />
                             </div>
                             <span className="text-xl font-bold">{sec.name}</span>
                         </button>
                     ))
                 ) : (
                     <p className="col-span-3 text-center text-slate-500">لا توجد فصول متاحة حالياً.</p>
                 )}
             </div>
        </div>
      )
  }

  // --- MAIN RENDER ---
  const gradeName = getGradeNameById(gradeId);
  const sectionName = formatSectionName(activeSectionId);
  const unifiedQRLink = `${window.location.origin}/supervisor/grade/${gradeId}`;
  const filteredStudents = students.filter(s => s.name.includes(searchQuery));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-cairo pb-20 selection:bg-blue-500/30" dir="rtl">
        <AlertModal />
        
        {/* Header - Fixed Layout */}
        <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 pt-12 pb-16 px-6 border-b border-slate-800/50 overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px]"></div>
             </div>

             <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-6 relative z-10">
                {/* Right Side: Teacher Info */}
                <div className="flex items-center gap-6 w-full xl:w-auto order-1 xl:order-1">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600 shadow-xl shrink-0">
                        <img src={teacherInfo.photo} alt={teacherInfo.name} className="w-full h-full rounded-full object-cover bg-slate-800 border-2 border-slate-900" onError={(e) => { e.target.src = '/default-avatar.png'; }} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{teacherInfo.name}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2"><FaSchool /> {teacherInfo.school}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                             <span className="text-slate-400 text-xs flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg border border-white/5">
                                <FaLayerGroup size={10}/> {gradeName} - {sectionName}
                             </span>
                             {isSupervisor && (
                                 <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20">
                                     زائر: {supervisorName}
                                 </span>
                             )}
                        </div>
                    </div>
                </div>
                
                {/* Left Side: Controls - Grouped nicely */}
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full xl:w-auto justify-end order-2 xl:order-2">
                    {/* Search Bar - Grows on mobile, fixed width on desktop */}
                    <div className="relative w-full md:w-64">
                        <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" placeholder="بحث عن طالب..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl py-3 pr-10 pl-4 text-white focus:border-blue-500 outline-none w-full" />
                    </div>
                    
                    {/* Actions Group */}
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                        {!isSupervisor && (
                            <>
                                {/* Grading Toggle */}
                                <button 
                                    onClick={() => setIsGradingMode(!isGradingMode)}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all border font-bold text-sm ${isGradingMode ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'}`}
                                >
                                    <FaPen /> {isGradingMode ? 'إغلاق الرصد' : 'رصد الدرجات'}
                                </button>

                                {/* Icon Buttons Group */}
                                <div className="flex items-center bg-slate-800/50 rounded-xl border border-slate-700/50 p-1">
<button 
    onClick={() => setShowDeleteRequestsModal(true)}
    className="bg-slate-800 p-3 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all relative group shadow-lg"
    title="طلبات الحذف"
>
    <FaTrashAlt className={pendingDeleteFiles.length > 0 ? "text-red-500" : "text-slate-400"} size={20} />
    
    {/* ظهور الرقم في دائرة حمراء إذا وجدت طلبات */}
    {pendingDeleteFiles.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(220,38,38,0.5)] border-2 border-slate-900">
            {pendingDeleteFiles.length}
        </span>
    )}
</button>
                                </div>

                                {/* Secondary Actions */}
                                <button onClick={() => setShowQRModal(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm"><FaQrcode /> رمز الصف</button>
                                <button onClick={() => setShowVisitsModal(true)} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl transition-all border border-slate-700 text-sm"><FaHistory className="text-yellow-500" /> الزيارات</button>
                            </>
                        )}
                        
                        <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-3 rounded-xl transition-all border border-white/5 text-sm"><FaArrowLeft /> عودة</button>
                    </div>
                </div>
             </div>
             
             {/* Notes Alert */}
             {!isSupervisor && latestSupervisorNote && showNoteAlert && (
                 <div className="max-w-7xl mx-auto mt-6 animate-fade-in-up relative">
                     <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 flex items-start gap-4 shadow-lg pr-12">
                         <button onClick={handleCloseNoteAlert} className="absolute top-3 left-3 text-slate-400 hover:text-white transition-colors p-1"><FaTimes size={16} /></button>
                         <div className="bg-yellow-500/20 p-3 rounded-xl text-yellow-400"><FaBell size={20} /></div>
                         <div className="flex-1">
                             <h4 className="text-yellow-400 font-bold text-sm mb-1 flex items-center justify-between">
                                 <span>آخر ملاحظة من الزوار ({latestSupervisorNote.supervisor_name}):</span>
                                 <span className="text-[10px] text-slate-400">{new Date(latestSupervisorNote.visit_date).toLocaleDateString('ar-EG')}</span>
                             </h4>
                             <p className="text-slate-200 text-sm leading-relaxed">{latestSupervisorNote.notes}</p>
                         </div>
                     </div>
                 </div>
             )}

             {isSupervisor && (
                <div className="max-w-7xl mx-auto mt-10 bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-yellow-500/20 shadow-lg animate-fade-in-up">
                    <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2"><FaClipboardList /> تدوين ملاحظة عامة للمعلم</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input type="text" value={supervisorNote} onChange={e => setSupervisorNote(e.target.value)} placeholder="اكتب ملاحظاتك..." className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-3 text-white focus:border-yellow-500 outline-none transition-colors" />
                        <button onClick={submitSupervisorGeneralNote} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-8 py-3 rounded-xl font-bold transition-transform active:scale-95">إرسال</button>
                    </div>
                </div>
             )}

             {/* GRADING BATCH TOOLBAR */}
             {isGradingMode && !isSupervisor && (
                 <div className="max-w-7xl mx-auto mt-6 animate-slide-down">
                     <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
                         <div className="flex items-center gap-4 flex-1">
                             <button onClick={toggleSelectAll} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm">
                                 {selectedStudents.length === filteredStudents.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                             </button>
                             <div className="h-8 w-px bg-slate-600 mx-2"></div>
                             <div className="flex items-center gap-2">
                                 <span className="text-sm text-slate-400 whitespace-nowrap">الرصد الجماعي:</span>
                                 <input 
                                     type="number" 
                                     placeholder="الدرجة (0-10)" 
                                     className="w-32 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-center focus:border-orange-500 outline-none"
                                     value={batchGradeInput}
                                     onChange={(e) => setBatchGradeInput(e.target.value)}
                                     max={10} min={0}
                                 />
                                 <button 
                                     onClick={applyBatchGrade}
                                     disabled={selectedStudents.length === 0 || !batchGradeInput}
                                     className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
                                 >
                                     تطبيق
                                 </button>
                                 <span className="text-xs text-slate-500 mr-2">* يتم التعبئة في أول خانة فارغة من الـ 4 خانات</span>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-3">
                             {hasUnsavedChanges && <span className="text-yellow-500 text-sm animate-pulse">يوجد تغييرات غير محفوظة</span>}
                             <button 
                                 onClick={saveAllGrades}
                                 disabled={!hasUnsavedChanges || isSaving}
                                 className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 {isSaving ? 'جاري الحفظ...' : <><FaSave /> حفظ التغييرات</>}
                             </button>
                         </div>
                     </div>
                 </div>
             )}
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">
            {!isSectionVisible && !isSupervisor ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                    <FaEyeSlash size={40} />
                    <p>قائمة الطلاب مخفية حالياً.</p>
                    <button onClick={() => setIsSectionVisible(true)} className="text-blue-400 hover:underline">إظهار القائمة</button>
                </div>
            ) : loading ? (
                 <div className="flex flex-col items-center py-20 text-slate-500 gap-4">
                     <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <p>جاري تحميل ملفات الطلاب...</p>
                 </div>
            ) : (
                filteredStudents.map(student => {
                    const studentFiles = files.filter(f => f.student_id === student.id);
                    const performanceTasks = studentFiles.filter(f => f.category === 'performance_tasks');
                    const otherWorks = studentFiles.filter(f => f.category === 'others');
                    
                    const studentNotesCount = fetchedStudentNotes[student.id]?.length || 0;
                    const isNotesExpanded = expandedStudentNotes[student.id];

                    const ptGrades = getPerformanceTasks(student);

                    const isSelected = isGradingMode && selectedStudents.includes(student.id);

                    return (
                        <div 
                            key={student.id} 
                            onClick={() => isGradingMode && toggleStudentSelection(student.id)}
                            className={`relative animate-fade-in-up bg-slate-900/40 border p-6 rounded-3xl shadow-xl transition-all duration-200 
                                ${isGradingMode ? 'cursor-pointer' : ''}
                                ${isSelected 
                                    ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-900/10 scale-[1.01]' 
                                    : 'border-white/5 hover:border-blue-500/20'
                                }`
                            }
                        >
                            
                            {/* Selected Badge */}
                            {isSelected && (
                                <div className="absolute top-0 right-0 p-4 z-10">
                                    <div className="bg-orange-500 text-white rounded-full p-1 shadow-lg animate-scale-in">
                                        <FaCheck size={14} />
                                    </div>
                                </div>
                            )}

                            {/* Student Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6 pl-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full p-1 bg-gradient-to-tr ${isSelected ? 'from-orange-500 to-red-600' : 'from-blue-500 to-purple-600'}`}>
                                        <img src={student.photo || '/default-avatar.png'} alt={student.name} className="w-full h-full rounded-full object-cover bg-slate-800" onError={(e) => { e.target.src = '/default-avatar.png'; }} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                                            {student.name}
                                            {!isSupervisor && studentNotesCount > 0 && (
                                                <button onClick={(e) => { e.stopPropagation(); toggleStudentNotes(student.id); }} className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${isNotesExpanded ? 'bg-yellow-500 text-slate-900' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                                                    {isNotesExpanded ? <FaEyeSlash /> : <FaEye />} {studentNotesCount} ملاحظة
                                                </button>
                                            )}
                                        </h3>
                                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">{studentFiles.length} ملفات</span>
                                    </div>
                                </div>

                                {isSupervisor && (
                                    <div className="w-full sm:w-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input type="text" placeholder="ملاحظة خاصة..." className="flex-1 sm:w-64 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" value={studentNotesInput[student.id] || ''} onChange={(e) => setStudentNotesInput({...studentNotesInput, [student.id]: e.target.value})} />
                                        <button onClick={() => saveStudentNote(student.id)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"><FaCheck size={14}/></button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Grading Inputs Section (4 Fields Only) */}
                            {(!isSupervisor || isGradingMode) && (
                                <div className="mb-8 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-orange-400 font-bold flex items-center gap-2 text-sm">
                                            <FaPen className="text-xs" /> درجات المهام الأدائية
                                        </h4>
                                        <span className="text-xs text-slate-500">الفترة: {activePeriod === 'period1' ? 'الأولى' : 'الثانية'}</span>
                                    </div>
                                    <div className="flex gap-2 max-w-lg items-center">
                                        <div className="flex gap-2 flex-1">
                                            {/* عرض 4 خانات فقط */}
                                            {ptGrades.slice(0, 4).map((grade, idx) => (
                                                <div key={idx} className="flex-1">
                                                    <input 
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={grade ?? ''}
                                                        onChange={(e) => handleGradeChange(student.id, idx, e.target.value)}
                                                        disabled={isSupervisor}
                                                        placeholder="-"
                                                        className={`w-full text-center py-2 rounded-lg font-bold text-lg outline-none border transition-all 
                                                            ${grade !== null ? 'bg-slate-700 text-white border-orange-500/50' : 'bg-black/40 text-gray-500 border-slate-800'}
                                                            ${!isSupervisor ? 'focus:border-orange-500 focus:ring-1 focus:ring-orange-500' : ''}
                                                        `}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Individual Save Button */}
                                        {!isSupervisor && (
                                            <button 
                                                onClick={() => saveStudentGrades(student.id)}
                                                disabled={savingStudentId === student.id}
                                                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg shadow-lg border border-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                                                title="حفظ درجات هذا الطالب"
                                            >
                                                {savingStudentId === student.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes Area */}
                            {isNotesExpanded && (
                                <div className="mb-6 bg-slate-800/50 border border-yellow-500/30 p-4 rounded-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                                    <h5 className="text-yellow-500 font-bold mb-3 text-sm flex items-center gap-2"><FaUserSecret /> ملاحظات المشرفين الخاصة:</h5>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {fetchedStudentNotes[student.id]?.map(note => (
                                            <div key={note.id} className="bg-slate-900 p-3 rounded-lg border-r-2 border-yellow-500 relative group">
                                                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{note.supervisor_name}</span><span>{new Date(note.created_at).toLocaleDateString('ar-EG')}</span></div>
                                                <p className="text-slate-200 text-sm">{note.note}</p>
                                                <button onClick={() => handleDeleteStudentNote(note.id, student.id)} className="absolute top-2 left-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Categories */}
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-sm border-r-2 border-blue-500 pr-3"><FaShapes /> المهام الأدائية</h4>
                                    {performanceTasks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {performanceTasks.map((file) => (
                                                <FileCard key={file.id} file={file} isSupervisor={isSupervisor} onDelete={() => handleDeleteFile(file.id)} onClick={(e) => { e.stopPropagation(); openFileViewer(file, studentFiles); }} imageErrors={imageErrors} onImageError={() => setImageErrors({...imageErrors, [file.id]: true})} getOptimizedUrl={getOptimizedUrl} />
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-slate-600 italic py-2 pr-4">لا توجد ملفات</p>}
                                </div>

                                <div>
                                    <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-sm border-r-2 border-purple-500 pr-3"><FaLayerGroup /> أعمال ومشاريع أخرى</h4>
                                    {otherWorks.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {otherWorks.map((file) => (
                                                <FileCard key={file.id} file={file} isSupervisor={isSupervisor} onDelete={() => handleDeleteFile(file.id)} onClick={(e) => { e.stopPropagation(); openFileViewer(file, studentFiles); }} imageErrors={imageErrors} onImageError={() => setImageErrors({...imageErrors, [file.id]: true})} getOptimizedUrl={getOptimizedUrl} />
                                            ))}
                                        </div>
                                    ) : <p className="text-xs text-slate-600 italic py-2 pr-4">لا توجد ملفات</p>}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* --- MODALS --- */}
        {showDeleteRequestsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaTrashAlt className="text-red-500" /> طلبات الحذف المعلقة</h3>
                        <button onClick={() => setShowDeleteRequestsModal(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {pendingDeleteFiles.length === 0 ? <p className="text-center text-slate-500 py-8">لا توجد طلبات حذف معلقة.</p> : (
                            <div className="space-y-4">
                                {pendingDeleteFiles.map((file) => {
                                    const studentName = students.find(s => s.id === file.student_id)?.name || "طالب غير معروف";
                                    return (
                                        <div key={file.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-red-900/30 p-2 rounded-lg text-red-400"><FaFileAlt /></div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{file.file_name}</p>
                                                    <p className="text-xs text-slate-400">الطالب: {studentName}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteFile(file.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><FaCheck size={10} /> موافقة وحذف</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-800 text-center"><button onClick={() => setShowDeleteRequestsModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg">إغلاق</button></div>
                </div>
            </div>
        )}
        
        {showSectionSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaCog /> إخفاء الفصول عن المشرفين</h3>
                        <button onClick={() => setShowSectionSettingsModal(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
                        <p className="text-slate-400 text-sm mb-4">حدد الفصول التي تريد إخفاءها من قائمة المشرف:</p>
                        <div className="space-y-3">
                             {availableSections.length > 0 ? (
                                availableSections.map(sec => {
                                    const isHidden = hiddenSections.includes(sec.id);
                                    return (
                                        <div key={sec.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                                            <span className="text-white font-bold">{sec.name}</span>
                                            <button onClick={() => toggleSectionVisibility(sec.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isHidden ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-green-900/30 text-green-400 border border-green-900/50'}`}>
                                                {isHidden ? <><FaToggleOff /> مخفي</> : <><FaToggleOn /> ظاهر</>}
                                            </button>
                                        </div>
                                    )
                                })
                             ) : (
                                 <p className="text-center text-slate-500">جاري تحميل الفصول...</p>
                             )}
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-800 text-center"><button onClick={() => setShowSectionSettingsModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg">إغلاق</button></div>
                </div>
            </div>
        )}

        {showQRModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative animate-scale-in">
                    <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FaTimes size={20}/></button>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">رمز الزيارة الموحد</h3>
                    <p className="text-slate-500 text-sm mb-6">QR شامل لجميع فصول هذا الصف</p>
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner inline-block mb-6"><QRCode value={unifiedQRLink} size={200} /></div>
                    <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-xs text-slate-600"><span className="truncate flex-1 text-left px-2">{unifiedQRLink}</span><button onClick={() => {navigator.clipboard.writeText(unifiedQRLink); showAlert({type:'success', title:'تم النسخ', message:'تم النسخ', showCancelButton:false})}} className="text-blue-600 font-bold hover:underline">نسخ</button></div>
                </div>
            </div>
        )}

        {showVisitsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaHistory className="text-yellow-500" /> سجل الزيارات</h3>
                        <button onClick={() => setShowVisitsModal(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {visitsLog.length === 0 ? <p className="text-center text-slate-500 py-8">لا توجد زيارات</p> : (
                            <div className="space-y-4">
                                {visitsLog.map((visit) => (
                                    <div key={visit.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="bg-slate-700 p-2 rounded-full"><FaUserTie className="text-blue-400" /></div>
                                            <div><h4 className="font-bold text-white">{visit.supervisor_name}</h4><p className="text-xs text-slate-400">{new Date(visit.visit_date).toLocaleString('ar-EG')}</p></div>
                                        </div>
                                        {visit.notes && <div className="mt-2 bg-slate-900 p-3 rounded text-sm text-slate-300 border-r-2 border-yellow-500">{visit.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-800 text-center"><button onClick={() => setShowVisitsModal(false)} className="bg-slate-700 text-white px-6 py-2 rounded-lg">إغلاق</button></div>
                </div>
            </div>
        )}

        {/* Updated File Viewer Usage */}
        {currentFileIndex !== null && (
            <StudentPortfolioFileViewer 
                files={viewingFiles} 
                currentIndex={currentFileIndex} 
                onClose={() => setCurrentFileIndex(null)} 
                onNext={() => setCurrentFileIndex(prev => Math.min(viewingFiles.length - 1, prev + 1))} 
                onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
            />
        )}
    </div>
  );
};

// --- File Card Sub-component ---
const FileCard = ({ file, isSupervisor, onDelete, onClick, imageErrors, onImageError, getOptimizedUrl }) => {
  return (
    <div onClick={onClick} className={`group bg-slate-800/40 border border-slate-700 rounded-2xl p-4 transition-all shadow-sm relative hover:border-blue-500/50 hover:shadow-lg cursor-pointer transform hover:-translate-y-1 ${file.status === 'pending_delete' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : ''}`}>
        <div className="aspect-video bg-slate-950 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-800 relative">
            {!imageErrors[file.id] ? (
                <img src={getOptimizedUrl(file.file_url, 'w500')} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" alt={file.file_name} onError={onImageError} loading="lazy" referrerPolicy="no-referrer" />
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                     {file.file_type?.includes('pdf') || file.file_name?.toLowerCase().endsWith('.pdf') ? <><FaFilePdf size={40} className="text-red-500/80 mb-2" /><span className="text-[10px] font-bold opacity-60">PDF</span></> : <FaFileAlt size={40} />}
                </div>
            )}
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                <span className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white border border-white/20 shadow-lg scale-75 group-hover:scale-100 transition-transform"><FaEye /></span>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-start"><p className="text-sm font-bold truncate text-slate-300 w-full" dir="auto" title={file.file_name}>{file.file_name}</p></div>
            {!isSupervisor ? (
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={`w-full text-white text-[10px] py-2 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-lg mt-1 ${file.status === 'pending_delete' ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-slate-700 hover:bg-red-600'}`}>
                    <FaTrash size={10} /> {file.status === 'pending_delete' ? 'موافقة على الحذف' : 'حذف الملف'}
                </button>
            ) : (
                <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-700/50 pt-2 mt-1">
                    <div className="flex items-center gap-1">{file.status === 'pending_delete' && <span className="text-yellow-500 flex items-center gap-1"><FaExclamationTriangle /> يطلب الحذف</span>}</div>
                    <span>{new Date(file.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default SectionPortfoliosViewer;