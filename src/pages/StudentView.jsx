// src/pages/StudentView.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaQuran,
  FaStar,
  FaTasks,
  FaPencilAlt,
  FaBookOpen,
  FaStickyNote,
  FaUserCircle,
} from "react-icons/fa";
import {
  calculateTotalScore,
  calculateCategoryScore,
  getStatusInfo,
  getStatusColor,
} from "../utils/gradeUtils";

const StarRating = ({ count }) => {
  return (
    <div className="flex gap-1 text-yellow-400">
      {Array.from({ length: 10 }).map((_, index) => (
        <FaStar key={index} className={index < count ? 'text-yellow-400' : 'text-gray-600'} />
      ))}
    </div>
  );
};

function StudentView() {
  const { gradeId, sectionId, studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testCalculationMethod, setTestCalculationMethod] = useState('average');
  const [curriculum, setCurriculum] = useState([]);

  useEffect(() => {
    if (!studentId || !gradeId || !sectionId) {
      setError("معرّف الطالب أو الصف أو الفصل مفقود.");
      setLoading(false);
      return;
    }

    const docRef = doc(db, `grades/${gradeId}/classes/${sectionId}/students`, studentId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setStudentData({ id: docSnap.id, ...docSnap.data() });
        setError(null);
      } else {
        setError("لم يتم العثور على الطالب.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching student data: ", err);
      setError("فشل في جلب بيانات الطالب.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gradeId, sectionId, studentId]);

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

  if (!studentData) {
    return (
      <div className="p-8 text-center text-gray-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">لا توجد بيانات متاحة لهذا الطالب.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-['Noto_Sans_Arabic',sans-serif] text-right" dir="rtl">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-200">
            <div className="flex-shrink-0">
              <img src={studentData.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow-lg" />
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-600 mb-1">{studentData.name}</h1>
              <p className="text-gray-600">السجل المدني: {studentData.nationalId}</p>
              {studentData.parentPhone && (
                <p className="text-gray-600">رقم ولي الأمر: {studentData.parentPhone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-blue-50 p-5 rounded-xl shadow-md border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-800">المجموع النهائي</h4>
                  <span className="text-xl md:text-2xl font-bold text-blue-600">
                    {calculateTotalScore(studentData.grades, testCalculationMethod)} / 60
                  </span>
                </div>
                <FaAward className="text-4xl text-blue-400" />
              </div>
            </div>

            <div className="bg-yellow-50 p-5 rounded-xl shadow-md border border-yellow-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <h4 className="font-semibold text-gray-800">النجوم المكتسبة</h4>
                  <StarRating count={studentData.stars || 0} />
                </div>
                <FaStar className="text-4xl text-yellow-400" />
              </div>
            </div>

            <div className="bg-green-50 p-5 rounded-xl shadow-md border border-green-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 text-lg">
                <FaPencilAlt className="text-2xl text-green-500" /> الاختبارات (15)
                <span className="text-green-600 font-bold text-xl">
                  {calculateCategoryScore(studentData.grades, 'tests', testCalculationMethod)} / 15
                </span>
              </h4>
              <div className="flex gap-2">
                {studentData.grades.tests.slice(0, 2).map((grade, i) => (
                  <div key={i} className="w-16 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-purple-50 p-5 rounded-xl shadow-md border border-purple-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 text-lg">
                <FaMicrophone className="text-2xl text-purple-500" /> الاختبار الشفوي (5)
                <span className="text-purple-600 font-bold text-xl">
                  {calculateCategoryScore(studentData.grades, 'oralTest', 'best')} / 5
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.oralTest.slice(0, 5).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-pink-50 p-5 rounded-xl shadow-md border border-pink-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 text-lg">
                <FaTasks className="text-2xl text-pink-500" /> الواجبات (10)
                <span className="text-pink-600 font-bold text-xl">
                  {calculateCategoryScore(studentData.grades, 'homework', 'sum')} / 10
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.homework.slice(0, 10).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-rose-50 p-5 rounded-xl shadow-md border border-rose-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 text-lg">
                <FaBookOpen className="text-2xl text-rose-500" /> مهام أدائية (5)
                <span className="text-rose-600 font-bold text-xl">
                  {calculateCategoryScore(studentData.grades, 'performanceTasks', 'best')} / 5
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.performanceTasks.slice(0, 5).map((grade, i) => (
                  <div key={i} className="w-16 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-cyan-50 p-5 rounded-xl shadow-md border border-cyan-200">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 text-lg">
                <FaCommentDots className="text-2xl text-cyan-500" /> المشاركة (10)
                <span className="text-cyan-600 font-bold text-xl">
                  {calculateCategoryScore(studentData.grades, 'participation', 'sum')} / 10
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {studentData.grades.participation.slice(0, 10).map((grade, i) => (
                  <div key={i} className="w-10 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                    {grade !== null ? grade : '--'}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full bg-indigo-50 p-5 rounded-xl shadow-md border border-indigo-200">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 text-lg">
                <FaQuran className="text-2xl text-indigo-500" /> القرآن الكريم
                <span className="text-indigo-600 font-bold text-xl">
                  {(parseFloat(calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')) + 
                   parseFloat(calculateCategoryScore(studentData.grades, 'quranMemorization', 'average'))).toFixed(2)} / 15
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-800">تلاوة القرآن (10)</h5>
                    {getStatusInfo(studentData, 'recitation', curriculum).icon}
                    <span className="text-sm text-gray-600">
                      ({getStatusInfo(studentData, 'recitation', curriculum).text})
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {calculateCategoryScore(studentData.grades, 'quranRecitation', 'average')} / 10
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                      <div key={i} className="w-12 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-medium text-gray-800">حفظ القرآن (5)</h5>
                    {getStatusInfo(studentData, 'memorization', curriculum).icon}
                    <span className="text-sm text-gray-600">
                      ({getStatusInfo(studentData, 'memorization', curriculum).text})
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {calculateCategoryScore(studentData.grades, 'quranMemorization', 'average')} / 5
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {studentData.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                      <div key={i} className="w-12 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-700">
                        {grade !== null ? grade : '--'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-full bg-yellow-50 p-5 rounded-xl shadow-md border border-yellow-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                  <FaStickyNote className="text-xl text-yellow-500" /> الملاحظات الأسبوعية
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
                {(studentData.grades.weeklyNotes || []).map((notes, weekIndex) => (
                  <div key={weekIndex} className="bg-white p-3 rounded-lg border border-gray-300 min-h-[120px]">
                    <h5 className="font-bold text-gray-700 mb-1 text-center">الأسبوع {weekIndex + 1}</h5>
                    <div className="h-px bg-gray-300 mb-2"></div>
                    {notes && notes.length > 0 ? (
                      <ul className="list-disc pr-4 text-gray-600 text-sm space-y-1">
                        {notes.map((note, noteIndex) => (
                          <li key={noteIndex} className="pb-1">
                            {note}
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
    </div>
  );
}


export default StudentView;
