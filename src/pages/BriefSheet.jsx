// src/pages/BriefSheet.jsx
import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from "docx";
import { saveAs } from 'file-saver';

const BriefSheet = ({
    students,
    calculateTotalScore,
    calculateCategoryScore,
    gradeName,
    sectionName,
    schoolName,
    teacherName,
    currentSemester,
    testCalculationMethod,
    handleTestCalculationMethodChange
}) => {
    
    // تم إضافة حالة جديدة للتحكم في عرض الجدول
    const [activeView, setActiveView] = useState('full'); // 'full', 'sub_totals'

    // دوال الحساب الفرعية (مكررة هنا للوصول السريع إلى studentData)
    const calculateMajorAssessments = (grades) => {
        // الاختبارات (40) + التلاوة (10) + الحفظ (10) = 60
        const testsScore = parseFloat(calculateCategoryScore(grades, 'tests', 'sum'));
        const recitationScore = parseFloat(calculateCategoryScore(grades, 'quranRecitation', 'average'));
        const memorizationScore = parseFloat(calculateCategoryScore(grades, 'quranMemorization', 'average'));
        return (testsScore + recitationScore + memorizationScore).toFixed(2);
    };

    const calculateCoursework = (grades) => {
        // الواجبات (10) + المشاركة (10) + المهام (10) + التفاعل (10) = 40
        const homeworkScore = parseFloat(calculateCategoryScore(grades, 'homework', 'sum'));
        const participationScore = parseFloat(calculateCategoryScore(grades, 'participation', 'sum'));
        const performanceScore = parseFloat(calculateCategoryScore(grades, 'performanceTasks', 'best'));
        const classInteractionScore = parseFloat(calculateCategoryScore(grades, 'classInteraction', 'best'));
        return (homeworkScore + participationScore + performanceScore + classInteractionScore).toFixed(2);
    };

    // دالة التصدير إلى Word (تم تحديثها لـ full و sub_totals)
    const handleExportToWord = (viewType) => {
        const docSections = [];
        const studentsPerPage = 20;

        for (let i = 0; i < students.length; i += studentsPerPage) {
            const studentsChunk = students.slice(i, i + studentsPerPage);
            const tableRows = [];

            // Define Headers and data fields based on viewType
            let headers;
            let dataFields;

            if (viewType === 'sub_totals') {
                headers = [ "النجوم", "المجموع الكلي (100)", "أعمال السنة (40)", "التقييمات الرئيسية (60)", "اسم الطالب" ];
                dataFields = (student) => [
                    (student.stars || 0).toString(),
                    calculateTotalScore(student.grades).toString(),
                    calculateCoursework(student.grades), // ✅ تصحيح: أعمال السنة (40)
                    calculateMajorAssessments(student.grades), // ✅ تصحيح: التقييمات الرئيسية (60)
                    student.name
                ];
            } else {
                 // عرض مفصل (Full Brief)
                 headers = [ 
                    "النجوم", "المجموع الكلي (100)", "مجموع القرآن (20)", "المهام الأدائية (10)",
                    "المشاركات (10)", "الواجبات (10)", "التفاعل الصفي (10)", "الاختبارات (40)", "اسم الطالب" 
                 ];
                 dataFields = (student) => [
                    (student.stars || 0).toString(),
                    calculateTotalScore(student.grades).toString(),
                    (parseFloat(calculateCategoryScore(student.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(student.grades, 'quranMemorization', 'average'))).toFixed(2),
                    calculateCategoryScore(student.grades, 'performanceTasks', 'best').toString(),
                    calculateCategoryScore(student.grades, 'participation', 'sum').toString(),
                    calculateCategoryScore(student.grades, 'homework', 'sum').toString(),
                    calculateCategoryScore(student.grades, 'classInteraction', 'best').toString(),
                    calculateCategoryScore(student.grades, 'tests', 'sum').toString(),
                    student.name
                 ];
            }


            // Add Header Row
            tableRows.push(new TableRow({
                children: headers.reverse().map(header => new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: header.replace(/\s\(.*\)/, ''), bold: true })], alignment: "center" })] // إزالة الأقواس من عناوين وورد
                })),
            }));

            // Add Student Data Rows
            studentsChunk.forEach(student => {
                const rowData = dataFields(student).reverse();
                tableRows.push(new TableRow({
                    children: rowData.map(data => new TableCell({ 
                        children: [new Paragraph({ text: data, alignment: "center" })] 
                    })),
                }));
            });

            docSections.push({
                children: [
                    new Paragraph({ text: `كشف مختصر - ${viewType === 'sub_totals' ? 'المجاميع الفرعية' : 'الدرجات المفصلة'} - صفحة ${Math.floor(i / studentsPerPage) + 1}`, heading: "Heading1", alignment: "right" }),
                    new Paragraph({ text: `المدرسة: ${schoolName} | المعلم: ${teacherName} | الفصل الدراسي: ${currentSemester}`, alignment: "right" }),
                    new Paragraph({ text: `الصف: ${gradeName} | الفصل: ${sectionName}`, alignment: "right" }),
                    new Paragraph({ text: " " }), // Spacer
                    new Table({ rows: tableRows }),
                ],
            });
        }

        const doc = new Document({
            sections: docSections,
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `كشف-مختصر-${viewType}.docx`);
        });
    };

    // ------------------------------------
    // رندرة العرض المفصل (الكشف المختصر الأصلي)
    // ------------------------------------
    const renderFullBrief = () => (
        <div className="overflow-y-auto max-h-[65vh] overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700" dir="rtl">
                <thead className="bg-gray-700 sticky top-0 z-30">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-700 z-20 whitespace-nowrap">
                            اسم الطالب
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            الاختبارات (40)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            التفاعل الصفي (10)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            الواجبات (10)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            المشاركات (10)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            المهام الأدائية (10)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            مجموع القرآن الكريم (20)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            المجموع الكلي (100)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            النجوم
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky right-0 bg-gray-800 text-right z-10">
                                {student.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {calculateCategoryScore(student.grades, 'tests', 'sum')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {calculateCategoryScore(student.grades, 'classInteraction', 'best')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {calculateCategoryScore(student.grades, 'homework', 'sum')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {calculateCategoryScore(student.grades, 'participation', 'sum')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {calculateCategoryScore(student.grades, 'performanceTasks', 'best')}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                {(parseFloat(calculateCategoryScore(student.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(student.grades, 'quranMemorization', 'average'))).toFixed(2)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                                {calculateTotalScore(student.grades)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                <div className="flex gap-1 text-yellow-400 justify-center">
                                    {Array.from({ length: 10 }).map((_, index) => (
                                        <FaStar key={index} className={index < (student.stars || 0) ? 'text-yellow-400' : 'text-gray-600'} />
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    // ------------------------------------
    // رندرة عرض المجاميع الفرعية (الجديد)
    // ------------------------------------
    const renderSubTotalsBrief = () => (
        <div className="overflow-y-auto max-h-[65vh]">
            <table className="min-w-full divide-y divide-gray-700" dir="rtl">
                <thead className="bg-gray-700 sticky top-0 z-30">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-700 z-20 whitespace-nowrap">
                            اسم الطالب
                        </th>
                        
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            أعمال السنة (40)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            التقييمات الرئيسية (60)
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                            المجموع الكلي (100)
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky right-0 bg-gray-800 text-right z-10">
                                {student.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                                {calculateCoursework(student.grades)} {/* ✅ تم التبديل: أعمال السنة (40) */}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-yellow-400">
                                {calculateMajorAssessments(student.grades)} {/* ✅ تم التبديل: التقييمات الرئيسية (60) */}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                                {calculateTotalScore(student.grades)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );


    return (
        <div className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 overflow-x-auto border border-gray-700 max-h-[80vh]">
            <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">كشف مختصر</h3>
            <p className="text-gray-400 mb-4">{schoolName} | {teacherName} | {currentSemester}</p>
            
            <div className="flex gap-2 mb-4 text-sm justify-between flex-wrap">
                <div className="flex gap-2 text-sm">
                    <span className="text-gray-400 self-center">طريقة عرض البيانات:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* زر التبديل بين العرضين */}
                    <button
                        onClick={() => setActiveView('full')}
                        className={`px-3 py-1 rounded-lg transition-colors ${activeView === 'full' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>
                        عرض مفصل
                    </button>
                    <button
                        onClick={() => setActiveView('sub_totals')}
                        className={`px-3 py-1 rounded-lg transition-colors ${activeView === 'sub_totals' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>
                        عرض المجاميع الفرعية
                    </button>
                    <button
                        onClick={() => handleExportToWord(activeView)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        تصدير Word
                    </button>
                </div>
            </div>

            {/* عرض الجدول المختار */}
            <div className="mt-4">
                {activeView === 'full' ? renderFullBrief() : renderSubTotalsBrief()}
            </div>
        </div>
    );
};

export default BriefSheet;
