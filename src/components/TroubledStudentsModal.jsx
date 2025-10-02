// src/components/TroubledStudentsModal.jsx

import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaFileWord, FaUserCircle, FaCheckCircle, FaBookOpen, FaTasks, FaPencilAlt, FaQuran, FaRegStar, FaGlobe, FaPaperPlane } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, PageBreak } from "docx";
import { getHijriToday } from '../utils/recitationUtils';

// تم إضافة onSave و handleDialog إلى خصائص المودال
const TroubledStudentsModal = ({ students, onClose, homeworkCurriculum, recitationCurriculum, gradeName, sectionName, onSave, handleDialog }) => {
    const [categorizedStudents, setCategorizedStudents] = useState({});
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [noteText, setNoteText] = useState(''); 
    const [isSending, setIsSending] = useState(false);
    
    // حالات إدارة الملاحظات
    const [currentWeek, setCurrentWeek] = useState(1);
    const [noteType, setNoteType] = useState('custom');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // قوالب الملاحظات الجاهزة 
    const noteTemplates = [
        { id: 'excellent', text: 'أداء ممتاز ومتفوق' },
        { id: 'sleeping', text: 'يغلب عليه النوم في الفصل' },
        { id: 'distracted', text: 'غير منتبه أثناء الشرح' },
        { id: 'late', text: 'يتأخر في الحضور' },
        { id: 'improved', text: 'ظهر تحسن ملحوظ في الأداء' }
    ];

    const categoryTitles = {
        all: { title: "جميع الطلاب المتعثرين", icon: <FaGlobe className="text-gray-300" /> },
        incompleteHomework: { title: "الطلاب المتعثرون في الواجبات", icon: <FaPencilAlt className="text-blue-400" /> },
        incompletePerformanceTask: { title: "الطلاب المتعثرون في المهام الأدائية", icon: <FaTasks className="text-purple-400" /> },
        incompleteRecitation: { title: "الطلاب المتعثرون في التلاوة", icon: <FaQuran className="text-green-400" /> },
        incompleteMemorization: { title: "الطلاب المتعثرون في الحفظ", icon: <FaBookOpen className="text-orange-400" /> },
        incompleteExam: { title: "الطلاب المتعثرون في الاختبارات", icon: <FaRegStar className="text-red-400" /> },
    };
    
    useEffect(() => {
        // حساب الأسبوع الحالي ووضعه كقيمة افتراضية لـ currentWeek
        const today = new Date();
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
        const currentWeekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        setCurrentWeek(currentWeekNumber > 20 ? 20 : currentWeekNumber);

        // منطق تصنيف الطلاب
        const categories = {
            incompleteHomework: [],
            incompletePerformanceTask: [],
            incompleteRecitation: [],
            incompleteMemorization: [],
            incompleteExam: [],
        };

        students.forEach(student => {
            // Check Homework
            for (let i = 0; i < (student.grades?.homework?.length || 0); i++) {
                if ((student.grades.homework[i] === null || student.grades.homework[i] === '' || student.grades.homework[i] === 0) && homeworkCurriculum.some(item => item.type === 'homework' && item.name === `واجب ${i + 1}`)) {
                    categories.incompleteHomework.push({ student, problemName: `واجب ${i + 1}` });
                }
            }

            // Check Performance Tasks
            for (let i = 0; i < (student.grades?.performanceTasks?.length || 0); i++) {
                if ((student.grades.performanceTasks[i] === null || student.grades.performanceTasks[i] === '' || student.grades.performanceTasks[i] === 0) && homeworkCurriculum.some(item => item.type === 'performanceTask' && item.name === `مهمة أدائية ${i + 1}`)) {
                    categories.incompletePerformanceTask.push({ student, problemName: `مهمة أدائية ${i + 1}` });
                }
            }
            
            // Check Exams
            for (let i = 0; i < (student.grades?.tests?.length || 0); i++) {
                if ((student.grades.tests[i] === null || student.grades.tests[i] === '') && homeworkCurriculum.some(item => item.type === 'test' && item.name === `اختبار ${i + 1}`)) {
                    categories.incompleteExam.push({ student, problemName: `اختبار ${i + 1}` });
                }
            }

            // Check Quran Recitation
            const recitationItems = recitationCurriculum.filter(item => item.type === 'recitation');
            recitationItems.forEach((recitationItem, index) => {
                const grade = student.grades?.quranRecitation?.[index];
                if (grade === null || grade === '' || grade === 0) {
                    categories.incompleteRecitation.push({ student, problemName: `تلاوة من ${recitationItem.start} إلى ${recitationItem.end}` });
                }
            });

            // Check Quran Memorization - UPDATED
            const memorizationItems = recitationCurriculum.filter(item => item.type === 'memorization');
            memorizationItems.forEach((memorizationItem, index) => {
                const grade = student.grades?.quranMemorization?.[index];
                if (grade === null || grade === '' || grade === 0) {
                    categories.incompleteMemorization.push({ student, problemName: `حفظ من ${memorizationItem.start} إلى ${memorizationItem.end}` });
                }
            });
        });

        setCategorizedStudents(categories);
    }, [students, homeworkCurriculum, recitationCurriculum]);

    // دالة لمعالجة اختيار/إلغاء اختيار طالب
    const toggleStudentSelection = (studentId) => {
        setSelectedStudentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    // دالة للتحقق من إمكانية الإضافة
    const isAddNoteDisabled = () => {
        return selectedStudentIds.size === 0 ||
               (noteType === 'custom' && !noteText.trim()) ||
               (noteType === 'template' && !selectedTemplate);
    };

    // دالة إرسال الملاحظة (بمنطق حفظ NotesModal)
    const handleSendNote = () => {
        if (isAddNoteDisabled()) {
            // استخدام handleDialog بدلاً من alert() 
            if (handleDialog) {
                 handleDialog("خطأ", "يرجى اختيار الطلاب وتحديد الملاحظة أولاً.", "error");
            } else {
                 alert("يرجى اختيار الطلاب وتحديد الملاحظة أولاً.");
            }
            return;
        }

        setIsSending(true);

        // تحديد نص الملاحظة بناءً على النوع المختار
        const finalNoteText = noteType === 'custom'
            ? noteText.trim()
            : noteTemplates.find(t => t.id === selectedTemplate)?.text || '';

        // حساب التاريخ الهجري
        const today = new Date();
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);

        // بناء نص الملاحظة
        const newNote = `(${hijriDate}): ${finalNoteText}`;

        // تطبيق الملاحظة على الطلاب المحددين وحفظ التغييرات
        const updatedStudents = (students || []).map(student => {
            if (!selectedStudentIds.has(student.id)) return student;

            // التأكد من تهيئة مصفوفة الملاحظات الأسبوعية بشكل صحيح (20 أسبوعاً)
            const weeklyNotes = Array.isArray(student.grades?.weeklyNotes)
                ? student.grades.weeklyNotes
                : Array(20).fill().map(() => []);

            const updatedWeeklyNotes = [...weeklyNotes];
            // التأكد من تهيئة مصفوفة ملاحظات الأسبوع الحالي بشكل صحيح
            if (!Array.isArray(updatedWeeklyNotes[currentWeek - 1])) {
                updatedWeeklyNotes[currentWeek - 1] = [];
            }
            // إضافة الملاحظة للأسبوع المحدد
            updatedWeeklyNotes[currentWeek - 1].push(newNote);

            return {
                ...student,
                grades: {
                    ...student.grades,
                    weeklyNotes: updatedWeeklyNotes
                }
            };
        });

        // حفظ الطلاب المحدثين
        onSave(updatedStudents);
        
        // محاكاة عملية الإرسال وإظهار التنبيه
        setTimeout(() => {
            
            // **الحل:** إغلاق المودال أولاً قبل عرض رسالة النجاح
            onClose(); 
            
            // استخدام handleDialog بدلاً من alert() هنا
            const message = `تم إضافة الملاحظة بنجاح وحفظها في الأسبوع ${currentWeek} لـ ${selectedStudentIds.size} طالب.`;
            
            if (handleDialog) {
                // يتم عرض رسالة النجاح بعد اختفاء مودال المتعثرين
                handleDialog("نجاح", message, "success");
            } 
            
            // مسح التحديد والملاحظة بعد الإرسال
            setSelectedStudentIds(new Set());
            setNoteText('');
            setSelectedTemplate(''); 
            setIsSending(false);
        }, 1500); 
    };

    // دالة إنشاء قائمة الطلاب الفريدين مع مهامهم غير المكتملة
    const getUniqueStudentsWithTasks = (studentList) => {
        const uniqueStudentsMap = new Map();
        studentList.forEach(item => {
            if (!uniqueStudentsMap.has(item.student.id)) {
                uniqueStudentsMap.set(item.student.id, {
                    student: item.student,
                    incompleteTasks: new Set([item.problemName])
                });
            } else {
                uniqueStudentsMap.get(item.student.id).incompleteTasks.add(item.problemName);
            }
        });

        return Array.from(uniqueStudentsMap.values()).map(item => ({
            ...item,
            incompleteTasks: Array.from(item.incompleteTasks)
        }));
    }

    const renderStudentList = (studentList, title, icon) => {
        const uniqueStudents = getUniqueStudentsWithTasks(studentList);
    
        return (
            <div className="bg-gray-700 p-4 rounded-xl shadow-lg flex-1">
                <h4 className="text-xl font-bold mb-4 text-center text-gray-100 flex items-center justify-center gap-2">
                    {icon}
                    {title}
                </h4>
                {uniqueStudents.length > 0 ? (
                    <ul className="space-y-4">
                        {uniqueStudents.map(item => (
                            <li key={item.student.id} className="bg-gray-600 p-4 rounded-lg flex items-start gap-4">
                                {/* خانة الاختيار */}
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.has(item.student.id)}
                                    onChange={() => toggleStudentSelection(item.student.id)}
                                    className="w-5 h-5 mt-1 rounded text-blue-500 bg-gray-500 border-gray-500 focus:ring-blue-500"
                                />

                                <div className="flex flex-col flex-grow">
                                    <div className="flex items-center gap-3 w-full">
                                        <FaUserCircle className="text-gray-400 text-3xl" />
                                        <div className="flex flex-col">
                                            <span className="text-lg font-semibold text-gray-200">{item.student.name}</span>
                                            <span className="text-sm text-gray-400">({gradeName} - {sectionName})</span>
                                        </div>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-red-300 mt-2 ml-8">
                                        {item.incompleteTasks.map((task, taskIndex) => (
                                            <li key={taskIndex}>
                                                <span className="font-medium">{task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-400 mt-4">
                        <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-2" />
                        <p>لا يوجد طلاب متعثرون في هذه الفئة حاليًا.</p>
                    </div>
                )}
            </div>
        );
    };
    
    // دالة تصدير البيانات إلى Word
    const exportToWord = () => {
        const sections = [];
        const today = getHijriToday();

        const hasTroubledStudents = Object.values(categorizedStudents).flat().length > 0;
        if (!hasTroubledStudents) {
            if (handleDialog) {
                handleDialog("تحذير", "لا توجد بيانات لتصديرها.", "warning");
            } else {
                alert("لا توجد بيانات لتصديرها.");
            }
            return;
        }

        const currentTitle = activeCategory === 'all' ? "جميع الطلاب المتعثرين" : categoryTitles[activeCategory].title;

        // Add a header
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `تقرير ${currentTitle}`,
                        bold: true,
                        size: 32,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                rightToLeft: true,
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `التاريخ: ${today}`,
                        size: 24,
                    }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 200, after: 200 },
                rightToLeft: true,
            })
        );
        
        let categoriesToExport;
        if (activeCategory === 'all') {
            categoriesToExport = Object.keys(categorizedStudents).filter(key => categorizedStudents[key]?.length > 0);
        } else {
            categoriesToExport = [activeCategory];
        }

        let firstCategory = true;
        categoriesToExport.forEach(categoryKey => {
            const studentList = categorizedStudents[categoryKey];
            if (studentList && studentList.length > 0) {
                const { title } = categoryTitles[categoryKey];

                if (!firstCategory) {
                    sections.push(new Paragraph({ children: [new PageBreak()] }));
                }
                firstCategory = false;

                const uniqueStudents = getUniqueStudentsWithTasks(studentList);
                
                const tableRows = [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "المهام غير المكتملة", bold: true, size: 28 })], alignment: AlignmentType.CENTER, rightToLeft: true })],
                                width: { size: 50, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "الصف / الفصل", bold: true, size: 28 })], alignment: AlignmentType.CENTER, rightToLeft: true })],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "اسم الطالب", bold: true, size: 28 })], alignment: AlignmentType.CENTER, rightToLeft: true })],
                                width: { size: 30, type: WidthType.PERCENTAGE },
                            }),
                        ],
                    }),
                ];
                
                uniqueStudents.forEach(item => {
                    tableRows.push(
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: item.incompleteTasks.map(task => new Paragraph({ children: [new TextRun({ text: `• ${task}`, size: 24 })], alignment: AlignmentType.CENTER, rightToLeft: true })),
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: `${gradeName} / ${sectionName}`, size: 24 })], alignment: AlignmentType.CENTER, rightToLeft: true })],
                                }),
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: item.student.name, size: 24 })], alignment: AlignmentType.CENTER, rightToLeft: true })],
                                }),
                            ],
                        })
                    );
                });

                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: title,
                                bold: true,
                                size: 28,
                                color: "1E90FF",
                            }),
                        ],
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 300, after: 150 },
                        rightToLeft: true,
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        alignment: AlignmentType.RIGHT,
                    })
                );
            }
        });

        const doc = new Document({
            sections: [{
                children: sections,
            }],
        });
        
        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `الطلاب_المتعثرون_${currentTitle}_${gradeName}_${sectionName}_${getHijriToday()}.docx`);
            if (handleDialog) {
                handleDialog("نجاح", "تم تصدير ملف Word بنجاح!", "success");
            } else {
                alert("تم تصدير ملف Word بنجاح!");
            }
        }).catch(err => {
            console.error(err);
            if (handleDialog) {
                handleDialog("خطأ", "حدث خطأ أثناء إنشاء ملف Word.", "error");
            } else {
                alert("حدث خطأ أثناء إنشاء ملف Word.");
            }
        });
    };

    const hasTroubledStudents = Object.values(categorizedStudents).some(list => list.length > 0);
    
    const categoriesList = Object.keys(categoryTitles);

    return (
        // العنصر الذي تم رفع الـ z-index الخاص به
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                            <FaExclamationTriangle className="text-yellow-400" />
                            الطلاب المتعثرون
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold"
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <p className="text-gray-400 text-center mb-6">
                        هذه القائمة تضم الطلاب الذين لم يحلوا المهام المضافة في ملفات المناهج، مصنفة حسب نوع المهمة.
                    </p>

                    <div dir="rtl" className="flex flex-wrap gap-2 mb-6">
                        {categoriesList.map(key => {
                            const { title, icon } = categoryTitles[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setActiveCategory(key);
                                        setSelectedStudentIds(new Set()); 
                                    }}
                                    className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                                        activeCategory === key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {icon}
                                    {title}
                                </button>
                            );
                        })}
                    </div>

                    {hasTroubledStudents && (
                        <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-700 rounded-xl">
                            {/* *قسم إرسال الملاحظة المحدث* */}
                            <div dir="rtl" className="flex flex-col gap-3 border-b border-gray-600 pb-4">
                                <label className="block text-gray-200 font-semibold text-lg mb-2">
                                    إرسال ملاحظة للطلاب المحددين ({selectedStudentIds.size})
                                </label>

                                {/* اختيار الأسبوع */}
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">اختر الأسبوع</label>
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

                                {/* نوع الملاحظة */}
                                <div className="mb-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">نوع الملاحظة</label>
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
                                
                                {/* حقل الإدخال أو القالب */}
                                {noteType === 'custom' ? (
                                    <textarea
                                        id="note-textarea"
                                        rows="3"
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="اكتب الملاحظة التي تود إرسالها للطلاب المحددين..."
                                        className="w-full p-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                                        disabled={isSending}
                                    />
                                ) : (
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isSending}
                                    >
                                        <option value="">اختر قالباً...</option>
                                        {noteTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.text}</option>
                                        ))}
                                    </select>
                                )}
                                
                                <button
                                    onClick={handleSendNote}
                                    disabled={isAddNoteDisabled() || isSending}
                                    className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                                        !isAddNoteDisabled() && !isSending
                                            ? 'bg-green-600 text-white hover:bg-green-500'
                                            : 'bg-gray-500 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isSending ? (
                                        <>
                                            <FaPaperPlane className="animate-pulse" />
                                            جارٍ الإرسال والحفظ في الأسبوع {currentWeek}...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            إرسال وحفظ الملاحظة في الأسبوع {currentWeek}
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* قسم التصدير */}
                            <div className="flex justify-center">
                                <button
                                    onClick={exportToWord}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors font-semibold"
                                >
                                    <FaFileWord />
                                    تصدير القائمة ({categoryTitles[activeCategory].title})
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div dir="rtl" className="flex flex-col gap-4">
                        {activeCategory === 'all' ? (
                             renderStudentList(Object.values(categorizedStudents).flat() || [], categoryTitles['all'].title, categoryTitles['all'].icon)
                        ) : (
                            renderStudentList(categorizedStudents[activeCategory] || [], categoryTitles[activeCategory].title, categoryTitles[activeCategory].icon)
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-700">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors font-semibold"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TroubledStudentsModal;