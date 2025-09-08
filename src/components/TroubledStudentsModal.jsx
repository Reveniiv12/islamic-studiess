// src/components/TroubledStudentsModal.jsx

import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaFileWord, FaUserCircle, FaCheckCircle, FaBookOpen, FaTasks, FaPencilAlt, FaQuran, FaRegStar, FaGlobe } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, TextRun, AlignmentType, PageBreak } from "docx";
import { getHijriToday } from '../utils/recitationUtils';

const TroubledStudentsModal = ({ students, onClose, homeworkCurriculum, recitationCurriculum, gradeName, sectionName }) => {
    const [categorizedStudents, setCategorizedStudents] = useState({});
    const [activeCategory, setActiveCategory] = useState('all');

    const categoryTitles = {
        all: { title: "جميع الطلاب المتعثرين", icon: <FaGlobe className="text-gray-300" /> },
        incompleteHomework: { title: "الطلاب المتعثرون في الواجبات", icon: <FaPencilAlt className="text-blue-400" /> },
        incompletePerformanceTask: { title: "الطلاب المتعثرون في المهام الأدائية", icon: <FaTasks className="text-purple-400" /> },
        incompleteRecitation: { title: "الطلاب المتعثرون في التلاوة", icon: <FaQuran className="text-green-400" /> },
        incompleteMemorization: { title: "الطلاب المتعثرون في الحفظ", icon: <FaBookOpen className="text-orange-400" /> },
        incompleteExam: { title: "الطلاب المتعثرون في الاختبارات", icon: <FaRegStar className="text-red-400" /> },
    };
    
    useEffect(() => {
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
                // Modified condition to include 0 as an incomplete grade
                if ((student.grades.homework[i] === null || student.grades.homework[i] === '' || student.grades.homework[i] === 0) && homeworkCurriculum.some(item => item.type === 'homework' && item.name === `واجب ${i + 1}`)) {
                    categories.incompleteHomework.push({ student, problemName: `واجب ${i + 1}` });
                }
            }

            // Check Performance Tasks
            for (let i = 0; i < (student.grades?.performanceTasks?.length || 0); i++) {
                // Modified condition to include 0 as an incomplete grade
                if ((student.grades.performanceTasks[i] === null || student.grades.performanceTasks[i] === '' || student.grades.performanceTasks[i] === 0) && homeworkCurriculum.some(item => item.type === 'performanceTask' && item.name === `مهمة أدائية ${i + 1}`)) {
                    categories.incompletePerformanceTask.push({ student, problemName: `مهمة أدائية ${i + 1}` });
                }
            }
            
            // Check Exams
            for (let i = 0; i < (student.grades?.tests?.length || 0); i++) {
                // Condition remains the same (does not include 0)
                if ((student.grades.tests[i] === null || student.grades.tests[i] === '') && homeworkCurriculum.some(item => item.type === 'test' && item.name === `اختبار ${i + 1}`)) {
                    categories.incompleteExam.push({ student, problemName: `اختبار ${i + 1}` });
                }
            }

            // Check Quran Recitation
            const recitationItems = recitationCurriculum.filter(item => item.type === 'recitation');
            recitationItems.forEach((recitationItem, index) => {
                const grade = student.grades?.quranRecitation?.[index];
                // Modified condition to include 0 as an incomplete grade
                if (grade === null || grade === '' || grade === 0) {
                    categories.incompleteRecitation.push({ student, problemName: `تلاوة من ${recitationItem.start} إلى ${recitationItem.end}` });
                }
            });

            // Check Quran Memorization - UPDATED
            const memorizationItems = recitationCurriculum.filter(item => item.type === 'memorization');
            memorizationItems.forEach((memorizationItem, index) => {
                const grade = student.grades?.quranMemorization?.[index];
                // Modified condition to include 0 as an incomplete grade
                if (grade === null || grade === '' || grade === 0) {
                    categories.incompleteMemorization.push({ student, problemName: `حفظ من ${memorizationItem.start} إلى ${memorizationItem.end}` });
                }
            });
        });

        setCategorizedStudents(categories);
    }, [students, homeworkCurriculum, recitationCurriculum]);

    const renderStudentList = (studentList, title, icon) => {
        // Create a map to store unique students and a Set of their unique incomplete tasks
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

        const uniqueStudents = Array.from(uniqueStudentsMap.values()).map(item => ({
            ...item,
            incompleteTasks: Array.from(item.incompleteTasks)
        }));
    
        return (
            <div className="bg-gray-700 p-4 rounded-xl shadow-lg flex-1">
                <h4 className="text-xl font-bold mb-4 text-center text-gray-100 flex items-center justify-center gap-2">
                    {icon}
                    {title}
                </h4>
                {uniqueStudents.length > 0 ? (
                    <ul className="space-y-4">
                        {uniqueStudents.map(item => (
                            <li key={item.student.id} className="bg-gray-600 p-4 rounded-lg flex flex-col items-start gap-2">
                                <div className="flex items-center gap-3 w-full">
                                    <FaUserCircle className="text-gray-400 text-3xl" />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold text-gray-200">{item.student.name}</span>
                                        <span className="text-sm text-gray-400">({gradeName} - {sectionName})</span>
                                    </div>
                                </div>
                                <ul className="list-disc list-inside text-sm text-red-300 ml-8">
                                    {item.incompleteTasks.map((task, taskIndex) => (
                                        <li key={taskIndex}>
                                            <span className="font-medium">{task}</span>
                                        </li>
                                    ))}
                                </ul>
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
    
    const exportToWord = () => {
        const sections = [];
        const today = getHijriToday();

        const dataToExport = activeCategory === 'all'
            ? Object.keys(categorizedStudents).reduce((acc, key) => acc.concat(categorizedStudents[key]), [])
            : categorizedStudents[activeCategory];

        const hasTroubledStudents = dataToExport && dataToExport.length > 0;
        if (!hasTroubledStudents) {
            alert("لا توجد بيانات لتصديرها.");
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

                // Create a map to store unique students and a Set of their unique incomplete tasks
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
                const uniqueStudents = Array.from(uniqueStudentsMap.values()).map(item => ({
                    ...item,
                    incompleteTasks: Array.from(item.incompleteTasks)
                }));
                
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
        }).catch(err => {
            console.error(err);
            alert("حدث خطأ أثناء إنشاء ملف Word.");
        });
    };

    const hasTroubledStudents = Object.values(categorizedStudents).some(list => list.length > 0);
    
    // Create a combined list for the "All" tab
    const allStudentsCombined = (() => {
        const uniqueStudentsMap = new Map();
        Object.values(categorizedStudents).flat().forEach(item => {
            const studentId = item.student.id;
            if (!uniqueStudentsMap.has(studentId)) {
                uniqueStudentsMap.set(studentId, {
                    student: item.student,
                    incompleteTasks: new Set()
                });
            }
            uniqueStudentsMap.get(studentId).incompleteTasks.add(item.problemName);
        });
        return Array.from(uniqueStudentsMap.values()).map(item => ({
            student: item.student,
            incompleteTasks: Array.from(item.incompleteTasks)
        }));
    })();

    const categoriesList = Object.keys(categoryTitles);

    return (
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
                                    onClick={() => setActiveCategory(key)}
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
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={exportToWord}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors font-semibold"
                            >
                                <FaFileWord />
                                تصدير القائمة ({categoryTitles[activeCategory].title})
                            </button>
                        </div>
                    )}
                    
                    <div dir="rtl" className="flex flex-col gap-4">
                        {activeCategory === 'all' ? (
                            Object.keys(categorizedStudents).map(key => {
                                const studentsList = categorizedStudents[key];
                                return renderStudentList(studentsList || [], categoryTitles[key].title, categoryTitles[key].icon);
                            })
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
