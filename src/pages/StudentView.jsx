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
  FaHistory
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
  const [verifying, setVerifying] = useState(false);

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
                const defaultKey = config.default_view; 
                if (config.allowed_views && config.allowed_views.includes(defaultKey)) {
                     const parts = defaultKey.split('_'); 
                     if (parts.length === 2) {
                        const semKey = parts[0] === 'sem1' ? 'semester1' : 'semester2';
                        const perNum = parts[1] === 'period1' ? 1 : 2;
                        
                        setSelectedSemester(semKey);
                        setCurrentPeriod(perNum);
                     }
                }
            } 
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
      setVerifying(true); 
      try {
          const { data: settingsData, error } = await supabase
              .from('settings')
              .select('student_view_config')
              .eq('id', 'general')
              .single();

          if (error) throw error;
          
          const config = settingsData?.student_view_config;
          
          if (config?.is_locked) {
              setIsLocked(true);
              setLockMessage(config.lock_message);
              setVerifying(false);
              return; 
          }

          const allowedViews = config?.allowed_views || [];
          
          if (allowedViews.length > 0) {
              let keyToCheck = "";
              
              if (type === 'period') {
                   const semPrefix = selectedSemester === 'semester1' ? 'sem1' : 'sem2';
                   keyToCheck = `${semPrefix}_period${value}`;
                   
                   if (!allowedViews.includes(keyToCheck)) {
                       handleDialog("عذراً", "لم يعد هذا القسم متاحاً للعرض بواسطة المعلم.", "error");
                       setViewConfig(config); 
                       setVerifying(false);
                       return; 
                   }
              }
          }

          if (type === 'semester') setSelectedSemester(value);
          if (type === 'period') setCurrentPeriod(value);
          
          setViewConfig(config);

      } catch (err) {
          console.error("Verification failed:", err);
          handleDialog("خطأ", "فشل في التحقق من الإعدادات. حاول مرة أخرى.", "error");
      } finally {
          setVerifying(false);
      }
  };

  const handleBackToMenu = () => {
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

      // تصفية الإعلانات
      const processedAnnouncements = (announcementsData || []).filter(ann => {
        const content = ann.content || "";
        const semesterPrefix = `${semester}_`; 

        if (content.startsWith('semester1_') || content.startsWith('semester2_')) {
          return content.startsWith(semesterPrefix);
        }
        return semester === 'semester1';
      }).map(ann => ({
        ...ann,
        content: ann.content.replace(/^semester\d+_/, '')
      }));

      setAnnouncements(processedAnnouncements);
      
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
  
  // >>>>> 0. شاشة التحميل الأولية (Loading Initial) <<<<<
  if (loadingInitial) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 font-['Noto_Sans_Arabic',sans-serif] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black z-0"></div>
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse z-0"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse delay-1000 z-0"></div>

            <div className="relative z-10 flex flex-col items-center justify-center p-10 bg-gray-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 max-w-sm w-full transform transition-all">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                    <FaSyncAlt className="text-6xl text-blue-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">جاري التحضير</h2>
                <p className="text-gray-400 text-sm font-medium mb-6">يتم الآن استدعاء بيانات الطالب الأساسية...</p>
                
                <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-500 via-purple-500 to-blue-500 w-[200%] animate-[shimmer_2s_linear_infinite] rounded-full"></div>
                </div>
            </div>
        </div>
      );
  }

  // >>>>> 1. شاشة القفل <<<<<
  if (isLocked) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gray-900 font-['Noto_Sans_Arabic',sans-serif]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black z-0"></div>
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

  // >>>>> 2. شاشة الاختيار المتعدد <<<<<
  if (currentPeriod === null || currentPeriod === 0) {
    const studentName = studentBaseData?.name || "هذا الطالب";
    const allowed = viewConfig?.allowed_views || []; 

    const hasSem1 = allowed.some(key => key.startsWith('sem1_'));
    const hasSem2 = allowed.some(key => key.startsWith('sem2_'));
    
    if (!selectedSemester) {
        if (hasSem1 && !hasSem2) {
            setSelectedSemester('semester1');
            return null; 
        }
        if (!hasSem1 && hasSem2) {
            setSelectedSemester('semester2');
            return null; 
        }
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
        
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-['Noto_Sans_Arabic',sans-serif]">
                <div className="text-center p-8 bg-gray-800 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-red-400 mb-2">لا توجد سجلات متاحة</h2>
                    <p className="text-gray-400">يرجى مراجعة المعلم لتفعيل العرض.</p>
                </div>
            </div>
        );
    }

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

  // Fallback (Loading Period) - Updated Design
  if (!studentDisplayedData || isFetching) {
    const semesterLabel = selectedSemester === 'semester1' ? 'الفصل الأول' : 'الفصل الثاني';
    const periodLabel = currentPeriod === 1 ? 'الفترة الأولى' : 'الفترة الثانية';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 font-['Noto_Sans_Arabic',sans-serif] relative overflow-hidden">
            {/* الخلفية نفسها لضمان التناسق */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-black z-0"></div>
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse z-0"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse delay-1000 z-0"></div>

            {/* البطاقة الزجاجية */}
            <div className="relative z-10 flex flex-col items-center justify-center p-10 bg-gray-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 max-w-sm w-full transform transition-all">
                
                {/* الأيقونة */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                    <FaSyncAlt className="text-6xl text-blue-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">جاري جلب البيانات</h2>
                <p className="text-gray-400 text-sm font-medium mb-6 text-center leading-relaxed">
                    يتم تحميل سجل درجات<br/>
                    <span className="text-blue-400 font-bold">{semesterLabel}</span> - <span className="text-purple-400 font-bold">{periodLabel}</span>
                </p>
                
                {/* شريط التقدم */}
                <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-500 via-purple-500 to-blue-500 w-[200%] animate-[shimmer_2s_linear_infinite] rounded-full"></div>
                </div>
            </div>
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
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right text-gray-100 flex justify-center items-start" dir="rtl">
      
      {/* الحاوية الرئيسية بنفس تصميم النافذة المنبثقة */}
      <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl border border-gray-600 flex flex-col animate-fadeIn overflow-hidden">
        
        {/* === Header === */}
        <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-gray-700 bg-gray-900 rounded-t-2xl gap-4">
            {/* معلومات الصفحة والمدرسة */}
            <div className="text-center md:text-right flex-grow">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
                    سجل متابعة مادة القرآن الكريم والدراسات الإسلامية
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-gray-400 justify-center md:justify-start items-center">
                    {schoolName && <span>{schoolName}</span>}
                    {schoolName && teacherName && <span className="hidden md:inline">|</span>}
                    {teacherName && <span>المعلم: {teacherName}</span>}
                </div>
                <div className="mt-2 text-yellow-500 font-medium">
                     {selectedSemester === 'semester1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'} - {currentPeriod === 1 ? 'الفترة الأولى' : 'الثانية'}
                </div>
            </div>

            {/* أزرار التحكم */}
            <button
                  onClick={handleBackToMenu}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl border border-gray-600 transition-all shadow-md flex items-center gap-2 text-sm font-bold whitespace-nowrap"
            >
                  <FaHistory className="text-blue-300"/> تغيير الفصل/الفترة
            </button>
        </div>

        {/* === Body === */}
        <div className="p-6 overflow-y-auto space-y-6">

            {/* 1. قسم معلومات الطالب */}
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 border-b border-gray-700 pb-6">
                <div className="text-center md:text-right">
                    <h3 className="text-3xl font-bold text-white mb-1">{studentData.name}</h3>
                    <p className="text-gray-400">السجل المدني: {studentData.nationalId}</p>
                    <p className="text-gray-400">الصف: {gradeName} / {sectionName}</p>
                    {studentData.parentPhone && <p className="text-gray-400">ولي الأمر: {studentData.parentPhone}</p>}
                </div>
                <img 
                    src={studentData.photo || '/images/1.webp'} 
                    alt="صورة الطالب" 
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-blue-500 object-cover shadow-lg" 
                />
            </div>

            {/* 2. تنبيهات المكافآت */}
            {lastRequest && lastRequest.status !== 'fulfilled' && (
              <div className={`p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 ${
                  lastRequest.status === 'pending' ? 'bg-yellow-900/40 text-yellow-100 border border-yellow-700' :
                  lastRequest.status === 'rejected' ? 'bg-red-900/40 text-red-100 border border-red-700' : 'bg-green-900/40 text-green-100 border border-green-700'
              }`}>
                  <div className="text-center md:text-right">
                      <h4 className="font-bold text-lg mb-1 flex items-center justify-center md:justify-start gap-2">
                          <FaGift /> حالة طلب المكافأة
                      </h4>
                      <p className="text-sm">
                          {lastRequest.status === 'pending' && <><FaExclamationCircle className="inline ml-1"/> لديك طلب مكافأة معلق: {lastRequest.prizes?.name} ({lastRequest.prize_cost} نجوم).</>}
                          {lastRequest.status === 'rejected' && <><FaExclamationCircle className="inline ml-1"/> تم رفض طلب {lastRequest.prizes?.name}.</>}
                          {lastRequest.status === 'approved' && <><FaCheckCircle className="inline ml-1"/> تمت الموافقة على {lastRequest.prizes?.name}.</>}
                      </p>
                  </div>
                  
                  {showClearButton && (
                      <button
                          onClick={() => clearRewardRequest(lastRequest.id)}
                          className={`px-4 py-2 text-sm rounded-lg font-bold transition-colors shadow-md ${
                              lastRequest.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                      >
                          <FaTimes className="inline ml-1" /> إخفاء
                      </button>
                  )}
              </div>
            )}

            {/* 3. بطاقات الملخص (نفس تصميم Popup) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total */}
                <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
                    <div>
                        <h4 className="text-gray-300 text-sm font-bold mb-1">المجموع النهائي</h4>
                        <span className="text-3xl font-bold text-green-400 font-mono">
                            {calculateFinalTotalScore(studentData.grades)} <span className="text-lg text-gray-400">/ 100</span>
                        </span>
                    </div>
                    <FaAward className="text-4xl text-green-500/20" />
                </div>

                {/* Coursework */}
                <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
                    <div>
                        <h4 className="text-gray-300 text-xs font-bold mb-1 leading-relaxed">المهام الأدائية والمشاركة والتفاعل الصفي و الواجبات</h4>
                        <span className="text-3xl font-bold text-yellow-400 font-mono">
                            {calculateCoursework(studentData.grades)} <span className="text-lg text-gray-400">/ 40</span>
                        </span>
                    </div>
                    <FaTasks className="text-4xl text-yellow-500/20" />
                </div>

                {/* Major Assessments */}
                <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
                    <div>
                        <h4 className="text-gray-300 text-sm font-bold mb-1">تقويمات شفهية وتحريرية</h4>
                        <span className="text-3xl font-bold text-blue-400 font-mono">
                            {calculateMajorAssessments(studentData.grades)} <span className="text-lg text-gray-400">/ 60</span>
                        </span>
                    </div>
                    <FaBookOpen className="text-4xl text-blue-500/20" />
                </div>
            </div>

            {/* 4. قسم النجوم (نفس تصميم Popup) */}
            <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 flex flex-col md:flex-row justify-around items-center gap-4">
                 {/* النجوم الحالية */}
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                       <FaStar className="text-yellow-400 text-2xl" />
                       <span className="font-bold text-white">الحالية ({studentData.stars || 0})</span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-center">
                       {[...Array(10)].map((_, i) => (
                          <FaStar key={i} className={`text-sm ${i < (studentData.stars || 0) ? 'text-yellow-400' : 'text-gray-600'}`} />
                       ))}
                    </div>
                 </div>
                 {/* النجوم المكتسبة */}
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                       <FaCoins className="text-green-400 text-2xl" />
                       <span className="font-bold text-white">المكتسبة ({studentData.acquiredStars || 0})</span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-center">
                       {[...Array(10)].map((_, i) => (
                          <FaStar key={i} className={`text-sm ${i < (studentData.acquiredStars || 0) ? 'text-green-400' : 'text-gray-600'}`} />
                       ))}
                    </div>
                 </div>
                 {/* النجوم المستهلكة */}
                 <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                       <FaRegStar className="text-red-400 text-2xl" />
                       <span className="font-bold text-white">المستهلكة ({studentData.consumedStars || 0})</span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-center">
                       {[...Array(10)].map((_, i) => (
                          <FaStar key={i} className={`text-sm ${i < (studentData.consumedStars || 0) ? 'text-red-400' : 'text-gray-600'}`} />
                       ))}
                    </div>
                 </div>
            </div>

            {/* 5. الإعلانات وآخر الملاحظات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-gray-500/50 transition-colors">
                     <h4 className="font-bold text-xl flex items-center gap-2 text-white mb-4 border-b border-gray-600 pb-2">
                        <FaCommentDots className="text-yellow-400" /> إعلانات هامة
                     </h4>
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {announcements.length > 0 ? (
                          announcements.map((ann, index) => (
                            <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-sm">
                              <p className="text-sm text-gray-300 font-medium">{ann.content}</p>
                              <p className="text-xs text-gray-500 mt-1 text-left" dir="ltr">
                                {new Date(ann.created_at).toLocaleDateString('ar-SA')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4 italic">لا توجد إعلانات حاليًا.</p>
                        )}
                      </div>
                </div>

                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-gray-500/50 transition-colors">
                    <h4 className="font-bold text-xl flex items-center gap-2 text-white mb-4 border-b border-gray-600 pb-2">
                        <FaCheckCircle className="text-green-400" /> آخر الملاحظات
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {processedNotes.length > 0 ? (
                          processedNotes.map((item, index) => (
                            <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-sm">
                              <p className="text-sm text-gray-300">
                                <span className="font-bold text-yellow-500 ml-2">الأسبوع {item.weekIndex + 1}:</span>
                                {item.note}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4 italic">لا توجد ملاحظات حديثة.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 6. شبكة الدرجات التفصيلية (تصميم Popup) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* الاختبارات */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-red-500/30 transition-colors">
                  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                      <h4 className="flex items-center gap-2 font-bold text-red-400 text-lg">
                        <FaBookOpen /> الاختبارات 
                      </h4>
                      <div className="flex items-center gap-2">
                         {taskStatusUtils(studentData, homeworkCurriculum, 'test').icon}
                         <span className="text-sm text-gray-400">({taskStatusUtils(studentData, homeworkCurriculum, 'test').text})</span>
                         <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300 border border-gray-600">
                            {calculateCategoryScore(studentData.grades, 'tests', 'sum')} / 40
                         </span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                    {studentData.grades.tests.slice(0, 2).map((grade, i) => (
                      <div key={i} className="flex-1 p-3 bg-gray-800 rounded-lg text-center text-xl font-bold border border-gray-600 shadow-inner text-gray-300">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* التفاعل الصفي */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-yellow-500/30 transition-colors">
                  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                      <h4 className="flex items-center gap-2 font-bold text-yellow-400 text-lg">
                        <FaMicrophone /> التفاعل الصفي
                      </h4>
                      <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300 border border-gray-600">
                         {calculateCategoryScore(studentData.grades, 'classInteraction', 'best')} / 10
                      </span>
                  </div>
                  <div className="flex gap-3">
                    {studentData.grades.classInteraction.slice(0, 4).map((grade, i) => (
                      <div key={i} className="flex-1 p-3 bg-gray-800 rounded-lg text-center text-xl font-bold border border-gray-600 shadow-inner text-gray-300">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* الواجبات */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-green-500/30 transition-colors">
                  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                       <h4 className="flex items-center gap-2 font-bold text-green-400 text-lg">
                        <FaTasks /> الواجبات
                       </h4>
                       <div className="flex items-center gap-2">
                         {taskStatusUtils(studentData, homeworkCurriculum, 'homework').icon}
                         <span className="text-sm text-gray-400">({taskStatusUtils(studentData, homeworkCurriculum, 'homework').text})</span>
                         <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300 border border-gray-600">
                            {calculateCategoryScore(studentData.grades, 'homework', 'sum')} / 10
                         </span>
                       </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {studentData.grades.homework.slice(0, 10).map((grade, i) => (
                      <div key={i} className="p-2 rounded-lg text-center font-bold border shadow-inner bg-gray-800 border-gray-600 text-gray-300">
                        {grade !== null ? grade : '-'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* المهام الأدائية */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-purple-500/30 transition-colors">
                  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                      <h4 className="flex items-center gap-2 font-bold text-purple-400 text-lg">
                        <FaPencilAlt /> المهام الأدائية
                      </h4>
                      <div className="flex items-center gap-2">
                         {taskStatusUtils(studentData, homeworkCurriculum, 'performanceTask').icon}
                         <span className="text-sm text-gray-400">({taskStatusUtils(studentData, homeworkCurriculum, 'performanceTask').text})</span>
                         <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300 border border-gray-600">
                            {calculateCategoryScore(studentData.grades, 'performanceTasks', 'best')} / 10
                         </span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                    {studentData.grades.performanceTasks.slice(0, 4).map((grade, i) => (
                      <div key={i} className="flex-1 p-3 bg-gray-800 rounded-lg text-center text-xl font-bold border border-gray-600 shadow-inner text-gray-300">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* المشاركة */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-cyan-500/30 transition-colors">
                  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                      <h4 className="flex items-center gap-2 font-bold text-cyan-400 text-lg">
                        <FaCommentDots /> المشاركة
                      </h4>
                      <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300 border border-gray-600">
                          {calculateCategoryScore(studentData.grades, 'participation', 'sum')} / 10
                      </span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {studentData.grades.participation.slice(0, 10).map((grade, i) => (
                      <div key={i} className="p-2 rounded-lg text-center font-bold border shadow-inner bg-gray-800 border-gray-600 text-gray-300">
                        {grade !== null ? grade : '-'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* القرآن الكريم */}
                <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 lg:col-span-1 hover:border-blue-500/30 transition-colors">
                    <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-4 text-lg border-b border-gray-600 pb-2">
                        <FaQuran /> القرآن الكريم
                    </h4>
                    
                    {/* التلاوة */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                 <h5 className="text-gray-300 text-sm">التلاوة</h5>
                                 <span className="text-xs text-gray-400">
                                    {getStatusInfo(studentData, 'recitation', curriculum).icon} 
                                    ({getStatusInfo(studentData, 'recitation', curriculum).text})
                                 </span>
                            </div>
                            <span className="text-blue-300 font-bold text-sm bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
                                {calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')} / 10
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {studentData.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                                <div key={i} className="w-full p-2 bg-gray-800 rounded-lg text-center font-bold border border-gray-600 shadow-inner text-gray-300">
                                    {grade !== null ? grade : '--'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* الحفظ */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                                 <h5 className="text-gray-300 text-sm">الحفظ</h5>
                                 <span className="text-xs text-gray-400">
                                    {getStatusInfo(studentData, 'memorization', curriculum).icon} 
                                    ({getStatusInfo(studentData, 'memorization', curriculum).text})
                                 </span>
                            </div>
                            <span className="text-blue-300 font-bold text-sm bg-gray-800 px-2 py-0.5 rounded border border-gray-600">
                                 {calculateCategoryScore(studentData.grades, 'quranMemorization', 'average')} / 10
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {studentData.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                                <div key={i} className="w-full p-2 bg-gray-800 rounded-lg text-center font-bold border border-gray-600 shadow-inner text-gray-300">
                                    {grade !== null ? grade : '--'}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. سجل الملاحظات الأسبوعية الكامل */}
            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600">
                <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                     <h4 className="flex items-center gap-2 font-bold text-gray-200 text-lg">
                        <FaStickyNote className="text-yellow-500" /> سجل الملاحظات الأسبوعية
                     </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto custom-scrollbar p-1">
                    {(studentData.grades.weeklyNotes || []).map((notes, wIndex) => {
                         if (!notes || notes.length === 0) return null;
                         return (
                            <div key={wIndex} className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow">
                                <h5 className="text-blue-300 font-bold text-sm mb-2 border-b border-gray-600 pb-1 text-center">الأسبوع {wIndex + 1}</h5>
                                <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                                    {notes.map((note, nIndex) => (
                                        <li key={nIndex} className="leading-relaxed">{note}</li>
                                    ))}
                                </ul>
                            </div>
                         );
                    })}
                    {(!studentData.grades.weeklyNotes || !studentData.grades.weeklyNotes.some(n => n && n.length > 0)) && (
                         <div className="col-span-full text-center text-gray-500 py-6 italic">
                             لا توجد ملاحظات مسجلة بالكامل.
                         </div>
                    )}
                </div>
            </div>

        </div>

        {/* === Footer === */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl z-10">
             <div className="flex items-center gap-2">
                <FaGift className="text-2xl text-purple-400" />
                <span className="text-gray-300 font-bold">برنامج المكافآت والتحفيز</span>
             </div>
             
             <button
                onClick={() => setIsPrizesModalOpen(true)}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
              >
                <FaGift /> استعراض وطلب المكافآت
             </button>
        </div>

      </div>
      
      {/* Modals */}
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
