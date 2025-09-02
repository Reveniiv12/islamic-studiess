// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gradesData } from "../data/mockData";
import Navbar from "../components/Navbar";
import { FaUserGraduate, FaBars, FaTimes, FaCog, FaRedo, FaDownload, FaTrash, FaFolderOpen, FaChartBar } from "react-icons/fa";
import { supabase } from "../supabaseClient";

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

  // حالة جديدة لإدارة نافذة الحوار المخصصة
  const [customDialogState, setCustomDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    inputs: {},
    onConfirm: () => {},
    onCancel: () => {},
  });
  
  // الدالة الحقيقية لإظهار وإخفاء نافذة الحوار
  const setCustomDialog = (dialogProps) => {
    setCustomDialogState(dialogProps);
  };

  const loadBackups = async () => {
    if (!teacherId) {
      return;
    }
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

        if (studentsError) {
          throw studentsError;
        }

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

        const { data: studentsGradesData, error: gradesError } = await supabase
          .from('students')
          .select('grades')
          .eq('teacher_id', teacherId);

        if (gradesError) {
          throw gradesError;
        }

        let allGrades = [];
        if (studentsGradesData) {
          studentsGradesData.forEach(studentRecord => {
            if (studentRecord.grades && studentRecord.grades.tests) {
              allGrades.push(...Object.values(studentRecord.grades.tests));
            }
          });
        }

        if (allGrades.length > 0) {
          const sumOfGrades = allGrades.reduce((acc, grade) => acc + (grade || 0), 0);
          const avg = (sumOfGrades / allGrades.length).toFixed(1);
          setAverageGrade(avg);
        } else {
          setAverageGrade(0);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      if (!teacherId) return;
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('teacher_name, school_name, current_semester, teacher_photo')
          .eq('id', 'general')
          .single();

        if (error && error.code !== 'PGRST205' && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setTeacherName(data.teacher_name || "اسم المعلم");
          setSchoolName(data.school_name || "اسم المدرسة");
          setCurrentSemester(data.current_semester || "الفصل الدراسي");
          setTeacherPhoto(data.teacher_photo || "/images/default_teacher.png");
        } else {
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert([{ id: 'general' }])
            .single();
          if (insertError) {
            console.error("Error creating default settings:", insertError);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings from Supabase", err);
        setTeacherName("اسم المعلم");
        setSchoolName("اسم المدرسة");
        setCurrentSemester("الفصل الدراسي");
        setTeacherPhoto("/images/default_teacher.png");
      }
    };

    if (teacherId) {
      fetchAndCalculateData();
      fetchSettings();
      // استدعاء الدالة من مكانها الجديد
      loadBackups();
    }
  }, [teacherId]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
        currentSemester: { label: "الفصل الدراسي", value: currentSemester },
        teacherPhoto: { label: "رابط الصورة", value: teacherPhoto },
      },
      onConfirm: async (inputs) => {
        try {
          const { error } = await supabase
            .from('settings')
            .update({
              teacher_name: inputs.teacherName,
              school_name: inputs.schoolName,
              current_semester: inputs.currentSemester,
              teacher_photo: inputs.teacherPhoto,
            })
            .eq('id', 'general');

          if (error) {
            throw error;
          }

          setTeacherName(inputs.teacherName);
          setSchoolName(inputs.schoolName);
          setCurrentSemester(inputs.currentSemester);
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
      let errorMessage = "فشل المصادقة: البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة.";
      }
      setModalError(errorMessage);
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsAuthModalOpen(false);
      setIsBackupOptionModalOpen(true);
    } else {
      setModalError("البريد الإلكتروني الذي أدخلته لا يتطابق مع المستخدم الحالي.");
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
    setModalMessage("جاري حفظ النسخة الاحتياطية...");
    setModalError("");

    try {
      const title = backupTitle || `نسخة احتياطية بتاريخ: ${new Date().toLocaleString('ar-EG')}`;

      // هنا تم تصحيح الطريقة لاستخدام .eq() بشكل صحيح
      const { data: studentsData, error: studentsError } = await supabase.from('students').select('*').eq('teacher_id', teacherId);
      const { data: gradesData, error: gradesError } = await supabase.from('grades').select('*').eq('teacher_id', teacherId);
      const { data: curriculumData, error: curriculumError } = await supabase.from('curriculum').select('*').eq('teacher_id', teacherId);
      const { data: announcementsData, error: announcementsError } = await supabase.from('announcements').select('*').eq('teacher_id', teacherId);
      const { data: prizesData, error: prizesError } = await supabase.from('prizes').select('*').eq('teacher_id', teacherId);
      const { data: absencesData, error: absencesError } = await supabase.from('absences').select('*').eq('teacher_id', teacherId);
      const { data: bookAbsencesData, error: bookAbsencesError } = await supabase.from('book_absences').select('*').eq('teacher_id', teacherId);
      const { data: sectionsData, error: sectionsError } = await supabase.from('sections').select('*').eq('teacher_id', teacherId);
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*').eq('id', 'general');

      if (studentsError || gradesError || curriculumError || announcementsError || prizesError || absencesError || bookAbsencesError || sectionsError || settingsError) {
        throw new Error("فشل جلب البيانات لحفظ النسخة الاحتياطية.");
      }
      
      const backupData = {
        students: studentsData,
        grades: gradesData,
        curriculum: curriculumData,
        announcements: announcementsData,
        prizes: prizesData,
        absences: absencesData,
        book_absences: bookAbsencesData,
        sections: sectionsData,
        settings: settingsData
      };

      const { error: insertError } = await supabase
        .from('backups')
        .insert([{ teacher_id: teacherId, title: title, data: backupData }]);

      if (insertError) {
        throw insertError;
      }
      
      await loadBackups();
      setModalMessage("تم حفظ النسخة الاحتياطية بنجاح.");
      return true;

    } catch (err) {
      setModalError("فشل حفظ النسخة الاحتياطية. يرجى المحاولة مرة أخرى.");
      console.error("Error creating backup:", err);
      return false;
    }
  };

  const showDeleteConfirmation = async (takeBackup = false) => {
    if (takeBackup) {
      const backupSuccess = await performBackup();
      if (!backupSuccess) {
        return;
      }
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

      setModalMessage("تم حذف بيانات الطلاب بنجاح.");
      setIsDeleteConfirmationModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setModalError("فشل حذف البيانات. يرجى المحاولة مرة أخرى.");
      setIsDeleteConfirmationModalOpen(false);
      console.error("Error deleting data:", err);
    }
  };

  const handleRestoreConfirm = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalMessage("");

    if (!user || !teacherId) {
      setModalError("يجب أن تكون مسجلاً للدخول لإجراء هذه العملية.");
      return;
    }

    if (!selectedBackupKey) {
      setModalError("الرجاء اختيار نسخة احتياطية للاستعادة.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      let errorMessage = "فشل المصادقة: البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة.";
      }
      setModalError(errorMessage);
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsRestoreModalOpen(false);
      
      const { data: backupData, error: fetchError } = await supabase
        .from('backups')
        .select('data')
        .eq('id', selectedBackupKey)
        .eq('teacher_id', teacherId)
        .single();
      
      if (fetchError || !backupData || !backupData.data) {
        setModalError("النسخة الاحتياطية المختارة غير موجودة أو فارغة.");
        return;
      }
      
      try {
        // حذف البيانات الحالية
        await supabase.from('grades').delete().eq('teacher_id', teacherId);
        await supabase.from('students').delete().eq('teacher_id', teacherId);
        await supabase.from('curriculum').delete().eq('teacher_id', teacherId);
        await supabase.from('announcements').delete().eq('teacher_id', teacherId);
        await supabase.from('prizes').delete().eq('teacher_id', teacherId);
        await supabase.from('absences').delete().eq('teacher_id', teacherId);
        await supabase.from('book_absences').delete().eq('teacher_id', teacherId);
        await supabase.from('sections').delete().eq('teacher_id', teacherId);
        await supabase.from('settings').delete().eq('id', 'general');

        const parsedBackup = backupData.data;

        // استعادة البيانات بالترتيب الصحيح
        // أولاً: الجداول التي لا تعتمد على غيرها
        await supabase.from('settings').insert(parsedBackup.settings);
        await supabase.from('sections').insert(parsedBackup.sections);
        await supabase.from('curriculum').insert(parsedBackup.curriculum);
        await supabase.from('announcements').insert(parsedBackup.announcements);
        await supabase.from('prizes').insert(parsedBackup.prizes);

        // ثانياً: الجداول التي تعتمد على الجداول السابقة
        await supabase.from('students').insert(parsedBackup.students);
        
        // أخيراً: الجداول التي تعتمد على الطلاب
        await supabase.from('grades').insert(parsedBackup.grades);
        await supabase.from('absences').insert(parsedBackup.absences);
        await supabase.from('book_absences').insert(parsedBackup.book_absences);

        setModalMessage("تم استعادة بيانات الطلاب بنجاح.");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        setModalError("حدث خطأ أثناء استعادة البيانات.");
        console.error("Restore error:", err);
      }
    } else {
      setModalError("البريد الإلكتروني الذي أدخلته لا يتطابق مع المستخدم الحالي.");
    }
  };

  const handleDeleteBackup = async (backupId) => {
    setIsRestoreModalOpen(false);

    try {
      await supabase
        .from('backups')
        .delete()
        .eq('id', backupId)
        .eq('teacher_id', teacherId);

      await loadBackups();
      setModalMessage("تم حذف النسخة الاحتياطية بنجاح.");
      setTimeout(() => setModalMessage(""), 2000);
      
    } catch (err) {
      console.error("Error deleting backup:", err);
      setModalError("فشل حذف النسخة الاحتياطية.");
    }
    setTimeout(() => setIsRestoreModalOpen(true), 300);
  };
  
  const handleStandaloneBackup = () => {
    setIsBackupTitleModalOpen(true);
    setBackupTitle("");
  };

  // --- التعديل هنا ---
  const handleConfirmBackupTitle = async () => {
    setIsBackupTitleModalOpen(false);
    setModalMessage("جاري حفظ النسخة الاحتياطية، يرجى الانتظار...");
    const success = await performBackup();
    if (success) {
      setModalMessage("تم حفظ النسخة الاحتياطية بنجاح.");
    }
    // لا يوجد استدعاء لـ showDeleteConfirmation هنا
  };
  // ------------------


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-['Noto_Sans_Arabic',sans-serif]">
      <Navbar />

      {/* Main Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد المصادقة</h3>
            <p className="text-gray-300 mb-6">للمتابعة، يرجى إدخال بياناتك:</p>
            {modalError && <p className="text-red-500 mb-4">{modalError}</p>}
            <form onSubmit={handleAuthConfirm} className="space-y-4">
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
            <h3 className="text-xl font-bold text-blue-400 mb-4">أخذ نسخة احتياطية قبل الحذف</h3>
            <p className="text-gray-300 mb-6">هل ترغب في أخذ نسخة احتياطية من البيانات الحالية قبل حذفها؟</p>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => { setIsBackupOptionModalOpen(false); setIsDeleteConfirmationModalOpen(true); }} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">لا، احذف مباشرة</button>
              <button onClick={() => { setIsBackupOptionModalOpen(false); setIsBackupTitleModalOpen(true); }} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">نعم، احفظ واحذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Title Modal */}
      {isBackupTitleModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">حفظ نسخة احتياطية</h3>
            <p className="text-gray-300 mb-6">أدخل عنوانًا لهذه النسخة الاحتياطية (اختياري).</p>
            <div className="space-y-4 mb-6 text-right">
              <div>
                <label className="block text-gray-400 text-sm mb-1">عنوان النسخة الاحتياطية</label>
                <input type="text" value={backupTitle} onChange={(e) => setBackupTitle(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثال: بيانات الفصل الدراسي الأول" />
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => { setIsBackupTitleModalOpen(false); }} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
              {/* --- التعديل هنا --- */}
              <button onClick={handleConfirmBackupTitle} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">تأكيد</button>
              {/* ------------------ */}
            </div>
          </div>
        </div>
      )}
      
      {/* Final Delete Confirmation Modal */}
      {isDeleteConfirmationModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد الحذف النهائي</h3>
            <p className="text-gray-300 mb-6">هل أنت متأكد من حذف كافة بيانات الطلاب؟ هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => setIsDeleteConfirmationModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
              <button onClick={handleFinalDeleteConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

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

          <div className="space-y-4">
            <button onClick={() => navigate("/portfolio")} className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition">
              <FaFolderOpen /> ملف الإنجاز
            </button>
            <button onClick={handleResetData} className="w-full py-3 bg-red-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-red-700 transition">
              <FaRedo /> إعادة تعيين
            </button>
            <button onClick={handleRestoreData} className="w-full py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition">
              <FaDownload /> استرداد
            </button>
            <button onClick={handleStandaloneBackup} className="w-full py-3 bg-gray-700 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-gray-600 transition">
              <FaDownload /> حفظ نسخة احتياطية
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
      
      {modalMessage && (
        <div className="fixed top-4 right-4 z-[200] bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300">
          {modalMessage}
        </div>
      )}
      {modalError && (
        <div className="fixed top-4 right-4 z-[200] bg-red-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300">
          {modalError}
        </div>
      )}

      {isRestoreModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-green-400 mb-4">اختيار نسخة للاسترداد</h3>
            <p className="text-gray-300 mb-6">للاسترداد، يرجى إدخال بياناتك للمصادقة:</p>
            <form onSubmit={handleRestoreConfirm} className="space-y-4">
              <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {backups.length > 0 ? (
                <ul className="text-right space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {backups.map((backup) => (
                    <li key={backup.id} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${selectedBackupKey === backup.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`} onClick={() => setSelectedBackupKey(backup.id)}>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{backup.title}</span>
                        <span className="text-sm text-gray-400">بتاريخ: {new Date(backup.created_at).toLocaleString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteBackup(backup.id); }} className="text-red-400 hover:text-red-200">
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 mb-6">لا توجد نسخ احتياطية متاحة.</p>
              )}

              <div className="flex justify-between items-center mt-6">
                <button type="button" onClick={() => setIsRestoreModalOpen(false)} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
                <button type="submit" disabled={!selectedBackupKey} className={`px-6 py-2 rounded-lg bg-green-600 text-white transition ${!selectedBackupKey ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}>تأكيد الاسترداد</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* نافذة الحوار المخصصة */}
      {customDialogState.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">{customDialogState.title}</h3>
            <p className="text-gray-300 mb-6">{customDialogState.message}</p>
            <div className="space-y-4 mb-6 text-right">
              {Object.entries(customDialogState.inputs).map(([key, input]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-gray-400 text-sm mb-1">{input.label}</label>
                  <input id={key} type="text" defaultValue={input.value} 
                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder={input.label} 
                    onChange={(e) => customDialogState.inputs[key].value = e.target.value} 
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => setCustomDialogState({ ...customDialogState, isOpen: false })} className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition">إلغاء</button>
              <button onClick={() => customDialogState.onConfirm(
                Object.fromEntries(
                  Object.entries(customDialogState.inputs).map(([key, input]) => [key, input.value])
                )
              )} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">تأكيد</button>
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
