// src/components/RecitationModal.jsx
import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaStickyNote, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle } from 'react-icons/fa';
import { getRecitationStatus } from '../utils/recitationUtils';

const RecitationModal = ({ students, onClose, onSave, curriculum }) => {
    // تم الإبقاء على الوضع الافتراضي 'note' لتجنب كسر منطق الإضافة المخصص
    // لكن سيتم فرض العرض على أساس وضع الملاحظات فقط بعد حذف أزرار التبديل.
    const [mode, setMode] = useState('note'); // 'recitation' or 'note'
    const [recitationType, setRecitationType] = useState('memorization');
    
    // States for notes
    const [noteType, setNoteType] = useState('custom'); // 'custom' or 'template'
    const [customNote, setCustomNote] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [weekIndex, setWeekIndex] = useState(0); // New state for week selection
    
    const [notMemorizedStudents, setNotMemorizedStudents] = useState([]);
    const [lateStudents, setLateStudents] = useState([]);
    const [fullyRecitedStudents, setFullyRecitedStudents] = useState([]);
    const [noneStudents, setNoneStudents] = useState([]);

    const [selectedStudents, setSelectedStudents] = useState([]);

const noteTemplates = [
    // العبارات الأصلية
    { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
    { id: 'sleeping_general', text: 'يغلب عليه النوم في الفصل' }, // تم تعديل ID لتجنب التكرار
    { id: 'distracted', text: 'غير منتبه أثناء الشرح' },
    { id: 'late_arrival', text: 'يتأخر في الحضور' },
    { id: 'improved', text: 'ظهر تحسن ملحوظ في الأداء' },
    { id: 'tlaawa_excellent', text: 'تلاوة ممتازة' },
    { id: 'tlaawa_needs_work', text: 'يحتاج تحسين في التلاوة' },
    { id: 'memorization_excellent', text: 'حفظ ممتاز' },
    { id: 'memorization_needs_work', text: 'يحتاج تحسين في الحفظ' },

    // العبارات الجديدة المُضافة
    { id: 'late_note1', text: 'لوحظ عليك التأخر في الحضور للحصة الدراسية - ارجو الاهتمام' },
    { id: 'late_note2', text: 'التأخر عن الحصة الدراسية يؤثر سلباً على مستواك الدراسي - ارجو الاهتمام' },
    { id: 'quran_hw_thank', text: 'شكرا لك على حرصك واهتمامك بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
    { id: 'quran_hw_attention', text: 'ارجو الاهتمام بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
    { id: 'quran_hw_missing', text: 'لوحظ عليك عدم حل واجب مادة القرآن الكريم والدراسات الإسلامية - ارجو الاهتمام بحل الواجبات في منصة مدرستي' },
    { id: 'eating_in_class', text: 'لوحظ عليك تناول الطعام أثناء الدرس بدون استئذان - ارجو الالتزام والاهتمام' },
    { id: 'sleeping_in_class', text: 'نوم أثناء الحصة الدراسية' },
    { id: 'missing_book', text: 'عدم الاهتمام بإحضار الكتاب في الحصة الدراسية' },
    { id: 'missing_quran', text: 'عدم الاهتمام بإحضار القرآن الكريم في الحصة الدراسية' },
    { id: 'talking_disruptive', text: 'كثرة كلام وإشغال زملائك عن الدرس' }
];

    useEffect(() => {
        const notMemorized = [];
        const late = [];
        const fullyRecited = [];
        const none = [];

        students.forEach(student => {
            const status = getRecitationStatus(student, recitationType, curriculum).status;
            if (status === 'not_memorized') notMemorized.push(student);
            else if (status === 'late') late.push(student);
            else if (status === 'fully_recited') fullyRecited.push(student);
            else if (status === 'none') none.push(student);
        });

        setNotMemorizedStudents(notMemorized);
        setLateStudents(late);
        setFullyRecitedStudents(fullyRecited);
        setNoneStudents(none);
        setSelectedStudents([]);
    }, [recitationType, students, curriculum, mode]);

    const handleToggleSelect = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (list) => {
        const listIds = list.map(s => s.id);
        const allSelected = listIds.every(id => selectedStudents.includes(id));
        if (allSelected) {
            setSelectedStudents(prev => prev.filter(id => !listIds.includes(id)));
        } else {
            setSelectedStudents(prev => [...new Set([...prev, ...listIds])]);
        }
    };

    const handleSelectAllStudents = () => {
        const allStudentIds = students.map(s => s.id);
        const allSelected = allStudentIds.every(id => selectedStudents.includes(id));
        if (allSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(allStudentIds);
        }
    };

    const handleSave = () => {
        if (selectedStudents.length === 0) {
            alert("يرجى تحديد الطلاب");
            return;
        }

        // تم استبدال getHijriToday() بالطريقة الجديدة
        const today = new Date();
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);
        
        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                let studentRecord = {};
                let updatedGrades = { ...student.grades };
                
                if (mode === 'note') {
                    const noteText = noteType === 'custom'
                        ? customNote
                        : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

                    if (!noteText.trim()) return student;

                    const formattedNote = `(${hijriDate}): ${noteText.trim()}`;
                    const updatedWeeklyNotes = [...(student.grades.weeklyNotes || Array(20).fill(null).map(() => []))];
                    if (!Array.isArray(updatedWeeklyNotes[weekIndex])) {
                        updatedWeeklyNotes[weekIndex] = [];
                    }
                    updatedWeeklyNotes[weekIndex] = [...updatedWeeklyNotes[weekIndex], formattedNote];
                    return {
                        ...student,
                        grades: {
                            ...student.grades,
                            weeklyNotes: updatedWeeklyNotes,
                        },
                    };
                }
                
                if (Object.keys(studentRecord).length > 0) {
                    const recitationHistory = Array.isArray(student.recitationHistory) ? student.recitationHistory : [];
                    return {
                        ...student,
                        grades: updatedGrades,
                        recitationHistory: [...recitationHistory, studentRecord]
                    };
                }
            }
            return student;
        });

        onSave(updatedStudents);
        onClose();
    };

    const isSaveDisabled = () => {
        if (selectedStudents.length === 0) return true;
        if (mode === 'note' && noteType === 'custom' && !customNote.trim()) return true;
        if (mode === 'note' && noteType === 'template' && !selectedTemplate) return true;
        return false;
    };
    
    const getIcon = (status) => {
        switch (status) {
            case 'fully_recited': return <FaCheckCircle className="text-green-500" />;
            case 'not_memorized': return <FaTimesCircle className="text-red-500" />;
            case 'late': return <FaClock className="text-yellow-500" />;
            case 'none': return <FaQuestionCircle className="text-gray-500" />;
            default: return null;
        }
    };
    
    const StudentList = ({ title, students, selectedStudents, toggleSelect, onSelectAll, color }) => {
        const isAllSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));
        return (
            <div className={`border border-gray-600 rounded-lg p-4 bg-gray-700 overflow-y-auto max-h-[250px]`}>
                <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-bold text-${color}-400`}>{title}</h4>
                    {students.length > 0 && (
                        <button
                            onClick={onSelectAll}
                            className={`text-sm py-1 px-2 rounded ${isAllSelected ? 'bg-gray-600 text-gray-100' : 'bg-blue-600 text-white'}`}
                        >
                            {isAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {students.length > 0 ? students.map(student => (
                        <div key={student.id} className="flex items-center text-gray-200">
                            <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => toggleSelect(student.id)}
                                className={`form-checkbox accent-${color}-500`}
                            />
                            <span className="mr-2">{student.name}</span>
                        </div>
                    )) : <p className="text-sm text-gray-400">لا يوجد طلاب في هذه الفئة.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                        <h3 className="text-xl font-bold text-gray-100">إدارة كشف التسميع</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => {
                                setMode('recitation');
                                setRecitationType('memorization');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'recitation' && recitationType === 'memorization'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaBookOpen />
                            حفظ القرآن
                        </button>
                        <button
                            onClick={() => {
                                setMode('recitation');
                                setRecitationType('recitation');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'recitation' && recitationType === 'recitation'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaBookOpen />
                            تلاوة القرآن
                        </button>
                        {/* تم حذف زر ملاحظة مخصصة */}
                        {/* تم حذف زر ملاحظة جاهزة */}
                    </div>

                    {/* Student Status Display Section */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100">حال الطلاب في التسميع الحالي</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StudentList
                                title="تم التسميع"
                                color="green"
                                students={fullyRecitedStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(fullyRecitedStudents)}
                            />
                            <StudentList
                                title="متأخر"
                                color="yellow"
                                students={lateStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(lateStudents)}
                            />
                            <StudentList
                                title="لم يتم التسميع"
                                color="red"
                                students={notMemorizedStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(notMemorizedStudents)}
                            />
                            <StudentList
                                title="لا يوجد منهج"
                                color="gray"
                                students={noneStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(noneStudents)}
                            />
                        </div>
                    </div>

                    {/* Action Section */}
                    {/* سيتم إبقاء هذا القسم على حاله لغرض إضافة الملاحظات */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                        <h4 className="text-lg font-bold mb-4 text-gray-100">إضافة ملاحظة</h4>
                        <>
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
                                    <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظة مخصصة</label>
                                    <textarea
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder="اكتب ملاحظة..."
                                        rows="4"
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        style={{ touchAction: 'manipulation' }}
                                    ></textarea>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">قالب ملاحظة جاهز</label>
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
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">الأسبوع</label>
                                <select
                                    value={weekIndex}
                                    onChange={(e) => setWeekIndex(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {Array(20).fill().map((_, i) => (
                                        <option key={i} value={i}>الأسبوع {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isSaveDisabled() ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500'}`}
                                disabled={isSaveDisabled()}
                            >
                                <FaSave />
                                حفظ
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end gap-2">
                    <button
                        onClick={handleSelectAllStudents}
                        className={`bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors font-semibold`}
                    >
                        {students.length > 0 && students.every(s => selectedStudents.includes(s.id)) ? 'إلغاء تحديد الكل' : 'تحديد جميع الطلاب'}
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors font-semibold"
                    >
                        <FaTimes />
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecitationModal;