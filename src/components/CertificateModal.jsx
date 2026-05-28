import React, { useRef, useState, useCallback } from "react";
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
  const [downloading, setDownloading] = useState(false);

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
    if (status === "ناجح") return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30";
    if (status === "راسب") return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30";
    return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30";
  };

  const s1Status = getStatusText(s1Active, s1Average);
  const s2Status = getStatusText(s2Active, s2Average);
  const finalStatus = s1Active ? getStatusText(true, yearAverage) : "تحت الرصد";

  const gradeName = getGradeNameById(student?.grade_level || student?.grade);
  const sectionName = getSectionNameById(student?.section);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = useCallback(() => {
    if (certificateRef.current === null) return;
    setDownloading(true);

    // Apply adjustments for rendering
    const originalStyle = certificateRef.current.style.cssText;
    certificateRef.current.style.transform = 'scale(1)';
    certificateRef.current.style.width = '800px';

    htmlToImage.toPng(certificateRef.current, { 
      cacheBust: true,
      backgroundColor: '#ffffff',
      style: {
        background: '#ffffff',
        transform: 'scale(1)',
      }
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `شهادة_${student?.name || "طالب"}.png`;
        link.href = dataUrl;
        link.click();
        certificateRef.current.style.cssText = originalStyle;
        setDownloading(false);
      })
      .catch((err) => {
        console.error("Failed to generate image", err);
        alert("فشل في تحميل الشهادة كصورة. يمكنك استخدام خيار الطباعة.");
        certificateRef.current.style.cssText = originalStyle;
        setDownloading(false);
      });
  }, [certificateRef, student]);

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
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure custom borders and details are printable */
          .print-border {
            border: 8px double #d4af37 !important;
            padding: 15px !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #4a5568 !important;
            padding: 6px !important;
            font-size: 11px !important;
            color: black !important;
          }
          th {
            background-color: #f7fafc !important;
          }
          .print-badge {
            border: 1px solid #4a5568 !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
          }
        }
      `}} />

      <div className="w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] animate-fadeIn text-right no-print overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-800 border-b border-gray-700">
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
        <div className="bg-gray-850 px-6 py-3 border-b border-gray-700 flex flex-wrap gap-3 justify-center sm:justify-start">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-102 text-sm"
          >
            <FaPrint /> طباعة الشهادة (PDF)
          </button>
          
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-102 disabled:opacity-50 text-sm"
          >
            {downloading ? (
              <>
                <span className="animate-spin text-sm">⌛</span> جاري الإنشاء...
              </>
            ) : (
              <>
                <FaDownload /> تحميل الشهادة كصورة (PNG)
              </>
            )}
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div className="flex-grow p-6 overflow-y-auto bg-gray-950 flex justify-center">
          
          {/* Certificate Container */}
          <div 
            ref={certificateRef}
            id="print-area"
            className="w-full max-w-[800px] bg-white text-gray-900 p-8 rounded-xl shadow-xl relative border-[12px] border-double border-yellow-600 print-border flex flex-col justify-between"
            style={{ direction: "rtl", minHeight: "1050px" }}
          >
            {/* Islamic Corner Decorations (Hidden on print or simplified) */}
            <div className="absolute top-2 right-2 w-16 h-16 border-t-2 border-r-2 border-yellow-600/30 rounded-tr-md no-print"></div>
            <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-yellow-600/30 rounded-tl-md no-print"></div>
            <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-yellow-600/30 rounded-br-md no-print"></div>
            <div className="absolute bottom-2 left-2 w-16 h-16 border-b-2 border-l-2 border-yellow-600/30 rounded-bl-md no-print"></div>

            <div>
              {/* Official Header */}
              <div className="flex flex-row justify-between items-start border-b-2 border-yellow-500 pb-4 mb-6">
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
                  <p className="text-[10px] text-gray-500 font-bold mt-1">العام الدراسي: ١٤٤٧ هـ / ٢٠٢٦ م</p>
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
              <div className="overflow-x-auto mb-6">
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
                      <td className="p-3 border border-gray-300 text-right text-yellow-850">مجموع درجات الفترة (من ١٠٠)</td>
                      <td className="p-3 border border-gray-300 bg-yellow-100/70 text-yellow-900">١٠٠</td>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Semester 1 Results */}
                <div className="border-2 border-yellow-300 bg-yellow-50/15 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-sm">
                  <h4 className="font-black text-sm md:text-base text-yellow-900 border-b-2 border-yellow-200 pb-2 flex items-center gap-2">
                    <span className="text-yellow-600">📌</span> <b>نتائج الفصل الدراسي الأول</b>
                  </h4>
                  <div className="flex justify-between items-center text-sm md:text-base font-bold">
                    <span className="text-gray-600">متوسط درجات الفصل:</span>
                    <span className="font-black text-blue-900 font-mono text-base md:text-lg">{s1Active ? `${s1Average} / ١٠٠` : "لم يُرصد"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base font-bold">
                    <span className="text-gray-600">حالة النتيجة:</span>
                    <span className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs md:text-sm print-badge ${getStatusColor(s1Status)}`}>
                      {s1Status}
                    </span>
                  </div>
                </div>

                {/* Semester 2 Results */}
                <div className="border-2 border-yellow-300 bg-yellow-50/15 rounded-xl p-5 flex flex-col justify-between gap-3 shadow-sm">
                  <h4 className="font-black text-sm md:text-base text-yellow-900 border-b-2 border-yellow-200 pb-2 flex items-center gap-2">
                    <span className="text-yellow-600">📌</span> <b>نتائج الفصل الدراسي الثاني</b>
                  </h4>
                  <div className="flex justify-between items-center text-sm md:text-base font-bold">
                    <span className="text-gray-600">متوسط درجات الفصل:</span>
                    <span className="font-black text-teal-900 font-mono text-base md:text-lg">{s2Active ? `${s2Average} / ١٠٠` : "تحت الرصد"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm md:text-base font-bold">
                    <span className="text-gray-600">حالة النتيجة:</span>
                    <span className={`px-4 py-1.5 rounded-lg border-2 font-black text-xs md:text-sm print-badge ${getStatusColor(s2Status)}`}>
                      {s2Status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Final Annual Result Box */}
              <div className="border-2 border-yellow-600 bg-gradient-to-r from-yellow-50/60 to-yellow-100/40 rounded-2xl p-6 mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md">
                <div className="text-right w-full lg:w-3/5">
                  <h3 className="font-black text-yellow-900 text-base md:text-lg mb-2 flex items-center gap-2 tracking-wide">
                    🏆 <b>النتيجة النهائية لمادة القرآن الكريم والدراسات الإسلامية</b>
                  </h3>
                  <p className="text-xs md:text-sm text-gray-700 font-bold leading-relaxed">
                    {finalStatus === "راسب" ? (
                      <span className="text-red-650 font-black block bg-red-50 p-3 rounded-lg border-2 border-red-200 mt-1 shadow-sm leading-relaxed">
                        ⚠️ تنبيه: لم يحقق الطالب درجة الاجتياز المطلوبة (٥٠٪)، لذا يتقرر دخوله اختبار الدور الثاني ولابد من الجد والاستعداد الجيد له.
                      </span>
                    ) : (
                      "يتم احتساب النتيجة النهائية بناءً على متوسط تحصيل الفصول الدراسية وتعد درجة النجاح من ٥٠٪."
                    )}
                  </p>
                </div>
                
                <div className="flex flex-row items-center gap-4 flex-shrink-0 w-full lg:w-auto justify-end">
                  <div className="text-center bg-white px-6 py-3 border-2 border-yellow-300 rounded-xl shadow-sm">
                    <span className="block text-[11px] text-gray-400 font-bold mb-0.5">المعدل العام</span>
                    <span className="text-2xl md:text-3xl font-black text-yellow-700 font-mono">{s1Active ? `${yearAverage}` : "-"}</span>
                  </div>

                  <div className="text-center">
                    <span className="block text-[11px] text-gray-400 font-bold mb-1">النتيجة النهائية</span>
                    <span className={`px-6 py-3 rounded-xl border-2 font-black text-sm md:text-base print-badge flex items-center gap-2 shadow-sm ${getStatusColor(finalStatus)}`}>
                      {finalStatus === "ناجح" && <FaCheckCircle className="text-green-500 shrink-0 text-lg" />}
                      {finalStatus === "راسب" && <FaTimesCircle className="text-red-500 shrink-0 text-lg" />}
                      {finalStatus}
                    </span>
                    {finalStatus === "راسب" && (
                      <span className="block text-[10px] md:text-xs text-red-600 font-black mt-2 text-center animate-pulse">
                        * يوجد دور ثاني ولابد من الاستعداد له
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ملاحظة مخصصة للمادة */}
            <div className="mt-4 p-3 bg-amber-50/60 border border-yellow-300/40 rounded-xl text-center">
              <p className="text-[11px] text-amber-800 font-bold">
                  ℹ️ تنويه: هذه الشهادة والدرجات الواردة فيها مخصصة ومعتمدة حصرياً لمادة القرآن الكريم والدراسات الإسلامية فقط.
              </p>
            </div>

            {/* Certificate Footer / Signatures */}
            <div className="border-t border-gray-300 pt-6 mt-6 flex flex-row justify-between items-center text-xs font-semibold text-gray-600">
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

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-xl font-bold transition-colors text-sm"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
