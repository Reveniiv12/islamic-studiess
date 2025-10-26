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
  FaClock, 
} from "react-icons/fa";

import {
  calculateTotalScore,
  calculateCategoryScore,
  getStatusInfo,
  getGradeNameById,
  getSectionNameById,
  taskStatusUtils,
} from "../utils/gradeUtils";
import { getRecitationStatus } from "../utils/recitationUtils";
import PrizesModal from "../components/PrizesModal";

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

// تم التعديل:
const createEmptyGradesStructure = () => ({
    tests: Array(2).fill(null),
    homework: Array(10).fill(null),
    performanceTasks: Array(4).fill(null), // تم تعديل الحجم إلى 4
    participation: Array(10).fill(null),
    quranRecitation: Array(5).fill(null),
    quranMemorization: Array(5).fill(null),
    classInteraction: Array(4).fill(null), // تم تغيير oralTest إلى classInteraction
});


function StudentView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  // States for period functionality
  const [studentBaseData, setStudentBaseData] = useState(null); 
  const [studentDisplayedData, setStudentDisplayedData] = useState(null); 
  const [fullCurriculumData, setFullCurriculumData] = useState({ period1: [], period2: [] });
  const [fullHomeworkCurriculumData, setFullHomeworkCurriculumData] = useState({ period1: [], period2: [] });
  const [currentPeriod, setCurrentPeriod] = useState(null); // null triggers selection screen
  const [loadingInitial, setLoadingInitial] = useState(true); 
  const [isFetching, setIsFetching] = useState(false); 

  const [curriculum, setCurriculum] = useState([]); // Active period curriculum
  const [homeworkCurriculum, setHomeworkCurriculum] = useState([]); // Active period homework curriculum
  
  const [error, setError] = useState(null);
  const [testCalculationMethod, setTestCalculationMethod] = useState('average'); // يتم تجاهله حالياً للاختبارات (Sum)
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [prizes, setPrizes] = useState([]);
  const [isPrizesModalOpen, setIsPrizesModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  
  const gradeName = getGradeNameById(studentBaseData?.grade_level);
  const sectionName = getSectionNameById(studentBaseData?.section);

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

        const teacherId = student.teacher_id;
        const gradeId = student.grade_level;
        const sectionId = student.section;
        
        // Fetch settings (shared)
        const { data: settingsData } = await supabase
          .from('settings')
          .select('test_method, teacher_name, school_name, current_semester, current_period')
          .eq('id', 'general')
          .single();

        let initialPeriod = 1; // Default
        if (settingsData) {
          setTestCalculationMethod(settingsData.test_method || 'average');
          setTeacherName(settingsData.teacher_name || "");
          setSchoolName(settingsData.school_name || "");
          setCurrentSemester(settingsData.current_semester || "");
          // Get last selected period from teacher's settings
          initialPeriod = settingsData.current_period === 'period2' ? 2 : 1; 
        }

        // Fetch curriculum (Shared Data Structure Logic)
        const { data: curriculumData } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId)
            .single();

        let recitationCurriculum = { period1: [], period2: [] };
        let homeworkCurriculumData = { period1: [], period2: [] };

        if (curriculumData) {
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
        setFullCurriculumData(recitationCurriculum);
        setFullHomeworkCurriculumData(homeworkCurriculumData);
        
        // Fetch prizes (shared)
        if (teacherId) {
          const { data: prizesData } = await supabase
            .from('prizes')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('cost', { ascending: true });
            
          setPrizes(prizesData || []);
        }

        // --- Prepare Student Grades (Crucial for handling old/new schema) ---
        let grades = student.grades || {};
        let fullGrades;
        
        // Fix for notes: Extract weeklyNotes if exists at root, otherwise default
        let weeklyNotes = grades.weeklyNotes || (grades.weekly_notes) || Array(20).fill(null);

        // Logic for handling migration from old single-object structure
        if (!grades.period1 && !grades.period2 && Object.keys(grades).length > 0) {
            const { weeklyNotes: _, weekly_notes: __, ...oldGradesWithoutNotes } = grades; // Exclude notes

            // Ensure grades are correctly sized for the new schema and use old names as fallbacks
            const oldPeriod1 = {
                tests: ensureArraySize(oldGradesWithoutNotes.tests, 2),
                homework: ensureArraySize(oldGradesWithoutNotes.homework, 10),
                performanceTasks: ensureArraySize(oldGradesWithoutNotes.performanceTasks || oldGradesWithoutNotes.performance_tasks, 4), 
                participation: ensureArraySize(oldGradesWithoutNotes.participation, 10),
                quranRecitation: ensureArraySize(oldGradesWithoutNotes.quranRecitation || oldGradesWithoutNotes.quran_recitation, 5),
                quranMemorization: ensureArraySize(oldGradesWithoutNotes.quranMemorization || oldGradesWithoutNotes.quran_memorization, 5),
                classInteraction: ensureArraySize(oldGradesWithoutNotes.classInteraction || oldGradesWithoutNotes.oralTest || oldGradesWithoutNotes.oral_test, 4), 
            };

            fullGrades = {
                period1: oldPeriod1,
                period2: createEmptyGradesStructure(),
            };
        } else {
            // Logic for handling new period structure (already saved in DB)
            fullGrades = {
                period1: {
                    tests: ensureArraySize(grades.period1?.tests, 2),
                    homework: ensureArraySize(grades.period1?.homework, 10),
                    performanceTasks: ensureArraySize(grades.period1?.performanceTasks || grades.period1?.performance_tasks, 4),
                    participation: ensureArraySize(grades.period1?.participation, 10),
                    quranRecitation: ensureArraySize(grades.period1?.quranRecitation || grades.period1?.quran_recitation, 5),
                    quranMemorization: ensureArraySize(grades.period1?.quranMemorization || grades.period1?.quran_memorization, 5),
                    classInteraction: ensureArraySize(grades.period1?.classInteraction || grades.period1?.oralTest || grades.period1?.oral_test, 4),
                },
                period2: {
                    tests: ensureArraySize(grades.period2?.tests, 2),
                    homework: ensureArraySize(grades.period2?.homework, 10),
                    performanceTasks: ensureArraySize(grades.period2?.performanceTasks || grades.period2?.performance_tasks, 4),
                    participation: ensureArraySize(grades.period2?.participation, 10),
                    quranRecitation: ensureArraySize(grades.period2?.quranRecitation || grades.period2?.quran_recitation, 5),
                    quranMemorization: ensureArraySize(grades.period2?.quranMemorization || grades.period2?.quran_memorization, 5),
                    classInteraction: ensureArraySize(grades.period2?.classInteraction || grades.period2?.oralTest || grades.period2?.oral_test, 4),
                },
            };
        }
        
        // Store the raw student data including all period grades
        const baseData = {
          ...student,
          acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
          consumedStars: student.consumed_stars || 0, // <--- تم التصحيح هنا
          stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0),
          nationalId: student.national_id,
          parentPhone: student.parent_phone,
          fullGrades: { 
             period1: fullGrades.period1,
             period2: fullGrades.period2,
             weeklyNotes: weeklyNotes 
          }, 
        };

        setStudentBaseData(baseData);
        setCurrentPeriod(initialPeriod); // Automatically select the teacher's last active period
        setLoadingInitial(false);

      } catch (err) {
        console.error("Error fetching student base data:", err);
        setError("فشل في جلب بيانات الطالب الأساسية.");
        setLoadingInitial(false);
      }
    };

    fetchBaseData();
  }, [studentId]);

  // ----------------------------------------------------------------------
  // 2. Period Data Processing (Runs after period selection)
  // ----------------------------------------------------------------------
  const fetchPeriodData = async (period) => {
    if (!studentBaseData || !period) return;
    
    const periodName = `period${period}`;

    try {
      setIsFetching(true);
      
      const student = studentBaseData;
      const teacherId = student.teacher_id;
      const gradeId = student.grade_level;
      const sectionId = student.section;
      
      let visitId = null;
      const { data: { user } } = await supabase.auth.getUser();

      // New Logic: Log the visit only if the user is not the teacher
      if (!user || user.id !== teacherId) {
          // Check for previous incomplete visits and close them
          await supabase
              .from('page_visits')
              .update({ visit_end_time: new Date().toISOString() })
              .eq('student_id', studentId)
              .is('visit_end_time', null);
              
          // Insert a new visit log
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
      
      // Fetch announcements (Shared Logic)
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      setAnnouncements(announcementsData || []);
      
      // Extract period-specific grades from the fullGrades structure
      const fullGrades = student.fullGrades || {};
      const periodGrades = fullGrades[periodName] || {};
      
      // Set active curriculum based on period selection
      setCurriculum(fullCurriculumData[periodName] || []);
      setHomeworkCurriculum(fullHomeworkCurriculumData[periodName] || []);
      
      // تعيين الأحجام الصحيحة لضمان التناسق مع الواجهة الجديدة
      const processedStudentData = {
        ...student, // Includes all shared data (stars, phones, etc.)
        // Overwrite grades object with period-specific and shared notes
        grades: {
          tests: ensureArraySize(periodGrades?.tests, 2),
          // تم تغيير oralTest إلى classInteraction وحجمها 4
          classInteraction: ensureArraySize(periodGrades?.classInteraction, 4), 
          homework: ensureArraySize(periodGrades?.homework, 10),
          performanceTasks: ensureArraySize(periodGrades?.performanceTasks, 4), // الحجم الجديد 4
          participation: ensureArraySize(periodGrades?.participation, 10),
          quranRecitation: ensureArraySize(periodGrades?.quranRecitation, 5),
          quranMemorization: ensureArraySize(periodGrades?.quranMemorization, 5),
          // Notes are shared at the root level (fullGrades.weeklyNotes)
          weeklyNotes: ensureArraySize(fullGrades.weeklyNotes, 20), 
        },
        nationalId: student.national_id,
        parentPhone: student.parent_phone,
        acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
        consumedStars: student.consumed_stars || 0, // <--- تم التصحيح هنا
        stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0),
        grade_level: student.grade_level,
        section: student.section,
      };

      setStudentDisplayedData(processedStudentData);
      setIsFetching(false);

      // Cleanup function to log visit end time
      return () => {
        if (visitId) {
          supabase
            .from('page_visits')
            .update({ visit_end_time: new Date().toISOString() })
            .eq('id', visitId)
            .then(({ error }) => {
              if (error) console.error("Error updating visit end time:", error);
            });
        }
      };

    } catch (err) {
      console.error("Error fetching period data:", err);
      setError("فشل في جلب بيانات الفترة.");
      setIsFetching(false);
    }
  };
  
  // ----------------------------------------------------------------------
  // 3. Effects
  // ----------------------------------------------------------------------

  useEffect(() => {
    // Effect to fetch period-specific data when base data is loaded AND a period is selected
    if (studentBaseData && currentPeriod) {
      // Use a small delay to ensure the new state of curriculum data is available
      const timeoutId = setTimeout(() => {
          fetchPeriodData(currentPeriod);
      }, 50); 
      return () => clearTimeout(timeoutId);
    }
  }, [studentBaseData, currentPeriod, fullCurriculumData, fullHomeworkCurriculumData]); 
  
  // ----------------------------------------------------------------------
  // 4. Loading/Error States and Period Selection UI
  // ----------------------------------------------------------------------

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">{error}</p>
      </div>
    );
  }
  
  // Show base loading spinner while fetching initial data
  if (loadingInitial) {
      return <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">جاري تحميل بيانات الطالب الأساسية...</div>;
  }

  // Show the period selection screen if base data is loaded but period is not selected
  if (currentPeriod === null || currentPeriod === 0) {
    const studentName = studentBaseData?.name || "هذا الطالب";
    
    return (
        <div className="p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center justify-center" dir="rtl">
            <div className="bg-gray-800 p-6 md:p-10 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-auto">
                <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 text-center mb-6 border-b pb-3 border-gray-700">
                    <FaClock className="inline mb-1 ml-2"/> اختر الفترة الدراسية
                </h1>
                <p className="text-gray-400 text-center mb-8 text-md">
                    أنت تشاهد سجل الطالب **{studentName}**.
                    يرجى تحديد الفترة التي تريد عرض درجاتها وواجباتها.
                </p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button 
                        onClick={() => setCurrentPeriod(1)}
                        className="flex-1 flex flex-col items-center justify-center p-6 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors shadow-lg text-lg font-bold border-2 border-green-700 transform hover:scale-[1.02]"
                    >
                        <span className="text-xl">الفترة</span>
                        <span className="text-5xl font-extrabold">1</span>
                        <span className="text-lg">(الأولى)</span>
                    </button>
                    <button 
                        onClick={() => setCurrentPeriod(2)}
                        className="flex-1 flex flex-col items-center justify-center p-6 bg-yellow-600 text-white rounded-xl hover:bg-yellow-500 transition-colors shadow-lg text-lg font-bold border-2 border-yellow-700 transform hover:scale-[1.02]"
                    >
                        <span className="text-xl">الفترة</span>
                        <span className="text-5xl font-extrabold">2</span>
                        <span className="text-lg">(الثانية)</span>
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Fallback if displayed data is not yet set (e.g., waiting for fetchPeriodData)
  if (!studentDisplayedData || isFetching) {
      return (
        <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
            <FaSyncAlt className="animate-spin text-4xl mr-3"/> جاري تحميل بيانات الفترة {currentPeriod === 1 ? 'الأولى' : 'الثانية'}...
        </div>
      );
  }

  // Use studentDisplayedData for rendering everything below
  const studentData = studentDisplayedData;
  
  const allNotes = [];
  // Notes are expected to be in the displayed data as they are shared/base data (weeklyNotes)
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
  // 5. Main Content UI (Original layout with period integration)
  // ----------------------------------------------------------------------
  
  // دوال حساب المجاميع الفرعية (مكررة هنا للوصول السريع إلى studentData)
  
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
  
  // **الدالة النهائية للمجموع الكلي (مطابقة للصفحة الأم)**
  const calculateFinalTotalScore = (grades) => {
      // التقييمات الرئيسية (60)
      const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum')); // Max 40
      const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average')); // Max 10
      const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average')); // Max 10

      // أعمال السنة (40)
      const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum')); // Max 10
      const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum')); // Max 10
      const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best')); // Max 10
      const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best')); // Max 10

      // المجموع الكلي (100)
      const finalTotal = testsScore + recitationScore + memorizationScore + homeworkScore + participationScore + performanceScore + classInteractionScore;

      return finalTotal.toFixed(2);
  };

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
          {currentSemester && (
            <p className="text-sm md:text-md font-medium text-gray-400">
              الفصل الدراسي: {currentSemester}
            </p>
          )}
          
          {/* ******************************************************************** */}
          {/* تحسين زر تبديل الفترة */}
          {/* ******************************************************************** */}
          <div className="flex flex-col items-center justify-center mt-3 p-2 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3">
              <span className="text-md font-bold text-yellow-500 whitespace-nowrap">
                الفترة المعروضة: <span className="text-lg text-white">{currentPeriod === 1 ? 'الأولى' : 'الثانية'}</span>
              </span>
              <button
                onClick={() => setCurrentPeriod(currentPeriod === 1 ? 2 : 1)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-md"
                disabled={isFetching}
              >
                <FaSyncAlt className={isFetching ? "animate-spin" : ""}/> تبديل الفترة
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              ملاحظة: هذا الزر يسمح لك بتبديل عرض الدرجات بين فترتي التقييم (الأولى والثانية).
            </p>
          </div>
          {/* ******************************************************************** */}
          
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
            {/* Important Announcements Section */}
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
            
            {/* New: Latest Notes Section */}
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
            {/* 1. المجموع النهائي (100) */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                  {/* **التعديل هنا: استخدام دالة calculateFinalTotalScore الموحدة** */}
                  <span className="text-xl md:text-2xl font-bold text-green-500">
                    {calculateFinalTotalScore(studentData.grades)} / 100
                  </span>
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
                  <span className="text-xl md:text-2xl font-bold text-yellow-400">{calculateCoursework(studentData.grades)} / 40</span>
                </div>
                <FaTasks className="text-4xl text-yellow-400" />
              </div>
            </div>

            {/* 2. التقييمات الرئيسية (الاختبارات + القرآن) (60) */}
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">تقويمات شفهية وتحريرية </h4>
                  <span className="text-xl md:text-2xl font-bold text-blue-400">{calculateMajorAssessments(studentData.grades)} / 60</span>
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
                  {/* تم التعديل: استخدام المجموع الكلي 'sum' */}
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
                {/* تم التعديل: تغيير المسمى إلى التفاعل الصفي */}
                <FaMicrophone className="text-3xl text-yellow-400" /> التفاعل الصفي
                <span className="text-yellow-400 font-bold text-2xl">
                  {/* تم التعديل: أفضل درجة 'best' ومن 10 */}
                  {calculateCategoryScore(studentData.grades, 'classInteraction', 'best')} / 10
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {/* تم التعديل: استخدام classInteraction وعدد المربعات 4 */}
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
                {/* تم التعديل: عدد المربعات 4 */}
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
                  {/* تم التعديل: التلاوة (Average) + الحفظ (Average) */}
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
                    {/* تم التعديل: أصبح Average ومن 10 */}
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
                  <FaGift /> عرض المكافآت
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
      {isPrizesModalOpen && <PrizesModal prizes={prizes} onClose={() => setIsPrizesModalOpen(false)} />}
    </div>
  );
}

export default StudentView;
