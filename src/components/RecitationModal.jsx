// src/components/RecitationModal.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { FaBookOpen, FaStickyNote, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle, FaUsers, FaPaperPlane, FaCalendarAlt, FaUserCircle, FaMicrophone } from 'react-icons/fa';
import { getRecitationStatus } from '../utils/recitationUtils'; // نحتفظ بها، لكن لن نستخدمها في الفرز المباشر

// =================================================================
// StudentList Component (للعرض الثنائي) - تم التعديل لإضافة صورة الطالب
// =================================================================

const StudentList = ({ title, color, students, selectedStudents, toggleSelect, onSelectAll }) => {
    const isAllSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));

    const getStatusIcon = (text) => {
        switch (text) {
            case 'تم التسميع': return <FaCheckCircle className="text-green-400 text-lg" />;
            case 'لم يسمع': 
            case 'متأخر': return <FaTimesCircle className="text-red-400 text-lg" />;
            case 'لا يوجد منهج': return <FaQuestionCircle className="text-gray-500 text-lg" />;
            default: return <FaClock className="text-yellow-400 text-lg" />; 
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
// RecitationModal Component
// =================================================================

const RecitationModal = ({ students, onClose, onSave, curriculum }) => {
    
    const [recitationType, setRecitationType] = useState('memorization');
    const [noteType, setNoteType] = useState('custom');
    const [customNote, setCustomNote] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [weekIndex, setWeekIndex] = useState(-1); // فهرس المهمة (0, 1, 2...)
    
    const [noteWeekIndex, setNoteWeekIndex] = useState(1); 

    const [solvedStudents, setSolvedStudents] = useState([]);
    const [notSolvedStudents, setNotSolvedStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

const noteTemplates = [
    { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
    { id: 'tlaawa_excellent', text: 'تلاوة ممتازة' },
    { id: 'memorization_excellent', text: 'حفظ ممتاز' },
    { id: 'tlaawa_needs_work', text: 'يحتاج تحسين في التلاوة' },
    { id: 'memorization_needs_work', text: 'يحتاج تحسين في الحفظ' },
    { id: 'late_note1', text: 'لوحظ عليك التأخر في الحضور للحصة الدراسية - ارجو الاهتمام' },
    { id: 'quran_hw_attention', text: 'ارجو الاهتمام بحل واجبات مادة القرآن الكريم والدراسات الإسلامية في منصة مدرستي' },
    { id: 'sleeping_in_class', text: 'نوم أثناء الحصة الدراسية' },
    { id: 'missing_quran', text: 'عدم الاهتمام بإحضار القرآن الكريم في الحصة الدراسية' },
];

    // 1. حساب أرقام مهام التسميع المتاحة
    const availableTaskNumbers = useMemo(() => {
        const filteredTasks = curriculum
            .filter(item => item.type === recitationType)
            .map((item, index) => ({
                number: index + 1, 
                name: `${item.start} - ${item.end}`, 
                index: index 
            }));
        
        return filteredTasks;
    }, [recitationType, curriculum]);

    // **مصحح 1:** دالة لتغيير نوع التسميع وتعيين الفهرس الافتراضي الجديد (التغيير الأولي)
    const handleTypeChange = (newType) => {
        setRecitationType(newType);
        
        // إعادة تعيين الفهرس الافتراضي لنوع التسميع الجديد
        const newAvailableNumbers = curriculum.filter(item => item.type === newType);
        const defaultIndex = newAvailableNumbers.length > 0 ? 0 : -1;
        
        setWeekIndex(defaultIndex);
        setNoteWeekIndex(defaultIndex !== -1 ? defaultIndex + 1 : 1);
    };
    
    // **مصحح 2:** useEffect لضمان تعيين weekIndex عند تحميل المنهج أو تغيير نوع التسميع
    useEffect(() => {
        if (availableTaskNumbers.length > 0) {
             // إذا لم يكن هناك فهرس محدد أو كان الفهرس خارج النطاق الجديد، نختار الفهرس 0
             if (weekIndex === -1 || weekIndex >= availableTaskNumbers.length) {
                 setWeekIndex(0);
                 setNoteWeekIndex(1);
             }
        } else {
            setWeekIndex(-1);
            setNoteWeekIndex(1);
        }
    }, [recitationType, availableTaskNumbers]);


    // 3. useEffect لتصنيف الطلاب بناءً على المهمة المحددة (weekIndex) - **منطق الفرز المباشر المُصحَّح**
    useEffect(() => {
        const solved = [];
        const notSolved = [];
        
        // الشرط الأساسي للفرز
        if (weekIndex >= 0 && availableTaskNumbers.length > 0) {
            
            // تحديد الحقل الذي يجب قراءة الدرجات منه
            const gradeKey = recitationType === 'memorization' ? 'quranMemorization' : 'quranRecitation';
            
            students.forEach(student => {
                const studentWithStatus = { ...student };
                
                // جلب قيمة الدرجة من مصفوفة الطالب مباشرة
                const gradesArray = student.grades?.[gradeKey];
                const gradeValue = Array.isArray(gradesArray) && weekIndex >= 0 && weekIndex < gradesArray.length
                    ? gradesArray[weekIndex]
                    : null; 
                
                let statusText;
                
                // التحقق من وجود المهمة في المنهج (على الرغم من أن availableTaskNumbers تضمن ذلك)
                const isTaskAvailable = curriculum.some(item => item.type === recitationType && curriculum.indexOf(item) === weekIndex);

                if (!isTaskAvailable) {
                    statusText = 'لا يوجد منهج';
                } else {
                    // المنطق: تم التسميع إذا كانت القيمة موجودة وصحيحة (> 0).
                    const isInputPresent = (gradeValue !== null && gradeValue !== undefined && gradeValue !== '');
                    const isSolved = isInputPresent && Number(gradeValue) > 0;
                    
                    if (isSolved) {
                        statusText = 'تم التسميع';
                    } else {
                        // أي شيء آخر (null, '', 0) يعتبر لم يسمع
                        statusText = 'لم يسمع';
                    }
                }
                
                studentWithStatus.tempStatusInfo = { text: statusText };
                
                if (statusText === 'تم التسميع') {
                    solved.push(studentWithStatus);
                } else {
                    notSolved.push(studentWithStatus); 
                }
            });
        }

        setSolvedStudents(solved);
        setNotSolvedStudents(notSolved);
        setSelectedStudents([]); 
    }, [recitationType, weekIndex, students, curriculum]); 


    // **مصحح 3:** دالة اختيار رقم المهمة (تنفذ التحديث مباشرة)
    const handleWeekIndexChange = (index) => {
        // تحديث weekIndex بشكل صريح لكي يتم تشغيل الـ useEffect التالي فوراً
        const newIndex = Number(index);
        setWeekIndex(newIndex);
        setNoteWeekIndex(newIndex + 1);
    };


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

    const isSaveDisabled = () => {
        if (selectedStudents.length === 0) return true;
        if (noteWeekIndex < 1 || noteWeekIndex > 20) return true;
        return (noteType === 'custom' && !customNote.trim()) ||
               (noteType === 'template' && !selectedTemplate);
    };
    
    const handleSave = () => {
        if (isSaveDisabled()) {
            alert("يرجى اختيار الطلاب وتحديد الملاحظة والأسبوع أولاً.");
            return;
        }

        // تحديد نص الملاحظة
        const noteText = noteType === 'custom'
            ? customNote
            : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

        if (!noteText.trim()) return;

        // حساب التاريخ الهجري
        const today = new Date();
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);
        
        // الأسبوع هو noteWeekIndex - 1 للحفظ
        const saveWeekIndex = noteWeekIndex - 1; 
        // 🚨 التعديل هنا: تم حذف جزء " - أسبوع ${noteWeekIndex}" 
        const formattedNote = `(${hijriDate}): ${noteText.trim()}`;
        
        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                // حفظ الملاحظة في weeklyNotes (الملاحظات موحدة عبر الفترتين)
                const updatedWeeklyNotes = [...(student.grades.weeklyNotes || Array(20).fill(null).map(() => []))];
                if (!Array.isArray(updatedWeeklyNotes[saveWeekIndex])) {
                    updatedWeeklyNotes[saveWeekIndex] = [];
                }
                updatedWeeklyNotes[saveWeekIndex] = [...updatedWeeklyNotes[saveWeekIndex], formattedNote];
                
                return {
                    ...student,
                    grades: {
                        ...student.grades,
                        weeklyNotes: updatedWeeklyNotes,
                    },
                };
            }
            return student;
        });

        onSave(updatedStudents);
        onClose();
    };

    const recitationTypeOptions = [
        { value: 'memorization', label: 'حفظ القرآن', icon: <FaBookOpen /> },
        { value: 'recitation', label: 'تلاوة القرآن', icon: <FaMicrophone /> },
    ];
    
    const selectedTaskName = weekIndex >= 0 && availableTaskNumbers.length > 0 
        ? availableTaskNumbers[weekIndex].name 
        : 'لا توجد مهمة محددة';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div dir="rtl" className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-700 transform transition-all duration-300">
                
                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center bg-gray-900 border-b border-gray-700 shadow-lg">
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400 flex items-center gap-3">
                        <FaBookOpen className="text-teal-400"/> إدارة كشف التسميع والملاحظات
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-400 text-3xl leading-none font-semibold transition-colors">&times;</button>
                </div>
                
                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-grow bg-gray-800">
                    
                    {/* 1. Recitation Selection Panel */}
                    <div className="bg-gray-700 p-5 rounded-2xl shadow-xl border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaMicrophone className="text-cyan-400"/> تحديد نوع ومهمة التسميع للفرز
                        </h4>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-600/50 rounded-xl">
                            
                            {/* Segmented Buttons for Recitation Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">نوع التسميع:</label>
                                <div className="flex bg-gray-900 p-1 rounded-full shadow-inner border border-gray-700">
                                    {recitationTypeOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleTypeChange(option.value)}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
                                                ${recitationType === option.value
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                        >
                                            {option.icon}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Dropdown for Task Number/Index */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-300">مهمة التسميع (الموضع):</label>
                                <select
                                    value={weekIndex} // القيمة هنا هي الفهرس (0, 1, 2...)
                                    onChange={(e) => handleWeekIndexChange(Number(e.target.value))}
                                    className="p-3 border border-gray-600 rounded-xl bg-gray-900 text-white text-base shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-all duration-200"
                                    disabled={availableTaskNumbers.length === 0}
                                >
                                    {availableTaskNumbers.length === 0 ? (
                                        <option value={-1}>لا توجد مهام تسميع</option>
                                    ) : (
                                        availableTaskNumbers.map((task, index) => (
                                            <option key={index} value={index}>
                                                مهمة {task.number}: {task.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. Student Status Display Section */}
                    <div className="bg-gray-700 p-5 rounded-2xl shadow-xl border border-gray-600 mb-6">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaUsers className="text-blue-400"/> حال الطلاب في "{selectedTaskName}"
                        </h4>
                        {weekIndex >= 0 && availableTaskNumbers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StudentList
                                    title="تم التسميع"
                                    color="green"
                                    students={solvedStudents}
                                    selectedStudents={selectedStudents}
                                    toggleSelect={handleToggleSelect}
                                    onSelectAll={() => handleSelectAll(solvedStudents)}
                                />
                                <StudentList
                                    title="لم يسمع / متعثر"
                                    color="red"
                                    students={notSolvedStudents}
                                    selectedStudents={selectedStudents}
                                    toggleSelect={handleToggleSelect}
                                    onSelectAll={() => handleSelectAll(notSolvedStudents)}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 p-4 bg-gray-600/50 rounded-xl border border-gray-500">
                                يرجى تحديد مهمة تسميع لعرض حالة الطلاب.
                            </p>
                        )}
                    </div>

                    {/* 3. Action Section (Note addition section) */}
                    <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
                        <h4 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                            <FaStickyNote className="text-yellow-400"/>
                            إرسال ملاحظة (لـ {selectedStudents.length} طلاب محددين)
                        </h4>
                        
                         <div className="flex flex-col gap-4">
                            
                            {/* اختيار الأسبوع لحفظ الملاحظة (1-20) */}
                            <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-xl border border-gray-600">
                                <FaCalendarAlt className="text-xl text-cyan-400"/>
                                <label className="text-sm font-medium text-gray-300">الأسبوع المراد حفظ الملاحظة فيه:</label>
                                <select
                                    value={noteWeekIndex}
                                    onChange={(e) => setNoteWeekIndex(Number(e.target.value))}
                                    className="p-2 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                                >
                                    {/* 20 أسبوع للملاحظات */}
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
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                                    ></textarea>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
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
                                onClick={handleSave}
                                className={`px-6 py-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 transform shadow-lg
                                    ${!isSaveDisabled()
                                        ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white hover:shadow-green-500/50 hover:scale-[1.02]'
                                        : 'bg-gray-500 text-gray-300 cursor-not-allowed shadow-none'
                                    }`}
                                disabled={isSaveDisabled()}
                            >
                                <FaSave />
                                حفظ الملاحظة
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between gap-3 shadow-top">
                    <button
                        onClick={handleSelectAllStudents}
                        className={`bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-500 transition-colors font-semibold shadow-md`}
                    >
                        {students.length > 0 && students.every(s => selectedStudents.includes(s.id)) ? 'إلغاء تحديد الكل' : 'تحديد جميع الطلاب'}
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

export default RecitationModal;
