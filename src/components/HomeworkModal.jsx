import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle, FaPencilAlt, FaTasks, FaStickyNote } from 'react-icons/fa';
import { taskStatusUtils } from '../utils/gradeUtils';
import { getHijriToday } from '../utils/recitationUtils';

// This StudentList component is defined here to keep the file self-contained.
const StudentList = ({ title, color, students, selectedStudents, toggleSelect, onSelectAll, taskType, homeworkCurriculum }) => {
    const isAllSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));

    const getStatusIcon = (text) => {
        switch (text) {
            case 'تم الحل': return <FaCheckCircle className="text-green-500" />;
            case 'لم يحل': return <FaTimesCircle className="text-red-500" />;
            case 'متأخر': return <FaClock className="text-yellow-500" />;
            case 'لا يوجد منهج': return <FaQuestionCircle className="text-gray-500" />;
            case 'حل جزئي': return <FaClock className="text-yellow-500" />;
            default: return null;
        }
    };

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
                {students.length > 0 ? students.map(student => {
                    const statusInfo = taskStatusUtils(student, homeworkCurriculum, taskType);
                    return (
                        <div key={student.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleSelect(student.id)}
                                    className={`form-checkbox accent-blue-500 text-white`}
                                />
                                <span className="mr-2 text-gray-100">{student.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(statusInfo.text)}
                                <span className="text-sm text-gray-400">({statusInfo.text})</span>
                            </div>
                        </div>
                    );
                }) : <p className="text-sm text-gray-400">لا يوجد طلاب في هذه الفئة.</p>}
            </div>
        </div>
    );
};

const HomeworkModal = ({ students, onClose, onSave, homeworkCurriculum }) => {
    const [mode, setMode] = useState('grading'); // 'grading' or 'note'
    const [taskType, setTaskType] = useState('homework'); 
    const [noteType, setNoteType] = useState('custom'); // 'custom' or 'template'
    const [gradeValue, setGradeValue] = useState(1);
    
    // States for notes
    const [customNote, setCustomNote] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [weekIndex, setWeekIndex] = useState(0);

    const [notCompletedStudents, setNotCompletedStudents] = useState([]);
    const [lateStudents, setLateStudents] = useState([]);
    const [fullyCompletedStudents, setFullyCompletedStudents] = useState([]);
    const [noneStudents, setNoneStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Note templates
    const noteTemplates = [
        { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
        { id: 'sleeping', text: 'يغلب عليه النوم في الفصل' },
        { id: 'distracted', text: 'غير منتبه أثناء الشرح' },
        { id: 'late_arrival', text: 'يتأخر في الحضور' },
        { id: 'improved', text: 'ظهر تحسن ملحوظ في الأداء' },
        { id: 'homework_incomplete', text: 'لم يكمل الواجب' },
        { id: 'homework_excellent', text: 'أنجز الواجب بشكل ممتاز' }
    ];
    
    // Derived state from new mode
    const isGradingMode = mode === 'grading';
    const isNoteMode = mode === 'note';

    const getTitle = () => {
        if (isNoteMode) return 'إدارة الملاحظات';
        if (taskType === 'homework') return 'إدارة كشف الواجبات';
        if (taskType === 'performanceTask') return 'إدارة كشف المهام الأدائية';
        if (taskType === 'test') return 'إدارة كشف الاختبارات';
        return '';
    };

    const getMaxGrade = () => {
        if (taskType === 'homework') return 10;
        if (taskType === 'performanceTask') return 5;
        if (taskType === 'test') return 15;
        return 10;
    };
    
    useEffect(() => {
        const notCompleted = [];
        const late = [];
        const fullyCompleted = [];
        const none = [];
        
        students.forEach(student => {
            const statusInfo = taskStatusUtils(student, homeworkCurriculum, taskType);
            if (statusInfo.text === 'لم يحل') notCompleted.push(student);
            else if (statusInfo.text === 'متأخر' || statusInfo.text === 'حل جزئي') late.push(student);
            else if (statusInfo.text === 'تم الحل') fullyCompleted.push(student);
            else if (statusInfo.text === 'لا يوجد منهج') none.push(student);
        });

        setNotCompletedStudents(notCompleted);
        setLateStudents(late);
        setFullyCompletedStudents(fullyCompleted);
        setNoneStudents(none);
        setSelectedStudents([]);
    }, [taskType, students, homeworkCurriculum]); // Removed `mode` from dependencies

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

        const today = getHijriToday();
        
        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                if (mode === 'note') {
                    const noteText = noteType === 'custom'
                        ? customNote
                        : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

                    if (!noteText.trim()) return student;

                    const formattedNote = `(${today}): ${noteText.trim()}`;
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
                } else if (mode === 'grading') {
                    const gradesKey = taskType === 'homework' ? 'homework' : taskType === 'performanceTask' ? 'performanceTasks' : 'tests';
                    const gradesArray = [...(student.grades[gradesKey] || [])];
                    
                    const firstUncompletedIndex = gradesArray.findIndex(grade => grade === null);
                    
                    if (firstUncompletedIndex !== -1) {
                        const updatedGrades = { ...student.grades, [gradesKey]: [...gradesArray] };
                        updatedGrades[gradesKey][firstUncompletedIndex] = gradeValue;
                        return { ...student, grades: updatedGrades };
                    }
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
        if (mode === 'grading' && (gradeValue === null || gradeValue === undefined)) return true;
        return false;
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                        <h3 className="text-xl font-bold text-gray-100">{getTitle()}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <button
                            onClick={() => {
                                setMode('grading');
                                setTaskType('homework');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'grading' && taskType === 'homework'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaTasks />
                            الواجبات
                        </button>
                        <button
                            onClick={() => {
                                setMode('grading');
                                setTaskType('performanceTask');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'grading' && taskType === 'performanceTask'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaBookOpen />
                            المهام الأدائية
                        </button>
                        <button
                            onClick={() => {
                                setMode('grading');
                                setTaskType('test');
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'grading' && taskType === 'test'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaPencilAlt />
                            الاختبارات
                        </button>
                        <button
                            onClick={() => setMode('note')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                mode === 'note' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            <FaStickyNote />
                            الملاحظات
                        </button>
                    </div>
                    {/* Student Status Display Section */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100">حال الطلاب في الواجب الحالي</h4>
                        <div className="flex items-center gap-4 mb-4">
                            <label className="text-sm font-medium text-gray-300">نوع المهمة:</label>
                            <div className="flex gap-4">
                                <label className="flex items-center text-gray-100">
                                    <input
                                        type="radio"
                                        name="taskTypeStatus"
                                        value="homework"
                                        checked={taskType === 'homework'}
                                        onChange={() => setTaskType('homework')}
                                        className="accent-blue-500 ml-2"
                                    />
                                    واجب
                                </label>
                                <label className="flex items-center text-gray-100">
                                    <input
                                        type="radio"
                                        name="taskTypeStatus"
                                        value="performanceTask"
                                        checked={taskType === 'performanceTask'}
                                        onChange={() => setTaskType('performanceTask')}
                                        className="accent-blue-500 ml-2"
                                    />
                                    مهمة أدائية
                                </label>
                                <label className="flex items-center text-gray-100">
                                    <input
                                        type="radio"
                                        name="taskTypeStatus"
                                        value="test"
                                        checked={taskType === 'test'}
                                        onChange={() => setTaskType('test')}
                                        className="accent-blue-500 ml-2"
                                    />
                                    اختبار
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StudentList
                                title="تم الحل"
                                color="green"
                                students={fullyCompletedStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(fullyCompletedStudents)}
                                taskType={taskType}
                                homeworkCurriculum={homeworkCurriculum}
                            />
                            <StudentList
                                title="متأخر/حل جزئي"
                                color="yellow"
                                students={lateStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(lateStudents)}
                                taskType={taskType}
                                homeworkCurriculum={homeworkCurriculum}
                            />
                            <StudentList
                                title="لم يتم الحل"
                                color="red"
                                students={notCompletedStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(notCompletedStudents)}
                                taskType={taskType}
                                homeworkCurriculum={homeworkCurriculum}
                            />
                            <StudentList
                                title="لا يوجد منهج"
                                color="gray"
                                students={noneStudents}
                                selectedStudents={selectedStudents}
                                toggleSelect={handleToggleSelect}
                                onSelectAll={() => handleSelectAll(noneStudents)}
                                taskType={taskType}
                                homeworkCurriculum={homeworkCurriculum}
                            />
                        </div>
                    </div>
                    {/* Action Section */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                        <h4 className="text-lg font-bold mb-4 text-gray-100">{isGradingMode ? 'تسجيل درجة' : 'إضافة ملاحظة'}</h4>
                        {isGradingMode ? (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    الدرجة (0 - {getMaxGrade()})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={getMaxGrade()}
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ) : (
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
                        )}
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

export default HomeworkModal;