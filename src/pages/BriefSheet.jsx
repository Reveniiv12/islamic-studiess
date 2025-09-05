// src/pages/BriefSheet.jsx
import React from 'react';
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
    // دالة التصدير إلى Word
    const handleExportToWord = () => {
        const docSections = [];
        const studentsPerPage = 20;

        for (let i = 0; i < students.length; i += studentsPerPage) {
            const studentsChunk = students.slice(i, i + studentsPerPage);
            const tableRows = [];

            // Add Header Row
            tableRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "النجوم", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "المجموع (من 60)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "مجموع القرآن الكريم (15)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "المهام الأدائية (5)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "المشاركات (10)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "الواجبات (10)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "الاختبار الشفوي (5)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "الاختبارات (15)", bold: true })], alignment: "center" })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "اسم الطالب", bold: true })], alignment: "center" })] }),
                ],
            }));

            // Add Student Data Rows
            studentsChunk.forEach(student => {
                const quranTotal = (parseFloat(calculateCategoryScore(student.grades, 'quranRecitation', 'average')) + parseFloat(calculateCategoryScore(student.grades, 'quranMemorization', 'average'))).toFixed(2);
                tableRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (student.stars || 0).toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateTotalScore(student.grades).toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: quranTotal, alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateCategoryScore(student.grades, 'performanceTasks', 'best').toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateCategoryScore(student.grades, 'participation', 'sum').toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateCategoryScore(student.grades, 'homework', 'sum').toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateCategoryScore(student.grades, 'oralTest', 'best').toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: calculateCategoryScore(student.grades, 'tests', testCalculationMethod).toString(), alignment: "center" })] }),
                        new TableCell({ children: [new Paragraph({ text: student.name, alignment: "right" })] }),
                    ],
                }));
            });

            docSections.push({
                children: [
                    new Paragraph({ text: `كشف مختصر - صفحة ${Math.floor(i / studentsPerPage) + 1}`, heading: "Heading1", alignment: "right" }),
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
            saveAs(blob, "كشف-مختصر.docx");
        });
    };

    return (
        <div className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 overflow-x-auto border border-gray-700 max-h-[80vh]">
            <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">كشف مختصر</h3>
            <p className="text-gray-400 mb-4">{schoolName} | {teacherName} | {currentSemester}</p>
            <div className="flex gap-2 mb-4 text-sm justify-between">
                <div className="flex gap-2 text-sm">
                    <span className="text-gray-400 self-center">طريقة حساب الاختبارات:</span>
                    <button
                        onClick={() => handleTestCalculationMethodChange('best')}
                        className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>
                        أحسن درجة
                    </button>
                    <button
                        onClick={() => handleTestCalculationMethodChange('average')}
                        className={`px-3 py-1 rounded-lg transition-colors ${testCalculationMethod === 'average' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}>
                        المتوسط
                    </button>
                </div>
                <button
                    onClick={handleExportToWord}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    تصدير Word
                </button>
            </div>

            {/* الجدول */}
            <div className="overflow-y-auto max-h-[65vh]">
                <table className="min-w-full divide-y divide-gray-700" dir="rtl">
                    {/* العناوين مثبتة */}
                    <thead className="bg-gray-700 sticky top-0 z-30">
                        <tr>
                            {/* اسم الطالب ثابت يمين */}
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-700 z-20 whitespace-nowrap">
                                اسم الطالب
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                الاختبارات (15)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                الاختبار الشفوي (5)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                الواجبات (10)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                المشاركات (10)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                المهام الأدائية (5)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                مجموع القرآن الكريم (15)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                المجموع (من 60)
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                النجوم
                            </th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-700 transition-colors">
                                {/* اسم الطالب ثابت يمين */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky right-0 bg-gray-800 text-right z-10">
                                    {student.name}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                    {calculateCategoryScore(student.grades, 'tests', testCalculationMethod)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-200">
                                    {calculateCategoryScore(student.grades, 'oralTest', 'best')}
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
        </div>
    );
};

export default BriefSheet;
