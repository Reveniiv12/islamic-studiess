// src/components/StudentVisitsModal.jsx
import React from "react";
import CustomModal from "./CustomModal";
import { FaCalendarAlt, FaHourglassHalf } from "react-icons/fa";

const StudentVisitsModal = ({ show, onClose, student, calculateDuration }) => {
    if (!student) return null;

    return (
        <CustomModal title={`سجل زيارات الطالب: ${student.student_name}`} onClose={onClose}>
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-lg font-bold text-gray-100">{student.student_name}</h4>
                    <p className="text-sm text-gray-400">السجل المدني: {student.student_national_id}</p>
                    <p className="text-sm font-semibold text-gray-300 mt-2">
                        عدد الزيارات الكلي: {student.logs.length}
                    </p>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-3">
                    {student.logs.map((log, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-green-400" />
                                <span className="text-gray-300 text-sm">
                                    وقت الدخول: {new Date(log.visit_start_time).toLocaleString('ar-SA', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <FaHourglassHalf className="text-red-400" />
                                <span className="text-gray-300 text-sm">
                                    المدة: {calculateDuration(log.visit_start_time, log.visit_end_time)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </CustomModal>
    );
};

export default StudentVisitsModal;
