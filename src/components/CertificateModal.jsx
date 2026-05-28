import React, { useRef, useState, useCallback, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import {
  FaPrint,
  FaTimes,
  FaAward,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaCalendarAlt,
  FaSchool,
  FaUserTie,
  FaGraduationCap
} from "react-icons/fa";
import {
  calculateCategoryScore,
  getGradeNameById,
  getSectionNameById
} from "../utils/gradeUtils";

const ensureArraySize = (array, size) => {
  const newArray = Array(size).fill(null);
  const sourceArray = array && Array.isArray(array) ? array : [];
  for (let i = 0; i < Math.min(sourceArray.length, size); i++) {
    newArray[i] = sourceArray[i];
  }
  return newArray;
};

const createEmptyGradesStructure = () => ({
  tests: Array(2).fill(null),
  homework: Array(10).fill(null),
  performanceTasks: Array(4).fill(null),
  participation: Array(10).fill(null),
  quranRecitation: Array(5).fill(null),
  quranMemorization: Array(5).fill(null),
  classInteraction: Array(4).fill(null),
});

const getPeriodGrades = (rawGrades, semester, periodName) => {
  let semesterGrades = rawGrades?.[semester];
  if (!semesterGrades && semester === 'semester1') {
    semesterGrades = rawGrades || {};
  }
  if (!semesterGrades) {
    semesterGrades = {};
  }
  const periodGrades = semesterGrades[periodName] || {};

  return {
    tests: ensureArraySize(periodGrades?.tests, 2),
    classInteraction: ensureArraySize(periodGrades?.classInteraction || periodGrades?.oralTest || periodGrades?.oral_test, 4),
    homework: ensureArraySize(periodGrades?.homework, 10),
    performanceTasks: ensureArraySize(periodGrades?.performanceTasks || periodGrades?.performance_tasks, 4),
    participation: ensureArraySize(periodGrades?.participation, 10),
    quranRecitation: ensureArraySize(periodGrades?.quranRecitation || periodGrades?.quran_recitation, 5),
    quranMemorization: ensureArraySize(periodGrades?.quranMemorization || periodGrades?.quran_memorization, 5),
  };
};

const hasRecordedGrades = (pGrades1, pGrades2) => {
  const checkPeriod = (p) => {
    if (!p) return false;
    return Object.values(p).some(categoryArray =>
      Array.isArray(categoryArray) && categoryArray.some(val => val !== null && val !== '' && val !== 0)
    );
  };
  return checkPeriod(pGrades1) || checkPeriod(pGrades2);
};

export default function CertificateModal({ student, teacherName, schoolName, principalName: propPrincipalName, onClose }) {
  const certificateRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(true);

  // Auto pre-render certificate as high-definition image on mount
  useEffect(() => {
    // Wait a brief moment to ensure fonts, icons, and Moe logo are fully loaded in the DOM
    const timer = setTimeout(() => {
      if (!certificateRef.current) return;
      
      htmlToImage.toPng(certificateRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          background: '#ffffff',
          transform: 'scale(1)',
        }
      })
        .then((dataUrl) => {
          setImageUrl(dataUrl);
          setGeneratingImage(false);
        })
        .catch((err) => {
          console.error("Failed to pre-render certificate image", err);
          setGeneratingImage(false);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [student]);

  const principalName = propPrincipalName || localStorage.getItem('principalName') || '';

  const rawGrades = student?.fullGradesStructure || student?.grades || student?.rawGrades || {};

  // Extract period structures safely
  const s1p1 = getPeriodGrades(rawGrades, 'semester1', 'period1');
  const s1p2 = getPeriodGrades(rawGrades, 'semester1', 'period2');
  const s2p1 = getPeriodGrades(rawGrades, 'semester2', 'period1');
  const s2p2 = getPeriodGrades(rawGrades, 'semester2', 'period2');

  // Check which semesters actually have active grades
  const s1Active = hasRecordedGrades(s1p1, s1p2);
  const s2Active = hasRecordedGrades(s2p1, s2p2);

  // Compute category scores for each semester period
  const getPeriodScores = (pGrades) => {
    const tests = parseFloat(calculateCategoryScore(pGrades, 'tests', 'sum')) || 0;
    const recitation = parseFloat(calculateCategoryScore(pGrades, 'quranRecitation', 'average')) || 0;
    const memorization = parseFloat(calculateCategoryScore(pGrades, 'quranMemorization', 'average')) || 0;
    const homework = parseFloat(calculateCategoryScore(pGrades, 'homework', 'sum')) || 0;
    const participation = parseFloat(calculateCategoryScore(pGrades, 'participation', 'sum')) || 0;
    const performance = parseFloat(calculateCategoryScore(pGrades, 'performanceTasks', 'best')) || 0;
    const interaction = parseFloat(calculateCategoryScore(pGrades, 'classInteraction', 'best')) || 0;
    const total = tests + recitation + memorization + homework + participation + performance + interaction;

    return { tests, recitation, memorization, homework, participation, performance, interaction, total };
  };

  const s1p1Scores = getPeriodScores(s1p1);
  const s1p2Scores = getPeriodScores(s1p2);
  const s2p1Scores = getPeriodScores(s2p1);
  const s2p2Scores = getPeriodScores(s2p2);

  // Semester Averages
  const s1Average = s1Active ? parseFloat(((s1p1Scores.total + s1p2Scores.total) / 2).toFixed(2)) : 0;
  const s2Average = s2Active ? parseFloat(((s2p1Scores.total + s2p2Scores.total) / 2).toFixed(2)) : 0;

  // Year Average
  let yearAverage = 0;
  if (s1Active && s2Active) {
    yearAverage = parseFloat(((s1Average + s2Average) / 2).toFixed(2));
  } else if (s1Active) {
    yearAverage = s1Average;
  }

  // Determine Status
  const getStatusText = (active, score) => {
    if (!active) return "تحت الرصد";
    return score >= 50 ? "ناجح" : "راسب";
  };

  const getStatusColor = (status) => {
    if (status === "ناجح") return "text-green-800 bg-green-100 border-green-400 font-extrabold shadow-sm";
    if (status === "راسب") return "text-red-800 bg-red-100 border-red-400 font-extrabold shadow-sm";
    return "text-amber-800 bg-amber-100 border-amber-400 font-extrabold shadow-sm";
  };

  const s1Status = getStatusText(s1Active, s1Average);
  const s2Status = getStatusText(s2Active, s2Average);
  const finalStatus = s1Active ? getStatusText(true, yearAverage) : "تحت الرصد";

  const getFailedSemestersDetails = () => {
    const failedList = [];
    if (s1Active && s1Average < 50) failedList.push("الأول");
    if (s2Active && s2Average < 50) failedList.push("الثاني");
    
    if (failedList.length === 2) {
      return {
        semesters: "الفصلين الدراسيين الأول والثاني",
        pronoun: "فيهما",
        pronoun2: "لهما"
      };
    } else if (failedList.length === 1) {
      const semText = failedList[0] === "الأول" ? "الفصل الدراسي الأول" : "الفصل الدراسي الثاني";
      return {
        semesters: semText,
        pronoun: "فيه",
        pronoun2: "له"
      };
    }
    return {
      semesters: "الفصل الدراسي",
      pronoun: "فيه",
      pronoun2: "له"
    };
  };

  const failedSemInfo = getFailedSemestersDetails();

  const gradeName = getGradeNameById(student?.grade_level || student?.grade);
  const sectionName = getSectionNameById(student?.section);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `إشعار_نتيجة_${student?.name || "طالب"}.png`;
    link.href = imageUrl;
    link.click();
  }, [imageUrl, student]);

  // Categories list for drawing detailed rows
  const categories = [
    { name: "الاختبارات التحريرية", max: 40, key: "tests" },
    { name: "الواجبات", max: 10, key: "homework" },
    { name: "المشاركة الصفية", max: 10, key: "participation" },
    { name: "المهام الأدائية", max: 10, key: "performance" },
    { name: "التفاعل والنشاط الصفي", max: 10, key: "interaction" },
    { name: "تلاوة القرآن الكريم", max: 10, key: "recitation" },
    { name: "حفظ القرآن الكريم", max: 10, key: "memorization" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-['Noto_Sans_Arabic',sans-serif]">
      
      {/* Print Stylesheet injection for beautiful physical A4 prints */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: 100% !important;
            width: 100% !important;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          #print-image-container, #print-image-container * {
            visibility: visible !important;
          }
          #print-image-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          .print-fit-image {
            max-width: 95% !important;
            max-height: 95% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
          }
          .no-print, #print-area, .offscreen-container {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}} />

      <div className="w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] animate-fadeIn text-right overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700 no-print">
          <div className="flex items-center gap-2">
            <FaAward className="text-yellow-500 text-xl" />
            <h3 className="text-lg font-bold text-white">الشهادة الأكاديمية وكشف الدرجات</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Modal Actions */}
        <div className="bg-gray-850 px-6 py-3 border-b border-gray-700 flex flex-wrap gap-3 justify-center sm:justify-start no-print">
          <button
            onClick={handlePrint}
            disabled={generatingImage || !imageUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-102 disabled:opacity-50 text-sm"
          >
            <FaPrint /> طباعة الشهادة (PDF)
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={generatingImage || !imageUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-102 disabled:opacity-50 text-sm"
          >
            <FaDownload /> تحميل الشهادة كصورة (PNG)
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-950 flex justify-center items-start">
          
          {/* Display beautiful responsive pre-rendered image */}
          {generatingImage ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 gap-4 no-print">
              <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-extrabold text-sm md:text-base animate-pulse">جاري تجهيز وثيقة النتيجة بصورة عالية الدقة...</p>
              <p className="text-xs text-gray-500">فضلاً انتظر لحظة واحدة...</p>
            </div>
          ) : imageUrl ? (
            <div className="w-full max-w-[800px] flex flex-col items-center no-print">
              <img 
                src={imageUrl} 
                alt="إشعار النتيجة" 
                className="w-full h-auto rounded-xl shadow-2xl border-4 border-yellow-600/40 animate-fadeIn" 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-red-400 gap-3 no-print">
              <span>⚠️ فشل في تحميل النسخة المصورة للشهادة.</span>
              <p className="text-xs text-gray-500">يمكنك استخدام خيار الطباعة مباشرة أو محاولة فتح النافذة مجدداً.</p>
            </div>
          )}

          {/* Hidden offscreen container for high-res rendering and vector printing */}
          <div className="absolute left-[-9999px] top-[-9999px] offscreen-container" style={{ pointerEvents: "none" }}>
            {/* Certificate Container */}
            <div 
              ref={certificateRef}
              id="print-area"
              className="bg-white text-gray-900 p-8 rounded-xl shadow-xl relative border-[12px] border-double border-yellow-600 print-border flex flex-col shrink-0"
              style={{ direction: "rtl", width: "800px", minWidth: "800px", minHeight: "1220px" }}
            >
            {/* Islamic Corner Decorations (Hidden on print or simplified) */}
            <div className="absolute top-2 right-2 w-16 h-16 border-t-2 border-r-2 border-yellow-600/30 rounded-tr-md no-print"></div>
            <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-yellow-600/30 rounded-tl-md no-print"></div>
            <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-yellow-600/30 rounded-br-md no-print"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 border-b-2 border-l-2 border-yellow-600/30 rounded-bl-md no-print"></div>

            {/* Inner Wrapper enclosing EVERYTHING to fix flex-zoom height bugs */}
            <div className="w-full flex flex-col justify-between flex-grow" style={{ minHeight: "1140px" }}>
              <div>
              {/* Official Header */}
              <div className="flex flex-row justify-between items-start border-b-2 border-yellow-500 pb-3 mb-4">
                <div className="text-right text-[11px] font-semibold text-gray-700 leading-relaxed">
                  <p className="font-bold text-gray-900 text-[12px]">المملكة العربية السعودية</p>
                  <p>وزارة التعليم</p>
                  {schoolName && <p>{schoolName}</p>}
                </div>
                
                {/* Logo and Academic Info */}
                <div className="text-center flex flex-col items-center">
                  <div className="h-16 w-28 flex items-center justify-center mb-2">
                    <img 
                      src="/images/moe_logo.png" 
                      alt="شعار وزارة التعليم" 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h2 className="text-lg font-extrabold text-yellow-700 tracking-wide">إشعار بنتيجة مادة القرآن الكريم والدراسات الإسلامية</h2>
                  <p className="text-[10px] text-gray-500 font-bold mt-1">العام الدراسي: 1447 هـ / 2026 م</p>
                </div>

                <div className="text-left text-[11px] font-semibold text-gray-700 leading-relaxed">
                  <p className="font-bold text-gray-900 text-[12px]">المادة</p>
                  <p>القرآن الكريم والدراسات الإسلامية</p>
                  {teacherName && <p>معلم المادة: {teacherName}</p>}
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-yellow-50/50 border border-yellow-200/60 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1"><FaGraduationCap className="text-yellow-600"/> اسم الطالب</span>
                  <span className="font-extrabold text-gray-900">{student?.name || "غير مسجل"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1"><FaUserTie className="text-yellow-600"/> السجل المدني</span>
                  <span className="font-extrabold text-gray-900 font-mono">{student?.nationalId || student?.national_id || "غير مسجل"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1"><FaSchool className="text-yellow-600"/> الصف الدراسي</span>
                  <span className="font-extrabold text-gray-900">{gradeName || "غير محدد"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-bold mb-1 flex items-center gap-1"><FaCalendarAlt className="text-yellow-600"/> الفصل</span>
                  <span className="font-extrabold text-gray-900">{sectionName || "غير محدد"}</span>
                </div>
              </div>

              {/* Grade Report Table */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-center border-collapse border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-yellow-600/10 text-gray-900 text-xs font-bold border-b border-gray-300">
                      <th rowSpan="2" className="p-3 border border-gray-300 text-right font-extrabold text-[13px] text-yellow-800">مجالات وعناصر التقييم</th>
                      <th rowSpan="2" className="p-3 border border-gray-300 font-extrabold text-gray-800">الدرجة العظمى</th>
                      <th colSpan="2" className="p-1 border border-gray-300 bg-blue-50/50 text-blue-900 font-extrabold">الفصل الدراسي الأول</th>
                      <th colSpan="2" className="p-1 border border-gray-300 bg-teal-50/50 text-teal-900 font-extrabold">الفصل الدراسي الثاني</th>
                    </tr>
                    <tr className="bg-gray-50 text-gray-700 text-[10px] font-bold border-b border-gray-300">
                      <th className="p-2 border border-gray-300 bg-blue-50/20 text-blue-800">الفترة الأولى</th>
                      <th className="p-2 border border-gray-300 bg-blue-50/20 text-blue-800">الفترة الثانية</th>
                      <th className="p-2 border border-gray-300 bg-teal-50/20 text-teal-800">الفترة الأولى</th>
                      <th className="p-2 border border-gray-300 bg-teal-50/20 text-teal-800">الفترة الثانية</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800 font-medium">
                    {categories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-yellow-50/30 transition-colors border-b border-gray-200">
                        <td className="p-2.5 border border-gray-300 text-right font-bold text-gray-900">{cat.name}</td>
                        <td className="p-2.5 border border-gray-300 font-bold bg-gray-50 text-gray-600">{cat.max}</td>
                        {/* Semester 1 */}
                        <td className="p-2.5 border border-gray-300 font-mono text-blue-900">{s1Active ? s1p1Scores[cat.key] : "-"}</td>
                        <td className="p-2.5 border border-gray-300 font-mono text-blue-900">{s1Active ? s1p2Scores[cat.key] : "-"}</td>
                        {/* Semester 2 */}
                        <td className="p-2.5 border border-gray-300 font-mono text-teal-900">{s2Active ? s2p1Scores[cat.key] : "-"}</td>
                        <td className="p-2.5 border border-gray-300 font-mono text-teal-900">{s2Active ? s2p2Scores[cat.key] : "-"}</td>
                      </tr>
                    ))}
                    {/* Sum/Total Row */}
                    <tr className="bg-yellow-50 font-extrabold border-t-2 border-yellow-500 text-[13px]">
                      <td className="p-3 border border-gray-300 text-right text-yellow-850">مجموع درجات الفترة (من 100)</td>
                      <td className="p-3 border border-gray-300 bg-yellow-100/70 text-yellow-900">100</td>
                      {/* Semester 1 Totals */}
                      <td className="p-3 border border-gray-300 font-mono text-blue-900">{s1Active ? s1p1Scores.total.toFixed(2) : "-"}</td>
                      <td className="p-3 border border-gray-300 font-mono text-blue-900">{s1Active ? s1p2Scores.total.toFixed(2) : "-"}</td>
                      {/* Semester 2 Totals */}
                      <td className="p-3 border border-gray-300 font-mono text-teal-900">{s2Active ? s2p1Scores.total.toFixed(2) : "-"}</td>
                      <td className="p-3 border border-gray-300 font-mono text-teal-900">{s2Active ? s2p2Scores.total.toFixed(2) : "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Semester Summaries & Results Section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Semester 1 Results */}
                <div className="border-2 border-yellow-300 bg-yellow-50/15 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-sm">
                  <h4 className="font-black text-base text-yellow-900 border-b-2 border-yellow-200 pb-2 flex items-center gap-2">
                    <span className="text-yellow-600">📌</span> <b>نتائج الفصل الدراسي الأول</b>
                  </h4>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-600">متوسط درجات الفصل:</span>
                    <span className="font-black text-blue-900 font-mono text-base">{s1Active ? `${s1Average} / 100` : "لم يُرصد"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-600">حالة النتيجة:</span>
                    <span className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs print-badge ${getStatusColor(s1Status)}`}>
                      {s1Status}
                    </span>
                  </div>
                </div>

                {/* Semester 2 Results */}
                <div className="border-2 border-yellow-300 bg-yellow-50/15 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-sm">
                  <h4 className="font-black text-base text-yellow-900 border-b-2 border-yellow-200 pb-2 flex items-center gap-2">
                    <span className="text-yellow-600">📌</span> <b>نتائج الفصل الدراسي الثاني</b>
                  </h4>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-600">متوسط درجات الفصل:</span>
                    <span className="font-black text-teal-900 font-mono text-base">{s2Active ? `${s2Average} / 100` : "تحت الرصد"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-600">حالة النتيجة:</span>
                    <span className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs print-badge ${getStatusColor(s2Status)}`}>
                      {s2Status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Annual Result Box */}
              <div className="border-2 border-yellow-600 bg-gradient-to-r from-yellow-50/60 to-yellow-100/40 rounded-2xl p-6 mb-4 shadow-md flex flex-col gap-3">
                {/* Title at the very top (full width) */}
                <h3 className="font-black text-yellow-900 text-base flex items-center gap-2 tracking-wide border-b border-yellow-200 pb-2">
                  🏆 <b>النتيجة النهائية لمادة القرآن الكريم والدراسات الإسلامية</b>
                </h3>

                {/* Content row (Warning box on right, two small boxes on left) */}
                <div className="flex flex-row items-center justify-between gap-6">
                  {/* Warning Box */}
                  <div className="text-right flex-grow">
                    <p className="text-xs text-gray-700 font-bold leading-relaxed">
                      {finalStatus === "راسب" ? (
                        <span className="text-red-650 font-black block bg-red-50 p-3 rounded-lg border-2 border-red-200 shadow-sm leading-relaxed">
                          ⚠️ تنبيه: لم يحقق الطالب درجة الاجتياز المطلوبة (50%) في {failedSemInfo.semesters}، لذا يتقرر دخوله اختبار الدور الثاني {failedSemInfo.pronoun} ولابد من الجد والاستعداد الجيد {failedSemInfo.pronoun2}.
                        </span>
                      ) : (
                        <span className="block bg-yellow-50/50 p-3 rounded-lg border border-yellow-200 shadow-sm">
                          يتم احتساب النتيجة النهائية بناءً على متوسط تحصيل الفصول الدراسية وتعد درجة النجاح من 50%.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Two small boxes */}
                  <div className="flex flex-row items-center gap-4 flex-shrink-0">
                    {/* المعدل العام */}
                    <div className="text-center bg-white px-6 py-3 border-2 border-yellow-300 rounded-xl shadow-sm flex flex-col justify-center items-center gap-1.5 h-[76px] w-[130px]">
                      <span className="block text-[11px] text-gray-400 font-bold mb-0.5 leading-none">المعدل العام</span>
                      <span className="text-3xl font-black text-yellow-700 font-mono leading-none mt-1">{s1Active ? `${yearAverage}` : "-"}</span>
                    </div>

                    {/* النتيجة النهائية */}
                    <div className={`px-6 py-3 rounded-xl border-2 font-black text-lg print-badge flex flex-col justify-center items-center gap-1.5 shadow-sm h-[76px] w-[150px] ${getStatusColor(finalStatus)}`}>
                      <span className="block text-[11px] font-bold opacity-80 leading-none">النتيجة النهائية</span>
                      <span className="flex items-center gap-2 font-black leading-none mt-1">
                        {finalStatus === "ناجح" && <FaCheckCircle className="text-green-800 shrink-0 text-xl" />}
                        {finalStatus === "راسب" && <FaTimesCircle className="text-red-800 shrink-0 text-xl" />}
                        {finalStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtext under the boxes (perfectly aligned below the two boxes on the far left) */}
                {finalStatus === "راسب" && (
                  <div className="flex justify-end -mt-2">
                    <span className="text-xs text-red-700 font-extrabold w-[296px] text-center">
                      * يوجد دور ثاني ولابد من الاستعداد {failedSemInfo.pronoun2}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              {/* ملاحظة مخصصة للمادة */}
              <div className="mt-3 p-3 bg-amber-50/60 border border-yellow-300/40 rounded-xl text-center">
                <p className="text-[11px] text-amber-800 font-bold">
                    ℹ️ تنويه: هذه الشهادة والدرجات الواردة فيها مخصصة ومعتمدة حصرياً لمادة القرآن الكريم والدراسات الإسلامية فقط.
                </p>
              </div>

              {/* Certificate Footer / Signatures */}
              <div className="border-t border-gray-300 pt-4 mt-4 flex flex-row justify-between items-center text-xs font-semibold text-gray-600">
                <div className="text-center w-1/2">
                  <p className="text-[11px] font-extrabold text-gray-900 mb-6">معلم المادة</p>
                  <p className="border-b border-gray-400 w-32 mx-auto mb-1"></p>
                  <p className="font-bold text-gray-700">{teacherName || "__________________"}</p>
                </div>

                <div className="text-center w-1/2">
                  <p className="text-[11px] font-extrabold text-gray-900 mb-6">قائد المدرسة</p>
                  <p className="border-b border-gray-400 w-32 mx-auto mb-1"></p>
                  <p className="font-bold text-gray-700">{principalName || "__________________"}</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex justify-end no-print">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-xl font-bold transition-colors text-sm"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
      {/* Dedicated print container for the pre-rendered high-res PNG image */}
      {imageUrl && (
        <div id="print-image-container" style={{ display: "none" }}>
          <img src={imageUrl} alt="شهادة الطالب" className="print-fit-image" />
        </div>
      )}
    </div>
  );
}
