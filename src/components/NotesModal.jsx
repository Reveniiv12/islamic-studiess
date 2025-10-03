// src/components/NotesModal.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

// ----------------------------------------------------------------------
// 1. مكون فرعي مُذَكَّر لعرض قائمة الطلاب (Memoized Component)
// ----------------------------------------------------------------------

const StudentListRenderer = ({ students, selectedStudents, toggleSelectAll, toggleStudent, allStudentsSelected }) => {
    return (
        <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
            <h4 className="font-semibold text-gray-100 mb-4">الطلاب</h4>
            <div className="flex items-center mb-4 pb-2 border-b border-gray-600">
                <input
                    type="checkbox"
                    checked={allStudentsSelected}
                    onChange={toggleSelectAll}
                    className="accent-blue-500 ml-2"
                />
                <label className="font-semibold text-gray-300">تحديد الكل</label>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {(students || []).map(student => (
                    <div
                        key={student.id}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.id) ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                        onClick={() => toggleStudent(student.id)}
                    >
                        {/* الإضافة المطلوبة: عرض صورة الطالب */}
                        <img 
                            src={student.photo || '/images/1.webp'} 
                            alt={student.name} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-500 ml-2"
                        />
                        <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            readOnly
                            className="accent-blue-500 ml-2"
                        />
                        <span className="text-gray-100">{student.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// استخدام React.memo لمنع إعادة تصيير هذا المكون ما لم تتغير خصائصه الضرورية
const MemoizedStudentList = memo(StudentListRenderer);

// ----------------------------------------------------------------------
// 2. المكون الرئيسي NotesModal (تم تطبيق useCallback على الدوال الممررة)
// ----------------------------------------------------------------------

const NotesModal = ({ students = [], onClose, onSave, onConfirmNotesClear }) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [noteType, setNoteType] = useState('custom');
  const [customNote, setCustomNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudentsSelected, setAllStudentsSelected] = useState(false);

const noteTemplates = [
  { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
  { id: 'sleeping', text: 'يغلب عليه النوم في الفصل' },
  { id: 'distracted', text: 'غير منتبه أثناء الشرح' },
  { id: 'late_general', text: 'يتأخر في الحضور' }, 
  { id: 'improved', text: 'ظهر تحسن ملحوظ في الأداء' },
  { id: 'late_note1', text: 'لوحظ عليك التأخر في الحضور للحصة الدراسية - ارجو الاهتمام' },
  { id: 'late_note2', text: 'التأخر عن الحصة الدراسية يؤثر سلباً على مستواك الدراسي - ارجو الاهتمام' },
  { id: 'quran_hw_thank', text: 'شكرا لك على حرصك واهتمامك بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
  { id: 'quran_hw_attention', text: 'ارجو الاهتمام بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
  { id: 'quran_hw_missing', text: 'لوحظ عليك عدم حل واجب مادة القرآن الكريم والدراسات الإسلامية - ارجو الاهتمام بحل الواجبات في منصة مدرستي' },
  { id: 'eating', text: 'لوحظ عليك تناول الطعام أثناء الدرس بدون استئذان - ارجو الالتزام والاهتمام' },
  { id: 'sleeping_note', text: 'نوم أثناء الحصة الدراسية' }, 
  { id: 'missing_book', text: 'عدم الاهتمام بإحضار الكتاب في الحصة الدراسية' },
  { id: 'missing_quran', text: 'عدم الاهتمام بإحضار القرآن الكريم في الحصة الدراسية' },
  { id: 'talking', text: 'كثرة كلام وإشغال زملائك عن الدرس' }
];

  useEffect(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const currentWeekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    setCurrentWeek(currentWeekNumber > 20 ? 20 : currentWeekNumber);
  }, []);

  const addNote = () => {
    const noteText = noteType === 'custom'
      ? customNote
      : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

    if (!noteText.trim() || selectedStudents.length === 0) {
      alert("يرجى اختيار الطلاب وإدخال الملاحظة أولاً.");
      return;
    }

    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(today);

    const newNote = `(${hijriDate}): ${noteText}`;

    const updatedStudents = (students || []).map(student => {
      if (!selectedStudents.includes(student.id)) return student;

      const weeklyNotes = Array.isArray(student.grades?.weeklyNotes)
        ? student.grades.weeklyNotes
        : Array(20).fill().map(() => []);

      const updatedWeeklyNotes = [...weeklyNotes];
      if (!Array.isArray(updatedWeeklyNotes[currentWeek - 1])) {
          updatedWeeklyNotes[currentWeek - 1] = [];
      }
      updatedWeeklyNotes[currentWeek - 1].push(newNote);

      return {
        ...student,
        grades: {
          ...student.grades,
          weeklyNotes: updatedWeeklyNotes
        }
      };
    });

    onSave(updatedStudents);
    setCustomNote('');
    setSelectedTemplate('');
    setSelectedStudents([]);
    setAllStudentsSelected(false);
  };

  const clearNotesForSelectedStudents = () => {
    if (selectedStudents.length === 0) {
      alert("يرجى اختيار الطلاب أولاً.");
      return;
    }
    onConfirmNotesClear(() => {
        const updatedStudents = (students || []).map(student => {
            if (selectedStudents.includes(student.id)) {
                // إنشاء نسخة من مصفوفة الملاحظات
                const weeklyNotes = Array.isArray(student.grades?.weeklyNotes)
                    ? [...student.grades.weeklyNotes]
                    : Array(20).fill().map(() => []);
                
                // مسح ملاحظات الأسبوع الحالي فقط
                weeklyNotes[currentWeek - 1] = [];

                return {
                    ...student,
                    grades: {
                        ...student.grades,
                        weeklyNotes: weeklyNotes
                    }
                };
            }
            return student;
        });

        onSave(updatedStudents);
        setSelectedStudents([]);
        setAllStudentsSelected(false);
    });
  };

    // استخدام useCallback لضمان ثبات مرجع الدالة عند تمريره للمكون المذكر
  const toggleSelectAll = useCallback(() => {
    if (allStudentsSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents((students || []).map(s => s.id));
    }
    setAllStudentsSelected(prev => !prev);
  }, [allStudentsSelected, students]);

  // استخدام useCallback لضمان ثبات مرجع الدالة عند تمريره للمكون المذكر
  const toggleStudent = useCallback((studentId) => {
    setSelectedStudents(prevSelected => {
        const isSelected = prevSelected.includes(studentId);
        const newSelected = isSelected
            ? prevSelected.filter(id => id !== studentId)
            : [...prevSelected, studentId];
        
        // تحديث حالة تحديد الكل
        const allCurrentlySelected = students.length > 0 && newSelected.length === students.length;
        setAllStudentsSelected(allCurrentlySelected);

        return newSelected;
    });
  }, [students.length]);


  const isAddNoteDisabled = () => {
    return selectedStudents.length === 0 ||
           (noteType === 'custom' && !customNote.trim()) ||
           (noteType === 'template' && !selectedTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-gray-100">إدارة الملاحظات</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">اختر الأسبوع</label>
                <select
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(Number(e.target.value))}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(20)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>الأسبوع {i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">نوع الملاحظة</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-gray-100">
                    <input
                      type="radio"
                      name="noteType"
                      value="custom"
                      checked={noteType === 'custom'}
                      onChange={() => setNoteType('custom')}
                      className="accent-blue-500 ml-2"
                    />
                    ملاحظة مخصصة
                  </label>
                  <label className="flex items-center text-gray-100">
                    <input
                      type="radio"
                      name="noteType"
                      value="template"
                      checked={noteType === 'template'}
                      onChange={() => setNoteType('template')}
                      className="accent-blue-500 ml-2"
                    />
                    قالب جاهز
                  </label>
                </div>
              </div>

              {noteType === 'custom' ? (
                <div className="mb-4">
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="اكتب ملاحظة..."
                    rows="4"
                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              ) : (
                <div className="mb-4">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر قالباً...</option>
                    {noteTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.text}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={addNote}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${isAddNoteDisabled() ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                  disabled={isAddNoteDisabled()}
                >
                  <FaPlus />
                  إضافة ملاحظة
                </button>
                <button
                  onClick={clearNotesForSelectedStudents}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${selectedStudents.length === 0 ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-500'}`}
                  disabled={selectedStudents.length === 0}
                >
                  <FaTrash />
                  حذف الملاحظات
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------------------------- */}
            {/* استخدام المكون المذّكر MemoizedStudentList هنا */}
            {/* ---------------------------------------------------------------------- */}
            <MemoizedStudentList
                students={students}
                selectedStudents={selectedStudents}
                toggleSelectAll={toggleSelectAll}
                toggleStudent={toggleStudent}
                allStudentsSelected={allStudentsSelected}
            />
            {/* ---------------------------------------------------------------------- */}
            
          </div>
        </div>

        <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;