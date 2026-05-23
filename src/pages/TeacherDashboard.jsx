// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gradesData } from "../data/mockData";
import Navbar from "../components/Navbar";
import { 
  FaUserGraduate, FaChalkboardTeacher, FaCalendarAlt, FaFileAlt, FaSignOutAlt, 
  FaBars, FaTimes, FaCog, FaHistory, FaShieldAlt, FaCloud, FaDownload, 
  FaDesktop, FaFileDownload, FaRedo, FaExchangeAlt, FaFolderOpen, FaEye, FaTrash, FaLock
} from 'react-icons/fa';
import { supabase } from "../supabaseClient";
import BackupPreviewer from "../components/BackupPreviewer";

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
  
  // NEW: حالة لتخزين معرف الفصل الدراسي النشط (semester1 أو semester2)
  const [activeSemesterKey, setActiveSemesterKey] = useState("semester1");

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBackupOptionModalOpen, setIsBackupOptionModalOpen] = useState(false);
  const [isBackupTitleModalOpen, setIsBackupTitleModalOpen] = useState(false);
  const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalError, setModalError] = useState("");

  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const [backups, setBackups] = useState([]);
  const [selectedBackupKey, setSelectedBackupKey] = useState(null);
  
  const [backupTitle, setBackupTitle] = useState("");
  const [isBackupCenterOpen, setIsBackupCenterOpen] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // حالة جديدة لإدارة نافذة الحوار المخصصة
  const [customDialogState, setCustomDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    inputs: {},
    onConfirm: () => {},
    onCancel: () => {},
  });

  // --- حالات المستعرض الجديدة ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  const setCustomDialog = (dialogProps) => {
    setCustomDialogState(dialogProps);
  };

  const loadBackups = async () => {
    if (!teacherId) return;
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('id, created_at, title')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (err) {
      console.error("Failed to load backups:", err);
      setBackups([]);
    }
  };

  const collectAllTeacherData = async () => {
    setBackupProgress(0);
    const tables = [
      'students', 'grades', 'absences', 'book_absences',
      'curriculum', 'announcements',
      'challenges', 'challenge_sessions', 'challenge_history',
      'messages', 'page_visits', 'student_visits',
      'class_materials', 'course_folders', 'portfolio_files',
      'files', 'folder_assignments', 'folder_contents', 'library_files',
      'sections', 'section_visibility', 'grade_types', 'categories',
      'teacher_info', 'teacher_photos', 'prizes', 'reward_requests',
      'activity_log', 'supervisor_visits', 'supervisor_student_notes', 'note_templates'
    ];

    const results = {};
    let completed = 0;

    const fetchTable = async (table, filterCol = 'teacher_id') => {
      let query = supabase.from(table).select('*');
      if (filterCol) query = query.eq(filterCol, teacherId);
      const { data } = await query;
      
      completed++;
      setBackupProgress(Math.round((completed / tables.length) * 100));
      return data || [];
    };

    results.students = await fetchTable('students');
    results.grades = await fetchTable('grades');
    results.absences = await fetchTable('absences');
    results.book_absences = await fetchTable('book_absences');
    results.curriculum = await fetchTable('curriculum');
    results.announcements = await fetchTable('announcements');
    results.challenges = await fetchTable('challenges');
    results.challenge_sessions = await fetchTable('challenge_sessions');
    results.challenge_history = await fetchTable('challenge_history');
    results.messages = await fetchTable('messages');
    results.page_visits = await fetchTable('page_visits');
    results.student_visits = await fetchTable('student_visits');
    results.class_materials = await fetchTable('class_materials');
    results.course_folders = await fetchTable('course_folders');
    
    // جلب ملفات إنجاز الطلاب: عبر معرفات الطلاب الموجودين
    const studentIds = results.students.map(s => s.id);
    if (studentIds.length > 0) {
        const { data: pFiles } = await supabase.from('portfolio_files').select('*').in('student_id', studentIds);
        results.portfolio_files = pFiles || [];
    } else {
        results.portfolio_files = [];
    }
    completed++; setBackupProgress(Math.round((completed / tables.length) * 100));

    results.files = await fetchTable('files', 'user_id'); // ملفات إنجاز المعلم تستخدم user_id
    results.folder_assignments = await supabase.from('folder_assignments').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));
    results.folder_contents = await supabase.from('folder_contents').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));
    results.library_files = await supabase.from('library_files').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));
    results.sections = await fetchTable('sections');
    results.section_visibility = await fetchTable('section_visibility');
    results.grade_types = await supabase.from('grade_types').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));
    results.categories = await fetchTable('categories', 'user_id'); // تصنيفات ملف الإنجاز تستخدم user_id
    results.settings = await supabase.from('settings').select('*').eq('id', teacherId);
    results.teacher_info = await fetchTable('teacher_info');
    results.teacher_photos = await fetchTable('teacher_photos');
    results.prizes = await fetchTable('prizes');
    results.reward_requests = await supabase.from('reward_requests').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));
    results.activity_log = await fetchTable('activity_log');
    results.supervisor_visits = await fetchTable('supervisor_visits');
    results.supervisor_student_notes = await fetchTable('supervisor_student_notes');
    results.note_templates = await supabase.from('note_templates').select('*'); completed++; setBackupProgress(Math.round((completed / tables.length) * 100));

    return {
      ...results,
      version: "3.0",
      backup_date: new Date().toISOString()
    };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          setTeacherId(currentUser.id);
        } else {
          navigate("/");
        }
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const fetchAndCalculateData = async () => {
      setLoading(true);
      if (!teacherId) {
        setLoading(false);
        return;
      }

      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, grade_level, section')
          .eq('teacher_id', teacherId);

        if (studentsError) throw studentsError;

        const studentsCountPerGrade = {};
        gradesData.forEach(grade => {
          studentsCountPerGrade[grade.id] = 0;
        });

        if (studentsData) {
          setTotalStudents(studentsData.length);
          studentsData.forEach(student => {
            if (student.grade_level) {
              studentsCountPerGrade[student.grade_level] = (studentsCountPerGrade[student.grade_level] || 0) + 1;
            }
          });
        }
        setStudentsPerGrade(studentsCountPerGrade);
        // تم إزالة حساب المتوسط مؤقتاً لأنه يعتمد على الهيكل الجديد ويحتاج تعقيداً لا داعي له في الداشبورد
        setAverageGrade(0); 

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      if (!teacherId) return;
      try {
        const { data: settingsData, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', teacherId)
          .single();

        if (error && error.code !== 'PGRST205' && error.code !== 'PGRST116') throw error;

        if (settingsData) {
          setTeacherName(settingsData.teacher_name || "اسم المعلم");
          setSchoolName(settingsData.school_name || "اسم المدرسة");
          setCurrentSemester(settingsData.current_semester || "الفصل الدراسي الأول");
          setTeacherPhoto(settingsData.teacher_photo || "/images/default_teacher.png");
          // جلب الفصل النشط (semester1 او semester2)
          setActiveSemesterKey(settingsData.active_semester_key || "semester1");
        } else {
          // إنشاء إعدادات افتراضية
          await supabase.from('settings').insert([{ id: teacherId, active_semester_key: 'semester1' }]);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };

    if (teacherId) {
      fetchAndCalculateData();
      fetchSettings();
      loadBackups();
    }
  }, [teacherId]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // دالة لتبديل الفصل الدراسي
  const handleSwitchSemester = async () => {
    const newSemesterKey = activeSemesterKey === "semester1" ? "semester2" : "semester1";
    const newSemesterName = newSemesterKey === "semester1" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";

    setCustomDialog({
        isOpen: true,
        title: "تبديل الفصل الدراسي",
        message: `أنت حالياً في (${currentSemester}). هل تريد الانتقال إلى (${newSemesterName})؟ \n\n ملاحظة: سيتم تحميل بيانات ودرجات الفصل المختار.`,
        inputs: {},
        onConfirm: async () => {
            try {
                const { error } = await supabase
                    .from('settings')
                    .upsert({
                        id: teacherId,
                        active_semester_key: newSemesterKey,
                        current_semester: newSemesterName // تحديث الاسم أيضاً للعرض
                    });

                if (error) throw error;

                setActiveSemesterKey(newSemesterKey);
                setCurrentSemester(newSemesterName);
                setModalMessage(`تم التبديل إلى ${newSemesterName} بنجاح`);
                setTimeout(() => setModalMessage(""), 3000);
                setCustomDialog({ isOpen: false });
            } catch (err) {
                console.error("Error switching semester:", err);
                setModalError("فشل تغيير الفصل الدراسي");
            }
        },
        onCancel: () => setCustomDialog({ isOpen: false }),
    });
  };

  const handleUpdateTeacherInfo = () => {
    setModalError("");
    setModalMessage("");
    setIsAuthModalOpen(false);
    
    setCustomDialog({
      isOpen: true,
      title: "تعديل بيانات المعلم",
      message: "يرجى إدخال البيانات الجديدة:",
      inputs: {
        teacherName: { label: "اسم المعلم", value: teacherName },
        schoolName: { label: "اسم المدرسة", value: schoolName },
        // تم إزالة تعديل اسم الفصل الدراسي يدوياً لأنه يتم آلياً الآن
        teacherPhoto: { label: "رابط الصورة", value: teacherPhoto },
      },
      onConfirm: async (inputs) => {
        try {
          const { error } = await supabase
            .from('settings')
            .update({
              teacher_name: inputs.teacherName,
              school_name: inputs.schoolName,
              teacher_photo: inputs.teacherPhoto,
            })
            .eq('id', teacherId);

          if (error) throw error;

          setTeacherName(inputs.teacherName);
          setSchoolName(inputs.schoolName);
          setTeacherPhoto(inputs.teacherPhoto);
          setCustomDialog({ isOpen: false });
        } catch (err) {
          console.error("Error updating settings:", err);
          setModalError("فشل تحديث البيانات. يرجى المحاولة مرة أخرى.");
        }
      },
      onCancel: () => setCustomDialog({ isOpen: false }),
      onClose: () => setCustomDialog({ isOpen: false }),
    });
  };

  const handleResetData = () => {
    setModalError("");
    setModalMessage("");
    setEmail("");
    setPassword("");
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleAuthConfirm = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalMessage("");

    if (!user || !teacherId) {
      setModalError("يجب أن تكون مسجلاً للدخول لإجراء هذه العملية.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setModalError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsAuthModalOpen(false);
      setIsBackupOptionModalOpen(true);
    } else {
      setModalError("البريد الإلكتروني لا يتطابق مع المستخدم الحالي.");
    }
  };

  const handleRestoreData = () => {
    setModalError("");
    setModalMessage("");
    setEmail("");
    setPassword("");
    setSelectedBackupKey(null);
    setIsRestoreModalOpen(true);
    setIsMenuOpen(false);
  };
  
  const performBackup = async () => {
    setModalMessage("جاري إنشاء نسخة احتياطية سحابية شاملة (v3.0)...");
    setModalError("");

    try {
      const title = backupTitle || `نسخة احتياطية شاملة بتاريخ: ${new Date().toLocaleString('ar-EG')}`;
      const fullData = await collectAllTeacherData();

      const { error: insertError } = await supabase
        .from('backups')
        .insert([{ teacher_id: teacherId, title: title, data: fullData }]);

      if (insertError) throw insertError;
      
      setModalMessage("تم الحفظ السحابي بنجاح (v3.0)");
      loadBackups();
      setTimeout(() => {
        setModalMessage("");
        setBackupProgress(0);
      }, 2000);
      return true;

    } catch (err) {
      setModalError("فشل حفظ النسخة السحابية.");
      console.error("Error creating backup:", err);
      return false;
    }
  };

  const handleDirectDownload = async () => {
    setModalMessage("جاري تحضير ملف JSON الشامل (v3.0)...");
    try {
      const fullData = await collectAllTeacherData();
      const jsonString = JSON.stringify(fullData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Full_Backup_v3_${new Date().toLocaleDateString('ar-EG')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setModalMessage("تم تحميل النسخة الكاملة على جهازك بنجاح.");
      setTimeout(() => {
        setModalMessage("");
        setBackupProgress(0);
      }, 2000);
    } catch (err) {
      console.error("Download error:", err);
      setModalError("فشل التحميل.");
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          setPreviewData(json);
          setIsPreviewOpen(true);
          setModalMessage("تم تحميل الملف بنجاح للمعاينة.");
          setTimeout(() => setModalMessage(""), 2000);
        } catch (err) {
          alert("الملف غير صالح.");
        }
      };
      reader.readAsText(file);
    }
  };

  const showDeleteConfirmation = async (takeBackup = false) => {
    if (takeBackup) {
      const backupSuccess = await performBackup();
      if (!backupSuccess) return;
    }
    setIsDeleteConfirmationModalOpen(true);
  };
  
  const handleFinalDeleteConfirm = async () => {
    try {
      await supabase.from('grades').delete().eq('teacher_id', teacherId);
      await supabase.from('students').delete().eq('teacher_id', teacherId);
      await supabase.from('curriculum').delete().eq('teacher_id', teacherId);
      await supabase.from('announcements').delete().eq('teacher_id', teacherId);
      await supabase.from('prizes').delete().eq('teacher_id', teacherId);
      await supabase.from('absences').delete().eq('teacher_id', teacherId);
      await supabase.from('book_absences').delete().eq('teacher_id', teacherId);
      await supabase.from('sections').delete().eq('teacher_id', teacherId);
      await supabase.from('settings').delete().eq('id', 'general');

      setModalMessage("تم حذف البيانات بنجاح.");
      setIsDeleteConfirmationModalOpen(false);
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (err) {
      setModalError("فشل حذف البيانات.");
      setIsDeleteConfirmationModalOpen(false);
    }
  };

  const handleRestoreConfirm = async (e) => {
    e.preventDefault();
    if (!user || !teacherId) return;
    if (!selectedBackupKey) return;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setModalError("كلمة المرور غير صحيحة.");
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsRestoreModalOpen(false);
      const { data: backupData } = await supabase.from('backups').select('data').eq('id', selectedBackupKey).single();
      
      if (!backupData || !backupData.data) {
        setModalError("النسخة الاحتياطية فارغة.");
        return;
      }
      
      try {
        await supabase.from('grades').delete().eq('teacher_id', teacherId);
        await supabase.from('students').delete().eq('teacher_id', teacherId);
        await supabase.from('curriculum').delete().eq('teacher_id', teacherId);
        await supabase.from('announcements').delete().eq('teacher_id', teacherId);
        await supabase.from('prizes').delete().eq('teacher_id', teacherId);
        await supabase.from('absences').delete().eq('teacher_id', teacherId);
        await supabase.from('book_absences').delete().eq('teacher_id', teacherId);
        await supabase.from('sections').delete().eq('teacher_id', teacherId);
        await supabase.from('settings').delete().eq('id', teacherId);

        const parsedBackup = backupData.data;
        const fixData = (items) => (items || []).map(({ id, ...rest }) => ({ ...rest, teacher_id: teacherId }));

        if (parsedBackup.settings && parsedBackup.settings.length > 0) {
            const { id, ...settingsRest } = Array.isArray(parsedBackup.settings) ? parsedBackup.settings[0] : parsedBackup.settings;
            await supabase.from('settings').insert({ ...settingsRest, id: teacherId });
        }
        
        if (parsedBackup.sections) await supabase.from('sections').insert(fixData(parsedBackup.sections));
        if (parsedBackup.curriculum) await supabase.from('curriculum').insert(fixData(parsedBackup.curriculum));
        if (parsedBackup.announcements) await supabase.from('announcements').insert(fixData(parsedBackup.announcements));
        if (parsedBackup.prizes) await supabase.from('prizes').insert(fixData(parsedBackup.prizes));
        if (parsedBackup.students) await supabase.from('students').insert(fixData(parsedBackup.students));
        if (parsedBackup.grades) await supabase.from('grades').insert(fixData(parsedBackup.grades));
        if (parsedBackup.absences) await supabase.from('absences').insert(fixData(parsedBackup.absences));
        if (parsedBackup.book_absences) await supabase.from('book_absences').insert(fixData(parsedBackup.book_absences));

        setModalMessage("تم استعادة البيانات بنجاح.");
        setTimeout(() => { window.location.reload(); }, 2000);
      } catch (err) {
        setModalError("حدث خطأ أثناء الاستعادة.");
      }
    }
  };

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmType, setConfirmType] = useState('restore'); // 'restore', 'backup', 'download', 'snapshot'
    const [passwordInput, setPasswordInput] = useState('');
    const [pendingAction, setPendingAction] = useState(null);

    const handleStartLocalRestore = () => {
        setIsPreviewOpen(false);
        setConfirmType('restore');
        setPendingAction(() => async () => {
            setModalMessage("جاري استعادة البيانات من الملف (v3.0)...");
            setBackupProgress(10);
            await executeRestoreLogic();
        });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmPassword = async () => {
      if (!teacherId || !passwordInput) return;

      setModalError(null);
      // التحقق من كلمة المرور
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordInput,
      });

      if (authError) {
        setModalError("كلمة المرور غير صحيحة. تم رفض العملية.");
        return;
      }

      setIsConfirmModalOpen(false);
      setPasswordInput(''); // مسح كلمة المرور للأمان

      if (pendingAction) {
          await pendingAction();
          setPendingAction(null);
      }
    };

    const executeRestoreLogic = async () => {
      if (!previewData) return;
      try {
        // 1. مسح البيانات الحالية
        const tables = ['grades', 'students', 'curriculum', 'announcements', 'prizes', 'absences', 'book_absences', 'sections'];
      for (let i = 0; i < tables.length; i++) {
        await supabase.from(tables[i]).delete().eq('teacher_id', teacherId);
        setBackupProgress(10 + (i + 1) * 5);
      }
      await supabase.from('settings').delete().eq('id', teacherId);

      // 2. تجهيز البيانات الجديدة والتحقق من المالك الأصلي
      const data = { ...previewData };
      const firstStudent = data.students?.[0];
      const isSameTeacher = firstStudent && firstStudent.teacher_id === teacherId;

      const fixData = (items) => (items || []).map(item => {
        if (isSameTeacher) return { ...item, teacher_id: teacherId };
        const { id, ...rest } = item;
        return { ...rest, teacher_id: teacherId };
      });

      // 3. الإدخال التدريجي مع معالجة التعارضات (Safe Import Mode)
      console.log("Starting Safe Smart Restore... isSameTeacher:", isSameTeacher);
      const sectionMap = new Map();
      const studentMap = new Map();

      // أ. إدخال الإعدادات
      if (data.settings && data.settings.length > 0) {
          const sToImport = Array.isArray(data.settings) ? data.settings[0] : data.settings;
          const { id, ...sRest } = sToImport;
          await supabase.from('settings').upsert({ ...sRest, id: teacherId }, { onConflict: 'id' });
      }
      
      // ب. معالجة الفصول (وإنشاؤها إذا كانت مفقودة لضمان الظهور)
      let sectionsToProcess = data.sections || [];
      if (!isSameTeacher && sectionsToProcess.length === 0 && data.students) {
          // استخراج الفصول الفريدة من الطلاب إذا لم توجد فصول في الملف
          const uniqueSections = [...new Set(data.students.map(s => s.section || s.section_id))].filter(Boolean);
          sectionsToProcess = uniqueSections.map(sId => ({ name: `فصل ${sId}`, id: sId }));
          console.log("Auto-generating sections from students data:", sectionsToProcess.length);
      }

      if (sectionsToProcess.length > 0) {
          for (const section of sectionsToProcess) {
              const { id: oldId, ...sectionRest } = section;
              // محاولة إدخال بسيطة بدون select أولاً إذا فشل
              try {
                const { data: newS, error: err } = await supabase.from('sections').insert({ 
                    name: sectionRest.name || `فصل ${oldId}`, 
                    teacher_id: teacherId 
                }).select();
                
                if (newS && newS[0]) {
                    sectionMap.set(String(oldId), String(newS[0].id));
                } else {
                    console.warn(`Could not get new ID for section ${oldId}, attempting fallback...`);
                }
              } catch (e) {
                console.error("Section insert exception:", e);
              }
          }
      }
      console.log("Section Mapping Ready:", sectionMap.size);
      setBackupProgress(70);

      // دالة معالجة البيانات مع حل تعارض الهوية الوطنية
      const processData = (items, type = 'general') => {
          if (!items || !Array.isArray(items)) return [];
          return items.map(item => {
              if (isSameTeacher) return { ...item, teacher_id: teacherId };
              
              const { id, ...rest } = item;
              const newItem = { ...rest, teacher_id: teacherId };
              
              // حل تعارض الهوية الوطنية: إضافة رمز تمييز
              if (type === 'student' && newItem.national_id) {
                  newItem.national_id = `${newItem.national_id}_${teacherId.substring(0,4)}`;
              }

              if (item.section_id && sectionMap.has(String(item.section_id))) newItem.section_id = sectionMap.get(String(item.section_id));
              if (item.section && sectionMap.has(String(item.section))) newItem.section = sectionMap.get(String(item.section));
              
              return newItem;
          });
      };

      // ج. إدخال بقية البيانات
      if (data.curriculum) {
          const processed = processData(data.curriculum);
          const uniqueCur = []; const seen = new Set();
          processed.forEach(c => {
              const key = `${c.grade_id}-${c.section_id}`;
              if(!seen.has(key)) { seen.add(key); uniqueCur.push(c); }
          });
          // نستخدم الـ insert ونصطاد الخطأ إذا حدث تعارض في المنهج لتستمر العملية
          try { await supabase.from('curriculum').insert(uniqueCur); } catch(e) {}
      }

      if (data.announcements) await supabase.from('announcements').insert(processData(data.announcements));
      if (data.prizes) await supabase.from('prizes').insert(processData(data.prizes));
      
      if (data.students) {
          console.log("Inserting students into new sections...");
          const processedStudents = processData(data.students, 'student');
          const { data: newStudents, error: sErr } = await supabase.from('students').insert(processedStudents).select();
          
          if (newStudents && data.grades) {
              if (!isSameTeacher) {
                  data.students.forEach((oldS, idx) => {
                      if (newStudents[idx]) studentMap.set(String(oldS.id), String(newStudents[idx].id));
                  });
              }

              const fixStudentLinks = (items) => (items || []).map(item => {
                  if (isSameTeacher) return { ...item, teacher_id: teacherId };
                  const { id, ...rest } = item;
                  const newItem = { ...rest, teacher_id: teacherId };
                  if (item.student_id && studentMap.has(String(item.student_id))) newItem.student_id = studentMap.get(String(item.student_id));
                  return newItem;
              });

              await supabase.from('grades').insert(fixStudentLinks(data.grades));
              if (data.absences) await supabase.from('absences').insert(fixStudentLinks(data.absences));
              if (data.book_absences) await supabase.from('book_absences').insert(fixStudentLinks(data.book_absences));
          }
      }
      console.log("Safe Restore process completed.");
      
      setBackupProgress(100);
      setModalMessage("تمت الاستعادة من الملف بنجاح! سيتم إعادة تحميل الصفحة...");
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (err) {
      console.error("Local restore error:", err);
      setModalError("فشل استعادة البيانات من الملف.");
      setBackupProgress(0);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    setIsRestoreModalOpen(false);
    try {
      await supabase.from('backups').delete().eq('id', backupId).eq('teacher_id', teacherId);
      await loadBackups();
      setModalMessage("تم حذف النسخة الاحتياطية.");
    } catch (err) {
      setModalError("فشل الحذف.");
    }
    setTimeout(() => setIsRestoreModalOpen(true), 300);
  };
  
  const handleStandaloneBackup = () => {
    setIsBackupTitleModalOpen(true);
    setBackupTitle("");
  };

  const handleConfirmBackupTitle = async () => {
    setIsBackupTitleModalOpen(false);
    const success = await performBackup();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-['Noto_Sans_Arabic',sans-serif]">
      <Navbar />

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد المصادقة</h3>
            <p className="text-gray-300 mb-6">للمتابعة، يرجى إدخال بياناتك:</p>
            {modalError && <p className="text-red-500 mb-4">{modalError}</p>}
            <form onSubmit={handleAuthConfirm} className="space-y-4">
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-between items-center mt-6">
                <button type="button" onClick={() => setIsAuthModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">تأكيد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Option Modal */}
      {isBackupOptionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">أخذ نسخة احتياطية</h3>
            <p className="text-gray-300 mb-6">هل ترغب في أخذ نسخة احتياطية؟</p>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => { setIsBackupOptionModalOpen(false); setIsDeleteConfirmationModalOpen(true); }} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">لا</button>
              <button onClick={() => { setIsBackupOptionModalOpen(false); setIsBackupTitleModalOpen(true); }} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">نعم</button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Title Modal */}
      {isBackupTitleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">عنوان النسخة الاحتياطية</h3>
            <input type="text" value={backupTitle} onChange={(e) => setBackupTitle(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white mb-6 focus:ring-2 focus:ring-blue-500" placeholder="مثال: نهاية الفصل الأول" />
            <div className="flex justify-between items-center">
              <button onClick={() => setIsBackupTitleModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
              <button onClick={handleConfirmBackupTitle} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">تأكيد</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-4">حذف نهائي</h3>
            <p className="text-gray-300 mb-6">هل أنت متأكد؟ لا يمكن التراجع.</p>
            <div className="flex justify-between items-center">
              <button onClick={() => setIsDeleteConfirmationModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-600 text-white">إلغاء</button>
              <button onClick={handleFinalDeleteConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* القائمة الجانبية */}
      <button onClick={toggleMenu} className="fixed top-4 left-4 z-50 p-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-300">
        <FaBars className="h-6 w-6" />
      </button>

      <div className={`fixed inset-y-0 right-0 z-40 w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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
            <p className="text-sm text-green-400 font-bold mt-1 bg-gray-700 py-1 px-2 rounded-lg inline-block">
               {currentSemester}
            </p>
            <button onClick={handleUpdateTeacherInfo} className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 mx-auto">
              <FaCog /> تعديل البيانات
            </button>
          </div>

          <div className="space-y-4">
            {/* زر التبديل بين الفصول */}
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                handleSwitchSemester();
              }}
              className="w-full py-3 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-purple-700 transition shadow-lg font-bold border border-purple-400"
            >
              <FaExchangeAlt /> 
              {activeSemesterKey === "semester1" ? "الانتقال للفصل الثاني" : "العودة للفصل الأول"}
            </button>

            <button onClick={() => { setIsMenuOpen(false); navigate("/reports"); }} className="w-full py-3 bg-teal-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-teal-700 transition shadow-lg font-bold">
              <FaFileAlt /> إنشاء تقارير
            </button>
            <button onClick={() => navigate("/portfolio")} className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition">
              <FaFolderOpen /> ملف الإنجاز
            </button>
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                setIsBackupCenterOpen(true);
              }} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 hover:from-blue-500 hover:to-indigo-500 transition shadow-xl font-black border border-white/10"
            >
              <FaShieldAlt /> مركز النسخ الاحتياطي
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && <div onClick={toggleMenu} className="fixed inset-0 bg-black opacity-50 z-30"></div>}
      
      {modalMessage && (
        <div className="fixed top-4 right-4 z-[200] bg-gray-900 border border-blue-500/30 text-white p-6 rounded-[2rem] shadow-2xl min-w-[350px] animate-slideUp overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">جاري معالجة البيانات v3.0</span>
              <span className="text-sm font-black text-white">{backupProgress}%</span>
            </div>
            <p className="text-sm font-bold">{modalMessage}</p>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      {modalError && <div className="fixed top-4 right-4 z-[200] bg-red-500 text-white px-4 py-2 rounded shadow-lg">{modalError}</div>}

      {/* Restore Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-green-400 mb-4">استرداد نسخة</h3>
            <form onSubmit={handleRestoreConfirm} className="space-y-4">
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500" />
              <ul className="text-right space-y-2 mb-6 max-h-60 overflow-y-auto">
                {backups.map((backup) => (
                  <li key={backup.id} className={`flex flex-col p-3 rounded-lg cursor-pointer transition ${selectedBackupKey === backup.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => setSelectedBackupKey(backup.id)}>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col text-right">
                            <span className="font-semibold block text-sm">{backup.title}</span>
                            <span className="text-[10px] text-gray-400">{new Date(backup.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 mr-auto">
                            <button 
                                type="button"
                                onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    try {
                                        setModalMessage("جاري تحميل بيانات النسخة للمعاينة...");
                                        const { data: backupRow, error } = await supabase
                                            .from('backups')
                                            .select('data')
                                            .eq('id', backup.id)
                                            .single();
                                        if (error) throw error;
                                        setPreviewData(backupRow.data);
                                        setIsPreviewOpen(true);
                                    } catch (err) {
                                        console.error("Error loading backup preview:", err);
                                        alert("فشل تحميل النسخة الاحتياطية للمعاينة.");
                                    } finally {
                                        setModalMessage("");
                                    }
                                }} 
                                className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500 hover:text-white transition"
                                title="معاينة النسخة"
                            >
                                <FaEye size={14} />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteBackup(backup.id); }} className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500 hover:text-white transition">
                                <FaTrash size={14} />
                            </button>
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 py-4 border-t border-white/5">
                 <p className="text-[10px] text-gray-500 font-bold">أو استعرض ملفاً من جهازك:</p>
                 <div className="relative group">
                    <input type="file" accept=".json" onChange={handleFileImport} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <button type="button" className="w-full py-3 bg-indigo-600/20 text-indigo-400 rounded-xl font-bold border border-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-3">
                       <FaDesktop /> اختيار ملف JSON ومعاينته
                    </button>
                 </div>
              </div>
              <div className="flex justify-between mt-4">
                 <button type="button" onClick={() => setIsRestoreModalOpen(false)} className="px-6 py-2 bg-gray-600 rounded text-white font-bold">إغلاق</button>
                 <button type="submit" disabled={!selectedBackupKey} className="px-6 py-2 bg-green-600 rounded text-white font-black shadow-lg">تأكيد الاسترداد</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Custom Dialog */}
      {customDialogState.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">{customDialogState.title}</h3>
            <p className="text-gray-300 mb-6 whitespace-pre-line">{customDialogState.message}</p>
            <div className="space-y-4 mb-6 text-right">
              {Object.entries(customDialogState.inputs).map(([key, input]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-gray-400 text-sm mb-1">{input.label}</label>
                  <input id={key} type="text" defaultValue={input.value} onChange={(e) => customDialogState.inputs[key].value = e.target.value} className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <button onClick={() => setCustomDialogState({ ...customDialogState, isOpen: false })} className="px-6 py-2 bg-gray-600 text-white rounded">إلغاء</button>
              <button onClick={() => customDialogState.onConfirm(Object.fromEntries(Object.entries(customDialogState.inputs).map(([key, input]) => [key, input.value])))} className="px-6 py-2 bg-blue-600 text-white rounded">تأكيد</button>
            </div>
          </div>
        </div>
      )}

      <div className={`p-4 md:p-8 max-w-7xl mx-auto transition-all duration-300 ${isMenuOpen ? 'md:mr-64' : ''}`}>
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img src="/images/moe_logo_white.png" alt="شعار وزارة التعليم" className="h-24 md:h-32" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-blue-400 leading-tight">{schoolName}</h1>
          <p className="mt-2 text-md md:text-xl text-gray-300">لوحة تحكم المعلم لإدارة الفصول</p>
          <div className="mt-4 text-center flex justify-center gap-4">
            <div className="inline-flex items-center gap-4 p-2 bg-gray-800 rounded-full border border-gray-700">
              <img src={teacherPhoto} alt="صورة المعلم" className="h-10 w-10 rounded-full object-cover"/>
              <div>
                <span className="block text-sm font-semibold text-white">{teacherName}</span>
                <span className={`block text-xs font-bold ${activeSemesterKey === 'semester2' ? 'text-purple-400' : 'text-green-400'}`}>
                    {currentSemester}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {gradesData.map((grade) => (
            <div key={grade.id} onClick={() => navigate(`/grades/${grade.id}`)} className="relative rounded-3xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer bg-gray-800 border border-gray-700 hover:border-blue-500">
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
                <span className="text-md font-semibold">عرض الفصول ←</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* مركز إدارة النسخ الاحتياطي (النافذة الجديدة) */}
      {isBackupCenterOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
          <div className="bg-gray-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-blue-600/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">مركز إدارة النسخ الاحتياطية</h3>
                  <p className="text-xs text-gray-500 font-bold">إدارة الملفات، الاسترداد، واللقطات المرجعية</p>
                </div>
              </div>
              <button onClick={() => setIsBackupCenterOpen(false)} className="text-gray-500 hover:text-white transition p-2"><FaTimes size={24} /></button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* قسم السحابة */}
              <div className="col-span-full mb-2">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-4">العمليات السحابية (Supabase)</p>
              </div>
              
              <button 
                onClick={() => { 
                  setIsBackupCenterOpen(false); 
                  setPendingAction(() => handleStandaloneBackup);
                  setConfirmType('backup');
                  setIsConfirmModalOpen(true); 
                }} 
                className="flex items-center gap-4 p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl hover:bg-blue-600 hover:text-white transition group"
              >
                <FaCloud className="text-2xl text-blue-500 group-hover:text-white" />
                <div className="text-right">
                  <p className="font-bold text-sm">حفظ نسخة سحابية</p>
                  <p className="text-[9px] opacity-60">تخزين آمن على قواعد البيانات</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  setIsBackupCenterOpen(false);
                  setPendingAction(() => async () => {
                      setBackupTitle(`نقطة مرجعية - ${new Date().toLocaleString('ar-EG')}`);
                      await performBackup();
                  });
                  setConfirmType('snapshot');
                  setIsConfirmModalOpen(true);
                }} 
                className="flex items-center gap-4 p-5 bg-amber-600/10 border border-amber-500/20 rounded-3xl hover:bg-amber-600 hover:text-white transition group"
              >
                <FaHistory className="text-2xl text-amber-500 group-hover:text-white" />
                <div className="text-right">
                  <p className="font-bold text-sm">نقطة مرجعية (Snapshot)</p>
                  <p className="text-[9px] opacity-60">حفظ الحالة الحالية فوراً</p>
                </div>
              </button>

              <button onClick={() => { setIsBackupCenterOpen(false); handleRestoreData(); }} className="flex items-center gap-4 p-5 bg-green-600/10 border border-green-500/20 rounded-3xl hover:bg-green-600 hover:text-white transition group">
                <FaDownload className="text-2xl text-green-500 group-hover:text-white" />
                <div className="text-right">
                  <p className="font-bold text-sm">استرداد ومعاينة</p>
                  <p className="text-[9px] opacity-60">استرجاع من النسخ السحابية</p>
                </div>
              </button>

              {/* قسم المحلي */}
              <div className="col-span-full mt-4 mb-2">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-4">العمليات المحلية والملفات</p>
              </div>

              <button 
                onClick={() => { 
                  setIsBackupCenterOpen(false); 
                  setPendingAction(() => handleDirectDownload);
                  setConfirmType('download');
                  setIsConfirmModalOpen(true);
                }} 
                className="flex items-center gap-4 p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl hover:bg-indigo-600 hover:text-white transition group"
              >
                <FaDesktop className="text-2xl text-indigo-500 group-hover:text-white" />
                <div className="text-right">
                  <p className="font-bold text-sm">تحميل ملف JSON شامل</p>
                  <p className="text-[9px] opacity-60">حفظ نسخة كاملة على جهازك</p>
                </div>
              </button>

              <div className="relative group">
                <input type="file" accept=".json" onChange={(e) => { setIsBackupCenterOpen(false); handleFileImport(e); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="flex items-center gap-4 p-5 bg-slate-800 border border-white/5 rounded-3xl group-hover:bg-gray-700 transition">
                  <FaFileDownload className="text-2xl text-gray-400" />
                  <div className="text-right">
                    <p className="font-bold text-sm text-white">معاينة ملف خارجي</p>
                    <p className="text-[9px] text-gray-500">عرض محتويات ملف من جهازك</p>
                  </div>
                </div>
              </div>

              <button onClick={() => { setIsBackupCenterOpen(false); handleResetData(); }} className="flex items-center gap-4 p-5 bg-red-600/10 border border-red-500/20 rounded-3xl hover:bg-red-600 hover:text-white transition group">
                <FaRedo className="text-2xl text-red-500 group-hover:text-white" />
                <div className="text-right">
                  <p className="font-bold text-sm text-red-500 group-hover:text-white">إعادة تعيين النظام</p>
                  <p className="text-[9px] opacity-60">حذف كافة البيانات الحالية</p>
                </div>
              </button>
            </div>
            
            <div className="p-6 bg-gray-950/50 text-center">
              <p className="text-[10px] text-gray-500 font-bold">إصدار نظام النسخ الاحتياطي: v3.0 الشامل</p>
            </div>
          </div>
        </div>
      )}

      {/* المستعرض الشامل */}
      {isPreviewOpen && (
        <BackupPreviewer 
          data={previewData} 
          onConfirm={handleStartLocalRestore}
          onCancel={() => setIsPreviewOpen(false)}
        />
      )}

      {/* مودال التأكيد النهائي بكلمة المرور */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[250] p-4">
          <div className={`bg-gray-900 border ${confirmType === 'restore' ? 'border-red-500/30' : 'border-blue-500/30'} rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-zoomIn`}>
            <div className="p-8 text-center">
              <div className={`w-20 h-20 ${confirmType === 'restore' ? 'bg-red-500/10 text-red-500 shadow-red-500/5' : 'bg-blue-500/10 text-blue-500 shadow-blue-500/5'} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                {confirmType === 'restore' ? <FaShieldAlt size={40} /> : <FaLock size={40} />}
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">
                {confirmType === 'restore' ? 'تأكيد الاستعادة النهائية' : 
                 confirmType === 'backup' ? 'تأكيد الحفظ السحابي' : 
                 confirmType === 'snapshot' ? 'تأكيد إنشاء نقطة مرجعية' : 'تأكيد تصدير البيانات'}
              </h3>
              
              <p className="text-gray-400 text-sm mb-8 font-bold leading-relaxed">
                {confirmType === 'restore' ? 'تنبيه: سيتم مسح كافة البيانات الحالية واستبدالها بمحتويات الملف. هذه العملية لا يمكن التراجع عنها.' : 
                 'يرجى إدخال كلمة مرور حسابك لتأكيد هويتك وإتمام عملية معالجة البيانات بأمان.'}
              </p>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="كلمة مرور الحساب" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-2xl text-center font-bold focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleConfirmPassword}
                    className={`flex-1 py-4 ${confirmType === 'restore' ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white rounded-2xl font-black shadow-lg transition-all active:scale-95`}
                  >
                    تأكيد العملية
                  </button>
                  <button 
                    onClick={() => {
                        setIsConfirmModalOpen(false);
                        setPasswordInput('');
                        setPendingAction(null);
                    }}
                    className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;