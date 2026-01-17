// src/pages/StudentView.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import {
  FaQuran,
  FaStar,
  FaTasks,
  FaPencilAlt,
  FaBookOpen,
  FaStickyNote,
  FaAward,
  FaMicrophone,
  FaCommentDots,
  FaArrowLeft,
  FaRegStar,
  FaCoins,
  FaGift, 
  FaSyncAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimes,
  FaLock,
  FaLayerGroup,
  FaHistory,
  FaHome
} from "react-icons/fa";

import {
  calculateCategoryScore,
  getStatusInfo,
  getGradeNameById,
  getSectionNameById,
  taskStatusUtils,
} from "../utils/gradeUtils";
import PrizesModal from "../components/PrizesModal"; 
import CustomDialog from "../components/CustomDialog"; 

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

// دالة لضمان حجم المصفوفة وتعبئتها بـ null إذا لزم الأمر
const ensureArraySize = (array, size) => {
    const newArray = Array(size).fill(null);
    const sourceArray = array && Array.isArray(array) ? array : [];
    
    for (let i = 0; i < Math.min(sourceArray.length, size); i++) {
        newArray[i] = sourceArray[i];
    }
    return newArray;
};

// هيكلية الدرجات الفارغة
const createEmptyGradesStructure = () => ({
    tests: Array(2).fill(null),
    homework: Array(10).fill(null),
    performanceTasks: Array(4).fill(null),
    participation: Array(10).fill(null),
    quranRecitation: Array(5).fill(null),
    quranMemorization: Array(5).fill(null),
    classInteraction: Array(4).fill(null),
});


function StudentView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  // --- States for Control Panel & View Config ---
  const [viewConfig, setViewConfig] = useState(null); 
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  // ---------------------------------------------

  // States for period functionality
  const [studentBaseData, setStudentBaseData] = useState(null); 
  const [studentDisplayedData, setStudentDisplayedData] = useState(null); 
  const [fullCurriculumData, setFullCurriculumData] = useState({ period1: [], period2: [] });
  const [fullHomeworkCurriculumData, setFullHomeworkCurriculumData] = useState({ period1: [], period2: [] });
  
  const [currentPeriod, setCurrentPeriod] = useState(null); 
  const [selectedSemester, setSelectedSemester] = useState(null); 
  
  const [loadingInitial, setLoadingInitial] = useState(true); 
  const [isFetching, setIsFetching] = useState(false); 
  const [verifying, setVerifying] = useState(false); // حالة تحميل جديدة للتحقق

  const [curriculum, setCurriculum] = useState([]); 
  const [homeworkCurriculum, setHomeworkCurriculum] = useState([]); 
  
  const [error, setError] = useState(null);
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  
  const [prizes, setPrizes] = useState([]);
  const [isPrizesModalOpen, setIsPrizesModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  
  // Reward Request States
  const [rewardRequests, setRewardRequests] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("info");
  const [dialogAction, setDialogAction] = useState(null);
  
  const gradeName = getGradeNameById(studentBaseData?.grade_level);
  const sectionName = getSectionNameById(studentBaseData?.section);
  
  // Dialog Handler
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


  // ----------------------------------------------------------------------
  // 1. Initial Data Fetch (Base/Shared Data)
  // ----------------------------------------------------------------------

  useEffect(() => {
    const fetchBaseData = async () => {
      if (!studentId) {
        setError("معرف الطالب مفقود.");
        setLoadingInitial(false);
        return;
      }

      try {
        setLoadingInitial(true);

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*, teacher_id')
          .eq('id', studentId)
          .single();

        if (studentError) {
          throw studentError;
        }

        const rawTeacherId = student.teacher_id;
        let teacherId = null;
        if (rawTeacherId) {
            teacherId = String(rawTeacherId).trim();
            if (teacherId === 'null' || teacherId === 'undefined' || teacherId.length === 0) {
                 teacherId = null;
            }
        }
        
        const gradeId = student.grade_level;
        const sectionId = student.section;
        
        // Fetch settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('teacher_name, school_name, student_view_config')
          .eq('id', 'general')
          .single();

        // --- منطق القفل والتحكم والتوجيه التلقائي ---
        if (settingsData?.student_view_config) {
            const config = settingsData.student_view_config;
            setViewConfig(config);
            
            if (config.is_locked) {
                setIsLocked(true);
                setLockMessage(config.lock_message);
                setLoadingInitial(false);
                return; 
            }

            // 🔥 التوجيه التلقائي (الصفحة الافتراضية) 🔥
            if (config.default_view) {
                const defaultKey = config.default_view; // e.g., 'sem1_period1'
                // التحقق من أن العرض الافتراضي لا يزال مسموحاً به
                if (config.allowed_views && config.allowed_views.includes(defaultKey)) {
                     const parts = defaultKey.split('_'); // ['sem1', 'period1']
                     if (parts.length === 2) {
                        const semKey = parts[0] === 'sem1' ? 'semester1' : 'semester2';
                        const perNum = parts[1] === 'period1' ? 1 : 2;
                        
                        // التوجيه المباشر
                        setSelectedSemester(semKey);
                        setCurrentPeriod(perNum);
                     }
                }
            } 
            // إذا لم يكن هناك افتراضي، نطبق المنطق القديم (خيار واحد فقط متاح)
            else if (config.allowed_views && config.allowed_views.length === 1) {
                const singleView = config.allowed_views[0];
                const parts = singleView.split('_');
                if (parts.length === 2) {
                    const semKey = parts[0] === 'sem1' ? 'semester1' : 'semester2';
                    const perNum = parts[1] === 'period1' ? 1 : 2;
                    setSelectedSemester(semKey);
                    setCurrentPeriod(perNum);
                }
            }
        }
        // --------------------------------

        setTeacherName(settingsData?.teacher_name || "");
        setSchoolName(settingsData?.school_name || "");
        
        // Fetch curriculum
        if (teacherId) {
            const { data: curriculumData } = await supabase
                .from('curriculum')
                .select('*')
                .eq('grade_id', gradeId)
                .eq('section_id', sectionId)
                .eq('teacher_id', teacherId)
                .single();
            
            if (curriculumData) {
                 setFullCurriculumData(curriculumData.recitation || {});
                 setFullHomeworkCurriculumData(curriculumData.homework || {});
            }
        }
        
        // Fetch prizes
        let prizesData = [];
        if (teacherId) {
          const { data: pData, error: pError } = await supabase
            .from('prizes')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('cost', { ascending: true });
            
          if (pError) console.error("Error fetching prizes:", pError);
          prizesData = pData || [];
          setPrizes(prizesData);
        
            // Fetch Reward Requests
            let requestsData = [];
            const { data: rData, error: rError } = await supabase
                .from('reward_requests')
                .select('*, prizes(id, name, cost)')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });
            
            if (rError) console.error("Error fetching reward requests:", rError);
            requestsData = rData ? rData.filter(r => r.teacher_id === teacherId) : [];
            setRewardRequests(requestsData);
        }
        
        const baseData = {
          ...student,
          teacher_id: teacherId,
          acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
          consumedStars: student.consumed_stars || 0, 
          stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0),
          nationalId: student.national_id,
          parentPhone: student.parent_phone,
          rawGrades: student.grades || {}
        };

        setStudentBaseData(baseData);
        setLoadingInitial(false);

      } catch (err) {
        console.error("Error fetching student base data:", err);
        setError("فشل في جلب بيانات الطالب الأساسية.");
        setLoadingInitial(false);
      }
    };

    fetchBaseData();
  }, [studentId]);
  
  // دالة تحديث بيانات الطالب
  const refreshStudentData = async () => {
      setIsFetching(true);
      try {
          const { data: student, error: studentError } = await supabase
              .from('students')
              .select('*, teacher_id')
              .eq('id', studentId)
              .single();

          if (studentError) throw studentError;
          
          const rawTeacherId = student.teacher_id;
          let teacherId = null;
          if (rawTeacherId) {
              teacherId = String(rawTeacherId).trim();
          }
          
          const { data: rData, error: rError } = await supabase
              .from('reward_requests')
              .select('*, prizes(id, name, cost)')
              .eq('student_id', studentId)
              .order('created_at', { ascending: false });
          
          const filteredRequests = rData ? rData.filter(r => r.teacher_id === teacherId) : [];

          const newBaseData = {
              ...student,
              teacher_id: teacherId,
              acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
              consumedStars: student.consumed_stars || 0, 
              stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0),
              nationalId: student.national_id,
              parentPhone: student.parent_phone,
              rawGrades: student.grades || {}
          };
          
          setStudentBaseData(newBaseData);
          setRewardRequests(filteredRequests);
          
          if (selectedSemester && currentPeriod) {
              await fetchPeriodData(currentPeriod, selectedSemester, newBaseData, filteredRequests);
          }

      } catch (err) {
          console.error("Error refreshing student data:", err);
          handleDialog("خطأ", "فشل في تحديث بيانات الطالب.", "error");
      } finally {
          setIsFetching(false);
      }
  };

  const clearRewardRequest = async (requestId) => {
      try {
          const { error } = await supabase
              .from('reward_requests')
              .update({ status: 'fulfilled', updated_at: new Date().toISOString() })
              .eq('id', requestId);

          if (error) throw error;
          
          setRewardRequests(prev => prev.map(r => 
              r.id === requestId ? { ...r, status: 'fulfilled' } : r
          ));
          refreshStudentData(); 
          
      } catch (err) {
          console.error("Error clearing reward request:", err);
          handleDialog("خطأ", "فشل في إخفاء الإشعار. يرجى المحاولة مرة أخرى.", "error");
      }
  };
  
  // ======================================================
  // 🔥🔥🔥 دالة التحقق الذكي قبل الدخول 🔥🔥🔥
  // ======================================================
  const verifyAndProceed = async (type, value) => {
      setVerifying(true); // إظهار مؤشر تحميل بسيط
      try {
          // 1. جلب أحدث الإعدادات الآن
          const { data: settingsData, error } = await supabase
              .from('settings')
              .select('student_view_config')
              .eq('id', 'general')
              .single();

          if (error) throw error;
          
          const config = settingsData?.student_view_config;
          
          // 2. التحقق من القفل
          if (config?.is_locked) {
              setIsLocked(true);
              setLockMessage(config.lock_message);
              setVerifying(false);
              return; // إيقاف العملية
          }

          // 3. التحقق من الصلاحيات (allowed_views)
          const allowedViews = config?.allowed_views || [];
          
          if (allowedViews.length > 0) {
              let keyToCheck = "";
              
              if (type === 'period') {
                   // نحتاج معرفة الفصل الحالي للتحقق
                   const semPrefix = selectedSemester === 'semester1' ? 'sem1' : 'sem2';
                   keyToCheck = `${semPrefix}_period${value}`;
                   
                   if (!allowedViews.includes(keyToCheck)) {
                       handleDialog("عذراً", "لم يعد هذا القسم متاحاً للعرض بواسطة المعلم.", "error");
                       // تحديث الإعدادات المحلية لتختفي الأزرار غير المتاحة
                       setViewConfig(config); 
                       setVerifying(false);
                       return; // إيقاف العملية
                   }
              }
          }

          // 4. السماح بالدخول
          if (type === 'semester') setSelectedSemester(value);
          if (type === 'period') setCurrentPeriod(value);
          
          // تحديث الإعدادات المحلية بالمرة
          setViewConfig(config);

      } catch (err) {
          console.error("Verification failed:", err);
          handleDialog("خطأ", "فشل في التحقق من الإعدادات. حاول مرة أخرى.", "error");
      } finally {
          setVerifying(false);
      }
  };

  // 🔥 وظيفة زر الرجوع للقائمة 🔥
  const handleBackToMenu = () => {
      // إفراغ القيم لإجبار المكون على إعادة رسم شاشة الاختيار
      setSelectedSemester(null);
      setCurrentPeriod(null);
  };


  // ----------------------------------------------------------------------
  // 2. Period Data Processing (Core Logic)
  // ----------------------------------------------------------------------
  const fetchPeriodData = async (period, semester, baseDataOverride = null) => {
    const student = baseDataOverride || studentBaseData;
    if (!student || !period || !semester) return;
    
    const periodName = `period${period}`;

    try {
      setIsFetching(true);
      
      const studentId = student.id; 
      const teacherId = student.teacher_id;
      const gradeId = student.grade_level;
      const sectionId = student.section;
      
      let visitId = null;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== teacherId) {
          await supabase
              .from('page_visits')
              .update({ visit_end_time: new Date().toISOString() })
              .eq('student_id', studentId)
              .is('visit_end_time', null);
              
          const { data, error } = await supabase
              .from('page_visits')
              .insert({
                  student_id: studentId,
                  teacher_id: teacherId, 
                  visit_start_time: new Date().toISOString()
              })
              .select()
              .single();

          if (error) {
              console.error("Error logging visit:", error);
          } else {
              visitId = data.id;
          }
      }
      
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .eq('teacher_id', teacherId)
        .eq('is_visible', true) 
        .order('created_at', { ascending: false });

      // ===============================================
      // 🔥 تصفية الإعلانات حسب الفصل الدراسي وتنظيف النص 🔥
      // ===============================================
      const processedAnnouncements = (announcementsData || []).filter(ann => {
        const content = ann.content || "";
        const semesterPrefix = `${semester}_`; // e.g. 'semester1_' or 'semester2_'

        // 1. إذا كان الإعلان يحتوي على بادئة فصل (نظام جديد)
        if (content.startsWith('semester1_') || content.startsWith('semester2_')) {
          return content.startsWith(semesterPrefix);
        }
        
        // 2. إذا لم يحتوي على بادئة (نظام قديم)، يعتبر للفصل الأول
        return semester === 'semester1';
      }).map(ann => ({
        ...ann,
        // تنظيف النص لإزالة البادئة قبل عرضه للطالب
        content: ann.content.replace(/^semester\d+_/, '')
      }));

      setAnnouncements(processedAnnouncements);
      
      // ===============================================

      let activeRecitationCurriculum = [];
      let activeHomeworkCurriculum = [];

      const semRecitation = fullCurriculumData[semester];
      const semHomework = fullHomeworkCurriculumData[semester];

      if (semRecitation) {
          activeRecitationCurriculum = semRecitation[periodName] || [];
      } else if (semester === 'semester1' && fullCurriculumData.period1) {
          activeRecitationCurriculum = fullCurriculumData[periodName] || [];
      }

      if (semHomework) {
          activeHomeworkCurriculum = semHomework[periodName] || [];
      } else if (semester === 'semester1' && fullHomeworkCurriculumData.period1) {
          activeHomeworkCurriculum = fullHomeworkCurriculumData[periodName] || [];
      }

      setCurriculum(activeRecitationCurriculum);
      setHomeworkCurriculum(activeHomeworkCurriculum);

      const rawGrades = student.rawGrades || {};
      let semesterGrades = rawGrades[semester]; 

      if (!semesterGrades && semester === 'semester1') {
          semesterGrades = rawGrades; 
      }
      
      if (!semesterGrades) {
          semesterGrades = createEmptyGradesStructure();
      }

      const periodGrades = semesterGrades[periodName] || createEmptyGradesStructure();
      
      const weeklyNotes = semesterGrades.weeklyNotes || rawGrades.weeklyNotes || rawGrades.weekly_notes || Array(20).fill(null);
      
      let displayStars = student.stars;
      let displayAcquired = student.acquired_stars;
      let displayConsumed = student.consumed_stars;

      if (semesterGrades.stars) {
          displayAcquired = semesterGrades.stars.acquired || 0;
          displayConsumed = semesterGrades.stars.consumed || 0;
          displayStars = displayAcquired - displayConsumed;
      }

      const processedStudentData = {
        ...student,
        grades: {
          tests: ensureArraySize(periodGrades?.tests, 2),
          classInteraction: ensureArraySize(periodGrades?.classInteraction || periodGrades?.oralTest || periodGrades?.oral_test, 4), 
          homework: ensureArraySize(periodGrades?.homework, 10),
          performanceTasks: ensureArraySize(periodGrades?.performanceTasks || periodGrades?.performance_tasks, 4), 
          participation: ensureArraySize(periodGrades?.participation, 10),
          quranRecitation: ensureArraySize(periodGrades?.quranRecitation || periodGrades?.quran_recitation, 5),
          quranMemorization: ensureArraySize(periodGrades?.quranMemorization || periodGrades?.quran_memorization, 5),
          weeklyNotes: ensureArraySize(weeklyNotes, 20), 
        },
        nationalId: student.national_id,
        parentPhone: student.parent_phone,
        acquiredStars: displayAcquired,
        consumedStars: displayConsumed, 
        stars: displayStars,
        grade_level: student.grade_level,
        section: student.section,
      };

      setStudentDisplayedData(processedStudentData);
      setIsFetching(false);

      return () => { 
        if (visitId) {
            supabase
                .from('page_visits')
                .update({ visit_end_time: new Date().toISOString() })
                .eq('id', visitId)
                .then(({ error }) => {
                    if (error) console.error("Error updating visit end time on cleanup:", error);
                });
        }
      }; 

    } catch (err) {
      console.error("Error fetching period data:", err);
      setError("فشل في جلب بيانات الفترة.");
      setIsFetching(false);
      return () => {}; 
    }
  };
  
  // ----------------------------------------------------------------------
  // 3. Effects
  // ----------------------------------------------------------------------

  useEffect(() => {
    if (studentBaseData && selectedSemester && currentPeriod) {
      const timeoutId = setTimeout(() => {
          fetchPeriodData(currentPeriod, selectedSemester);
      }, 50); 
      return () => clearTimeout(timeoutId);
    }
  }, [studentBaseData, currentPeriod, selectedSemester, fullCurriculumData, fullHomeworkCurriculumData]); 
  
  // ----------------------------------------------------------------------
  // 4. Request Reward Functionality
  // ----------------------------------------------------------------------
  
  const requestReward = async (prize) => {
      if (!studentDisplayedData) return;
      const teacherId = studentDisplayedData.teacher_id; 
      
      if (!teacherId) {
          handleDialog("خطأ", "لم يتم العثور على معرف المعلم المرتبط بالطالب، لا يمكن إرسال الطلب.", "error");
          return;
      }
      
      const pendingRequest = rewardRequests.find(r => r.status === 'pending');
      if (pendingRequest) {
          handleDialog("خطأ", "لديك طلب مكافأة معلق بالفعل: " + pendingRequest.prizes.name, "error");
          return;
      }
      
      if (studentDisplayedData.stars < prize.cost) {
          handleDialog("خطأ", `رصيدك الحالي (${studentDisplayedData.stars} نجمة) غير كافٍ لطلب مكافأة "${prize.name}" التي تكلفتها ${prize.cost} نجوم.`, "error");
          return;
      }

      handleDialog(
          "تأكيد طلب المكافأة",
          `هل أنت متأكد من طلب مكافأة "${prize.name}" التي تكلفتها ${prize.cost} نجوم؟ سيتم خصم التكلفة عند موافقة المعلم.`,
          "confirm",
          async () => {
              try {
                  const { data, error } = await supabase
                      .from('reward_requests')
                      .insert({
                          student_id: studentId,
                          teacher_id: teacherId, 
                          prize_id: prize.id,
                          prize_cost: prize.cost,
                          status: 'pending'
                      })
                      .select('*, prizes(id, name, cost)')
                      .single();

                  if (error) throw error;
                  
                  setRewardRequests([data, ...rewardRequests.filter(r => r.id !== data.id)]);
                  handleDialog("نجاح", `تم إرسال طلب مكافأة "${prize.name}" بنجاح. يرجى الانتظار حتى موافقة المعلم.`, "success");
              } catch (err) {
                 handleDialog("خطأ", `حدث خطأ أثناء إرسال طلب المكافأة.`, "error");
              }
          }
      );
  };
  
  // ----------------------------------------------------------------------
  // 5. Loading/Error States and Period Selection UI
  // ----------------------------------------------------------------------

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">{error}</p>
      </div>
    );
  }
  
  if (loadingInitial) {
      return (
        <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
            جاري تحميل بيانات الطالب الأساسية...
        </div>
      );
  }

  // >>>>> 1. شاشة القفل (التصميم الرسمي الجديد) <<<<<
  if (isLocked) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gray-900 font-['Noto_Sans_Arabic',sans-serif]">
            {/* الخلفية المتدرجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black z-0"></div>
            
            {/* دوائر تزيينية ضبابية */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 z-0"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 z-0"></div>

            <div className="relative z-10 bg-gray-800/40 backdrop-blur-xl p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700/50 max-w-lg w-full text-center animate-fadeIn">
                <div className="mb-6 relative inline-block group">
                     <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-full group-hover:bg-yellow-500/20 transition-all duration-500"></div>
                     <FaLock className="relative text-7xl text-yellow-500/90 mx-auto drop-shadow-2xl" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">الوصول مقيد</h1>
                <h2 className="text-lg text-gray-400 mb-8 font-light border-b border-gray-700/50 pb-4 w-3/4 mx-auto">
                    تم قفل الصفحة بواسطة المعلم
                </h2>
                
                <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-700/50 mb-8 shadow-inner">
                    <p className="text-gray-300 text-lg leading-relaxed font-medium">
                        {lockMessage || "يقوم المعلم بتحديث البيانات حالياً. يرجى العودة لاحقاً."}
                    </p>
                </div>

                <button 
                    onClick={() => window.location.reload()} 
                    className="group relative px-8 py-3 w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transition-all duration-300 overflow-hidden border border-blue-600/30"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <FaSyncAlt className="group-hover:rotate-180 transition-transform duration-500" /> 
                        تحديث الصفحة
                    </span>
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-shine"></div>
                </button>
            </div>
            
            <div className="relative z-10 mt-8 text-gray-600 text-xs tracking-widest uppercase font-semibold">
                نظام إدارة الطلاب الذكي
            </div>
        </div>
      );
  }

  // >>>>> 2. شاشة الاختيار المتعدد (المنطق الجديد) <<<<<
  if (currentPeriod === null || currentPeriod === 0) {
    const studentName = studentBaseData?.name || "هذا الطالب";
    const allowed = viewConfig?.allowed_views || []; 

    // التحقق من السماحيات بناءً على المفاتيح الجديدة (semX_periodY)
    const hasSem1 = allowed.some(key => key.startsWith('sem1_'));
    const hasSem2 = allowed.some(key => key.startsWith('sem2_'));
    
    // 1. منطق اختيار الفصل الدراسي (أو التحديد التلقائي)
    if (!selectedSemester) {
        // حالة أ: فقط الفصل الأول متاح -> اختر الفصل الأول تلقائياً وأظهر الفترات
        if (hasSem1 && !hasSem2) {
            setSelectedSemester('semester1');
            return null; // سيتم إعادة التصيير فوراً مع المتغير الجديد
        }
        // حالة ب: فقط الفصل الثاني متاح -> اختر الفصل الثاني تلقائياً
        if (!hasSem1 && hasSem2) {
            setSelectedSemester('semester2');
            return null; 
        }
        // حالة ج: كلاهما متاح -> أظهر شاشة اختيار الفصل
        if (hasSem1 && hasSem2) {
             return (
                <div className="p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center justify-center" dir="rtl">
                    <div className="bg-gray-800 p-6 md:p-10 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-auto">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 text-center mb-6 border-b pb-3 border-gray-700">
                            <FaLayerGroup className="inline mb-1 ml-2"/> اختر الفصل الدراسي
                        </h1>
                        <p className="text-gray-400 text-center mb-8 text-md">
                            مرحباً **{studentName}**. لديك سجلات متاحة في الفصلين، اختر للمتابعة.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => verifyAndProceed('semester', 'semester1')}
                                disabled={verifying}
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl hover:scale-[1.02] transition-transform shadow-lg border border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifying ? <FaSyncAlt className="animate-spin text-2xl"/> : <span className="text-xl font-bold">الفصل الدراسي الأول</span>}
                                {!verifying && <span className="text-sm opacity-80 mt-1">اضغط لعرض الفترات</span>}
                            </button>

                            <button 
                                onClick={() => verifyAndProceed('semester', 'semester2')}
                                disabled={verifying}
                                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-xl hover:scale-[1.02] transition-transform shadow-lg border border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifying ? <FaSyncAlt className="animate-spin text-2xl"/> : <span className="text-xl font-bold">الفصل الدراسي الثاني</span>}
                                {!verifying && <span className="text-sm opacity-80 mt-1">اضغط لعرض الفترات</span>}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        
        // حالة د: لا يوجد شيء متاح
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-['Noto_Sans_Arabic',sans-serif]">
                <div className="text-center p-8 bg-gray-800 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-red-400 mb-2">لا توجد سجلات متاحة</h2>
                    <p className="text-gray-400">يرجى مراجعة المعلم لتفعيل العرض.</p>
                </div>
            </div>
        );
    }

    // 2. إذا تم اختيار الفصل (أو تم اختياره تلقائياً)، أظهر خيارات الفترة
    // تحقق أي الفترات مسموحة لهذا الفصل بالتحديد
    const prefix = selectedSemester === 'semester1' ? 'sem1' : 'sem2';
    const showP1 = allowed.includes(`${prefix}_period1`);
    const showP2 = allowed.includes(`${prefix}_period2`);

    return (
        <div className="p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center justify-center" dir="rtl">
            <div className="bg-gray-800 p-6 md:p-10 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-auto animate-fadeIn">
                <div className="flex justify-between items-center mb-6 border-b pb-3 border-gray-700">
                    <h1 className="text-2xl font-extrabold text-blue-400">
                         {selectedSemester === 'semester1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'}
                    </h1>
                    {/* إظهار زر العودة فقط إذا كان الفصلين متاحين (يعني المستخدم وصل هنا باختيار) */}
                    {(hasSem1 && hasSem2) && (
                        <button 
                            onClick={() => setSelectedSemester(null)}
                            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                        >
                            <FaArrowLeft /> تغيير الفصل
                        </button>
                    )}
                </div>

                <p className="text-gray-400 text-center mb-8 text-md">
                    يرجى اختيار الفترة الزمنية لعرض الدرجات والمهام الخاصة بها.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showP1 && (
                        <button 
                            onClick={() => verifyAndProceed('period', 1)}
                            disabled={verifying}
                            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl hover:scale-[1.02] transition-transform shadow-lg border border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {verifying ? <FaSyncAlt className="animate-spin text-2xl"/> : <span className="text-xl font-bold">الفترة الأولى</span>}
                            {!verifying && <span className="text-sm opacity-80 mt-1">عرض السجل</span>}
                        </button>
                    )}

                    {showP2 && (
                        <button 
                            onClick={() => verifyAndProceed('period', 2)}
                            disabled={verifying}
                            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-600 to-yellow-800 text-white rounded-xl hover:scale-[1.02] transition-transform shadow-lg border border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {verifying ? <FaSyncAlt className="animate-spin text-2xl"/> : <span className="text-xl font-bold">الفترة الثانية</span>}
                            {!verifying && <span className="text-sm opacity-80 mt-1">عرض السجل</span>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
  }

  // Fallback
  if (!studentDisplayedData || isFetching) {
      return (
        <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
            <FaSyncAlt className="animate-spin text-4xl mr-3"/> جاري تحميل بيانات {selectedSemester === 'semester1' ? 'الفصل الأول' : 'الفصل الثاني'} - الفترة {currentPeriod === 1 ? 'الأولى' : 'الثانية'}...
        </div>
      );
  }

  const studentData = studentDisplayedData;
  const allNotes = [];
  const safeWeeklyNotes = Array.isArray(studentData.grades.weeklyNotes) ? studentData.grades.weeklyNotes : [];
  
  safeWeeklyNotes.forEach((notes, weekIndex) => { 
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        allNotes.push({ note, weekIndex });
      });
    }
  });

  const processedNotes = allNotes.reverse().slice(0, 5);
  
  // ----------------------------------------------------------------------
  // 6. Main Content UI
  // ----------------------------------------------------------------------
  
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
  
  const pendingRequest = rewardRequests.find(r => r.status === 'pending');
  const lastRequest = rewardRequests[0];
  const showClearButton = lastRequest && (lastRequest.status === 'approved' || lastRequest.status === 'rejected');
  

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen font-['Noto_Sans_Arabic',sans-serif] text-right text-gray-100" dir="rtl">
      {/* الشريط العلوي */}
      <header className="flex flex-col md:flex-row justify-center items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center relative">
        <div className="flex flex-col">
          <h1 className="text-lg md:text-2xl font-extrabold text-white">
            سجل متابعة مادة القرآن الكريم والدراسات الإسلامية
          </h1>
          {schoolName && (
            <p className="text-sm md:text-md font-medium text-gray-400">
              المدرسة: {schoolName}
            </p>
          )}
          {teacherName && (
            <p className="text-sm md:text-md font-medium text-gray-400">
              معلم المادة:  {teacherName}
            </p>
          )}
          
          <p className="text-sm md:text-md font-medium text-yellow-500 mt-1">
              يتم عرض بيانات: {selectedSemester === 'semester1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'}
          </p>
          
          <div className="flex flex-col items-center justify-center mt-3 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3">
              <span className="text-md font-bold text-yellow-500 whitespace-nowrap">
                الفترة المعروضة: <span className="text-lg text-white">{currentPeriod === 1 ? 'الأولى' : 'الثانية'}</span>
              </span>
              
              {/* 🔥 زر العودة إلى القائمة بدلاً من التحديث 🔥 */}
              <button
                  onClick={handleBackToMenu}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all shadow-md border border-gray-500 font-bold text-sm"
                  title="العودة لاختيار الفصل أو الفترة"
              >
                  <FaHistory className="text-blue-300"/> تغيير الفصل/الفترة
              </button>

            </div>
          </div>
          
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-700">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-700 flex-row-reverse">
            <div className="flex-shrink-0">
              <img src={studentData.photo || '/images/1.webp'} alt="صورة الطالب" className="w-32 h-32 rounded-full object-cover border-4 border-blue-400 shadow-lg" />
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 mb-1">{studentData.name}</h1>
              <p className="text-gray-400">السجل المدني: {studentData.nationalId}</p>
              <p className="text-gray-400">الصف: {gradeName} / {sectionName}</p>
              {studentData.parentPhone && (
                <p className="text-gray-400">رقم ولي الأمر: {studentData.parentPhone}</p>
              )}
            </div>
          </div>
          
          {lastRequest && lastRequest.status !== 'fulfilled' && (
              <div className={`p-4 rounded-xl mb-6 flex justify-between items-start ${
                  lastRequest.status === 'pending' ? 'bg-yellow-800 text-yellow-100 border border-yellow-700' :
                  lastRequest.status === 'rejected' ? 'bg-red-800 text-red-100 border border-red-700' : 'bg-green-800 text-green-100 border border-green-700'
              }`}>
                  <div className="flex-grow">
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                          <FaGift /> حالة طلب المكافأة
                      </h4>
                      <p className="text-sm">
                          {lastRequest.status === 'pending' && <><FaExclamationCircle className="inline ml-1"/> لديك طلب مكافأة معلق: {lastRequest.prizes?.name} (بتكلفة {lastRequest.prize_cost} نجوم). لا يمكنك طلب مكافأة أخرى حتى تتم معالجة هذا الطلب.</>}
                          {lastRequest.status === 'rejected' && <><FaExclamationCircle className="inline ml-1"/> تم رفض طلب مكافأة {lastRequest.prizes?.name} بتاريخ {new Date(lastRequest.updated_at).toLocaleDateString()}. يمكنك تقديم طلب جديد الآن.</>}
                          {lastRequest.status === 'approved' && <><FaCheckCircle className="inline ml-1"/> تهانينا! تم قبول طلب مكافأة {lastRequest.prizes?.name} بتاريخ {new Date(lastRequest.updated_at).toLocaleDateString()}. يمكنك تقديم طلب جديد.</>}
                      </p>
                  </div>
                  
                  {showClearButton && (
                      <button
                          onClick={() => clearRewardRequest(lastRequest.id)}
                          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 text-sm rounded-lg font-semibold transition-colors mt-1 ${
                              lastRequest.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                      >
                          <FaTimes className="text-xs" /> إخفاء الإشعار
                      </button>
                  )}
              </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="md:col-span-2 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold text-xl flex items-center gap-2 text-gray-100 mb-4">
                <FaCommentDots className="text-3xl text-yellow-400" /> إعلانات هامة
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {announcements.length > 0 ? (
                  announcements.map((ann, index) => (
                    <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
                      <p className="text-sm text-gray-300">{ann.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ann.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm text-center">لا توجد إعلانات حاليًا.</p>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold text-xl flex items-center gap-2 text-gray-100 mb-4">
                <FaStickyNote className="text-3xl text-yellow-400" /> آخر الملاحظات (مشترك)
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {processedNotes.length > 0 ? (
                  processedNotes.map((item, index) => (
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
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* المجموع النهائي */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                  <span className="text-xl md:text-2xl font-bold text-green-500">
                    {calculateFinalTotalScore(studentData.grades)} / 100
                  </span>
                </div>
                <FaAward className="text-4xl text-green-400" />
              </div>
            </div>

            {/* أعمال السنة */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المهام الأدائية والمشاركة والتفاعل الصفي
 </h4>
                  <span className="text-xl md:text-2xl font-bold text-yellow-400">{calculateCoursework(studentData.grades)} / 40</span>
                </div>
                <FaTasks className="text-4xl text-yellow-400" />
              </div>
            </div>

            {/* التقييمات الرئيسية */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">تقويمات شفهية وتحريرية </h4>
                  <span className="text-xl md:text-2xl font-bold text-blue-400">{calculateMajorAssessments(studentData.grades)} / 60</span>
                </div>
                <FaBookOpen className="text-4xl text-blue-400" />
              </div>
            </div>
            
            {/* النجوم */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 col-span-1 flex flex-col items-center justify-center">
              <h4 className="font-semibold text-gray-100 text-lg mb-4">النجوم</h4>
              <div className="flex flex-col items-center justify-center w-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-3xl text-yellow-400" />
                    <span className="text-md font-semibold text-yellow-400">الحالية</span>
                    <span className="text-lg font-bold text-yellow-400">({studentData.stars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <FaStar
                        key={`total-${i}`}
                        className={`text-xl ${i < (studentData.stars || 0) ? 'text-yellow-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FaCoins className="text-3xl text-green-400" />
                    <span className="text-md font-semibold text-green-400">المكتسبة</span>
                    <span className="text-lg font-bold text-green-400">({studentData.acquiredStars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <FaStar
                        key={`acquired-${i}`}
                        className={`text-xl ${i < (studentData.acquiredStars || 0) ? 'text-green-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FaRegStar className="text-3xl text-red-400" />
                    <span className="text-md font-semibold text-red-400">المستهلكة</span>
                    <span className="text-lg font-bold text-red-400">({studentData.consumedStars || 0})</span>
                  </div>
                  <div className="flex items-center flex-wrap justify-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <FaStar
                        key={`consumed-${i}`}
                        className={`text-xl ${i < (studentData.consumedStars || 0) ? 'text-red-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaBookOpen className="text-3xl text-red-400" /> الاختبارات
                <span className="text-red-400 font-bold mr-2 text-2xl">
                  {calculateCategoryScore(studentData.grades, 'tests', 'sum')} / 40
                </span>
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة الاختبارات</h5>
                {taskStatusUtils(studentData, homeworkCurriculum, 'test').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(studentData, homeworkCurriculum, 'test').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.tests.slice(0, 2).map((grade, i) => (
                  <div key={i} className="w-20 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaMicrophone className="text-3xl text-yellow-400" /> التفاعل الصفي
                <span className="text-yellow-400 font-bold text-2xl">
                  {calculateCategoryScore(studentData.grades, 'classInteraction', 'best')} / 10
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.classInteraction.slice(0, 4).map((grade, i) => (
                  <div key={i} className="w-16 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaTasks className="text-3xl text-green-400" /> الواجبات
                <span className="text-green-400 font-bold mr-2 text-2xl">
                  {calculateCategoryScore(studentData.grades, 'homework', 'sum')} / 10
                </span>
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة الواجبات</h5>
                {taskStatusUtils(studentData, homeworkCurriculum, 'homework').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(studentData, homeworkCurriculum, 'homework').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.homework.slice(0, 10).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-1 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaPencilAlt className="text-3xl text-purple-400" /> المهام الأدائية
                <span className="text-purple-400 font-bold mr-2 text-2xl">
                  {calculateCategoryScore(studentData.grades, 'performanceTasks', 'best')} / 10
                </span>
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <h5 className="font-medium text-gray-100">حالة المهام</h5>
                {taskStatusUtils(studentData, homeworkCurriculum, 'performanceTask').icon}
                <span className="text-sm text-gray-400">
                  ({taskStatusUtils(studentData, homeworkCurriculum, 'performanceTask').text})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.performanceTasks.slice(0, 4).map((grade, i) => (
                  <div key={i} className="w-16 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaCommentDots className="text-3xl text-cyan-400" /> المشاركة 
                <span className="text-cyan-400 font-bold text-2xl">
                  {calculateCategoryScore(studentData.grades, 'participation', 'sum')} / 10
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.participation.slice(0, 10).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full md:col-span-2 lg:col-span-3 bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-100 text-xl">
                <FaQuran className="text-3xl text-blue-400" /> القرآن الكريم
                <span className="text-blue-400 font-bold mr-2 text-2xl">
                  {(parseFloat(calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(studentData.grades, 'quranMemorization', 'average'))).toFixed(2)} / 20
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-100">تلاوة القرآن</h5>
                    {getStatusInfo(studentData, 'recitation', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(studentData, 'recitation', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(studentData, 'recitation', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(studentData, 'recitation', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(studentData, 'recitation', curriculum).text})
                    </span>
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')} / 10</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                      <div key={i} className="w-12 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-100">حفظ القرآن </h5>
                    {getStatusInfo(studentData, 'memorization', curriculum).icon}
                    <span className={`text-sm ${getStatusInfo(studentData, 'memorization', curriculum).icon.props.className.includes('text-green') ? 'text-green-400' : getStatusInfo(studentData, 'memorization', curriculum).icon.props.className.includes('text-red') ? 'text-red-400' : getStatusInfo(studentData, 'memorization', curriculum).icon.props.className.includes('text-yellow') ? 'text-yellow-400' : 'text-gray-400'}`}>
                      ({getStatusInfo(studentData, 'memorization', curriculum).text})
                    </span>
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(studentData.grades, 'quranMemorization', 'average')} / 10</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                      <div key={i} className="w-12 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-full bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-xl flex items-center gap-2 text-gray-100">
                  <FaGift className="text-2xl text-purple-400" /> المكافآت المتاحة
                </h4>
                <button
                  onClick={() => setIsPrizesModalOpen(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <FaGift /> طلب المكافأة
                </button>
              </div>
            </div>

            <div className="col-span-full bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-xl flex items-center gap-2 text-gray-100">
                  <FaStickyNote className="text-2xl text-yellow-400" /> الملاحظات الأسبوعية
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
                {(studentData.grades.weeklyNotes || []).map((notes, weekIndex) => (
                  <div key={weekIndex} className="bg-gray-800 p-3 rounded-lg border border-gray-600 min-h-[120px] relative">
                    <h5 className="font-bold text-gray-200 mb-1 text-center">الأسبوع {weekIndex + 1}</h5>
                    <div className="h-px bg-gray-600 mb-2"></div>
                    {notes && notes.length > 0 ? (
                      <ul className="list-none pr-0 text-gray-300 text-sm space-y-1">
                        {notes.map((note, noteIndex) => (
                          <li key={noteIndex} className="pb-1 border-b border-gray-700 last:border-b-0">
                            <span>{note}</span>
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
      </div>
      
      {isPrizesModalOpen && 
        <PrizesModal 
            prizes={prizes} 
            onClose={() => {
                setIsPrizesModalOpen(false);
                refreshStudentData(); 
            }}
            currentStars={studentData.stars}
            pendingRequest={pendingRequest}
            onRequest={requestReward}
            handleDialog={handleDialog}
        />
      }
      
      {showDialog && (
        <CustomDialog
          title={dialogTitle}
          message={dialogMessage}
          type={dialogType}
          onConfirm={handleConfirmAction}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}

export default StudentView;