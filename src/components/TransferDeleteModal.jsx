// src/components/TransferDeleteModal.jsx
import React, { useState, useEffect } from "react";
import {
    FaSearch,
    FaUserCircle,
    FaTimesCircle,
    FaArrowLeft,
} from "react-icons/fa";

// استيراد Supabase
import { supabase } from "../supabaseClient";
// استيراد البيانات الوهمية من الملف
import { gradesData } from "../data/mockData";

const TransferDeleteModal = ({ show, onClose, students, updateStudentsData, handleDialog, gradeId, sectionId, teacherId }) => {
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [transferSearchQuery, setTransferSearchQuery] = useState("");
    const [showTransferOptions, setShowTransferOptions] = useState(false);
    const [selectedTransferSection, setSelectedTransferSection] = useState(null);
    const [allStudentsSelected, setAllStudentsSelected] = useState(false); // New state for "Select All"

    // Get the current grade sections from the mock data
    const currentGrade = gradesData.find(g => g.id === gradeId);
    const currentSections = currentGrade?.sections || [];

    // Clear state when the modal closes
    useEffect(() => {
        if (!show) {
            setSelectedStudents([]);
            setTransferSearchQuery("");
            setAllStudentsSelected(false); // Reset "Select All" state
            setShowTransferOptions(false);
            setSelectedTransferSection(null);
        }
    }, [show]);

    // Sync "Select All" checkbox state with the selected students list
    useEffect(() => {
        const areAllStudentsSelected = students.length > 0 && selectedStudents.length === students.length;
        setAllStudentsSelected(areAllStudentsSelected);
    }, [selectedStudents, students]);

    if (!show) {
        return null;
    }

    const getGradeNameById = (id) => {
        return gradesData.find(g => g.id === id)?.name || "غير معروف";
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
                async () => {
                    try {
                        const { error } = await supabase
                            .from('students')
                            .delete()
                            .in('id', selectedStudents)
                            .eq('teacher_id', teacherId); // فلترة الحذف حسب معرف المعلم

                        if (error) throw error;
                        
                        const updatedStudents = students.filter(s => !selectedStudents.includes(s.id));
                        updateStudentsData(updatedStudents);
                        setSelectedStudents([]);
                        handleDialog("نجاح", "تم حذف الطلاب بنجاح.", "success");
                    } catch (error) {
                        console.error("Error deleting students:", error);
                        handleDialog("خطأ", "حدث خطأ أثناء حذف الطلاب.", "error");
                    }
                }
            );
        }, 100);
    };

    const handleTransferStudents = () => {
        if (selectedStudents.length === 0 || !selectedTransferSection) {
            handleDialog("تنبيه", "الرجاء تحديد الطلاب والفصل المراد النقل إليه.", "warning");
            return;
        }
        if (!teacherId) {
            handleDialog("خطأ", "معرف المعلم غير متوفر. لا يمكن إكمال العملية.", "error");
            return;
        }

        const studentNames = students.filter(s => selectedStudents.includes(s.id)).map(s => s.name).join(', ');
        const targetSectionName = `فصل ${selectedTransferSection}`;

        onClose();

        setTimeout(() => {
            handleDialog(
                "تأكيد النقل",
                `هل أنت متأكد أنك تريد نقل الطلاب التالية أسماؤهم: ${studentNames} إلى ${targetSectionName}؟`,
                "confirm",
                async () => {
                    try {
                        // التحقق من تعارض السجل المدني في الفصل المستهدف
                        const studentsToTransfer = students.filter(s => selectedStudents.includes(s.id));
                        const nationalIdsToTransfer = studentsToTransfer.map(s => s.nationalId);

                        const { data: existingStudents, error: conflictError } = await supabase
                            .from('students')
                            .select('name, national_id')
                            .eq('grade_level', gradeId) // استخدام grade_level
                            .eq('section', selectedTransferSection) // استخدام section
                            .eq('teacher_id', teacherId) // فلترة الاستعلام حسب معرف المعلم
                            .in('national_id', nationalIdsToTransfer);

                        if (conflictError) throw conflictError;

                        if (existingStudents && existingStudents.length > 0) {
                            const conflictingNames = existingStudents.map(s => s.name).join(', ');
                            handleDialog("خطأ في النقل", `لا يمكن نقل الطلاب بسبب وجود سجلات مدنية متطابقة مع الطلاب التالية أسماؤهم في الفصل المستهدف: ${conflictingNames}.`, "error");
                            return;
                        }

                        // تنفيذ النقل
                        const { error: transferError } = await supabase
                            .from('students')
                            .update({ 
                                grade_level: gradeId, // استخدام grade_level
                                section: selectedTransferSection // استخدام section
                            })
                            .in('id', selectedStudents)
                            .eq('teacher_id', teacherId); // فلترة التحديث حسب معرف المعلم

                        if (transferError) throw transferError;
                        
                        const updatedStudents = students.filter(s => !selectedStudents.includes(s.id));
                        updateStudentsData(updatedStudents);
                        setSelectedStudents([]);
                        setShowTransferOptions(false);
                        setSelectedTransferSection(null);
                        handleDialog("نجاح", "تم نقل الطلاب بنجاح.", "success");
                    } catch (error) {
                        console.error("Error transferring students:", error);
                        handleDialog("خطأ", "حدث خطأ أثناء نقل الطلاب.", "error");
                    }
                }
            );
        }, 100);
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };
    
    // New function to handle "Select All" toggle
    const toggleSelectAll = () => {
        if (allStudentsSelected) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allStudentsSelected}
                          onChange={toggleSelectAll}
                          className="form-checkbox h-5 w-5 text-blue-600 bg-gray-900 border-gray-500 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-200">تحديد الكل</span>
                      </div>
                      <span className="text-sm text-gray-400">{selectedStudents.length} طالب محدد</span>
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
                        <div className="flex flex-wrap gap-2">
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
