// src/components/RewardRequestsButton.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaGift, FaSyncAlt } from 'react-icons/fa';

// تم التعديل: إزالة gradeId و sectionId كـ props
// وإضافة 'students' (قائمة طلاب الفصل الحالي) بدلاً منهما
const RewardRequestsButton = ({ students, teacherId, onClick }) => { 
    const [pendingRequestCount, setPendingRequestCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPendingRequestsCount = async () => {
        // التحقق من وجود المعرف الضروري وقائمة الطلاب
        if (!teacherId || !students) { //
             setPendingRequestCount(0);
             return;
        }

        setIsLoading(true); //
        try {
            // 1. جلب جميع طلبات المكافآت المعلقة للمعلّم الحالي فقط (دون تصفية الصف/الفصل)
            const { data: requests, error } = await supabase
                .from('reward_requests')
                // جلب student_id فقط للحساب
                .select('student_id') //
                .eq('teacher_id', teacherId) //
                .eq('status', 'pending'); //

            if (error) throw error; //
            
            // 2. إنشاء مجموعة لمعرفات الطلاب في الفصل الحالي (لتسريع عملية البحث)
            const currentSectionStudentIds = new Set(students.map(s => s.id)); //

            // 3. تصفية الطلبات: احتساب فقط الطلبات التي تخص الطلاب الموجودين في الفصل الحالي
            const pendingRequestsInCurrentSection = (requests || []).filter(request => 
                currentSectionStudentIds.has(request.student_id)
            );

            setPendingRequestCount(pendingRequestsInCurrentSection.length); //

        } catch (error) {
            console.error("Error fetching pending requests count:", error); //
            setPendingRequestCount(0); //
        } finally {
            setIsLoading(false); //
        }
    };

    // جلب العدد عند تحميل المكون وعندما يتغير teacherId أو قائمة الطلاب
    useEffect(() => {
        fetchPendingRequestsCount();
    }, [teacherId, students]); // تم تغيير التبعيات للاعتماد على students

    return (
        <button 
            onClick={onClick} 
            className="relative flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition-colors shadow-md text-xs md:text-sm"
            title={isLoading ? "جارٍ التحديث..." : "طلبات المكافآت المعلقة"}
            disabled={isLoading}
        >
            <FaGift className={isLoading ? "animate-spin" : ""} /> 
            طلبات المكافآت

            {/* Badge: يظهر فقط إذا كان هناك طلبات معلقة */}
            {pendingRequestCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-gray-800 leading-none">
                    {pendingRequestCount}
                </span>
            )}
        </button>
    );
};

export default RewardRequestsButton;