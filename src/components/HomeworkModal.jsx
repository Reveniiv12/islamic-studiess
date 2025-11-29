import React, { useState, useEffect, useMemo } from 'react';
// تم استيراد FaCalendarAlt لتكتمل قائمة الأيقونات
import { FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle, FaStickyNote, FaUsers, FaPaperPlane, FaUserCircle, FaBookOpen, FaPencilAlt, FaTasks, FaCalendarAlt } from 'react-icons/fa';
import { taskStatusUtils } from '../utils/gradeUtils';

// =================================================================
// B. StudentList Component (تم التعديل لإضافة صورة الطالب)
// =================================================================

const StudentList = ({ title, color, students, selectedStudents, toggleSelect, onSelectAll }) => {
    const isAllSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));

    const getStatusIcon = (text) => {
        switch (text) {
            case 'تم الحل': return <FaCheckCircle className="text-green-400 text-lg" />;
            case 'لم يحل': return <FaTimesCircle className="text-red-400 text-lg" />;
            case 'متأخر':
            case 'حل جزئي': return <FaClock className="text-yellow-400 text-lg" />;
            case 'لا يوجد منهج': return <FaQuestionCircle className="text-gray-500 text-lg" />;
            default: return null;
        }
    };

    return (
        <div className={`border border-gray-600 rounded-xl p-4 bg-gray-700 shadow-inner-lg overflow-y-auto max-h-[450px]`}>
            <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                <h4 className={`font-bold text-${color}-400 flex items-center gap-2 text-lg`}>{title} ({students.length})</h4>
                {students.length > 0 && (
                    <button
                        onClick={onSelectAll}
                        className={`text-sm py-1 px-3 rounded-full transition-all duration-200 shadow-md ${isAllSelected ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                    >
                        {isAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {students.length > 0 ? students.map(student => {
                    const statusText = student.tempStatusInfo?.text || 'جارٍ التحديث'; 
                    const isSelected = selectedStudents.includes(student.id);

                    return (
                        <div 
                            key={student.id} 
                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-150 cursor-pointer 
                                ${isSelected ? 'bg-blue-800/60 ring-2 ring-blue-500' : 'hover:bg-gray-600/70 bg-gray-800'}`}
                            onClick={() => toggleSelect(student.id)}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => { e.stopPropagation(); toggleSelect(student.id); }} 
                                    className={`form-checkbox accent-blue-500 text-white w-5 h-5`}
                                />
                                {/* التعديل: استخدام صورة الطالب */}
                                <img 
                                    src={student.photo || '/images/1.webp'} 
                                    alt={student.name} 
                                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
                                />
                                <span className="text-gray-100 font-medium text-base">{student.name}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-900/50 px-2 py-1 rounded-full text-xs">
                                {getStatusIcon(statusText)}
                                <span className="text-gray-300">({statusText})</span>
                            </div>
                        </div>
                    );
                }) : <p className="text-sm text-gray-400 p-2 text-center">لا يوجد طلاب في هذه الفئة.</p>}
            </div>
        </div>
    );
};

// =================================================================
// A. HomeworkModal Component (المكوّن الرئيسي)
// =================================================================

const noteTemplates = [
    { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
    { id: 'homework_incomplete', text: 'لم يكمل الواجب' },
    { id: 'homework_excellent', text: 'أنجز الواجب بشكل ممتاز' },
    { id: 'quran_hw_attention', text: 'ارجو الاهتمام بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
    { id: 'quran_hw_missing', text: 'لوحظ عليك عدم حل واجب مادة القرآن الكريم والدراسات الإسلامية - ارجو الاهتمام بحل الواجبات في منصة مدرستي' },
    { id: 'talking_disruptive', text: 'كثرة كلام وإشغال زملائك عن الدرس' }
];

const HomeworkModal = ({ students, onClose, onSave, homeworkCurriculum, handleDialog }) => {
    // A. حالات داخلية (state)
    const [taskType, setTaskType] = useState('homework'); 
    const [taskNumber, setTaskNumber] = useState(0); 
    const [noteType, setNoteType] = useState('custom');
    const [customNote, setCustomNote] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isSending, setIsSending] = useState(false); 
    
    // **NEW STATE: أسبوع حفظ الملاحظة (1-20)**
    const [noteWeekIndex, setNoteWeekIndex] = useState(1); 
    
    // B. تصنيف الطلاب
    const [solvedStudents, setSolvedStudents] = useState([]);
    const [notSolvedStudents, setNotSolvedStudents] = useState([]);

    // 1. حساب أرقام المهام المتاحة بناءً على homeworkCurriculum
    const availableTaskNumbers = useMemo(() => {
        const filteredTasks = homeworkCurriculum
            .filter(task => task.type === taskType)
            .map(task => {
                const match = task.name.match(/\d+$/);
                return match ? parseInt(match[0], 10) : null;
            })
            .filter(num => num !== null)
            .sort((a, b) => a - b);
        
        return filteredTasks;
    }, [taskType, homeworkCurriculum]);

    // 2. useEffect لتعيين رقم المهمة الافتراضي عند تغيير taskType أو تحميل المنهج
    useEffect(() => {
        if (availableTaskNumbers.length > 0 && (taskNumber === 0 || !availableTaskNumbers.includes(taskNumber))) {
            const defaultTaskNumber = availableTaskNumbers[0];
            setTaskNumber(defaultTaskNumber);
            // تعيين أسبوع الملاحظة الافتراضي ليكون نفس رقم المهمة المحددة
            setNoteWeekIndex(defaultTaskNumber);
        } else if (availableTaskNumbers.length === 0) {
            setTaskNumber(0); 
            // تعيين أسبوع الملاحظة إلى القيمة الافتراضية 1 عند عدم وجود مهام
            setNoteWeekIndex(1);
        }
    }, [taskType, availableTaskNumbers]);

    // 3. useEffect لتصنيف الطلاب بناءً على المهمة المحددة (taskNumber) - **المنطق المُصحَّح والنهائي**
    useEffect(() => {
        const solved = [];
        const notSolved = [];
        
        if (taskNumber > 0) {
            const weekIndex = taskNumber - 1;
            
            students.forEach(student => {
                const studentWithStatus = { ...student };
                
                // تحديد مصفوفة الدرجات الصحيحة بناءً على taskType
                let taskGradesArray;
                if (taskType === 'performanceTask') {
                    taskGradesArray = student.grades.performanceTasks;
                } else if (taskType === 'test') {
                     taskGradesArray = student.grades.tests;
                } else { // homework
                    taskGradesArray = student.grades.homework;
                }

                // تحديد قيمة الدرجة (القيمة المحفوظة في سجل الطالب)
                const gradeValue = Array.isArray(taskGradesArray) && weekIndex >= 0 && weekIndex < taskGradesArray.length
                    ? taskGradesArray[weekIndex]
                    : null; 
                
                // 1. التحقق من وجود المهمة في المنهج (هل يجب على الطالب حلها؟)
                const isTaskAvailableInCurriculum = homeworkCurriculum.some(
                    item => {
                        const match = item.name.match(/\d+$/);
                        return item.type === (taskType === 'performanceTask' ? 'performanceTask' : taskType) && (match ? parseInt(match[0], 10) : null) === taskNumber;
                    }
                );
                
                let statusText;
                
                if (!isTaskAvailableInCurriculum) {
                    statusText = 'لا يوجد منهج';
                } else {
                    // 2. التحقق من أن القيمة هي قيمة حقيقية (مُنجزة)
                    // القيمة تُعتبر منجزة إذا كانت:
                    // أ) ليست null / undefined / سلسلة فارغة
                    // ب) ليست القيمة الرقمية صفر (0) ما لم يكن الواجب يستحق صفر كحد أقصى!
                    
                    const isInputPresent = (gradeValue !== null && gradeValue !== undefined && gradeValue !== '');
                    const isNumericAndPositive = isInputPresent && Number(gradeValue) > 0;
                    
                    // إذا كان الواجب يستحق 0 أو أكثر (مثل الاختبارات والمهام)، أي قيمة مدخلة تعني محاولة/حل
                    // إذا كان الواجب يستحق 1 (مثل الواجبات والمشاركات)، أي 1 تعني حل كامل
                    
                    const isSolved = isNumericAndPositive; // نعتبر أي قيمة رقمية موجبة تعني "تم الحل"
                    
                    if (isSolved) {
                        statusText = 'تم الحل';
                    } else {
                        // إذا كانت المهمة موجودة لكن القيمة مفقودة (null, '', 0)، تصنف "لم يحل"
                        statusText = 'لم يحل';
                    }
                }

                // التصنيف النهائي:
                studentWithStatus.tempStatusInfo = { text: statusText };
                
                if (statusText === 'تم الحل') {
                    solved.push(studentWithStatus);
                } else {
                    // "لم يحل" و "لا يوجد منهج" يذهبان إلى قائمة المتعثرين
                    notSolved.push(studentWithStatus); 
                }
            });
        }

        setSolvedStudents(solved);
        setNotSolvedStudents(notSolved);
        
        setSelectedStudents([]); 
    }, [taskType, taskNumber, students, homeworkCurriculum]); 
    // **نهاية المنطق المُصحَّح والنهائي**


    // دالة للتحقق من إمكانية الإضافة
    const isAddNoteDisabled = () => {
        if (selectedStudents.length === 0) return true; // يجب تحديد طلاب
        if (noteWeekIndex < 1 || noteWeekIndex > 20) return true; // يجب اختيار أسبوع صالح
        return (noteType === 'custom' && !customNote.trim()) ||
               (noteType === 'template' && !selectedTemplate);
    };

    // 4.3 اختيار/إلغاء اختيار 
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
        const allStudentIds = [...solvedStudents.map(s => s.id), ...notSolvedStudents.map(s => s.id)];
        const allSelected = allStudentIds.every(id => selectedStudents.includes(id));
        if (allSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(allStudentIds);
        }
    };

    // 4.4 حفظ / إرسال ملاحظة
    const handleSendNote = () => {
        if (isAddNoteDisabled()) {
            if (handleDialog) {
                 handleDialog("خطأ", "يرجى اختيار الطلاب وتحديد الملاحظة والأسبوع أولاً.", "error");
            } else {
                 alert("يرجى اختيار الطلاب وتحديد الملاحظة والأسبوع أولاً.");
            }
            return;
        }

        setIsSending(true);

        const finalNoteText = noteType === 'custom'
            ? customNote.trim()
            : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

        // **استخدام noteWeekIndex (رقم الأسبوع) للحفظ**
        const weekIndex = noteWeekIndex - 1; 
        
        const today = new Date();
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);

        // 🚨 التعديل هنا: تم حذف جزء " - أسبوع ${noteWeekIndex}" من صياغة الملاحظة
        const newNote = `(${hijriDate}): ${finalNoteText}`;

        const updatedStudents = (students || []).map(student => {
            if (!selectedStudents.includes(student.id)) return student;

            const weeklyNotes = Array.isArray(student.grades?.weeklyNotes)
                ? student.grades.weeklyNotes
                : Array(20).fill().map(() => []);

            const updatedWeeklyNotes = [...weeklyNotes];
            if (!Array.isArray(updatedWeeklyNotes[weekIndex])) {
                updatedWeeklyNotes[weekIndex] = [];
            }
            updatedWeeklyNotes[weekIndex].push(newNote);

            return {
                ...student,
                grades: {
                    ...student.grades,
                    weeklyNotes: updatedWeeklyNotes
                }
            };
        });

        onSave(updatedStudents);
        
        setTimeout(() => {
            onClose(); 
            const message = `تم إضافة الملاحظة بنجاح وحفظها في الأسبوع ${noteWeekIndex} لـ ${selectedStudents.length} طالب.`;
            
            if (handleDialog) {
                handleDialog("نجاح", message, "success");
            } 
            
            setCustomNote('');
            setSelectedTemplate('');
            setSelectedStudents([]);
            setIsSending(false);
        }, 1500); 
    };
    
    // بيانات أزرار اختيار نوع المهمة
    const taskTypeOptions = [
        { value: 'homework', label: 'واجب', icon: <FaPencilAlt /> },
        { value: 'performanceTask', label: 'مهمة أدائية', icon: <FaTasks /> },
        { value: 'test', label: 'اختبار', icon: <FaBookOpen /> },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div dir="rtl" className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-700 transform transition-all duration-300">
                
                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center bg-gray-900 border-b border-gray-700 shadow-lg">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
                        <FaUsers className="text-blue-400"/> إدارة المهام والملاحظات
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-3xl leading-none font-semibold transition-colors">&times;</button>
                </div>
                
                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-grow bg-gray-800">
                    
                    {/* 1. Task Selection Panel (لوحة اختيار المهمة - تصميم عصري) */}
                    <div className="bg-gray-700 p-5 rounded-2xl shadow-xl border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaClock className="text-yellow-400"/> تحديد المهمة للفرز
                        </h4>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-600/50 rounded-xl">
                            
                            {/* Segmented Buttons for Task Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">نوع المهمة:</label>
                                <div className="flex bg-gray-900 p-1 rounded-full shadow-inner border border-gray-700">
                                    {taskTypeOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setTaskType(option.value)}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
                                                ${taskType === option.value
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                        >
                                            {option.icon}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Dropdown for Task Number */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-300">رقم الواجب/المهمة:</label>
                                <select
                                    value={taskNumber}
                                    onChange={(e) => setTaskNumber(Number(e.target.value))}
                                    className="p-3 border border-gray-600 rounded-xl bg-gray-900 text-white text-base shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-all duration-200"
                                    disabled={availableTaskNumbers.length === 0}
                                >
                                    {availableTaskNumbers.length === 0 ? (
                                        <option value={0}>لا توجد مهام متاحة</option>
                                    ) : (
                                        availableTaskNumbers.map(num => (
                                            <option key={num} value={num}>رقم {num}</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Student Status Display Section (عرض حالات الطلاب) */}
                    <div className="bg-gray-700 p-5 rounded-2xl shadow-xl border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaUsers className="text-blue-400"/> حالة الطلاب للمهمة المحددة
                        </h4>
                        {taskNumber > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StudentList
                                    title="تم الحل"
                                    color="green"
                                    students={solvedStudents}
                                    selectedStudents={selectedStudents}
                                    toggleSelect={handleToggleSelect}
                                    onSelectAll={() => handleSelectAll(solvedStudents)}
                                />
                                <StudentList
                                    title="لم يتم الحل / متعثر"
                                    color="red"
                                    students={notSolvedStudents}
                                    selectedStudents={selectedStudents}
                                    toggleSelect={handleToggleSelect}
                                    onSelectAll={() => handleSelectAll(notSolvedStudents)}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 p-4 bg-gray-600/50 rounded-xl border border-gray-500">
                                يرجى تحديد نوع ورقم المهمة لعرض حالة الطلاب.
                            </p>
                        )}
                    </div>
                    
                    {/* 3. Action Bar / Note Action Section (شريط الإجراءات - تصميم محسّن مع الأسبوع) */}
                    <div className="bg-gray-700 p-5 rounded-2xl shadow-xl border border-gray-600">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaStickyNote className="text-yellow-400"/>
                            إرسال ملاحظة (لـ {selectedStudents.length} طلاب محددين)
                        </h4>
                        
                        <div className="flex flex-col gap-4">
                            
                            {/* NEW: اختيار الأسبوع لحفظ الملاحظة */}
                            <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-xl border border-gray-600">
                                <FaCalendarAlt className="text-xl text-cyan-400"/>
                                <label className="text-sm font-medium text-gray-300">الأسبوع المراد حفظ الملاحظة فيه:</label>
                                <select
                                    value={noteWeekIndex}
                                    onChange={(e) => setNoteWeekIndex(Number(e.target.value))}
                                    className="p-2 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                                    disabled={isSending}
                                >
                                    {Array(20).fill().map((_, i) => (
                                        <option key={i + 1} value={i + 1}>الأسبوع {i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* نوع الملاحظة */}
                            <div className="mb-4 border-b border-gray-600 pb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">نوع الملاحظة</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center text-gray-100 cursor-pointer">
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
                                    <label className="flex items-center text-gray-100 cursor-pointer">
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
                            
                            {/* حقل الإدخال أو القالب */}
                            {noteType === 'custom' ? (
                                <div className="mb-4">
                                    <textarea
                                        value={customNote}
                                        onChange={(e) => setCustomNote(e.target.value)}
                                        placeholder={`اكتب ملاحظة مخصصة ليتم حفظها في الأسبوع رقم ${noteWeekIndex}...`}
                                        rows="3"
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                                        disabled={isSending}
                                    ></textarea>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                                        disabled={isSending}
                                    >
                                        <option value="">اختر قالباً...</option>
                                        {noteTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.text}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={handleSendNote}
                                disabled={isAddNoteDisabled() || isSending}
                                className={`px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 transform shadow-lg
                                    ${!isAddNoteDisabled() && !isSending
                                        ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white hover:shadow-green-500/50 hover:scale-[1.02]'
                                        : 'bg-gray-500 text-gray-300 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {isSending ? (
                                    <>
                                        <FaPaperPlane className="animate-pulse" />
                                        جارٍ الإرسال والحفظ...
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane />
                                        إرسال وحفظ الملاحظة
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (تحديد الكل وإغلاق) */}
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between gap-3 shadow-top">
                    <button
                        onClick={handleSelectAllStudents}
                        className={`bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-500 transition-colors font-semibold shadow-md`}
                        disabled={solvedStudents.length + notSolvedStudents.length === 0}
                    >
                        {selectedStudents.length === (solvedStudents.length + notSolvedStudents.length) && (solvedStudents.length + notSolvedStudents.length) > 0 ? 'إلغاء تحديد جميع الطلاب' : 'تحديد جميع الطلاب'}
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-500 transition-colors font-semibold flex items-center gap-1 shadow-md"
                    >
                        <FaTimes />
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeworkModal;
