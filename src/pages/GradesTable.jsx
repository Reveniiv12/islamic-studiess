// src/components/GradesTable.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaPencilAlt, FaUserCircle } from "react-icons/fa";

const GradesTable = ({
    filteredStudents,
    gradeName,
    sectionName,
    setSelectedStudent,
    selectedStudent,
    setEditingStudent,
    setShowEditForm
}) => {
    return (
        <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl md:text-2xl font-bold text-blue-400 text-right mb-4">
                الطلاب في {gradeName} - {sectionName}
            </h3>
            <div className="flex flex-wrap justify-start gap-4 pb-4 md:pb-6 mb-4 md:mb-6">
                {filteredStudents.length === 0 ? (
                    <p className="text-gray-400 text-lg text-center w-full">
                        لا يوجد طلاب في هذا الفصل حاليًا. يمكنك إضافة طالب جديد أو استيراد بيانات.
                    </p>
                ) : (
                    filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={`flex items-center gap-4 p-4 border rounded-xl w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-sm ${
                                selectedStudent?.id === student.id
                                    ? "border-blue-500 bg-gray-700"
                                    : "border-gray-700 bg-gray-900"
                            }`}
                            dir="rtl"
                        >
                            {/* مربع placeholder */}
                            <div className="w-12 h-12 bg-red-500 rounded-lg flex-shrink-0"></div>

                            {/* بيانات الطالب */}
                            <div className="flex-1 flex flex-col text-right">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-100 text-lg">{student.name}</h4>
                                    <FaUserCircle className="text-blue-400 text-2xl" />
                                </div>
                                <p className="text-sm text-gray-400">
                                    السجل المدني: {student.nationalId}
                                </p>
                                <p className="text-sm text-gray-400">
                                    رقم ولي الأمر: {student.parentPhone}
                                </p>

                                {/* رابط لصفحة الطالب */}
                                {student.viewKey && (
                                    <a
                                        href={`${window.location.origin}/student-view/${student.viewKey}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 text-blue-400 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        الدخول لصفحة الطالب
                                    </a>
                                )}

                                <div className="flex mt-2 justify-end gap-2">
                                    <Link
                                        to={`/student/${student.id}`}
                                        className="text-gray-400 hover:text-blue-400 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        عرض الملف الشخصي
                                    </Link>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingStudent(student);
                                            setShowEditForm(true);
                                        }}
                                        className="text-gray-400 hover:text-blue-400 transition-colors"
                                        title="تعديل بيانات الطالب"
                                    >
                                        <FaPencilAlt />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GradesTable;
