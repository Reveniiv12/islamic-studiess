// src/components/GradesModal.jsx
import React, { useState, useEffect } from "react";

const GradesModal = ({ students, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('tests');
    const [modalStudents, setModalStudents] = useState(students);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [batchGrade, setBatchGrade] = useState('');
    const [homeworkIndex, setHomeworkIndex] = useState(0); // 0 for الواجب 1
    const [oralTestIndex, setOralTestIndex] = useState(0);

    useEffect(() => {
        setModalStudents(students);
        setSelectedStudents([]);
    }, [students]);

    const handleGradeChange = (studentId, category, index, value) => {
        const updatedStudents = modalStudents.map(student => {
            if (student.id === studentId) {
                const updatedGrades = { ...student.grades };
                if (Array.isArray(updatedGrades[category])) {
                    const newArray = [...updatedGrades[category]];
                    newArray[index] = value === '' ? null : Number(value);
                    updatedGrades[category] = newArray;
                } else {
                    updatedGrades[category] = value === '' ? null : Number(value);
                }
                return { ...student, grades: updatedGrades };
            }
            return student;
        });
        setModalStudents(updatedStudents);
    };

    const handleSave = () => {
        onSave(modalStudents);
        onClose();
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prevSelected =>
            prevSelected.includes(studentId)
                ? prevSelected.filter(id => id !== studentId)
                : [...prevSelected, studentId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === modalStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(modalStudents.map(student => student.id));
        }
    };

    const handleBatchGradeApply = (category) => {
        if (batchGrade === '' || selectedStudents.length === 0) {
            alert("يرجى إدخال درجة واختيار الطلاب أولاً.");
            return;
        }

        const gradeValue = Number(batchGrade);
        const updatedStudents = modalStudents.map(student => {
            if (selectedStudents.includes(student.id)) {
                const updatedGrades = { ...student.grades };
                if (Array.isArray(updatedGrades[category])) {
                    let indexToUpdate = -1;
                    if (category === 'homework') {
                        indexToUpdate = homeworkIndex;
                    } else if (category === 'participation') {
                         indexToUpdate = updatedGrades[category].findIndex(g => g === null);
                    } else if (category === 'oralTest') {
                        indexToUpdate = oralTestIndex;
                    } else {
                        indexToUpdate = updatedGrades[category].findIndex(g => g === null);
                    }
                    if (indexToUpdate !== -1) {
                        const newArray = [...updatedGrades[category]];
                        newArray[indexToUpdate] = gradeValue;
                        updatedGrades[category] = newArray;
                    }
                } else {
                    updatedGrades[category] = gradeValue;
                }
                return { ...student, grades: updatedGrades };
            }
            return student;
        });
        setModalStudents(updatedStudents);
        setBatchGrade('');
    };

    const handleAutoAssignParticipation = () => {
        const gradeValue = 1;
        const updatedStudents = modalStudents.map(student => {
            const updatedGrades = { ...student.grades };
            const firstEmptyIndex = updatedGrades.participation.findIndex(g => g === null);
            if (firstEmptyIndex !== -1) {
                const newArray = [...updatedGrades.participation];
                newArray[firstEmptyIndex] = gradeValue;
                updatedGrades.participation = newArray;
            }
            return { ...student, grades: updatedGrades };
        });
        setModalStudents(updatedStudents);
    };

    const renderBatchControls = (category) => (
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-700 rounded-lg">
            <span className="font-semibold text-blue-400 text-sm">رصد جماعي:</span>
            <input
                type="number"
                min="0"
                value={batchGrade}
                onChange={(e) => setBatchGrade(e.target.value)}
                placeholder="الدرجة"
                className="w-20 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white"
            />
            <button
                onClick={() => handleBatchGradeApply(category)}
                className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-500 transition-colors"
            >
                تطبيق
            </button>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'tests':
                return (
                    <div className="space-y-4">
                        {renderBatchControls('tests')}
                        <div className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                            <div className="w-1/3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.length === modalStudents.length}
                                    onChange={toggleSelectAll}
                                    className="accent-blue-500"
                                />
                                <span className="font-semibold text-gray-100">اسم الطالب</span>
                            </div>
                            <div className="flex gap-4 text-gray-300 text-sm">
                                <span className="w-16 text-center">اختبار 1</span>
                                <span className="w-16 text-center">اختبار 2</span>
                            </div>
                        </div>
                        {modalStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center border-b border-gray-700 pb-2 hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <div className="w-1/3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="accent-blue-500"
                                    />
                                    <span className="truncate text-gray-100">{student.name}</span>
                                </div>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={student.grades.tests[0] === null ? '' : student.grades.tests[0]}
                                        onChange={(e) => handleGradeChange(student.id, 'tests', 0, e.target.value)}
                                        className="w-16 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={student.grades.tests[1] === null ? '' : student.grades.tests[1]}
                                        onChange={(e) => handleGradeChange(student.id, 'tests', 1, e.target.value)}
                                        className="w-16 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'homework':
                return (
                    <div className="space-y-4">
                         <div className="flex items-center justify-between mb-4 p-2 bg-gray-700 rounded-lg">
                            <label className="font-semibold text-gray-300 text-sm">رقم الواجب:</label>
                            <select
                                value={homeworkIndex}
                                onChange={(e) => setHomeworkIndex(Number(e.target.value))}
                                className="p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm"
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i} value={i}>الواجب {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        {renderBatchControls('homework')}
                        <div className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                            <div className="w-1/3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.length === modalStudents.length}
                                    onChange={toggleSelectAll}
                                    className="accent-blue-500"
                                />
                                <span className="font-semibold text-gray-100">اسم الطالب</span>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                                {[...Array(10)].map((_, i) => (
                                    <span key={i} className="w-8 text-center text-sm text-gray-300">واجب {i + 1}</span>
                                ))}
                            </div>
                        </div>
                        {modalStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center border-b border-gray-700 pb-2 hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <div className="w-1/3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="accent-blue-500"
                                    />
                                    <span className="truncate text-gray-100">{student.name}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {[...Array(10)].map((_, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min="0"
                                            max="1"
                                            value={student.grades.homework[i] === null ? '' : student.grades.homework[i]}
                                            onChange={(e) => handleGradeChange(student.id, 'homework', i, e.target.value)}
                                            className="w-10 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'participation':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4 p-2 bg-gray-700 rounded-lg">
                            <h4 className="font-semibold text-gray-300 text-sm">ملاحظة:</h4>
                            <button
                                onClick={handleAutoAssignParticipation}
                                className="bg-purple-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-purple-500 transition-colors"
                            >
                                رصد درجة المشاركة (1)
                            </button>
                        </div>
                        <div className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                             <div className="w-1/3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.length === modalStudents.length}
                                    onChange={toggleSelectAll}
                                    className="accent-blue-500"
                                />
                                <span className="font-semibold text-gray-100">اسم الطالب</span>
                            </div>
                             <div className="flex gap-2 flex-wrap justify-end text-sm text-gray-300">
                                 {[...Array(10)].map((_, i) => (<span key={i} className="w-8 text-center">مشاركة {i + 1}</span>))}
                             </div>
                        </div>
                        {modalStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center border-b border-gray-700 pb-2 hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <div className="w-1/3 flex items-center gap-2">
                                     <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="accent-blue-500"
                                    />
                                    <span className="truncate text-gray-100">{student.name}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {[...Array(10)].map((_, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min="0"
                                            max="1"
                                            value={student.grades.participation[i] === null ? '' : student.grades.participation[i]}
                                            onChange={(e) => handleGradeChange(student.id, 'participation', i, e.target.value)}
                                            className="w-10 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'performanceTasks':
                return (
                    <div className="space-y-4">
                        {renderBatchControls('performanceTasks')}
                        <div className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                            <div className="w-1/3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.length === modalStudents.length}
                                    onChange={toggleSelectAll}
                                    className="accent-blue-500"
                                />
                                <span className="font-semibold text-gray-100">اسم الطالب</span>
                            </div>
                            <div className="flex gap-4 text-gray-300 text-sm">
                                <span className="w-16 text-center">مهمة 1</span>
                                <span className="w-16 text-center">مهمة 2</span>
                                <span className="w-16 text-center">مهمة 3</span>
                            </div>
                        </div>
                        {modalStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center border-b border-gray-700 pb-2 hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <div className="w-1/3 flex items-center gap-2">
                                     <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="accent-blue-500"
                                    />
                                    <span className="truncate text-gray-100">{student.name}</span>
                                </div>
                                <div className="flex gap-4">
                                    {Array.isArray(student.grades.performanceTasks) && student.grades.performanceTasks.map((grade, i) => (
                                         <input key={i} type="number" min="0" max="5" value={grade === null ? '' : grade} onChange={(e) => handleGradeChange(student.id, 'performanceTasks', i, e.target.value)} className="w-16 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'oralTest':
                return (
                    <div className="space-y-4">
                         <div className="flex items-center justify-between mb-4 p-2 bg-gray-700 rounded-lg">
                            <label className="font-semibold text-gray-300 text-sm">رقم الاختبار الشفوي:</label>
                            <select
                                value={oralTestIndex}
                                onChange={(e) => setOralTestIndex(Number(e.target.value))}
                                className="p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm"
                            >
                                {[...Array(6)].map((_, i) => (
                                    <option key={i} value={i}>شفوي {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        {renderBatchControls('oralTest')}
                        <div className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                            <div className="w-1/3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.length === modalStudents.length}
                                    onChange={toggleSelectAll}
                                    className="accent-blue-500"
                                />
                                <span className="font-semibold text-gray-100">اسم الطالب</span>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end text-sm text-gray-300">
                                {[...Array(6)].map((_, i) => (<span key={i} className="w-10 text-center">شفوي {i + 1}</span>))}
                            </div>
                        </div>
                        {modalStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center border-b border-gray-700 pb-2 hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <div className="w-1/3 flex items-center gap-2">
                                     <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="accent-blue-500"
                                    />
                                    <span className="truncate text-gray-100">{student.name}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {[...Array(6)].map((_, i) => (
                                        <input
                                            key={i}
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={student.grades.oralTest[i] === null ? '' : student.grades.oralTest[i]}
                                            onChange={(e) => handleGradeChange(student.id, 'oralTest', i, e.target.value)}
                                            className="w-10 p-1 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
                        <h3 className="text-xl font-bold text-gray-100">إدارة الدرجات</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab('tests')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'tests' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            الاختبارات
                        </button>
                        <button
                            onClick={() => setActiveTab('homework')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'homework' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            الواجبات
                        </button>
                        <button
                            onClick={() => setActiveTab('participation')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'participation' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            المشاركة
                        </button>
                        <button
                            onClick={() => setActiveTab('performanceTasks')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'performanceTasks' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            المهام الأدائية
                        </button>
                        <button
                            onClick={() => setActiveTab('oralTest')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'oralTest' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                        >
                            الاختبار الشفوي
                        </button>
                    </div>

                    <div className="mt-4">
                        {renderContent()}
                    </div>
                </div>

                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end gap-2">
                    <button
                        onClick={handleSave}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors"
                    >
                        حفظ
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradesModal;