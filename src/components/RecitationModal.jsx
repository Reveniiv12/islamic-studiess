// src/components/RecitationModal.jsx
import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaStickyNote, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle } from 'react-icons/fa';
import { getRecitationStatus, getHijriToday, compareHijriDates } from '../utils/recitationUtils';

const RecitationModal = ({ students, onClose, onSave, curriculum }) => {
    const [mode, setMode] = useState('recitation'); // 'recitation' or 'note'
    const [recitationType, setRecitationType] = useState('memorization');
    const [gradeValue, setGradeValue] = useState(10);
    
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
        { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
        { id: 'sleeping', text: 'يغلب عليه النوم في الفصل' },
        { id: 'distracted', text: 'غير منتبه أثناء الشرح' },
        { id: 'late_arrival', text: 'يتأخر في الحضور' },
        { id: 'improved', text: 'ظهر تحسن ملحوظ في الأداء' },
        { id: 'tlaawa_excellent', text: 'تلاوة ممتازة' },
        { id: 'tlaawa_needs_work', text: 'يحتاج تحسين في التلاوة' },
        { id: 'memorization_excellent', text: 'حفظ ممتاز' },
        { id: 'memorization_needs_work', text: 'يحتاج تحسين في الحفظ' }
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

        const today = getHijriToday();
        
        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                let studentRecord = {};
                let updatedGrades = { ...student.grades };
                
                if (mode === 'recitation') {
                    const gradesKey = recitationType === 'memorization' ? 'quranMemorization' : 'quranRecitation';
                    const gradesArray = [...(student.grades[gradesKey] || [])];
                    const relevantCurriculum = curriculum
                        .filter(c => c.type === recitationType)
                        .sort((a, b) => compareHijriDates(a.dueDate, b.dueDate));

                    const nextPartIndex = gradesArray.findIndex(grade => grade === null);

                    if (nextPartIndex !== -1 && relevantCurriculum[nextPartIndex]) {
                        const currentPart = relevantCurriculum[nextPartIndex];
                        studentRecord = {
                            date: today,
                            part: `${currentPart.start} - ${currentPart.end}`,
                            type: recitationType,
                            grade: gradeValue,
                            note: ''
                        };
                        updatedGrades = { ...student.grades, [gradesKey]: [...gradesArray] };
                        updatedGrades[gradesKey][nextPartIndex] = gradeValue;
                    } else {
                        return student; // No parts to grade
                    }
                } else if (mode === 'note') {
                    const noteText = noteType === 'custom'
                        ? customNote
                        : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

                    if (!noteText.trim()) return student;

                    const formattedNote = `(${today}): ${noteText.trim()}`;
                    const updatedWeeklyNotes = [...(student.grades.weeklyNotes || Array(16).fill(null).map(() => []))];
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
        if (mode === 'recitation' && (!gradeValue && gradeValue !== 0)) return true;
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
                            onClick={() => { setMode('recitation'); setRecitationType('memorization'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'recitation' && recitationType === 'memorization' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            <FaBookOpen /> حفظ القرآن
                        </button>
                        <button
                            onClick={() => { setMode('recitation'); setRecitationType('recitation'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'recitation' && recitationType === 'recitation' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            <FaBookOpen /> تلاوة القرآن
                        </button>
                        <button
                            onClick={() => { setMode('note'); setNoteType('custom'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'note' && noteType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            <FaStickyNote /> ملاحظة مخصصة
                        </button>
                        <button
                            onClick={() => { setMode('note'); setNoteType('template'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'note' && noteType === 'template' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            <FaStickyNote /> ملاحظة جاهزة
                        </button>
                    </div>
                    
                    {/* Student Status Display Section */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100">حال الطلاب في التسميع الحالي</h4>
                        <div className="flex items-center gap-4 mb-4">
                            <label className="text-sm font-medium text-gray-300">نوع التسميع:</label>
                            <div className="flex gap-4">
                                <label className="flex items-center text-gray-100">
                                    <input
                                        type="radio"
                                        name="recitationTypeStatus"
                                        value="memorization"
                                        checked={recitationType === 'memorization'}
                                        onChange={() => setRecitationType('memorization')}
                                        className="accent-blue-500 ml-2"
                                    />
                                    حفظ
                                </label>
                                <label className="flex items-center text-gray-100">
                                    <input
                                        type="radio"
                                        name="recitationTypeStatus"
                                        value="recitation"
                                        checked={recitationType === 'recitation'}
                                        onChange={() => setRecitationType('recitation')}
                                        className="accent-blue-500 ml-2"
                                    />
                                    تلاوة
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {students.length > 0 ? (
                                students.map(student => {
                                    const status = getRecitationStatus(student, recitationType, curriculum).status;
                                    const statusText = status === 'not_memorized' ? 'لم يسمع' : status === 'late' ? 'متأخر' : status === 'fully_recited' ? 'تم التسميع' : 'لا يوجد منهج';
                                    return (
                                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-600 bg-gray-800">
                                            <span className="text-gray-100 font-semibold">{student.name}</span>
                                            <div className="flex items-center gap-2">
                                                {getIcon(status)}
                                                <span className={`text-sm ${status === 'fully_recited' ? 'text-green-400' : status === 'not_memorized' ? 'text-red-400' : status === 'late' ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-400 text-center">لا يوجد طلاب في هذا الفصل.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-700">
                         <h4 className="font-bold mb-2 text-gray-100">إجراء على الطلاب المحددين ({selectedStudents.length})</h4>
                        
                        {mode === 'recitation' && (
                            <div className="flex items-center space-x-4 mb-4">
                                <label className="text-sm font-medium text-gray-300">درجة التسميع:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(Number(e.target.value))}
                                    className="w-20 p-2 border border-gray-600 rounded text-center bg-gray-800 text-white"
                                />
                            </div>
                        )}
                        
                        {mode === 'note' && (
                             <div className="mb-4">
                                 <label className="block text-sm font-medium text-gray-300 mb-1">
                                     اختر الأسبوع:
                                 </label>
                                 <select
                                     value={weekIndex}
                                     onChange={(e) => setWeekIndex(Number(e.target.value))}
                                     className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
                                 >
                                     {[...Array(16).keys()].map((_, i) => (
                                         <option key={i} value={i}>الأسبوع {i + 1}</option>
                                     ))}
                                 </select>
                             </div>
                        )}

                        {mode === 'note' && noteType === 'custom' && (
                            <div className="relative">
                                <button
                                    onClick={handleSelectAllStudents}
                                    className="absolute top-2 left-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    تحديد الكل
                                </button>
                                <textarea
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    placeholder="اكتب ملاحظتك هنا..."
                                    className="w-full p-3 border border-gray-600 rounded h-32 bg-gray-800 text-white placeholder-gray-400"
                                />
                            </div>
                        )}
                        
                        {mode === 'note' && noteType === 'template' && (
                            <div className="relative">
                                <button
                                    onClick={handleSelectAllStudents}
                                    className="absolute top-2 left-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    تحديد الكل
                                </button>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
                                >
                                    <option value="">اختر ملاحظة جاهزة</option>
                                    {noteTemplates.map(template => (
                                        <option key={template.id} value={template.id}>{template.text}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <StudentList 
                                title="لم يحفظ 🔴" 
                                color="red" 
                                students={notMemorizedStudents} 
                                selectedStudents={selectedStudents} 
                                toggleSelect={handleToggleSelect} 
                                onSelectAll={() => handleSelectAll(notMemorizedStudents)} 
                            />
                            <StudentList 
                                title="متأخر 🟡" 
                                color="yellow" 
                                students={lateStudents} 
                                selectedStudents={selectedStudents} 
                                toggleSelect={handleToggleSelect} 
                                onSelectAll={() => handleSelectAll(lateStudents)} 
                            />
                            <StudentList 
                                title="مسمع كامل 🟢" 
                                color="green" 
                                students={fullyRecitedStudents} 
                                selectedStudents={selectedStudents} 
                                toggleSelect={handleToggleSelect} 
                                onSelectAll={() => handleSelectAll(fullyRecitedStudents)} 
                            />
                            <StudentList 
                                title="لا يوجد جزء ⚪" 
                                color="gray" 
                                students={noneStudents} 
                                selectedStudents={selectedStudents} 
                                toggleSelect={handleToggleSelect} 
                                onSelectAll={() => handleSelectAll(noneStudents)} 
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end gap-2">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors ${isSaveDisabled() ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500'}`}
                        disabled={isSaveDisabled()}
                    >
                        <FaSave />
                        حفظ
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

const StudentList = ({ title, color, students, selectedStudents, toggleSelect, onSelectAll }) => {
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
                    <div key={student.id} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className={`form-checkbox accent-blue-500 text-white`}
                        />
                        <span className="mr-2 text-gray-100">{student.name}</span>
                    </div>
                )) : <p className="text-sm text-gray-400">لا يوجد طلاب في هذه الفئة.</p>}
            </div>
        </div>
    );
};

export default RecitationModal;