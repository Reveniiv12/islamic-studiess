// src/pages/StudentView.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { gradesData } from "../data/mockData";

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

function StudentView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [homeworkCurriculum, setHomeworkCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testCalculationMethod, setTestCalculationMethod] = useState('average');
  const [teacherName, setTeacherName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [prizes, setPrizes] = useState([]);
  const [isPrizesModalOpen, setIsPrizesModalOpen] = useState(false);
  
  const [announcements, setAnnouncements] = useState([]);
  
  const gradeName = getGradeNameById(studentData?.grade_level);
  const sectionName = getSectionNameById(studentData?.section);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) {
        setError("معرف الطالب مفقود.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*, teacher_id')
          .eq('id', studentId)
          .single();

        if (studentError) {
          throw studentError;
        }

        const teacherId = student.teacher_id;
        const { data: { user } } = await supabase.auth.getUser();

        // New Logic: Log the visit only if the user is not the teacher
        let visitId = null;
        if (!user || user.id !== teacherId) {
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

        const { data: curriculumData, error: curriculumError } = await supabase
          .from('curriculum')
          .select('*')
          .eq('grade_id', student.grade_level)
          .eq('section_id', student.section)
          .eq('teacher_id', teacherId)
          .single();

        if (curriculumError) {
          console.warn("Warning: Could not fetch curriculum data.", curriculumError);
          if (curriculumError.code !== 'PGRST205' && curriculumError.code !== 'PGRST116') {
            throw curriculumError;
          }
        }

        if (curriculumData) {
          setCurriculum(curriculumData.recitation || []);
          setHomeworkCurriculum(curriculumData.homework || []);
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('test_method, teacher_name, school_name, current_semester')
          .eq('id', 'general')
          .single();

        if (settingsError) {
            console.error("Error fetching settings:", settingsError);
        }

        if (settingsData) {
          setTestCalculationMethod(settingsData.test_method || 'average');
          setTeacherName(settingsData.teacher_name || "");
          setSchoolName(settingsData.school_name || "");
          setCurrentSemester(settingsData.current_semester || "");
        }
        
        if (teacherId) {
          const { data: prizesData, error: prizesError } = await supabase
            .from('prizes')
            .select('*')
            .eq('teacher_id', teacherId)
            .order('cost', { ascending: true });
            
          if (prizesError) {
            console.error("Error fetching prizes:", prizesError);
          } else {
            setPrizes(prizesData);
          }
        }

        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .eq('grade_id', student.grade_level)
          .eq('section_id', student.section)
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false });

        if (announcementsError) {
          console.error("Error fetching announcements:", announcementsError);
        } else {
          setAnnouncements(announcementsData || []);
        }

        const processedStudentData = {
          ...student,
          grades: {
            tests: student.grades?.tests || [],
            oralTest: student.grades?.oral_test || [],
            homework: student.grades?.homework || [],
            performanceTasks: student.grades?.performance_tasks || [],
            participation: student.grades?.participation || [],
            quranRecitation: student.grades?.quran_recitation || [],
            quranMemorization: student.grades?.quran_memorization || [],
            weeklyNotes: student.grades?.weekly_notes || [],
          },
          nationalId: student.national_id,
          parentPhone: student.parent_phone,
          acquiredStars: student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0,
          consumedStars: student.consumed_stars || 0,
          stars: (student.acquired_stars !== undefined ? student.acquired_stars : student.stars || 0) - (student.consumed_stars || 0),
          grade_level: student.grade_level,
          section: student.section,
        };

        setStudentData(processedStudentData);
        setLoading(false);

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
        console.error("Error fetching student data:", err);
        setError("فشل في جلب بيانات الطالب.");
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">جاري تحميل بيانات الطالب...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">{error}</p>
      </div>
    );
  }
  
  const allNotes = [];
  (studentData.grades.weeklyNotes || []).forEach((notes, weekIndex) => {
    if (notes && notes.length > 0) {
      notes.forEach(note => {
        allNotes.push({ note, weekIndex });
      });
    }
  });

  const processedNotes = allNotes.reverse().slice(0, 5);
  
  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen font-['Noto_Sans_Arabic',sans-serif] text-right text-gray-100" dir="rtl">
      {/* الشريط العلوي الجديد */}
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
                <FaStickyNote className="text-3xl text-yellow-400" /> آخر الملاحظات
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


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-100">المجموع النهائي</h4>
                  <span className="text-xl md:text-2xl font-bold text-green-500">
                    {calculateTotalScore(studentData.grades, testCalculationMethod)} / 60
                  </span>
                </div>
                <FaAward className="text-4xl text-green-400" />
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
                  {calculateCategoryScore(studentData.grades, 'tests', testCalculationMethod)} / 15
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
                  <div key={i} className="w-16 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-100 text-xl">
                <FaMicrophone className="text-3xl text-yellow-400" /> الاختبار الشفوي
                <span className="text-yellow-400 font-bold text-2xl">
                  {calculateCategoryScore(studentData.grades, 'oralTest', 'best')} / 5
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.oralTest.slice(0, 5).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-600 rounded-lg text-center bg-gray-800 text-gray-300">
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
                  {calculateCategoryScore(studentData.grades, 'performanceTasks', 'best')} / 5
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
                {studentData.grades.performanceTasks.slice(0, 3).map((grade, i) => (
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
                  {(parseFloat(calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')) +
                    parseFloat(calculateCategoryScore(studentData.grades, 'quranMemorization', 'average'))).toFixed(2)} / 15
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
                    <span className="text-blue-400 font-bold text-xl">{calculateCategoryScore(studentData.grades, 'quranMemorization', 'average')} / 5</span>
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
