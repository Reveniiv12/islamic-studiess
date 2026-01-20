// src/components/StudentGradesPopup.jsx

import React, { useState } from "react";
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
  FaExclamationTriangle
} from "react-icons/fa";

// استيراد دوال الحساب والحالة من ملف الأدوات
import { 
  calculateCategoryScore, 
  taskStatusUtils, 
  getStatusInfo 
} from "../utils/gradeUtils";

const StudentGradesPopup = ({
  student,
  onClose,
  onSave,
  curriculum = [],
  homeworkCurriculum = [],
}) => {
  const [localStudent, setLocalStudent] = useState(JSON.parse(JSON.stringify(student)));
  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });

  // **********************************************************
  // دوال الحساب المحلية
  // **********************************************************
  const calculateMajorAssessments = (grades) => {
      const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum') || 0);
      const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average') || 0);
      const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average') || 0);
      return (testsScore + recitationScore + memorizationScore).toFixed(2);
  };

  const calculateCoursework = (grades) => {
      const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum') || 0);
      const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum') || 0);
      const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best') || 0);
      const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best') || 0);
      return (homeworkScore + participationScore + performanceScore + classInteractionScore).toFixed(2);
  };
  
  const calculateFinalTotalScore = (grades) => {
      const majorAssessments = parseFloat(calculateMajorAssessments(grades));
      const coursework = parseFloat(calculateCoursework(grades));
      return (majorAssessments + coursework).toFixed(2);
  };

  // **********************************************************
  // أدوات مساعدة
  // **********************************************************
  const convertToEnglishNumbers = (input) => {
    if (input === null || input === undefined) return null;
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let output = String(input);
    for (let i = 0; i < arabicNumbers.length; i++) {
      output = output.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i]);
    }
    return output;
  };

  const checkCurriculumExists = (category, index) => {
    if (category === 'classInteraction' || category === 'participation') return true;
    let items = [];
    if (category === 'quranRecitation') items = curriculum.filter(c => c.type === 'recitation');
    else if (category === 'quranMemorization') items = curriculum.filter(c => c.type === 'memorization');
    else if (category === 'homework') items = homeworkCurriculum.filter(c => c.type === 'homework');
    else if (category === 'performanceTasks') items = homeworkCurriculum.filter(c => c.type === 'performanceTask');
    else if (category === 'tests') items = homeworkCurriculum.filter(c => c.type === 'test');
    return index < items.length;
  };

  const getInputStyle = (hasCurriculum, activeColorRing) => {
    return hasCurriculum
      ? `bg-gray-800 text-white border-gray-600 focus:ring-${activeColorRing}-500 focus:border-${activeColorRing}-500`
      : `bg-black/40 text-gray-500 border-gray-800 focus:ring-gray-600 cursor-default placeholder-gray-700`;
  };

  // **********************************************************
  // منطق التحديث
  // **********************************************************
  const updateLocalGrade = (category, index, value) => {
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

    const updatedGrades = { ...localStudent.grades };
    if (Array.isArray(updatedGrades[category])) {
        const newArr = [...updatedGrades[category]];
        if (index >= newArr.length) while(newArr.length <= index) newArr.push(null);
        newArr[index] = numValue;
        updatedGrades[category] = newArr;
    } else {
        updatedGrades[category] = numValue;
    }
    setLocalStudent({ ...localStudent, grades: updatedGrades });
  };

  const deleteLocalNote = (weekIndex, noteIndex) => {
    if (!window.confirm("سيتم حذف الملاحظة عند الضغط على زر الحفظ النهائي. هل تريد الاستمرار؟")) return;
    const updatedNotes = [...(localStudent.grades.weeklyNotes || [])];
    if (updatedNotes[weekIndex]) {
      updatedNotes[weekIndex] = updatedNotes[weekIndex].filter((_, i) => i !== noteIndex);
    }
    setLocalStudent({
      ...localStudent,
      grades: { ...localStudent.grades, weeklyNotes: updatedNotes }
    });
  };

  // تجهيز آخر الملاحظات
  const latestNotes = localStudent.grades.weeklyNotes?.reduce((acc, notes, weekIndex) => {
    notes?.forEach(note => acc.push({ note, weekIndex }));
    return acc;
  }, []).reverse().slice(0, 5) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
      
      {/* نافذة الخطأ المنبثقة */}
      {errorDialog.show && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 border-2 border-red-500 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-transform">
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

      <div className="bg-gray-800 w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-600 flex flex-col max-h-[95vh] animate-fadeIn">
        
        {/* === Header === */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <img 
              src={localStudent.photo || '/images/1.webp'} 
              alt={localStudent.name}
              className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover" 
            />
            <div className="text-right">
              <h3 className="text-xl font-bold text-white">{localStudent.name}</h3>
              <p className="text-gray-400 text-sm">السجل: {localStudent.nationalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-800">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* === Body (Scrollable) === */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-right" dir="rtl">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* المجموع النهائي */}
            <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
              <div>
                <h4 className="text-gray-300 text-sm font-bold mb-1">المجموع النهائي</h4>
                <span className="text-3xl font-bold text-green-400 font-mono">
                  {calculateFinalTotalScore(localStudent.grades)} <span className="text-lg text-gray-400">/ 100</span>
                </span>
              </div>
              <FaAward className="text-4xl text-green-500/20" />
            </div>

            {/* المهام الأدائية والواجبات والمشاركة */}
            <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
              <div>
                <h4 className="text-gray-300 text-xs font-bold mb-1 leading-relaxed">المهام الأدائية والمشاركة والتفاعل الصفي والواجبات</h4>
                <span className="text-3xl font-bold text-yellow-400 font-mono">
                  {calculateCoursework(localStudent.grades)} <span className="text-lg text-gray-400">/ 40</span>
                </span>
              </div>
              <FaTasks className="text-4xl text-yellow-500/20" />
            </div>

            {/* التقويمات */}
            <div className="bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center shadow-lg">
              <div>
                <h4 className="text-gray-300 text-sm font-bold mb-1">تقويمات شفهية وتحريرية</h4>
                <span className="text-3xl font-bold text-blue-400 font-mono">
                  {calculateMajorAssessments(localStudent.grades)} <span className="text-lg text-gray-400">/ 60</span>
                </span>
              </div>
              <FaBookOpen className="text-4xl text-blue-500/20" />
            </div>
          </div>

          {/* === قسم النجوم (10 نجوم) === */}
          <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 mb-6 flex flex-col md:flex-row justify-around items-center gap-4">
             {/* النجوم الحالية */}
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                   <FaStar className="text-yellow-400 text-2xl" />
                   <span className="font-bold text-white">الحالية ({localStudent.stars || 0})</span>
                </div>
                <div className="flex gap-1 flex-wrap justify-center">
                   {[...Array(10)].map((_, i) => (
                      <FaStar key={i} className={`text-sm ${i < (localStudent.stars || 0) ? 'text-yellow-400' : 'text-gray-600'}`} />
                   ))}
                </div>
             </div>
             {/* النجوم المكتسبة */}
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                   <FaCoins className="text-green-400 text-2xl" />
                   <span className="font-bold text-white">المكتسبة ({localStudent.acquiredStars || 0})</span>
                </div>
                <div className="flex gap-1 flex-wrap justify-center">
                   {[...Array(10)].map((_, i) => (
                      <FaStar key={i} className={`text-sm ${i < (localStudent.acquiredStars || 0) ? 'text-green-400' : 'text-gray-600'}`} />
                   ))}
                </div>
             </div>
             {/* النجوم المستهلكة */}
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                   <FaRegStar className="text-red-400 text-2xl" />
                   <span className="font-bold text-white">المستهلكة ({localStudent.consumedStars || 0})</span>
                </div>
                <div className="flex gap-1 flex-wrap justify-center">
                   {[...Array(10)].map((_, i) => (
                      <FaStar key={i} className={`text-sm ${i < (localStudent.consumedStars || 0) ? 'text-red-400' : 'text-gray-600'}`} />
                   ))}
                </div>
             </div>
          </div>

          {/* Input Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* الاختبارات */}
            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 hover:border-red-500/30 transition-colors">
              <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                  <h4 className="flex items-center gap-2 font-bold text-red-400 text-lg">
                    <FaBookOpen /> الاختبارات 
                  </h4>
                  <div className="flex items-center gap-2">
                     {taskStatusUtils(localStudent, homeworkCurriculum, 'test').icon}
                     <span className="text-sm text-gray-400">({taskStatusUtils(localStudent, homeworkCurriculum, 'test').text})</span>
                     <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
                        {calculateCategoryScore(localStudent.grades, 'tests', 'sum')} / 40
                     </span>
                  </div>
              </div>
              <div className="flex gap-3">
                {localStudent.grades.tests.slice(0, 2).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <input
                      type="text" inputMode="numeric" placeholder="--" value={grade ?? ''}
                      onChange={(e) => updateLocalGrade('tests', i, e.target.value)}
                      className={`w-full p-3 rounded-lg text-center text-xl font-bold border transition-all shadow-inner ${getInputStyle(checkCurriculumExists('tests', i), 'red')}`}
                    />
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
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
                     {calculateCategoryScore(localStudent.grades, 'classInteraction', 'best')} / 10
                  </span>
              </div>
              <div className="flex gap-3">
                {localStudent.grades.classInteraction.slice(0, 4).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <input
                      type="text" inputMode="numeric" placeholder="--" value={grade ?? ''}
                      onChange={(e) => updateLocalGrade('classInteraction', i, e.target.value)}
                      className={`w-full p-3 rounded-lg text-center text-xl font-bold border transition-all shadow-inner ${getInputStyle(true, 'yellow')}`}
                    />
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
                     {taskStatusUtils(localStudent, homeworkCurriculum, 'homework').icon}
                     <span className="text-sm text-gray-400">({taskStatusUtils(localStudent, homeworkCurriculum, 'homework').text})</span>
                     <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
                        {calculateCategoryScore(localStudent.grades, 'homework', 'sum')} / 10
                     </span>
                   </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {localStudent.grades.homework.slice(0, 10).map((grade, i) => (
                  <input
                    key={i} type="text" inputMode="numeric" placeholder="-" value={grade ?? ''}
                    onChange={(e) => updateLocalGrade('homework', i, e.target.value)}
                    className={`p-2 rounded-lg text-center font-bold border shadow-inner ${getInputStyle(checkCurriculumExists('homework', i), 'green')}`}
                  />
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
                     {taskStatusUtils(localStudent, homeworkCurriculum, 'performanceTask').icon}
                     <span className="text-sm text-gray-400">({taskStatusUtils(localStudent, homeworkCurriculum, 'performanceTask').text})</span>
                     <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
                        {calculateCategoryScore(localStudent.grades, 'performanceTasks', 'best')} / 10
                     </span>
                  </div>
              </div>
              <div className="flex gap-3">
                {localStudent.grades.performanceTasks.slice(0, 4).map((grade, i) => (
                  <div key={i} className="flex-1">
                    <input
                      type="text" inputMode="numeric" placeholder="--" value={grade ?? ''}
                      onChange={(e) => updateLocalGrade('performanceTasks', i, e.target.value)}
                      className={`w-full p-3 rounded-lg text-center text-xl font-bold border transition-all shadow-inner ${getInputStyle(checkCurriculumExists('performanceTasks', i), 'purple')}`}
                    />
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
                  <span className="bg-gray-800 px-2 py-0.5 rounded text-sm text-gray-300">
                      {calculateCategoryScore(localStudent.grades, 'participation', 'sum')} / 10
                  </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {localStudent.grades.participation.slice(0, 10).map((grade, i) => (
                  <input
                    key={i} type="text" inputMode="numeric" placeholder="-" value={grade ?? ''}
                    onChange={(e) => updateLocalGrade('participation', i, e.target.value)}
                    className={`p-2 rounded-lg text-center font-bold border shadow-inner ${getInputStyle(true, 'cyan')}`}
                  />
                ))}
              </div>
            </div>

            {/* القرآن الكريم - قسمين */}
            <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 lg:col-span-1 hover:border-blue-500/30 transition-colors">
                <h4 className="flex items-center gap-2 font-bold text-blue-400 mb-4 text-lg border-b border-gray-600 pb-2">
                    <FaQuran /> القرآن الكريم (التلاوة والحفظ)
                </h4>
                
                {/* التلاوة */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                             <h5 className="text-gray-300 text-sm">التلاوة</h5>
                             <span className="text-xs text-gray-400">
                                {getStatusInfo(localStudent, 'recitation', curriculum).icon} 
                                ({getStatusInfo(localStudent, 'recitation', curriculum).text})
                             </span>
                        </div>
                        <span className="text-blue-300 font-bold text-sm">
                            {calculateCategoryScore(localStudent.grades, 'quranRecitation', 'average')} / 10
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {localStudent.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                            <input
                                key={i} type="text" inputMode="numeric" placeholder="--" value={grade ?? ''}
                                onChange={(e) => updateLocalGrade('quranRecitation', i, e.target.value)}
                                className={`w-full p-2 rounded-lg text-center font-bold border shadow-inner ${getInputStyle(checkCurriculumExists('quranRecitation', i), 'blue')}`}
                            />
                        ))}
                    </div>
                </div>

                {/* الحفظ */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                             <h5 className="text-gray-300 text-sm">الحفظ</h5>
                             <span className="text-xs text-gray-400">
                                {getStatusInfo(localStudent, 'memorization', curriculum).icon} 
                                ({getStatusInfo(localStudent, 'memorization', curriculum).text})
                             </span>
                        </div>
                        <span className="text-blue-300 font-bold text-sm">
                             {calculateCategoryScore(localStudent.grades, 'quranMemorization', 'average')} / 10
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {localStudent.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                            <input
                                key={i} type="text" inputMode="numeric" placeholder="--" value={grade ?? ''}
                                onChange={(e) => updateLocalGrade('quranMemorization', i, e.target.value)}
                                className={`w-full p-2 rounded-lg text-center font-bold border shadow-inner ${getInputStyle(checkCurriculumExists('quranMemorization', i), 'blue')}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
             {/* === الملاحظات الأسبوعية === */}
             <div className="bg-gray-700/40 p-5 rounded-xl border border-gray-600 lg:col-span-2">
                <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                     <h4 className="flex items-center gap-2 font-bold text-gray-200 text-lg">
                        <FaStickyNote className="text-yellow-500" /> سجل الملاحظات
                     </h4>
                </div>

                {/* آخر 5 ملاحظات */}
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

                {/* شبكة الملاحظات الكاملة */}
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
        <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-2xl flex justify-between items-center gap-4 shadow-2xl z-10">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all border border-gray-600 hover:border-gray-500"
          >
            إلغاء
          </button>
          
          <button
            onClick={() => onSave(localStudent)}
            className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
          >
            <FaCheckCircle className="text-xl" /> حفظ التغييرات واعتماد الدرجات
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentGradesPopup;
