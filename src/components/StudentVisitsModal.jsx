// src/components/StudentVisitsModal.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { FaCalendarAlt, FaHourglassHalf, FaFilePdf } from "react-icons/fa"; // إضافة أيقونة PDF للتمثيل
import { supabase } from "../supabaseClient";

const StudentVisitsModal = ({ show, onClose, student, calculateDuration }) => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        if (student && student.logs) {
            setLogs(student.logs);
        } else {
            setLogs([]);
        }
    }, [student]);

    useEffect(() => {
        if (!show || !student) return;

        const channel = supabase
            .channel(`visits-${student.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'page_visits',
                    filter: `student_id=eq.${student.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setLogs(prevLogs => [payload.new, ...prevLogs]);
                    } 
                    else if (payload.eventType === 'UPDATE') {
                        setLogs(prevLogs => prevLogs.map(log => 
                            log.id === payload.new.id ? payload.new : log
                        ));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [show, student]);

    if (!student) return null;

    return (
        <CustomModal title={`سجل زيارات الطالب: ${student.student_name}`} onClose={onClose}>
            <div className="space-y-6">
                {/* الرأس المحسن */}
                <div className="bg-[#1a1c23] p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                        <h4 className="text-xl font-bold text-white">{student.student_name}</h4>
                        <p className="text-sm text-gray-400">السجل المدني: {student.student_national_id}</p>
                    </div>
                    <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-lg border border-yellow-500/20 font-bold">
                        {logs.length} زيارة
                    </div>
                </div>
                
                {/* شبكة البطاقات - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    {logs.map((log, index) => (
                        <div 
                            key={log.id || index} 
                            className="bg-[#1a1c23] rounded-2xl border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors group"
                        >
                            {/* منطقة المعاينة (تشبه صورة الملف) */}
                            <div className="h-32 bg-gray-800 flex items-center justify-center border-b border-gray-700 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                                    {/* خلفية رمزية تشبه الملفات */}
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700"></div>
                                </div>
                                <FaCalendarAlt className="text-4xl text-white/50 relative z-10" />
                            </div>

                            {/* تفاصيل البطاقة */}
                            <div className="p-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium text-sm truncate">
                                        زيارة يوم: {new Date(log.visit_start_time).toLocaleDateString('ar-SA')}
                                    </span>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase">
                                            <FaFilePdf /> PDF LOG
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-1 rounded">
                                            <FaHourglassHalf className="text-[10px]" />
                                            {calculateDuration(log.visit_start_time, log.visit_end_time)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {logs.length === 0 && (
                        <div className="col-span-full py-10 text-center text-gray-500">
                            لا توجد زيارات مسجلة لهذا الطالب حالياً.
                        </div>
                    )}
                </div>
            </div>
        </CustomModal>
    );
};

export default StudentVisitsModal;
