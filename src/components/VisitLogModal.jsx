// src/components/VisitLogModal.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import StudentVisitsModal from "./StudentVisitsModal"; // New import
import { supabase } from "../supabaseClient";
import { FaClock, FaCalendarAlt, FaHourglassHalf, FaUser, FaListAlt } from "react-icons/fa";

const VisitLogModal = ({ show, onClose, students, teacherId }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStudentVisitsModal, setShowStudentVisitsModal] = useState(false);
    const [selectedStudentVisits, setSelectedStudentVisits] = useState(null);

    useEffect(() => {
        if (show && teacherId && students && students.length > 0) {
            const fetchVisits = async () => {
                setLoading(true);
                try {
                    const studentIds = students.map(s => s.id);
                    const { data: rawVisits, error: visitsError } = await supabase
                        .from('page_visits')
                        .select('student_id, visit_start_time, visit_end_time')
                        .eq('teacher_id', teacherId)
                        .in('student_id', studentIds)
                        .order('visit_start_time', { ascending: false });

                    if (visitsError) throw visitsError;

                    const studentMap = new Map(students.map(s => [s.id, s]));

                    const groupedVisits = rawVisits.reduce((acc, visit) => {
                        const student = studentMap.get(visit.student_id);
                        if (student) {
                            if (!acc[student.id]) {
                                acc[student.id] = {
                                    student_name: student.name,
                                    student_national_id: student.nationalId,
                                    logs: []
                                };
                            }
                            acc[student.id].logs.push(visit);
                        }
                        return acc;
                    }, {});

                    setVisits(Object.values(groupedVisits));
                } catch (err) {
                    console.error("Error fetching visit logs:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchVisits();
        }
    }, [show, teacherId, students]);

    const calculateDuration = (start, end) => {
        if (!start || !end) return 'لم يغادر بعد';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffInMs = endDate - startDate;
        const minutes = Math.floor(diffInMs / 60000);
        const seconds = Math.floor((diffInMs % 60000) / 1000);
        return `${minutes} دقيقة, ${seconds} ثانية`;
    };

    const handleShowMore = (studentVisit) => {
        setSelectedStudentVisits(studentVisit);
        setShowStudentVisitsModal(true);
    };

    return (
        <>
            <CustomModal title="سجل زيارات الطلاب" onClose={onClose}>
                {loading ? (
                    <div className="flex justify-center items-center p-8">
                        <FaClock className="animate-spin text-blue-400 text-3xl" />
                        <span className="mr-2 text-lg text-gray-300">جاري تحميل السجل...</span>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {visits.length > 0 ? (
                            <div className="space-y-6">
                                {visits.map((studentVisit, index) => (
                                    <div key={index} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-blue-400" />
                                                <h4 className="text-lg font-bold text-gray-100">{studentVisit.student_name}</h4>
                                                <p className="text-sm text-gray-400">({studentVisit.student_national_id})</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-sm font-semibold text-gray-300">عدد الزيارات: {studentVisit.logs.length}</h5>
                                                {studentVisit.logs.length > 2 && (
                                                    <button onClick={() => handleShowMore(studentVisit)} className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-colors flex items-center gap-1">
                                                        <FaListAlt /> المزيد
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 pr-4">
                                            {studentVisit.logs.slice(0, 2).map((log, logIndex) => (
                                                <div key={logIndex} className="bg-gray-800 p-3 rounded-lg border border-gray-600">
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
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 p-8">
                                <FaClock className="text-6xl mx-auto mb-4 text-gray-600" />
                                <p>لا توجد زيارات مسجلة لهذا الفصل حتى الآن.</p>
                            </div>
                        )}
                    </div>
                )}
            </CustomModal>
            {showStudentVisitsModal && selectedStudentVisits && (
                <StudentVisitsModal
                    show={showStudentVisitsModal}
                    onClose={() => setShowStudentVisitsModal(false)}
                    student={selectedStudentVisits}
                    calculateDuration={calculateDuration}
                />
            )}
        </>
    );
};

export default VisitLogModal;
