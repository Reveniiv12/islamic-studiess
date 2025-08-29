// src/pages/GradesSheet.jsx
import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, PageOrientation } from "docx";

const StarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
        className={`w-4 h-4 ${className}`}>
        <path fillRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z"
            clipRule="evenodd" />
    </svg>
);

const GradesSheet = ({
    students,
    calculateTotalScore,
    calculateCategoryScore,
    gradeName,
    sectionName,
    schoolName,
    teacherName,
    currentSemester,
    testCalculationMethod,
    handleTestCalculationMethodChange,
    updateStudentGrade
}) => {

    const renderHeaderNumbers = (count) => {
        return Array.from({ length: count }).map((_, i) => (
            <th key={`header_num_${i}`} scope="col"
                className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600">
                {i + 1}
            </th>
        ));
    };
    
    const handleExportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet([]);
        const workbook = XLSX.utils.book_new();

        // Define the full set of headers in the correct order (right-to-left)
        const headers = [
            'النجوم',
            'المجموع (60)',
            ...students[0].grades.quranMemorization.map((_, i) => `حفظ القرآن (${i + 1})`).reverse(),
            ...students[0].grades.quranRecitation.map((_, i) => `تلاوة القرآن (${i + 1})`).reverse(),
            ...students[0].grades.performanceTasks.map((_, i) => `المهام الأدائية (${i + 1})`).reverse(),
            ...students[0].grades.participation.map((_, i) => `المشاركات (${i + 1})`).reverse(),
            ...students[0].grades.homework.map((_, i) => `الواجبات (${i + 1})`).reverse(),
            ...students[0].grades.oralTest.map((_, i) => `الشفوي (${i + 1})`).reverse(),
            ...students[0].grades.tests.map((_, i) => `الاختبارات (${i + 1})`).reverse(),
            'الاسم'
        ];

        // Prepare student data as an array of arrays to ensure order
        const studentData = students.map(student => {
            const rowData = [
                student.stars || 0,
                calculateTotalScore(student.grades),
                ...student.grades.quranMemorization.reverse(),
                ...student.grades.quranRecitation.reverse(),
                ...student.grades.performanceTasks.reverse(),
                ...student.grades.participation.reverse(),
                ...student.grades.homework.reverse(),
                ...student.grades.oralTest.reverse(),
                ...student.grades.tests.reverse(),
                student.name
            ];
            return rowData;
        });

        // Add headers and data to the worksheet
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A8' });
        XLSX.utils.sheet_add_aoa(worksheet, studentData, { origin: 'A9' });
        
        // Add column widths
        const maxNameLength = Math.max(...students.map(s => s.name.length), 'الاسم'.length);
        const wscols = headers.map(header => {
            let wch = header.length + 5;
            if (header === 'الاسم') {
                wch = maxNameLength + 5;
            }
            return { wch: wch };
        });
        worksheet['!cols'] = wscols;

        // Add metadata to the sheet right above the 'الاسم' column
        const metadata = [
            ['', 'كشف الدرجات الشامل'],
            ['المدرسة:', schoolName],
            ['المعلم:', teacherName],
            ['الفصل الدراسي:', currentSemester],
            ['الصف:', gradeName],
            ['الفصل:', sectionName]
        ].map(row => row.reverse()); // Reverse for proper RTL display

        const numColumns = headers.length;
        const originCol = XLSX.utils.encode_col(numColumns - 2); // Get the column just before 'الاسم'
        XLSX.utils.sheet_add_aoa(worksheet, metadata, { origin: `${originCol}1` });
        
        // Finalize workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Grades');
        
        // Export file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(dataBlob, 'كشف-الدرجات-الشامل.xlsx');
    };

    return (
        <div className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 overflow-auto border border-gray-700 max-h-[80vh]">

            <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">كشف الدرجات الشامل</h3>
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
                <div className="flex gap-2">
                    <button
                        onClick={handleExportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        تصدير Excel
                    </button>
                </div>
            </div>

            {/* الجدول RTL */}
            <div className="overflow-y-auto max-h-[65vh] overflow-x-auto" dir="rtl">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700 sticky top-0 z-30">
                        <tr>
                            {/* الاسم مثبت يمين */}
                            <th scope="col"
                                className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-700 z-20 whitespace-nowrap">
                                الاسم
                            </th>
                            <th scope="col" colSpan="2" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l-2 border-r border-gray-500">الاختبارات (15)</th>
                            <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">الشفوي (5)</th>
                            <th scope="col" colSpan="10" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l-2 border-r border-gray-500">الواجبات (10)</th>
                            <th scope="col" colSpan="10" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">المشاركات (10)</th>
                            <th scope="col" colSpan="3" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l-2 border-r border-gray-500">المهام الأدائية (5)</th>
                            <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l border-r border-gray-600">تلاوة القرآن (10)</th>
                            <th scope="col" colSpan="5" className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-l-2 border-r border-gray-500">حفظ القرآن (5)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">المجموع (60)</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">النجوم</th>
                        </tr>
                        <tr>
                            <th scope="col" className="sticky right-0 bg-gray-700 z-20"></th>
                            {renderHeaderNumbers(2)}
                            {renderHeaderNumbers(5)}
                            {renderHeaderNumbers(10)}
                            {renderHeaderNumbers(10)}
                            {renderHeaderNumbers(3)}
                            {renderHeaderNumbers(5)}
                            {renderHeaderNumbers(5)}
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-700 transition-colors group">
                                {/* الاسم مثبت يمين */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-100 sticky right-0 bg-gray-800 text-right group-hover:bg-gray-700 z-10">
                                    {student.name}
                                </td>

                                {student.grades.tests.slice(0, 2).map((grade, i) => (
                                    <td key={`test_${i}`} className="p-1 whitespace-nowrap text-sm text-center border-l-2 border-r border-gray-500">
                                        <input type="number" min="0" max="15" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "tests", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-green-500" />
                                    </td>
                                ))}
                                {student.grades.oralTest.slice(0, 5).map((grade, i) => (
                                    <td key={`ot_${i}`} className="p-1 whitespace-nowrap text-sm text-center border-r border-gray-600">
                                        <input type="number" min="0" max="5" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "oralTest", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                                    </td>
                                ))}
                                {student.grades.homework.slice(0, 10).map((grade, i) => (
                                    <td key={`hw_${i}`} className={`p-1 whitespace-nowrap text-sm text-center ${i === 0 ? 'border-l-2 border-gray-500' : ''} border-r border-gray-600`}>
                                        <input type="number" min="0" max="1" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "homework", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                    </td>
                                ))}
                                {student.grades.participation.slice(0, 10).map((grade, i) => (
                                    <td key={`part_${i}`} className="p-1 whitespace-nowrap text-sm text-center border-r border-gray-600">
                                        <input type="number" min="0" max="1" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "participation", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                    </td>
                                ))}
                                {student.grades.performanceTasks.slice(0, 3).map((grade, i) => (
                                    <td key={`pt_${i}`} className={`p-1 whitespace-nowrap text-sm text-center ${i === 0 ? 'border-l-2 border-gray-500' : ''} border-r border-gray-600`}>
                                        <input type="number" min="0" max="5" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "performanceTasks", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-rose-500" />
                                    </td>
                                ))}
                                {student.grades.quranRecitation.slice(0, 5).map((grade, i) => (
                                    <td key={`qr_${i}`} className="p-1 whitespace-nowrap text-sm text-center border-r border-gray-600">
                                        <input type="number" min="0" max="10" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "quranRecitation", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                ))}
                                {student.grades.quranMemorization.slice(0, 5).map((grade, i) => (
                                    <td key={`qm_${i}`} className={`p-1 whitespace-nowrap text-sm text-center ${i === 0 ? 'border-l-2 border-gray-500' : ''} border-r border-gray-600`}>
                                        <input type="number" min="0" max="5" value={grade ?? ''} onChange={(e) => updateStudentGrade(student.id, "quranMemorization", i, e.target.value)}
                                            className="w-12 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </td>
                                ))}

                                {/* المجموع يتحرك عادي */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-green-400">
                                    {calculateTotalScore(student.grades)}
                                </td>
                                {/* النجوم تتحرك عادي */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                    <div className="flex gap-1 text-yellow-400 justify-center">
                                        {Array.from({ length: 10 }).map((_, index) => (
                                            <StarIcon key={index} className={index < (student.stars || 0) ? 'text-yellow-400' : 'text-gray-600'} />
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

export default GradesSheet;