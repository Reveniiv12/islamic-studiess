// src/components/StudentVisitsModal.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { FaCalendarAlt, FaHourglassHalf } from "react-icons/fa";
import { supabase } from "../supabaseClient"; // استيراد Supabase

const StudentVisitsModal = ({ show, onClose, student, calculateDuration }) => {
    // حالة محلية لتخزين وعرض السجلات (لكي نستطيع تحديثها)
    const [logs, setLogs] = useState([]);

    // 1. تحديث الحالة عند فتح المودال أو تغيير الطالب
    useEffect(() => {
        if (student && student.logs) {
            setLogs(student.logs);
        } else {
            setLogs([]);
        }
    }, [student]);

    // 2. الاشتراك في التحديثات المباشرة (Real-time)
    useEffect(() => {
        if (!show || !student) return;

        // الاشتراك في جدول page_visits لهذا الطالب فقط
        const channel = supabase
            .channel(`visits-${student.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // الاستماع لكل التغييرات (إضافة أو تعديل)
                    schema: 'public',
                    table: 'page_visits',
                    filter: `student_id=eq.${student.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // عند دخول جديد، نضيف السجل في بداية القائمة
                        setLogs(prevLogs => [payload.new, ...prevLogs]);
                    } 
                    else if (payload.eventType === 'UPDATE') {
                        // عند تحديث وقت الخروج، نحدث السجل الموجود
                        setLogs(prevLogs => prevLogs.map(log => 
                            log.id === payload.new.id ? payload.new : log
                        ));
                    }
                }
            )
            .subscribe();

        // تنظيف الاشتراك عند الإغلاق
        return () => {
            supabase.removeChannel(channel);
        };
    }, [show, student]);

    if (!student) return null;

    return (
        <CustomModal title={`سجل زيارات الطالب: ${student.student_name}`} onClose={onClose}>
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <h4 className="text-lg font-bold text-gray-100">{student.student_name}</h4>
                    <p className="text-sm text-gray-400">السجل المدني: {student.student_national_id}</p>
                    <p className="text-sm font-semibold text-gray-300 mt-2">
                        {/* استخدام logs.length بدلاً من student.logs.length */}
                        عدد الزيارات الكلي: {logs.length}
                    </p>
                </div>
                
                <div className="max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
                    {/* عرض السجلات من الحالة logs */}
                    {logs.map((log, index) => (
                        <div key={log.id || index} className="bg-gray-700 p-3 rounded-lg border border-gray-600 animate-fadeIn">
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
                    {logs.length === 0 && (
                        <p className="text-center text-gray-500 py-4">لا توجد زيارات مسجلة.</p>
                    )}
                </div>
            </div>
        </CustomModal>
    );
};

export default StudentVisitsModal;
