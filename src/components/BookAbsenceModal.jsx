// src/components/BookAbsenceModal.jsx

import React, { useState, useMemo } from 'react';
import {
  FaBookOpen,
  FaSave,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaTimesCircle,
  FaTrash
} from 'react-icons/fa';

const BookAbsenceModal = ({ students, onClose, onSave, handleDialog }) => {
  const startDate = new Date('2024-09-01');

  const getHijriTodayShort = () => {
    const date = new Date();
    const hijriDateParts = date.toLocaleDateString('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).split('/');
    
    if (hijriDateParts.length >= 2) {
      return `${hijriDateParts[0]}/${hijriDateParts[1]}`;
    }
    return '';
  };

  const initialBookAbsences = {};
  students.forEach(student => {
    initialBookAbsences[student.id] =
      student.bookAbsences?.map(dateString => {
        if (dateString.startsWith('W')) {
          const [weekPart, dayPart] = dateString.split('-');
          const week = parseInt(weekPart.substring(1));
          const day = parseInt(dayPart.substring(1));
          return { week, day, date: getHijriTodayShort() };
        } else {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;

          const hijriDateParts = date.toLocaleDateString('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
          }).split('/');

          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const daysPassed = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
          const week = Math.ceil(daysPassed / 7);
          const day = date.getDay();
          
          return { week, day, date: hijriDateParts.length >= 2 ? `${hijriDateParts[0]}/${hijriDateParts[1]}` : '' };
        }
      }).filter(a => a !== null) || [];
  });

  const [bookAbsencesByStudent, setBookAbsencesByStudent] = useState(initialBookAbsences);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [searchByView, setSearchByView] = useState({ all: '' });
  const currentSearch = searchByView[selectedWeek] ?? '';
  const setCurrentSearch = (val) =>
    setSearchByView(prev => ({ ...prev, [selectedWeek]: val }));

  const [isSaving, setIsSaving] = useState(false);

  const weeks = Array.from({ length: 20 }, (_, i) => i + 1);
  const days = Array.from({ length: 5 }, (_, i) => i);

  const toggleBookAbsence = (studentId, week, day) => {
    setBookAbsencesByStudent(prev => {
      const curr = prev[studentId] || [];
      const exists = curr.some(a => a.week === week && a.day === day);
      return {
        ...prev,
        [studentId]: exists
          ? curr.filter(a => !(a.week === week && a.day === day))
          : [...curr, { week, day, date: getHijriTodayShort() }]
      };
    });
  };

const handleSaveBookAbsences = async () => {
    setIsSaving(true);
    const updatedStudents = students.map(student => {
      const newBookAbsences = bookAbsencesByStudent[student.id]?.map(a => `W${a.week}-D${a.day}`) || [];
      return { ...student, bookAbsences: newBookAbsences };
    });
    
    await onSave(updatedStudents);
    
    setIsSaving(false);
    onClose();
};

const handleDeleteAllBookAbsences = () => {
    onClose();
    setTimeout(() => {
        handleDialog(
            "تأكيد الحذف",
            "هل أنت متأكد من حذف جميع سجلات عدم إحضار الكتاب لكل الطلاب؟ لا يمكن التراجع عن هذا الإجراء.",
            "confirm",
            async () => {
                setIsSaving(true);
                const updatedStudents = students.map(student => ({
                    ...student,
                    bookAbsences: []
                }));
                await onSave(updatedStudents);
                setIsSaving(false);
            }
        );
    }, 100);
  };

  const getDayName = (i) => ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'][i];

  const getAbsenceDate = (studentId, week, day) => {
    const absence = bookAbsencesByStudent[studentId]?.find(a => a.week === week && a.day === day);
    return absence ? absence.date : '';
  };

  const isStudentAbsent = (studentId, week, day) =>
    bookAbsencesByStudent[studentId]?.some(a => a.week === week && a.day === day);

  const getAbsenceCount = (studentId) =>
    bookAbsencesByStudent[studentId]?.length || 0;

  const normalizeArabic = (s = '') =>
    s
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const filteredStudents = useMemo(() => {
    const q = normalizeArabic(currentSearch);
    if (!q) return students;
    
    const matches = students.filter(stu => {
      const name = normalizeArabic(stu.name);
      const nameParts = name.split(' ');
      
      const firstNameMatch = nameParts[0]?.includes(q);
      const lastNameMatch = nameParts.length > 1 && nameParts[nameParts.length - 1]?.includes(q);

      return firstNameMatch || lastNameMatch;
    });

    return matches.sort((a, b) => {
      const aName = normalizeArabic(a.name);
      const bName = normalizeArabic(b.name);

      const aStartsWith = aName.startsWith(q);
      const bStartsWith = bName.startsWith(q);

      if (aStartsWith && !bStartsWith) {
        return -1;
      }
      if (!aStartsWith && bStartsWith) {
        return 1;
      }
      return aName.localeCompare(bName, 'ar');
    });
  }, [currentSearch, students]);

  const weeksToDisplay =
    selectedWeek === 'all' ? weeks : [parseInt(selectedWeek)];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FaBookOpen className="text-blue-400" /> كشف من لم يحضر الكتاب
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow flex flex-col">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex items-center w-full max-w-sm">
              <input
                type="text"
                placeholder="ابحث عن طالب..."
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 pr-10 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute right-3 text-gray-400" />
              {currentSearch ? (
                <button
                  onClick={() => setCurrentSearch('')}
                  className="absolute left-3 text-gray-300 hover:text-white"
                  aria-label="مسح البحث"
                >
                  <FaTimesCircle />
                </button>
              ) : null}
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">كشف شامل (كل الأسابيع)</option>
                {weeks.map(week => (
                  <option key={week} value={week}>الأسبوع {week}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                <FaChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div
            key={`view-${selectedWeek}`}
            className="overflow-x-auto relative shadow-md sm:rounded-lg flex-grow"
          >
            <table className="w-full text-sm text-right text-gray-400">
              <thead className="text-xs text-gray-200 uppercase bg-gray-700 sticky top-0 z-20">
                <tr>
                  <th scope="col" className="py-3 px-6 sticky right-0 bg-gray-700 z-30">
                    اسم الطالب (<span className="text-blue-400">عدد مرات عدم إحضار الكتاب</span>)
                  </th>
                  {weeksToDisplay.map(week => (
                    <th key={week} scope="col" colSpan={days.length} className="py-3 px-6 text-center border-l border-gray-600">
                      الأسبوع {week}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th scope="col" className="py-2 px-6 sticky right-0 bg-gray-700 z-30"></th>
                  {weeksToDisplay.map(week =>
                    days.map(day => (
                      <th key={`${week}-${day}`} scope="col" className="py-2 px-2 text-center border-l border-gray-600">
                        {getDayName(day)}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                  <tr key={`${student.id}-${selectedWeek}`} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
                    <th scope="row" className="py-4 px-6 font-medium text-white whitespace-nowrap sticky right-0 bg-gray-800 z-10">
                      {student.name} (<span className="text-blue-400">{getAbsenceCount(student.id)}</span>)
                    </th>
                    {weeksToDisplay.map(week =>
                      days.map(day => (
                        <td
                          key={`${student.id}-${week}-${day}`}
                          className={`py-4 px-2 text-center cursor-pointer transition-colors border-l border-gray-700 text-xs ${
                            isStudentAbsent(student.id, week, day) ? 'bg-blue-600' : 'hover:bg-gray-600'
                          }`}
                          onClick={() => toggleBookAbsence(student.id, week, day)}
                          title={isStudentAbsent(student.id, week, day) ? getAbsenceDate(student.id, week, day) : ''}
                        >
                          {isStudentAbsent(student.id, week, day) ? getAbsenceDate(student.id, week, day) : ''}
                        </td>
                      ))
                    )}
                  </tr>
                )) : (
                  <tr className="bg-gray-800">
                    <td colSpan={1 + weeksToDisplay.length * days.length} className="py-4 text-center text-gray-400">
                      لا يوجد طلاب يطابقون البحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2 bg-gray-700">
          <button
            onClick={handleSaveBookAbsences}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaSave />
            )}
            {isSaving ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
          </button>
          <button
            onClick={handleDeleteAllBookAbsences}
            disabled={isSaving}
            className="bg-red-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTrash />
            حذف الكل
          </button>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaTimes />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAbsenceModal;