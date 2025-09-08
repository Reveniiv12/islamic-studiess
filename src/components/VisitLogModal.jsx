// src/components/VisitLogModal.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { supabase } from "../supabaseClient";
import { FaClock, FaCalendarAlt, FaHourglassHalf, FaUser } from "react-icons/fa";

const VisitLogModal = ({ show, onClose, students, teacherId }) => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (show && teacherId) {
            const fetchVisits = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('page_visits')
                        .select('student_id, visit_start_time, visit_end_time')
                        .eq('teacher_id', teacherId)
                        .order('visit_start_time', { ascending: false });

                    if (error) {
                        throw error;
                    }

                    const visitsWithStudentNames = data.map(visit => {
                        const student = students.find(s => s.id === visit.student_id);
                        return {
                            ...visit,
                            student_name: student ? student.name : 'طالب محذوف',
                            student_national_id: student ? student.nationalId : 'غير متوفر',
                        };
                    });

                    setVisits(visitsWithStudentNames);
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

    return (
        <CustomModal title="سجل زيارات الطلاب" onClose={onClose}>
            {loading ? (
                <div className="flex justify-center items-center p-8">
                    <FaClock className="animate-spin text-blue-400 text-3xl" />
                    <span className="mr-2 text-lg text-gray-300">جاري تحميل السجل...</span>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto">
                    {visits.length > 0 ? (
                        <div className="space-y-4">
                            {visits.map((visit, index) => (
                                <div key={index} className="bg-gray-700 p-4 rounded-lg shadow-md border border-gray-600">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaUser className="text-blue-400" />
                                        <h4 className="text-lg font-bold text-gray-100">{visit.student_name}</h4>
                                        <p className="text-sm text-gray-400">({visit.student_national_id})</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-green-400" />
                                            <span>وقت الدخول: {new Date(visit.visit_start_time).toLocaleString('ar-SA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaHourglassHalf className="text-red-400" />
                                            <span>المدة: {calculateDuration(visit.visit_start_time, visit.visit_end_time)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 p-8">
                            <FaClock className="text-6xl mx-auto mb-4 text-gray-600" />
                            <p>لا توجد زيارات مسجلة حتى الآن.</p>
                        </div>
                    )}
                </div>
            )}
        </CustomModal>
    );
};

export default VisitLogModal;
