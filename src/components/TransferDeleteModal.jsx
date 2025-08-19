// src/components/TransferDeleteModal.jsx
import React, { useState, useEffect } from "react";
import {
    FaSearch,
    FaUserCircle,
    FaTimesCircle,
    FaArrowLeft,
} from "react-icons/fa";
import { gradesData } from "../data/mockData";

const TransferDeleteModal = ({ show, onClose, students, updateStudentsData, handleDialog, gradeId, sectionId }) => {
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [transferSearchQuery, setTransferSearchQuery] = useState("");
    const [showTransferOptions, setShowTransferOptions] = useState(false);
    const [selectedTransferSection, setSelectedTransferSection] = useState(null);

    // Get the current grade sections
    const currentGrade = gradesData.find(g => g.id === gradeId);
    const currentSections = currentGrade?.sections || [];

    // Clear state when the modal closes
    useEffect(() => {
        if (!show) {
            setSelectedStudents([]);
            setTransferSearchQuery("");
            setShowTransferOptions(false);
            setSelectedTransferSection(null);
        }
    }, [show]);

    if (!show) {
        return null;
    }

    const getGradeNameById = (id) => {
        return gradesData.find(g => g.id === id)?.name || "غير معروف";
    };

    const getSectionNameById = (section) => {
        return `فصل ${section}` || "غير معروف";
    };

    const handleDeleteStudents = () => {
        if (selectedStudents.length === 0) {
            handleDialog("تنبيه", "الرجاء تحديد الطلاب المراد حذفهم.", "warning");
            return;
        }

        const studentNames = students.filter(s => selectedStudents.includes(s.id)).map(s => s.name).join(', ');
        
        onClose();

        setTimeout(() => {
            handleDialog(
                "تأكيد الحذف",
                `هل أنت متأكد أنك تريد حذف الطلاب التالية أسماؤهم: ${studentNames}؟`,
                "confirm",
                () => {
                    const updatedStudents = students.filter(s => !selectedStudents.includes(s.id));
                    updateStudentsData(updatedStudents);
                    setSelectedStudents([]);
                    handleDialog("نجاح", "تم حذف الطلاب بنجاح.", "success");
                }
            );
        }, 300);
    };

    const handleTransferStudents = () => {
        if (selectedStudents.length === 0 || !selectedTransferSection) {
            handleDialog("تنبيه", "الرجاء تحديد الطلاب والفصل المراد النقل إليه.", "warning");
            return;
        }

        const studentNames = students.filter(s => selectedStudents.includes(s.id)).map(s => s.name).join(', ');
        const targetGradeName = getGradeNameById(gradeId);
        const targetSectionName = getSectionNameById(selectedTransferSection);

        onClose();

        setTimeout(() => {
            handleDialog(
                "تأكيد النقل",
                `هل أنت متأكد أنك تريد نقل الطلاب التالية أسماؤهم: ${studentNames} إلى ${targetGradeName} - ${targetSectionName}؟`,
                "confirm",
                () => {
                    const targetStorageKey = `grades_${gradeId}_${selectedTransferSection}`;
                    const targetStudents = JSON.parse(localStorage.getItem(targetStorageKey) || "[]");
                    const studentsToMove = students.filter(s => selectedStudents.includes(s.id));
                    const studentsToKeep = students.filter(s => !selectedStudents.includes(s.id));

                    const updatedTargetStudents = [...targetStudents, ...studentsToMove];
                    localStorage.setItem(targetStorageKey, JSON.stringify(updatedTargetStudents));

                    updateStudentsData(studentsToKeep);

                    setSelectedStudents([]);
                    setShowTransferOptions(false);
                    setSelectedTransferSection(null);
                    handleDialog("نجاح", "تم نقل الطلاب بنجاح.", "success");
                }
            );
        }, 300);
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const filteredTransferStudents = students.filter(student =>
        student.name.toLowerCase().includes(transferSearchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-blue-400 text-right">نقل وحذف الطلاب</h3>
                <div className="mb-4">
                    <div className="relative flex items-center mb-4">
                        <FaSearch className="absolute right-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث عن طالب..."
                            value={transferSearchQuery}
                            onChange={(e) => setTransferSearchQuery(e.target.value)}
                            className="w-full p-2 pr-10 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-700 p-2 rounded-lg">
                        {filteredTransferStudents.map(student => (
                            <div
                                key={student.id}
                                onClick={() => toggleStudentSelection(student.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.id) ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600"}`}
                            >
                                <FaUserCircle className="text-2xl" />
                                <span className="text-sm font-medium">{student.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={handleDeleteStudents}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm"
                    >
                        <FaTimesCircle /> حذف الطلاب المحددين
                    </button>
                    <button
                        onClick={() => setShowTransferOptions(!showTransferOptions)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm"
                    >
                        <FaArrowLeft /> نقل الطلاب المحددين
                    </button>
                </div>

                {showTransferOptions && (
                    <div className="mt-6 p-4 rounded-xl bg-gray-700 border border-gray-600">
                        <h4 className="text-lg font-bold mb-3 text-white">اختر الفصل المراد النقل إليه:</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                {/* Only show sections for the current grade */}
                                {currentSections.map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setSelectedTransferSection(section)}
                                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${selectedTransferSection === section ? "bg-blue-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"}`}
                                    >
                                        فصل {section}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleTransferStudents}
                            disabled={!selectedTransferSection || selectedStudents.length === 0}
                            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            تأكيد النقل
                        </button>
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferDeleteModal;