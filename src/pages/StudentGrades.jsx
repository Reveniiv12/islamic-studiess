// src/SectionGrades.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import NotesModal from "../components/NotesModal";
import StarsModal from "../components/StarsModal";
import RecitationModal from "../components/RecitationModal";
import CurriculumModal from "../components/CurriculumModal.jsx";
import HomeworkCurriculumModal from "../components/HomeworkCurriculumModal.jsx";
import HomeworkModal from "../components/HomeworkModal.jsx";
import GradesModal from "../components/GradesModal";
import { getRecitationStatus } from '../utils/recitationUtils';

const SectionGrades = () => {
    const { gradeId, sectionId } = useParams();
    const storageKey = `grades_${gradeId}_${sectionId}`;
    const curriculumStorageKey = `curriculum_${gradeId}_${sectionId}`;

    const [students, setStudents] = useState([]);
    const [curriculum, setCurriculum] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showStarsModal, setShowStarsModal] = useState(false);
    const [showRecitationModal, setShowRecitationModal] = useState(false);
    const [showCurriculumModal, setShowCurriculumModal] = useState(false);
    const [showGradesModal, setShowGradesModal] = useState(false);
    const [showGradeSheet, setShowGradeSheet] = useState(false);

    // Batch grading states for the comprehensive grade sheet
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [batchGrade, setBatchGrade] = useState('');
    const [batchCategory, setBatchCategory] = useState('tests');
    const [batchIndex, setBatchIndex] = useState(0);

    const [newStudent, setNewStudent] = useState({
        name: "",
        nationalId: "",
        phone: "",
        photo: "",
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        const savedCurriculum = localStorage.getItem(curriculumStorageKey);

        if (savedData) setStudents(JSON.parse(savedData));
        if (savedCurriculum) setCurriculum(JSON.parse(savedCurriculum));
    }, [gradeId, sectionId, storageKey, curriculumStorageKey]);

    const updateStudentsData = (updatedStudents) => {
        setStudents(updatedStudents);
        localStorage.setItem(storageKey, JSON.stringify(updatedStudents));
    };

    const updateCurriculumData = (updatedCurriculum) => {
        setCurriculum(updatedCurriculum);
        localStorage.setItem(curriculumStorageKey, JSON.stringify(updatedCurriculum));
    };

    const exportToExcel = () => {
        const data = students.map(student => ({
            'اسم الطالب': student.name,
            'السجل المدني': student.nationalId,
            'اختبار 1': student.grades.tests[0],
            'اختبار 2': student.grades.tests[1],
            ...student.grades.homework.slice(0, 10).reduce((acc, val, idx) => ({ ...acc, [`واجب ${idx + 1}`]: val }), {}),
            ...student.grades.participation.slice(0, 10).reduce((acc, val, idx) => ({ ...acc, [`مشاركة ${idx + 1}`]: val }), {}),
            'المهام الأدائية': student.grades.performanceTasks,
            ...student.grades.quranRecitation.slice(0, 5).reduce((acc, val, idx) => ({ ...acc, [`تلاوة جزء ${idx + 1}`]: val }), {}),
            ...student.grades.quranMemorization.slice(0, 5).reduce((acc, val, idx) => ({ ...acc, [`حفظ جزء ${idx + 1}`]: val }), {}),
            ...student.grades.oralTest.slice(0, 6).reduce((acc, val, idx) => ({ ...acc, [`شفوي ${idx + 1}`]: val }), {}),
            'عدد النجوم': student.stars || 0,
            'سجل التسميع': JSON.stringify(student.recitationHistory),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "الدرجات");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `درجات_${gradeId}_${sectionId}.xlsx`);
    };

    const handleFileImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const updatedStudents = jsonData.map(row => {
                    const student = {
                        id: Date.now() + Math.random(),
                        name: row['اسم الطالب'] || '',
                        nationalId: row['السجل المدني'] || '',
                        phone: '',
                        photo: '',
                        stars: row['عدد النجوم'] || 0,
                        recitationHistory: JSON.parse(row['سجل التسميع'] || '[]'),
                        grades: {
                            tests: [row['اختبار 1'] || 0, row['اختبار 2'] || 0],
                            homework: Array(10).fill(0),
                            participation: Array(10).fill(0),
                            performanceTasks: row['المهام الأدائية'] || 0,
                            quranRecitation: Array(5).fill(0),
                            quranMemorization: Array(5).fill(0),
                            oralTest: Array(6).fill(0),
                            weeklyNotes: Array(16).fill("")
                        }
                    };
                    return student;
                });

                updateStudentsData(updatedStudents);
                alert('تم استيراد البيانات بنجاح!');
            } catch (error) {
                alert('حدث خطأ أثناء استيراد الملف: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleAddStudent = () => {
        if (!newStudent.name || !newStudent.nationalId) {
            alert("يرجى إدخال الاسم والسجل المدني");
            return;
        }

        const newId = Date.now();
        const studentToAdd = {
            id: newId,
            ...newStudent,
photo: newStudent.photo || '/images/1.webp',            stars: 0,
            recitationHistory: [],
            grades: {
                tests: [0, 0],
                homework: Array(10).fill(0),
                participation: Array(10).fill(0),
                performanceTasks: 0,
                quranRecitation: Array(5).fill(0),
                quranMemorization: Array(5).fill(0),
                oralTest: Array(6).fill(0),
                weeklyNotes: Array(16).fill(""),
            },
        };

        updateStudentsData([...students, studentToAdd]);
        setShowAddForm(false);
        setNewStudent({ name: "", nationalId: "", phone: "", photo: "" });
    };

    const updateStudentGrade = (studentId, category, index, value) => {
        const updatedStudents = students.map((student) => {
            if (student.id === studentId) {
                const updatedGrades = { ...student.grades };
                if (Array.isArray(updatedGrades[category])) {
                    updatedGrades[category][index] = value;
                } else {
                    updatedGrades[category] = value;
                }
                return { ...student, grades: updatedGrades };
            }
            return student;
        });
        updateStudentsData(updatedStudents);
        const updatedSelectedStudent = updatedStudents.find(s => s.id === studentId);
        if (updatedSelectedStudent) {
            setSelectedStudent(updatedSelectedStudent);
        }
    };

    const updateStudentStars = (updatedStudents) => {
        updateStudentsData(updatedStudents);
        setShowStarsModal(false);
    };

    const updateRecitationData = (updatedStudents) => {
        updateStudentsData(updatedStudents);
    };

    // Batch grading functions for the grade sheet
    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prevSelected =>
            prevSelected.includes(studentId)
                ? prevSelected.filter(id => id !== studentId)
                : [...prevSelected, studentId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(student => student.id));
        }
    };

    const handleBatchGradeApply = () => {
        if (batchGrade === '' || selectedStudents.length === 0) {
            alert("يرجى إدخال درجة واختيار الطلاب أولاً.");
            return;
        }

        const gradeValue = Number(batchGrade);
        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                const updatedGrades = { ...student.grades };
                if (Array.isArray(updatedGrades[batchCategory])) {
                    const newArray = [...updatedGrades[batchCategory]];
                    newArray[batchIndex] = gradeValue;
                    updatedGrades[batchCategory] = newArray;
                } else {
                    updatedGrades[batchCategory] = gradeValue;
                }
                return { ...student, grades: updatedGrades };
            }
            return student;
        });
        updateStudentsData(updatedStudents);
        setBatchGrade('');
    };

    const renderBatchControls = () => (
        <div className="p-4 mb-4 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-4">
            <span className="font-semibold text-gray-700">رصد جماعي للدرجات:</span>
            <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                className="p-2 border rounded"
            >
                <option value="tests">الاختبارات</option>
                <option value="homework">الواجبات</option>
                <option value="participation">المشاركة</option>
                <option value="performanceTasks">المهام الأدائية</option>
                <option value="oralTest">الاختبار الشفوي</option>
            </select>
            {
                (batchCategory === 'tests' || batchCategory === 'homework' || batchCategory === 'oralTest' || batchCategory === 'quranRecitation' || batchCategory === 'quranMemorization' || batchCategory === 'participation') && (
                    <select
                        value={batchIndex}
                        onChange={(e) => setBatchIndex(Number(e.target.value))}
                        className="p-2 border rounded"
                    >
                        {Array.from({ length: batchCategory === 'tests' ? 2 : batchCategory === 'homework' || batchCategory === 'participation' ? 10 : batchCategory === 'oralTest' ? 6 : 5  }, (_, i) => (
                            <option key={i} value={i}>
                                {batchCategory === 'tests' ? `اختبار ${i + 1}` : batchCategory === 'homework' ? `واجب ${i + 1}` : batchCategory === 'participation' ? `مشاركة ${i + 1}` : batchCategory === 'oralTest' ? `شفوي ${i + 1}` : `مربع ${i + 1}`}
                            </option>
                        ))}
                    </select>
                )
            }
            <input
                type="number"
                min="0"
                value={batchGrade}
                onChange={(e) => setBatchGrade(e.target.value)}
                placeholder="الدرجة"
                className="w-24 p-2 border rounded text-center"
            />
            <button
                onClick={handleBatchGradeApply}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                تطبيق على المحدد
            </button>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800">
                    درجات الصف {gradeId} - الفصل {sectionId}
                </h2>
                <div className="flex gap-4">
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        تصدير إلى Excel
                    </button>
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        استيراد من Excel
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileImport}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />
                    </button>
                    <button
                        onClick={() => setShowNotesModal(true)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                        إدارة الملاحظات الأسبوعية
                    </button>
                    <button
                        onClick={() => setShowStarsModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        إدارة النجوم
                    </button>
                    <button
                        onClick={() => setShowCurriculumModal(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        منهج التلاوة والحفظ
                    </button>
                    <button
                        onClick={() => setShowRecitationModal(true)}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                        كشف التسميع
                    </button>
                    <button
                        onClick={() => setShowGradesModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        إدارة الدرجات
                    </button>
                    <button
                        onClick={() => {
                            setShowGradeSheet(!showGradeSheet);
                            setSelectedStudent(null);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        {showGradeSheet ? "إخفاء كشف الدرجات" : "كشف الدرجات الشامل"}
                    </button>
                </div>
            </div>

            <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                {showAddForm ? "إلغاء" : "+ إضافة طالب"}
            </button>

            {showAddForm && (
                <div className="mb-6 p-4 border border-gray-300 rounded-lg max-w-md bg-gray-50">
                    <input
                        type="text"
                        placeholder="اسم الطالب"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        className="w-full mb-3 p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="السجل المدني"
                        value={newStudent.nationalId}
                        onChange={(e) => setNewStudent({ ...newStudent, nationalId: e.target.value })}
                        className="w-full mb-3 p-2 border rounded"
                    />

                    <input
                        type="text"
                        placeholder="رابط صورة (اختياري)"
                        value={newStudent.photo}
                        onChange={(e) => setNewStudent({ ...newStudent, photo: e.target.value })}
                        className="w-full mb-3 p-2 border rounded"
                    />
                    <button
                        onClick={handleAddStudent}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        حفظ الطالب
                    </button>
                </div>
            )}

            {!showGradeSheet && (
                <div className="flex flex-wrap gap-4 pb-6 mb-6 border-b border-gray-300">
                    {students.length === 0 ? (
                        <p className="text-gray-500">لا يوجد طلاب في هذا الفصل</p>
                    ) : (
                        students.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`p-4 border rounded-lg w-40 text-center cursor-pointer transition-all ${
                                    selectedStudent?.id === student.id
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-300"
                                }`}
                            >
                                <img
                                    src={student.photo}
                                    alt={student.name}
                                    className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                                />
                                <h4 className="font-medium truncate">{student.name}</h4>
                                <p className="text-sm text-gray-600 truncate">السجل: {student.nationalId}</p>
                                <Link
                                    to={`/student/${student.id}`}
                                    className="text-blue-600 text-sm hover:underline block mt-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    رابط الطالب
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            )}

            {!showGradeSheet && selectedStudent ? (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-blue-700">
                        درجات الطالب: {selectedStudent.name}
                    </h3>

                    <div className="space-y-6">
                        {/* Stars Section */}
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center">
                                النجوم المكتسبة
                            </h4>
                            <div className="flex items-center gap-1">
                                <span className="text-2xl text-yellow-400">★</span>
                                <span className="text-xl font-bold">{selectedStudent.stars || 0} / 10</span>
                            </div>
                        </div>

                        {/* Recitation Status Section */}
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center">
                                كشف التسميع
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* حالة حفظ القرآن */}
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h5 className="font-bold mb-2">حالة حفظ القرآن</h5>
                                    {(() => {
                                        const { status, note } = getRecitationStatus(selectedStudent, 'memorization', curriculum);
                                        const statusColor = status === 'fully_recited' ? 'text-green-600' : status === 'late' ? 'text-yellow-600' : status === 'not_memorized' ? 'text-red-600' : 'text-gray-600';
                                        const statusIcon = status === 'fully_recited' ? '🟢' : status === 'late' ? '🟡' : status === 'not_memorized' ? '🔴' : '⚪';
                                        return (
                                            <div className="flex items-start gap-2">
                                                <span className={`text-xl ${statusColor}`}>{statusIcon}</span>
                                                <p className="text-sm text-gray-800">{note}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {/* حالة تلاوة القرآن */}
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h5 className="font-bold mb-2">حالة تلاوة القرآن</h5>
                                    {(() => {
                                        const { status, note } = getRecitationStatus(selectedStudent, 'recitation', curriculum);
                                        const statusColor = status === 'fully_recited' ? 'text-green-600' : status === 'late' ? 'text-yellow-600' : status === 'not_memorized' ? 'text-red-600' : 'text-gray-600';
                                        const statusIcon = status === 'fully_recited' ? '🟢' : status === 'late' ? '🟡' : status === 'not_memorized' ? '🔴' : '⚪';
                                        return (
                                            <div className="flex items-start gap-2">
                                                <span className={`text-xl ${statusColor}`}>{statusIcon}</span>
                                                <p className="text-sm text-gray-800">{note}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Tests */}
                        <div>
                            <h4 className="font-semibold mb-2">الاختبارات</h4>
                            <div className="flex gap-2">
                                {selectedStudent.grades.tests.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "tests", i, Number(e.target.value))
                                        }
                                        className="w-16 p-2 border rounded"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Homework */}
                        <div>
                            <h4 className="font-semibold mb-2">الواجبات (10)</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.homework.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="1"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "homework", i, Number(e.target.value))
                                        }
                                        className="w-12 p-1 border rounded text-center"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 font-medium">
                                المجموع: {selectedStudent.grades.homework.slice(0, 10).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                        {/* Participation */}
                        <div>
                            <h4 className="font-semibold mb-2">المشاركة (10)</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.participation.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="1"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "participation", i, Number(e.target.value))
                                        }
                                        className="w-12 p-1 border rounded text-center"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 font-medium">
                                المجموع: {selectedStudent.grades.participation.slice(0, 10).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                        {/* Performance Tasks */}
                        <div>
                            <h4 className="font-semibold mb-2">المهام الأداءية (1 - 5)</h4>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                value={selectedStudent.grades.performanceTasks}
                                onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "performanceTasks", null, Number(e.target.value))
                                        }
                                className="w-16 p-2 border rounded"
                            />
                        </div>
                        {/* Quran Recitation */}
                        <div>
                            <h4 className="font-semibold mb-2">تلاوة القرآن (5 مربعات)</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.quranRecitation.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "quranRecitation", i, Number(e.target.value))
                                        }
                                        className="w-12 p-1 border rounded text-center"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 font-medium">
                                المجموع:{" "}
                                {selectedStudent.grades.quranRecitation.slice(0, 5).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                        {/* Quran Memorization */}
                        <div>
                            <h4 className="font-semibold mb-2">حفظ القرآن (5 مربعات)</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.quranMemorization.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "quranMemorization", i, Number(e.target.value))
                                        }
                                        className="w-12 p-1 border rounded text-center"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 font-medium">
                                المجموع:{" "}
                                {selectedStudent.grades.quranMemorization.slice(0, 5).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                        {/* Oral Test */}
                        <div>
                            <h4 className="font-semibold mb-2">الاختبار الشفوي (6 مربعات)</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedStudent.grades.oralTest.map((grade, i) => (
                                    <input
                                        key={i}
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={grade}
                                        onChange={(e) =>
                                            updateStudentGrade(selectedStudent.id, "oralTest", i, Number(e.target.value))
                                        }
                                        className="w-12 p-1 border rounded text-center"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 font-medium">
                                المجموع: {selectedStudent.grades.oralTest.slice(0, 6).reduce((a, b) => a + b, 0)}
                            </div>
                        </div>
                         {/* Weekly Notes Section */}
                        <div>
                          <h4 className="font-semibold mb-2">الملاحظات الأسبوعية (16)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {selectedStudent.grades.weeklyNotes.map((notesArray, i) => (
                              <div key={i} className="mb-2 p-3 border rounded-lg bg-gray-50">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">الأسبوع {i + 1}</label>
                                {Array.isArray(notesArray) && notesArray.length > 0 ? (
                                  notesArray.map((note, index) => (
                                    <p key={index} className="text-sm text-gray-800 border-b last:border-b-0 py-1">
                                      {note}
                                    </p>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">لا توجد ملاحظات</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                </div>
            ) : !showGradeSheet ? (
                <p className="text-gray-500">اختر طالباً لعرض درجاته</p>
            ) : null}

            {showGradeSheet && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-700">كشف الدرجات الشامل</h3>
                    {renderBatchControls()}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.length === students.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اختبار 1</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اختبار 2</th>
                                    {[...Array(10)].map((_, i) => (
                                        <th key={i} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">واجب {i + 1}</th>
                                    ))}
                                    {[...Array(10)].map((_, i) => (
                                        <th key={i} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مشاركة {i + 1}</th>
                                    ))}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مهام أدائية</th>
                                    {[...Array(6)].map((_, i) => (
                                        <th key={i} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شفوي {i + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => toggleStudentSelection(student.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number" min="0" max="100"
                                                value={student.grades.tests[0] || 0}
                                                onChange={(e) => updateStudentGrade(student.id, 'tests', 0, Number(e.target.value))}
                                                className="w-16 p-1 border rounded text-center"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number" min="0" max="100"
                                                value={student.grades.tests[1] || 0}
                                                onChange={(e) => updateStudentGrade(student.id, 'tests', 1, Number(e.target.value))}
                                                className="w-16 p-1 border rounded text-center"
                                            />
                                        </td>
                                        {[...Array(10)].map((_, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="number" min="0" max="1"
                                                    value={student.grades.homework[i] || 0}
                                                    onChange={(e) => updateStudentGrade(student.id, 'homework', i, Number(e.target.value))}
                                                    className="w-12 p-1 border rounded text-center"
                                                />
                                            </td>
                                        ))}
                                        {[...Array(10)].map((_, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="number" min="0" max="1"
                                                    value={student.grades.participation[i] || 0}
                                                    onChange={(e) => updateStudentGrade(student.id, 'participation', i, Number(e.target.value))}
                                                    className="w-12 p-1 border rounded text-center"
                                                />
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number" min="0" max="5"
                                                value={student.grades.performanceTasks || 0}
                                                onChange={(e) => updateStudentGrade(student.id, 'performanceTasks', null, Number(e.target.value))}
                                                className="w-16 p-1 border rounded text-center"
                                            />
                                        </td>
                                        {[...Array(6)].map((_, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="number" min="0" max="5"
                                                    value={student.grades.oralTest[i] || 0}
                                                    onChange={(e) => updateStudentGrade(student.id, 'oralTest', i, Number(e.target.value))}
                                                    className="w-12 p-1 border rounded text-center"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showNotesModal && (
                <NotesModal
                    students={students}
                    onClose={() => setShowNotesModal(false)}
                    onSave={(updatedStudents) => {
                        updateStudentsData(updatedStudents);
                        setShowNotesModal(false);
                    }}
                />
            )}
            {showStarsModal && (
                <StarsModal
                    students={students}
                    onClose={() => setShowStarsModal(false)}
                    onSave={updateStudentStars}
                />
            )}
            {showRecitationModal && (
                <RecitationModal
                    students={students}
                    curriculum={curriculum}
                    onClose={() => setShowRecitationModal(false)}
                    onSave={updateRecitationData}
                />
            )}
            {showCurriculumModal && (
                <CurriculumModal
                    curriculum={curriculum}
                    onClose={() => setShowCurriculumModal(false)}
                    onSave={updateCurriculumData}
                />
            )}
            {showGradesModal && (
                <GradesModal
                    students={students}
                    onClose={() => setShowGradesModal(false)}
                    onSave={updateStudentsData}
                />
            )}
        </div>
    );
};

export default SectionGrades;