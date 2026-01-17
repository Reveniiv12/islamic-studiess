// src/components/DailyAttendanceModal.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../supabaseClient"; // تأكد من استيراد Supabase
import {
  FaSave,
  FaTimes,
  FaSearch,
  FaCalendarAlt,
  FaUserSlash,
  FaBookOpen,
  FaListAlt, 
  FaChartBar,
  FaSpinner
} from 'react-icons/fa';

const DailyAttendanceModal = ({ students, onClose, onSave, activeSemester }) => {
  // --- إعدادات الوقت والتاريخ ---
  const initialDay = new Date().getDay();
  // اليوم الافتراضي (تلقائي حسب جهازك)
  const [selectedDay, setSelectedDay] = useState(initialDay > 4 ? 0 : initialDay);
  
  // الأسبوع الافتراضي (سنجلبه من قاعدة البيانات)
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // --- حالة نافذة الملخص ---
  const [showSummary, setShowSummary] = useState(false); 
  const [summaryTab, setSummaryTab] = useState('absences'); 

  // --- حالة التحضير اليومي ---
  const [dailyStatus, setDailyStatus] = useState({});

  // مفتاح اليوم الحالي (الصيغة الجديدة القياسية)
  const currentDayKey = `${activeSemester}_W${selectedWeek}-D${selectedDay}`;
  
  // مفتاح اليوم القديم (للتوافق)
  const legacyDayKey = `W${selectedWeek}-D${selectedDay}`;

  // --- 1. جلب الأسبوع المحفوظ عند فتح النافذة ---
  useEffect(() => {
    const fetchSavedSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('current_week')
          .eq('id', 'general')
          .single();
        
        if (data && data.current_week) {
          setSelectedWeek(data.current_week);
        }
      } catch (err) {
        console.error("Error fetching week:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSavedSettings();
  }, []);

  // --- 2. دالة تغيير الأسبوع وحفظه ---
  const handleWeekChange = async (newWeek) => {
    const weekNum = Number(newWeek);
    setSelectedWeek(weekNum);
    
    // حفظ التغيير في قاعدة البيانات ليبقى ثابتاً للمرات القادمة
    try {
      await supabase
        .from('settings')
        .upsert({ id: 'general', current_week: weekNum });
    } catch (err) {
      console.error("Error saving week:", err);
    }
  };

  // --- دالة مساعدة لفلترة بيانات الفصل الحالي (العداد الصحيح) ---
  const isDateInCurrentSemester = (dateStr) => {
    if (!dateStr) return false;
    const semesterPrefix = `${activeSemester}_`;
    
    if (dateStr.includes('_W')) {
      return dateStr.startsWith(semesterPrefix);
    }
    return activeSemester === 'semester1';
  };

  // --- تحميل بيانات اليوم الحالي ---
  useEffect(() => {
    const statusMap = {};
    students.forEach(student => {
      const isAbsent = (student.absences || []).some(dateStr => {
        if (dateStr === currentDayKey) return true;
        if (activeSemester === 'semester1' && dateStr === legacyDayKey) return true;
        return false;
      });

      const noBook = (student.bookAbsences || []).some(dateStr => {
        if (dateStr === currentDayKey) return true;
        if (activeSemester === 'semester1' && dateStr === legacyDayKey) return true;
        return false;
      });

      statusMap[student.id] = { isAbsent, noBook };
    });
    setDailyStatus(statusMap);
  }, [students, currentDayKey, legacyDayKey, activeSemester]);

  // --- دوال التحكم ---
  const toggleStatus = (studentId, type) => {
    setDailyStatus(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: !prev[studentId]?.[type]
      }
    }));
  };

  const markAllPresent = () => {
    if(!window.confirm("هل أنت متأكد من تحضير جميع الطلاب (إلغاء كل الغيابات لهذا اليوم)؟")) return;
    const newStatus = {};
    students.forEach(s => {
      newStatus[s.id] = { isAbsent: false, noBook: dailyStatus[s.id]?.noBook || false };
    });
    setDailyStatus(newStatus);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedStudents = students.map(student => {
      const status = dailyStatus[student.id] || { isAbsent: false, noBook: false };
      
      let newAbsences = (student.absences || []).filter(dateStr => 
        dateStr !== currentDayKey && dateStr !== legacyDayKey
      );
      if (status.isAbsent) newAbsences.push(currentDayKey);

      let newBookAbsences = (student.bookAbsences || []).filter(dateStr => 
        dateStr !== currentDayKey && dateStr !== legacyDayKey
      );
      if (status.noBook) newBookAbsences.push(currentDayKey);

      return { ...student, absences: newAbsences, bookAbsences: newBookAbsences };
    });

    await onSave(updatedStudents);
    setIsSaving(false);
    onClose();
  };

  // --- الفلترة والبحث ---
  const normalizeArabic = (s = '') => s.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').toLowerCase();

  const filteredStudents = useMemo(() => {
    if (!searchText) return students;
    const q = normalizeArabic(searchText);
    return students.filter(s => normalizeArabic(s.name).includes(q));
  }, [students, searchText]);

  const weeks = Array.from({ length: 20 }, (_, i) => i + 1);
  const days = [
    { val: 0, name: 'الأحد' },
    { val: 1, name: 'الاثنين' },
    { val: 2, name: 'الثلاثاء' },
    { val: 3, name: 'الأربعاء' },
    { val: 4, name: 'الخميس' }
  ];

  // --- منطق الملخص ---
  const getDayName = (dayIndex) => ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][dayIndex] || '';

  const formatLogDate = (logStr) => {
    const match = logStr.match(/W(\d+)-D(\d+)/);
    if (match) {
      const w = match[1];
      const d = match[2];
      return `أسبوع ${w} (${getDayName(parseInt(d))})`;
    }
    return logStr; 
  };

  const summaryData = useMemo(() => {
    return students.map(student => {
      const semesterAbsences = (student.absences || []).filter(isDateInCurrentSemester);
      const semesterBooks = (student.bookAbsences || []).filter(isDateInCurrentSemester);

      return {
        id: student.id,
        name: student.name,
        absences: semesterAbsences,
        books: semesterBooks,
        absencesCount: semesterAbsences.length,
        booksCount: semesterBooks.length
      };
    }).filter(s => s.absencesCount > 0 || s.booksCount > 0)
      .sort((a, b) => {
         if(summaryTab === 'absences') return b.absencesCount - a.absencesCount;
         return b.booksCount - a.booksCount;
      });
  }, [students, activeSemester, summaryTab]);

  const getStudentSemesterAbsencesCount = (student) => (student.absences || []).filter(isDateInCurrentSemester).length;
  const getStudentSemesterBooksCount = (student) => (student.bookAbsences || []).filter(isDateInCurrentSemester).length;


  // --- واجهة الملخص ---
  const renderSummaryModal = () => (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-80 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-gray-600 shadow-2xl">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FaChartBar className="text-yellow-500" />
            ملخص المتابعة ({activeSemester === 'semester1' ? 'الفصل الأول' : 'الفصل الثاني'})
          </h3>
          <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setSummaryTab('absences')}
            className={`flex-1 py-3 font-bold transition-colors ${
              summaryTab === 'absences' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            الغياب ({summaryData.filter(s => s.absencesCount > 0).length})
          </button>
          <button
            onClick={() => setSummaryTab('books')}
            className={`flex-1 py-3 font-bold transition-colors ${
              summaryTab === 'books' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            نقص الكتب ({summaryData.filter(s => s.booksCount > 0).length})
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-800">
          {summaryData.filter(s => summaryTab === 'absences' ? s.absencesCount > 0 : s.booksCount > 0).length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {summaryTab === 'absences' ? 'لا يوجد غياب مسجل في هذا الفصل 👍' : 'جميع الطلاب ملتزمون بالكتب 👍'}
            </div>
          ) : (
            summaryData
              .filter(s => summaryTab === 'absences' ? s.absencesCount > 0 : s.booksCount > 0)
              .map(student => (
                <div key={student.id} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-white text-lg">{student.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      summaryTab === 'absences' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      العدد: {summaryTab === 'absences' ? student.absencesCount : student.booksCount}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(summaryTab === 'absences' ? student.absences : student.books).map((log, idx) => (
                      <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-600">
                        {formatLogDate(log)}
                      </span>
                    ))}
                  </div>
                </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-xl text-left">
          <button onClick={() => setShowSummary(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );

  // --- الواجهة الرئيسية ---
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex justify-center items-start pt-10 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 mb-10 border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-700 bg-gray-750 rounded-t-xl sticky top-0 z-10 bg-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaCalendarAlt className="text-blue-500" />
                تحضير {activeSemester === 'semester1' ? 'الفصل الأول' : 'الفصل الثاني'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {loadingSettings ? "جاري تحميل الأسبوع..." : "حدد الأسبوع واليوم ثم قم برصد الحالات"}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSummary(true)} 
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition shadow-lg"
              >
                <FaListAlt /> ملخص المتابعة
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 bg-gray-700 rounded-lg">
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="block text-gray-400 text-xs mb-1 flex justify-between">
                الأسبوع الدراسي
                {loadingSettings && <FaSpinner className="animate-spin text-blue-400" />}
              </label>
              <select
                value={selectedWeek}
                // هنا نستخدم دالة التغيير الجديدة التي تحفظ في قاعدة البيانات
                onChange={(e) => handleWeekChange(e.target.value)}
                disabled={loadingSettings}
                className="w-full bg-gray-700 text-white p-2.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {weeks.map(w => <option key={w} value={w}>الأسبوع {w}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-400 text-xs mb-1">اليوم</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full bg-gray-700 text-white p-2.5 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                {days.map(d => <option key={d.val} value={d.val}>{d.name}</option>)}
              </select>
            </div>

            <div className="md:col-span-6 relative">
              <label className="block text-gray-400 text-xs mb-1">بحث عن طالب</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="اسم الطالب..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2.5 pr-10 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
             <div className="text-sm text-gray-400">
               عدد الطلاب: <span className="text-white font-bold">{filteredStudents.length}</span>
             </div>
             <button 
               onClick={markAllPresent}
               className="text-xs text-green-400 hover:text-green-300 underline cursor-pointer"
             >
               تحديد الجميع "حاضر"
             </button>
          </div>
        </div>

        {/* القائمة */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => {
              const status = dailyStatus[student.id] || { isAbsent: false, noBook: false };
              const absCount = getStudentSemesterAbsencesCount(student);
              const bkCount = getStudentSemesterBooksCount(student);
              
              return (
                <div 
                  key={student.id} 
                  className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                    status.isAbsent 
                      ? 'bg-red-900/20 border-red-800' 
                      : status.noBook 
                        ? 'bg-yellow-900/10 border-yellow-800/50'
                        : 'bg-gray-750 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className={`w-2 h-10 rounded-full ${
                      status.isAbsent ? 'bg-red-500' : status.noBook ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium text-lg">{student.name}</span>
                      
                      {/* عرض الإحصائيات (مفلترة للفصل الحالي فقط) */}
                      {(absCount > 0 || bkCount > 0) && (
                         <span className="text-xs text-gray-400 flex gap-2">
                           {absCount > 0 && <span className="text-red-400">غياب سابق: {absCount}</span>}
                           {bkCount > 0 && <span className="text-yellow-400">كتب: {bkCount}</span>}
                         </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => toggleStatus(student.id, 'isAbsent')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        status.isAbsent
                          ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <FaUserSlash />
                      {status.isAbsent ? 'غائب' : 'غياب'}
                    </button>

                    <button
                      onClick={() => toggleStatus(student.id, 'noBook')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        status.noBook
                          ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <FaBookOpen />
                      {status.noBook ? 'بدون كتاب' : 'كتاب'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-10">
              لا يوجد طلاب يطابقون البحث
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl sticky bottom-0 z-10 flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
          >
            {isSaving ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <FaSave />
            )}
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            إلغاء
          </button>
        </div>

      </div>

      {showSummary && renderSummaryModal()}
    </div>
  );
};

export default DailyAttendanceModal;