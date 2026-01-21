// src/components/StudentGradesPopup.jsx

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  FaTimes,
  FaAward,
  FaTasks,
  FaBookOpen,
  FaMicrophone,
  FaPencilAlt,
  FaCommentDots,
  FaQuran,
  FaStickyNote,
  FaTimesCircle,
  FaCheckCircle,
  FaStar,
  FaCoins,
  FaRegStar,
  FaExclamationTriangle,
  FaSpinner,
  FaPaperPlane, // تمت الإضافة
  FaHistory     // تمت الإضافة
} from "react-icons/fa";

// استيراد دوال الحساب والحالة من ملف الأدوات
import { 
  calculateCategoryScore, 
  taskStatusUtils, 
  getStatusInfo 
} from "../utils/gradeUtils";

// ============================================
// مكونات فرعية مع memoization
// ============================================

const SummaryCard = memo(({ title, value, max, icon: Icon, color }) => (
  <div className={`bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg`}>
    <div>
      <h4 className="text-gray-300 text-sm font-bold mb-1">{title}</h4>
      <span className={`text-3xl font-bold text-${color}-400 font-mono`}>
        {value} <span className="text-lg text-gray-400">/ {max}</span>
      </span>
    </div>
    <Icon className={`text-4xl text-${color}-500/20`} />
  </div>
));

const StarsDisplay = memo(({ count, color, label, icon: Icon }) => {
  const starsArray = useMemo(() => 
    [...Array(10)].map((_, i) => i < (count || 0)), 
    [count]
  );
  
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`text-${color}-400 text-2xl`} />
        <span className="font-bold text-white">{label} ({count || 0})</span>
      </div>
      <div className="flex gap-1 flex-wrap justify-center">
        {starsArray.map((filled, i) => (
          <FaStar key={i} className={`text-sm ${filled ? `text-${color}-400` : 'text-gray-600'}`} />
        ))}
      </div>
    </div>
  );
});

const GradeInput = memo(({ 
  category, 
  index, 
  value, 
  onUpdate, 
  hasCurriculum, 
  color, 
  placeholder = "--",
  size = "lg"
}) => {
  const [isDesktop] = useState(window.innerWidth > 768);
  
  const handleChange = useCallback((e) => {
    onUpdate(category, index, e.target.value);
  }, [category, index, onUpdate]);
  
  const inputStyle = useMemo(() => 
    hasCurriculum
      ? `bg-gray-800 text-white border-gray-600 focus:ring-${color}-500 focus:border-${color}-500 ${!isDesktop ? 'hover:border-' + color + '-300' : ''}`
      : `bg-black/40 text-gray-500 border-gray-800 focus:ring-gray-600 cursor-default placeholder-gray-700`,
    [hasCurriculum, color, isDesktop]
  );
  
  const inputSize = size === "lg" ? "p-3 text-xl" : "p-2";
  
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={handleChange}
      className={`w-full rounded-lg text-center font-bold border transition-all shadow-inner ${inputSize} ${inputStyle}`}
      dir="ltr"
    />
  );
});

const SectionHeader = memo(({ title, icon: Icon, color, status, score, total }) => (
  <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
    <h4 className="flex items-center gap-2 font-bold text-lg" style={{ color }}>
      <Icon /> {title}
    </h4>
    <div className="flex items-center gap-2">
      {status && (
        <>
          {status.icon}
          <span className="text-sm text-gray-400">({status.text})</span>
        </>
      )}
      <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
        {score} / {total}
      </span>
    </div>
  </div>
));

// ============================================
// المكون الرئيسي
// ============================================

const StudentGradesPopup = ({
  student,
  onClose,
  onSave,
  onOpenNotes, // --- Prop جديد لفتح نافذة الملاحظات ---
  curriculum = [],
  homeworkCurriculum = [],
  gradeLabel,
  classLabel,
  semesterLabel,
  periodLabel
}) => {
  const [localStudent, setLocalStudent] = useState(JSON.parse(JSON.stringify(student)));
  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDesktop] = useState(() => window.innerWidth > 768);

  // **********************************************************
  // دوال الحساب المحلية مع memoization
  // **********************************************************
  
  const calculateMajorAssessments = useCallback((grades) => {
    const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum') || 0);
    const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average') || 0);
    const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average') || 0);
    return (testsScore + recitationScore + memorizationScore).toFixed(2);
  }, []);

  const calculateCoursework = useCallback((grades) => {
    const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum') || 0);
    const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum') || 0);
    const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best') || 0);
    const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best') || 0);
    return (homeworkScore + participationScore + performanceScore + classInteractionScore).toFixed(2);
  }, []);
  
  const calculateFinalTotalScore = useCallback((grades) => {
    const majorAssessments = parseFloat(calculateMajorAssessments(grades));
    const coursework = parseFloat(calculateCoursework(grades));
    return (majorAssessments + coursework).toFixed(2);
  }, [calculateMajorAssessments, calculateCoursework]);

  const calculatedScores = useMemo(() => ({
    finalTotal: calculateFinalTotalScore(localStudent.grades),
    coursework: calculateCoursework(localStudent.grades),
    majorAssessments: calculateMajorAssessments(localStudent.grades),
    tests: calculateCategoryScore(localStudent.grades, 'tests', 'sum'),
    recitation: calculateCategoryScore(localStudent.grades, 'quranRecitation', 'average'),
    memorization: calculateCategoryScore(localStudent.grades, 'quranMemorization', 'average'),
    classInteraction: calculateCategoryScore(localStudent.grades, 'classInteraction', 'best'),
    homework: calculateCategoryScore(localStudent.grades, 'homework', 'sum'),
    performanceTasks: calculateCategoryScore(localStudent.grades, 'performanceTasks', 'best'),
    participation: calculateCategoryScore(localStudent.grades, 'participation', 'sum'),
  }), [localStudent.grades, calculateFinalTotalScore, calculateCoursework, calculateMajorAssessments]);

  // **********************************************************
  // أدوات مساعدة
  // **********************************************************
  const convertToEnglishNumbers = useCallback((input) => {
    if (input === null || input === undefined) return null;
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let output = String(input);
    for (let i = 0; i < arabicNumbers.length; i++) {
      output = output.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i]);
    }
    return output;
  }, []);

  const checkCurriculumExists = useCallback((category, index) => {
    if (category === 'classInteraction' || category === 'participation') return true;
    let items = [];
    if (category === 'quranRecitation') items = curriculum.filter(c => c.type === 'recitation');
    else if (category === 'quranMemorization') items = curriculum.filter(c => c.type === 'memorization');
    else if (category === 'homework') items = homeworkCurriculum.filter(c => c.type === 'homework');
    else if (category === 'performanceTasks') items = homeworkCurriculum.filter(c => c.type === 'performanceTask');
    else if (category === 'tests') items = homeworkCurriculum.filter(c => c.type === 'test');
    return index < items.length;
  }, [curriculum, homeworkCurriculum]);

  // **********************************************************
  // منطق التحديث والحفظ
  // **********************************************************
  const updateLocalGrade = useCallback((category, index, value) => {
    const englishValue = convertToEnglishNumbers(value);
    const numValue = englishValue === '' ? null : Number(englishValue);

    let maxLimit = 100;
    let errorMessage = '';

    switch (category) {
      case 'tests': maxLimit = 20; errorMessage = "عفواً: درجة الاختبار لا يمكن أن تتجاوز 20."; break;
      case 'classInteraction': maxLimit = 10; errorMessage = "عفواً: درجة التفاعل الصفي لا يمكن أن تتجاوز 10."; break;
      case 'homework': maxLimit = 1; errorMessage = "عفواً: درجة الواجب لا يمكن أن تتجاوز 1."; break;
      case 'performanceTasks': maxLimit = 10; errorMessage = "عفواً: درجة المهمة الأدائية لا يمكن أن تتجاوز 10."; break;
      case 'participation': maxLimit = 1; errorMessage = "عفواً: درجة المشاركة لا يمكن أن تتجاوز 1."; break;
      case 'quranRecitation': maxLimit = 10; errorMessage = "عفواً: درجة تلاوة القرآن لا يمكن أن تتجاوز 10."; break;
      case 'quranMemorization': maxLimit = 10; errorMessage = "عفواً: درجة حفظ القرآن لا يمكن أن تتجاوز 10."; break;
      default: maxLimit = 100;
    }

    if (numValue !== null && (numValue > maxLimit || numValue < 0)) {
      setErrorDialog({ show: true, message: errorMessage });
      return;
    }

    setLocalStudent(prev => {
      const updatedGrades = { ...prev.grades };
      if (Array.isArray(updatedGrades[category])) {
          const newArr = [...updatedGrades[category]];
          if (index >= newArr.length) while(newArr.length <= index) newArr.push(null);
          newArr[index] = numValue;
          updatedGrades[category] = newArr;
      } else {
          updatedGrades[category] = numValue;
      }
      return { ...prev, grades: updatedGrades };
    });
  }, [convertToEnglishNumbers]);

  const deleteLocalNote = useCallback((weekIndex, noteIndex) => {
    if (!window.confirm("سيتم حذف الملاحظة عند الضغط على زر الحفظ النهائي. هل تريد الاستمرار؟")) return;
    
    setLocalStudent(prev => {
      const updatedNotes = [...(prev.grades.weeklyNotes || [])];
      if (updatedNotes[weekIndex]) {
        updatedNotes[weekIndex] = updatedNotes[weekIndex].filter((_, i) => i !== noteIndex);
      }
      return {
        ...prev,
        grades: { ...prev.grades, weeklyNotes: updatedNotes }
      };
    });
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    await new Promise(resolve => setTimeout(resolve, isDesktop ? 500 : 800));

    try {
      await onSave(localStudent);
      onClose();
    } catch (error) {
      console.error("حدث خطأ أثناء الحفظ:", error);
      setErrorDialog({ show: true, message: "فشل في حفظ البيانات، يرجى المحاولة مرة أخرى." });
      setIsSaving(false);
    }
  }, [isSaving, localStudent, onSave, onClose, isDesktop]);

  const latestNotes = useMemo(() => 
    localStudent.grades.weeklyNotes?.reduce((acc, notes, weekIndex) => {
      notes?.forEach(note => acc.push({ note, weekIndex }));
      return acc;
    }, []).reverse().slice(0, 5) || []
  , [localStudent.grades.weeklyNotes]);

  const statusInfo = useMemo(() => ({
    test: taskStatusUtils(localStudent, homeworkCurriculum, 'test'),
    homework: taskStatusUtils(localStudent, homeworkCurriculum, 'homework'),
    performanceTask: taskStatusUtils(localStudent, homeworkCurriculum, 'performanceTask'),
    recitation: getStatusInfo(localStudent, 'recitation', curriculum),
    memorization: getStatusInfo(localStudent, 'memorization', curriculum),
  }), [localStudent, homeworkCurriculum, curriculum]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-hidden ${isDesktop ? '' : 'backdrop-blur-sm'}`}>
      
      {errorDialog.show && (
        <div className={`absolute inset-0 z-[110] flex items-center justify-center bg-black/60 ${isDesktop ? '' : 'backdrop-blur-sm'} animate-fadeIn`}>
          <div className="bg-gray-800 border-2 border-red-500 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <FaExclamationTriangle className="text-5xl text-red-500" />
              <h3 className="text-xl font-bold text-white">تنبيه</h3>
              <p className="text-gray-300 text-lg">{errorDialog.message}</p>
              <button 
                onClick={() => setErrorDialog({ show: false, message: "" })}
                className="mt-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors w-full"
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-gray-800 w-full max-w-6xl rounded-2xl border border-gray-600 flex flex-col max-h-[95vh] animate-fadeIn ${isDesktop ? 'shadow-xl' : 'shadow-2xl'}`}>
        
        {/* === Header === */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <img 
              src={localStudent.photo || '/images/1.webp'} 
              alt={localStudent.name}
              className="w-16 h-16 rounded-full border-2 border-blue-500 object-cover" 
              width="64"
              height="64"
              loading="lazy"
            />
            <div className="text-right">
              <h3 className="text-xl font-bold text-white mb-1">{localStudent.name}</h3>
              <div className="flex flex-col gap-1">
                <p className="text-gray-400 text-sm">السجل: {localStudent.nationalId}</p>
                
                <div className="flex flex-wrap gap-2 text-sm font-medium text-gray-400 mt-1">
                    <span>{gradeLabel || localStudent.grade || ""}</span>
                    {(gradeLabel || localStudent.grade) && (classLabel || localStudent.className) && <span>-</span>}
                    
                    <span>{classLabel || localStudent.className || ""}</span>
                    {(classLabel || localStudent.className) && (semesterLabel || localStudent.semester) && <span>-</span>}
                    
                    <span>{semesterLabel || localStudent.semester || ""}</span>
                    {(semesterLabel || localStudent.semester) && (periodLabel || localStudent.period) && <span>-</span>}
                    
                    <span className="text-blue-400 font-bold">الفترة {periodLabel || localStudent.period || ""}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-800 disabled:opacity-50">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* === Body (Scrollable) === */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-right" dir="rtl">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SummaryCard title="المجموع النهائي" value={calculatedScores.finalTotal} max="100" icon={FaAward} color="green" />
            <SummaryCard title="المهام الأدائية والمشاركة والتفاعل الصفي والواجبات" value={calculatedScores.coursework} max="40" icon={FaTasks} color="yellow" />
            <SummaryCard title="تقويمات شفهية وتحريرية" value={calculatedScores.majorAssessments} max="60" icon={FaBookOpen} color="blue" />
          </div>

          <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 mb-6 flex flex-col md:flex-row justify-around items-center gap-4">
             <StarsDisplay count={localStudent.stars} color="yellow" label="الحالية" icon={FaStar} />
             <StarsDisplay count={localStudent.acquiredStars} color="green" label="المكتسبة" icon={FaCoins} />
             <StarsDisplay count={localStudent.consumedStars} color="red" label="المستهلكة" icon={FaRegStar} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-red-500/30 transition-colors">
              <SectionHeader title="الاختبارات" icon={FaBookOpen} color="#f87171" status={statusInfo.test} score={calculatedScores.tests} total="40" />
              <div className="flex gap-3">
                {localStudent.grades.tests.slice(0, 2).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <GradeInput category="tests" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={checkCurriculumExists('tests', i)} color="red" size="lg" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 lg:col-span-1 hover:border-blue-500/30 transition-colors">
                <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-4 text-lg border-b border-gray-600 pb-2">
                    <FaQuran /> القرآن الكريم (التلاوة والحفظ)
                </h4>
                
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                             <h5 className="text-gray-300 text-sm">التلاوة</h5>
                             <span className="text-xs text-gray-400">{statusInfo.recitation.icon} ({statusInfo.recitation.text})</span>
                        </div>
                        <span className="text-blue-300 font-bold text-sm">{calculatedScores.recitation} / 10</span>
                    </div>
                    <div className="flex gap-2">
                        {localStudent.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                            <GradeInput key={i} category="quranRecitation" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={checkCurriculumExists('quranRecitation', i)} color="blue" size="sm" placeholder="--" />
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                             <h5 className="text-gray-300 text-sm">الحفظ</h5>
                             <span className="text-xs text-gray-400">{statusInfo.memorization.icon} ({statusInfo.memorization.text})</span>
                        </div>
                        <span className="text-blue-300 font-bold text-sm">{calculatedScores.memorization} / 10</span>
                    </div>
                    <div className="flex gap-2">
                        {localStudent.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                            <GradeInput key={i} category="quranMemorization" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={checkCurriculumExists('quranMemorization', i)} color="blue" size="sm" placeholder="--" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-yellow-500/30 transition-colors">
              <SectionHeader title="التفاعل الصفي" icon={FaMicrophone} color="#fbbf24" score={calculatedScores.classInteraction} total="10" />
              <div className="flex gap-3">
                {localStudent.grades.classInteraction.slice(0, 4).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <GradeInput category="classInteraction" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={true} color="yellow" size="lg" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-green-500/30 transition-colors">
              <SectionHeader title="الواجبات" icon={FaTasks} color="#4ade80" status={statusInfo.homework} score={calculatedScores.homework} total="10" />
              <div className="grid grid-cols-5 gap-3">
                {localStudent.grades.homework.slice(0, 10).map((grade, i) => (
                  <GradeInput key={i} category="homework" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={checkCurriculumExists('homework', i)} color="green" size="sm" placeholder="-" />
                ))}
              </div>
            </div>

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-purple-500/30 transition-colors">
              <SectionHeader title="المهام الأدائية" icon={FaPencilAlt} color="#a855f7" status={statusInfo.performanceTask} score={calculatedScores.performanceTasks} total="10" />
              <div className="flex gap-3">
                {localStudent.grades.performanceTasks.slice(0, 4).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <GradeInput category="performanceTasks" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={checkCurriculumExists('performanceTasks', i)} color="purple" size="lg" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-cyan-500/30 transition-colors">
              <SectionHeader title="المشاركة" icon={FaCommentDots} color="#22d3ee" score={calculatedScores.participation} total="10" />
              <div className="grid grid-cols-5 gap-3">
                {localStudent.grades.participation.slice(0, 10).map((grade, i) => (
                  <GradeInput key={i} category="participation" index={i} value={grade} onUpdate={updateLocalGrade} hasCurriculum={true} color="cyan" size="sm" placeholder="-" />
                ))}
              </div>
            </div>
            
             {/* === الملاحظات الأسبوعية === */}
             <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 lg:col-span-2">
                
                {/* --- التعديل هنا: إضافة الأزرار في ترويسة قسم الملاحظات --- */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-600 pb-3 mb-4 gap-3">
                     <h4 className="flex items-center gap-2 font-bold text-gray-200 text-lg">
                        <FaStickyNote className="text-yellow-500" /> سجل الملاحظات
                     </h4>
                     
                     {/* أزرار إدارة الملاحظات الجديدة */}
                     <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => onOpenNotes && onOpenNotes(localStudent.id, 'private_note')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm rounded-lg transition-colors shadow-sm"
                        >
                            <FaPaperPlane /> إرسال خاصة
                        </button>
                        <button 
                            onClick={() => onOpenNotes && onOpenNotes(localStudent.id, 'student_history')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs md:text-sm rounded-lg transition-colors shadow-sm"
                        >
                            <FaHistory /> سجل الطالب
                        </button>
                     </div>
                </div>

                {latestNotes.length > 0 && (
                   <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-600/50">
                       <h5 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                           <FaCheckCircle className="text-green-500"/> آخر الملاحظات المسجلة:
                       </h5>
                       <ul className="space-y-2">
                           {latestNotes.map((item, idx) => (
                               <li key={idx} className="text-gray-300 text-sm border-r-2 border-yellow-500 pr-2">
                                   <span className="font-bold text-yellow-500 ml-2">الأسبوع {item.weekIndex + 1}:</span>
                                   {item.note}
                               </li>
                           ))}
                       </ul>
                   </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {(localStudent.grades.weeklyNotes || []).map((notes, wIndex) => {
                         if (!notes || notes.length === 0) return null;
                         return (
                            <div key={wIndex} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                                <h5 className="text-blue-300 font-bold text-sm mb-2 border-b border-gray-600 pb-1">الأسبوع {wIndex + 1}</h5>
                                <div className="space-y-2">
                                    {notes.map((note, nIndex) => (
                                        <div key={nIndex} className="flex justify-between items-start text-sm bg-gray-900/50 p-2 rounded">
                                            <span className="text-gray-300 text-xs">{note}</span>
                                            <button 
                                                onClick={() => deleteLocalNote(wIndex, nIndex)}
                                                className="text-red-400 hover:text-red-200 mr-2"
                                                title="حذف"
                                            >
                                                <FaTimesCircle />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         );
                    })}
                    {(!localStudent.grades.weeklyNotes || !localStudent.grades.weeklyNotes.some(n => n && n.length > 0)) && (
                         <div className="col-span-full text-center text-gray-500 py-4 italic">
                             لا توجد ملاحظات مسجلة لهذا الطالب
                         </div>
                    )}
                </div>
            </div>

          </div>
        </div>

        {/* === Footer (Actions) === */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-2xl flex justify-between items-center gap-4 z-10">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`flex-[2] py-3 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
              isSaving 
                ? 'bg-blue-800 cursor-wait' 
                : `bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 ${isDesktop ? 'shadow-lg hover:shadow-xl' : 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'}`
            }`}
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin text-xl" /> جاري الحفظ...
              </>
            ) : (
              <>
                <FaCheckCircle className="text-xl" /> حفظ التغييرات واعتماد الدرجات
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default memo(StudentGradesPopup);