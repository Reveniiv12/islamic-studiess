// src/pages/StudentPortfolio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  FaCloudUploadAlt, FaTrash, FaFilePdf, FaArrowRight,
  FaExclamationTriangle, FaLayerGroup, FaShapes, FaEye,
  FaSchool, FaCalendarAlt, FaGraduationCap, FaUserTie,
  FaSpinner, FaTimes, FaCheck, FaFileAlt, FaFile, FaLock
} from 'react-icons/fa';
import StudentPortfolioFileViewer from '../components/StudentPortfolioFileViewer';
import { getGradeNameById, getSectionNameById } from "../utils/gradeUtils";

const StudentPortfolio = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [studentData, setStudentData] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetCategory, setTargetCategory] = useState('performance_tasks');
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  // State جديد لتتبع نسبة الرفع
  const [uploadProgress, setUploadProgress] = useState(0);

  // حالة لتتبع الصور التي فشل تحميلها للعودة للأيقونة
  const [imageErrors, setImageErrors] = useState({});

  // حالات القفل والوصول
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  // نظام التنبيهات
  const [alert, setAlert] = useState({
    show: false,
    type: '',
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    showCancelButton: true,
    showConfirmButton: true,
    confirmText: 'تأكيد',
    cancelText: 'إلغاء'
  });

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  // اشتراك اللحظي للتعديلات
  useEffect(() => {
    if (!studentId) return;

    const channel = supabase
      .channel('portfolio-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.general' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // جلب اسم المدرسة وإعدادات العرض
      const { data: settingsData } = await supabase
        .from('settings')
        .select('school_name, student_view_config')
        .eq('id', 'general')
        .single();

      if (settingsData) {
        setSchoolName(settingsData.school_name || "المدرسة الافتراضية");

        if (settingsData.student_view_config) {
          const config = settingsData.student_view_config;
          const isGlobalLocked = config.is_locked === true;
          const isPortfolioDisabled = config.show_portfolio_button === false;

          if (isGlobalLocked) {
            setIsLocked(true);
            setLockMessage(config.lock_message || "عذراً، الصفحة مغلقة حالياً للتحديث ورصد الدرجات.");
          } else if (isPortfolioDisabled) {
            setIsLocked(true);
            setLockMessage("عذراً، ملف الإنجاز غير متاح حالياً.");
          } else {
            setIsLocked(false);
          }
        }
      }

      // جلب بيانات الطالب
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      setStudentData(student);

      // جلب اسم المعلم
      if (student.teacher_id) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('name')
          .eq('id', student.teacher_id)
          .single();
        if (teacher) setTeacherName(teacher.name);
      }

      // جلب الملفات
      const { data: filesData } = await supabase
        .from('portfolio_files')
        .select('*')
        .eq('student_id', studentId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (filesData) setFiles(filesData);

    } catch (err) {
      console.error("Error fetching data:", err);
      showAlert({
        type: 'error',
        title: 'خطأ في تحميل البيانات',
        message: 'حدث خطأ أثناء تحميل بيانات الطالب.'
      });
    } finally {
      setLoading(false);
    }
  };

  // دالة إظهار التنبيه
  const showAlert = (options) => {
    setAlert({
      show: true,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      showCancelButton: options.showCancelButton !== undefined ? options.showCancelButton : true,
      showConfirmButton: options.showConfirmButton !== undefined ? options.showConfirmButton : true,
      confirmText: options.confirmText || 'تأكيد',
      cancelText: options.cancelText || 'إلغاء'
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  const handleConfirm = () => {
    if (alert.onConfirm) alert.onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (alert.onCancel) alert.onCancel();
    hideAlert();
  };

  // استخراج معرف الملف من الرابط
  const getFileId = (url) => {
    if (!url) return null;
    const cleanUrl = url.toString().trim();
    const matchStandard = cleanUrl.match(/(?:id=|\/d\/)([\w-]{25,})/);
    if (matchStandard) return matchStandard[1];
    const matchBroken = cleanUrl.match(/picture\/0?([\w-]{25,})/);
    if (matchBroken) return matchBroken[1];
    return null;
  };

  // تحسين الرابط للعرض
  const getOptimizedUrl = (originalUrl, size = 'w800') => {
    const fileId = getFileId(originalUrl);
    if (!fileId) return originalUrl || '/default-avatar.png';
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  };

  const handleImageError = (fileId) => {
    setImageErrors(prev => ({ ...prev, [fileId]: true }));
  };

  const initUpload = (category) => {
    if (files.length >= 5) {
      showAlert({
        type: 'warning',
        title: 'تنبيه مساحة التخزين',
        message: 'عفواً، لقد وصلت للحد الأقصى المسموح به (5 ملفات).',
        showCancelButton: false,
        confirmText: 'حسناً'
      });
      return;
    }
    setTargetCategory(category);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        type: 'error',
        title: 'خطأ في الحجم',
        message: "حجم الملف كبير جداً. الحد الأقصى المسموح هو 5 ميجابايت.",
        showCancelButton: false,
        confirmText: 'حسناً'
      });
      e.target.value = "";
      return;
    }

    const categoryLabel = targetCategory === 'performance_tasks' ? 'المهام الأدائية' : 'أعمال أخرى';

    showAlert({
      type: 'confirm',
      title: 'تأكيد الإضافة',
      message: `هل أنت متأكد من رفع الملف "${file.name}" إلى قسم "${categoryLabel}"؟`,
      onConfirm: () => uploadFile(file),
      onCancel: () => { e.target.value = ""; }
    });
  };

  // دالة الرفع المعدلة لدعم شريط التقدم
  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // إزالة شرط "if (!accessToken) throw new Error..." 
      // أو استبداله للسماح بالرفع إذا كان التوكن غير موجود

      const functionUrl = 'https://timeeqkhoxhvxlgcxlcz.supabase.co/functions/v1/upload-to-drive';

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', functionUrl);

        // إذا وجد التوكن نرسله، وإذا لم يوجد نرسل قيمة فارغة أو Anon Key
        if (accessToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        } else {
          // يمكنك إرسال الـ anon key الخاص بمشروعك هنا إذا كانت الوظيفة تتطلبه
          xhr.setRequestHeader('apikey', 'YOUR_SUPABASE_ANON_KEY');
        }

        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('x-student-id', studentId);
        xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        // حدث التقدم
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              resolve(responseData);
            } catch (e) {
              reject(new Error("فشل في قراءة استجابة الخادم"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || errorData.details || xhr.statusText));
            } catch (e) {
              reject(new Error(`Server Error: ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("فشل الاتصال بالشبكة"));

        xhr.send(file);
      });

      // الحفظ في قاعدة البيانات
      const { error: dbError } = await supabase.from('portfolio_files').insert({
        student_id: studentId,
        file_url: result.url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        category: targetCategory,
        status: 'active'
      });

      if (dbError) throw dbError;

      await fetchData(); // تحديث القائمة

      showAlert({
        type: 'success',
        title: 'تم الرفع بنجاح',
        message: 'تم رفع الملف وحفظه في ملفك الإنجازي.',
        showCancelButton: false,
        confirmText: 'حسناً'
      });

    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      showAlert({
        type: 'error',
        title: 'فشل الرفع',
        message: error.message || "حدث خطأ غير متوقع أثناء الرفع.",
        showCancelButton: false,
        confirmText: 'حسناً'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const requestDeletion = (e, fileId) => {
    e.stopPropagation();
    showAlert({
      type: 'confirm',
      title: 'طلب حذف',
      message: 'سيتم إرسال طلب للمعلم لحذف الملف. هل أنت متأكد؟',
      onConfirm: async () => {
        const { error } = await supabase
          .from('portfolio_files')
          .update({ status: 'pending_delete' })
          .eq('id', fileId);

        if (!error) {
          await fetchData();
          showAlert({ type: 'success', title: 'تم بنجاح', message: "تم إرسال الطلب.", showCancelButton: false, confirmText: 'حسناً' });
        } else {
          showAlert({ type: 'error', title: 'خطأ', message: "فشل إرسال الطلب.", showCancelButton: false, confirmText: 'حسناً' });
        }
      }
    });
  };

  const getOrderedFilesForViewer = () => {
    const allFiles = [...performanceFiles, ...otherFiles];
    return allFiles.map(f => ({ ...f }));
  };

  const findFileIndexInAllFiles = (fileId) => {
    const allFiles = [...performanceFiles, ...otherFiles];
    return allFiles.findIndex(f => f.id === fileId);
  };

  const gradeName = studentData ? getGradeNameById(studentData.grade_level) : '...';
  const sectionName = studentData ? getSectionNameById(studentData.section) : '...';

  const performanceFiles = files.filter(f => f.category === 'performance_tasks');
  const otherFiles = files.filter(f => f.category === 'others');

  // مكون التنبيه
  const AlertModal = () => {
    if (!alert.show) return null;
    const alertColors = { info: 'bg-blue-500', success: 'bg-green-500', warning: 'bg-yellow-500', error: 'bg-red-500', confirm: 'bg-blue-500' };
    const colorClass = alertColors[alert.type] || 'bg-blue-500';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancel}></div>
        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <div className={`h-2 ${colorClass}`}></div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">{alert.title}</h3>
            <div className="mb-6 text-slate-300">{alert.message}</div>
            {alert.showConfirmButton && (
              <div className="flex gap-3 justify-end">
                {alert.showCancelButton && (
                  <button onClick={handleCancel} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-600">
                    {alert.cancelText}
                  </button>
                )}
                <button onClick={handleConfirm} className={`px-5 py-2.5 text-white rounded-xl ${alert.type === 'confirm' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  {alert.confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // نافذة التحميل مع شريط التقدم
  const UploadLoadingOverlay = () => {
    if (!uploading) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>
        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl animate-scale-in">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">جاري رفع الملف...</h3>

          {/* عرض النسبة المئوية */}
          <div className="text-blue-400 font-mono text-lg font-bold mb-3">
            {uploadProgress}%
          </div>

          {/* شريط التقدم */}
          <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>

          <p className="text-slate-500 text-sm mt-4">يرجى الانتظار وعدم إغلاق الصفحة</p>
        </div>
      </div>
    );
  };

  const PortfolioSection = ({ title, icon, items, categoryKey }) => (
    <div className="mb-16 animate-fade-in-up">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>

        <button
          onClick={() => initUpload(categoryKey)}
          disabled={uploading}
          className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-600 hover:border-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg text-sm font-bold disabled:opacity-50"
        >
          <FaCloudUploadAlt size={16} /> إضافة ملف هنا
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-700/50 rounded-3xl bg-slate-800/20">
          <p className="text-slate-500 mb-2">لا توجد ملفات مضافة في هذا القسم</p>
          <button onClick={() => initUpload(categoryKey)} className="text-blue-400 text-sm hover:underline">اضغط لإضافة ملف</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((file) => (
            <div
              key={file.id}
              onClick={() => {
                const fileIndex = findFileIndexInAllFiles(file.id);
                if (fileIndex !== -1) setCurrentFileIndex(fileIndex);
              }}
              className="group bg-slate-800/40 border border-slate-700 rounded-2xl p-4 transition-all shadow-sm relative hover:border-blue-500/50 hover:shadow-lg cursor-pointer transform hover:-translate-y-1"
            >
              <div className="aspect-video bg-slate-950 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-slate-800 relative">

                {!imageErrors[file.id] ? (
                  <img
                    src={getOptimizedUrl(file.file_url, 'w800')}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    alt={file.file_name}
                    onError={() => handleImageError(file.id)}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                    {file.file_type?.includes('pdf') || file.file_name?.toLowerCase().endsWith('.pdf') ? (
                      <>
                        <FaFilePdf size={40} className="text-red-500/80 mb-2" />
                        <span className="text-[10px] font-bold opacity-60">PDF</span>
                      </>
                    ) : (
                      <FaFileAlt size={40} />
                    )}
                  </div>
                )}

                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                  <span className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white border border-white/20 shadow-lg scale-75 group-hover:scale-100 transition-transform">
                    <FaEye />
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold truncate text-slate-300 w-4/5" dir="auto" title={file.file_name}>
                    {file.file_name}
                  </p>
                  {file.status === 'pending_delete' ? (
                    <span title="بانتظار الموافقة" className="text-yellow-500 animate-pulse bg-yellow-500/10 p-1.5 rounded-lg">
                      <FaExclamationTriangle size={12} />
                    </span>
                  ) : (
                    <button
                      onClick={(e) => requestDeletion(e, file.id)}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all p-2 rounded-lg"
                      title="حذف الملف"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-700/50 pt-2 mt-1">
                  <FaCalendarAlt size={10} />
                  <span>{new Date(file.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gray-900 font-['Noto_Sans_Arabic',sans-serif]">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black z-0"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 z-0"></div>

        <div className="relative z-10 bg-gray-800/40 backdrop-blur-xl p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700/50 max-w-lg w-full text-center">
          <div className="mb-6 relative inline-block group">
            <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full group-hover:bg-yellow-500/20 transition-all duration-500"></div>
            <FaLock className="relative text-7xl text-yellow-500/90 mx-auto drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">الوصول مقيد</h1>
          <h2 className="text-lg text-gray-400 mb-8 font-light border-b border-gray-700/50 pb-4 w-3/4 mx-auto">
            تم قفل ملف الإنجاز بواسطة المعلم
          </h2>

          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-700/50 mb-8 shadow-inner">
            <p className="text-gray-300 text-lg leading-relaxed font-medium">
              {lockMessage}
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all border border-gray-600 shadow-lg flex items-center gap-2 mx-auto"
          >
            <FaArrowRight /> <span>العودة للخلف</span>
          </button>
        </div>

        <div className="relative z-10 mt-8 text-gray-600 text-xs tracking-widest uppercase font-semibold">
          نظام إدارة الطلاب الذكي
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-cairo pb-20" dir="rtl">
      <UploadLoadingOverlay />
      <AlertModal />

      {/* Header and User Info Section */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 pt-24 pb-20 px-4 border-b border-slate-800/50 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="absolute -top-10 right-0 bg-white/5 hover:bg-white/10 text-slate-300 p-3 rounded-full border border-white/5 backdrop-blur-sm">
            <FaArrowRight />
          </button>

          {loading || !studentData ? (
            <div className="text-center text-slate-500">جاري تحميل البيانات...</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000"></div>
                <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full p-1.5 bg-slate-900 shadow-2xl">
                  <img src={studentData.photo || '/default-avatar.png'} alt={studentData.name} className="w-full h-full rounded-full object-cover bg-slate-800 border border-slate-700" onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }} />
                </div>
              </div>

              <div className="text-center md:text-right flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{studentData.name}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-slate-300 text-sm md:text-base font-medium">
                  <div className="flex items-center gap-2 bg-slate-800/40 px-5 py-2.5 rounded-full border border-white/5"><FaSchool className="text-blue-400" /><span>{schoolName}</span></div>
                  <div className="flex items-center gap-2 bg-slate-800/40 px-5 py-2.5 rounded-full border border-white/5"><FaLayerGroup className="text-purple-400" /><span>{gradeName} - {sectionName}</span></div>
                  {teacherName && (<div className="flex items-center gap-2 bg-slate-800/40 px-5 py-2.5 rounded-full border border-white/5"><FaUserTie className="text-teal-400" /><span>المعلم: {teacherName}</span></div>)}
                </div>
                <div className="mt-6 flex justify-center md:justify-start gap-8 border-t border-white/5 pt-6 md:border-none md:pt-0">
                  <div><span className="block text-2xl font-bold text-white">{files.length}</span><span className="text-xs text-slate-500 uppercase tracking-wider">ملفات مرفقة</span></div>
                  <div><span className="block text-2xl font-bold text-white">5</span><span className="text-xs text-slate-500 uppercase tracking-wider">الحد الأقصى</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,video/*" />

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <PortfolioSection
              title="المهام الأدائية"
              icon={<FaShapes size={24} />}
              items={performanceFiles}
              categoryKey="performance_tasks"
            />

            <PortfolioSection
              title="أعمال ومشاريع أخرى"
              icon={<FaLayerGroup size={24} />}
              items={otherFiles}
              categoryKey="others"
            />
          </>
        )}
      </div>

      {currentFileIndex !== null && (
        <StudentPortfolioFileViewer
          files={getOrderedFilesForViewer()}
          currentIndex={currentFileIndex}
          onClose={() => setCurrentFileIndex(null)}
          onNext={() => setCurrentFileIndex(prev => Math.min(getOrderedFilesForViewer().length - 1, prev + 1))}
          onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
        />
      )}
    </div>
  );
};

export default StudentPortfolio;
