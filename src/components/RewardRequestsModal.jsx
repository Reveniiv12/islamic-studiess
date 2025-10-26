// src/components/RewardRequestsModal.jsx (ملف جديد)

import React, { useState, useEffect } from "react";
import CustomModal from "./CustomModal";
import { supabase } from "../supabaseClient";
import { FaGift, FaStar, FaSyncAlt, FaCheckCircle, FaTimes } from "react-icons/fa";

const RewardRequestsModal = ({ show, onClose, students, handleDialog, updateStudentsData, fetchDataFromSupabase }) => {
    const [requests, setRequests] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const teacherId = students[0]?.teacher_id; // Assume all students have the same teacher_id

    const fetchRequests = async () => {
        if (!students.length || !teacherId) return;
        setIsProcessing(true);
        try {
            const studentIds = students.map(s => s.id);
            
            // جلب الطلبات المعلقة فقط، مع جلب بيانات الطالب والجائزة
            const { data, error } = await supabase
                .from('reward_requests')
                .select('*, prizes(id, name, cost), students!inner(name, id, acquired_stars, consumed_stars, stars)')
                .eq('teacher_id', teacherId)
                .in('student_id', studentIds)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            const processedRequests = data.map(req => {
                const acquired = req.students.acquired_stars || 0;
                const consumed = req.students.consumed_stars || 0;
                const currentStars = acquired - consumed;
                
                return {
                    ...req,
                    studentName: req.students.name,
                    currentStars: currentStars,
                    isSufficient: currentStars >= req.prize_cost
                };
            });
            
            setRequests(processedRequests);
        } catch (error) {
            console.error("Error fetching reward requests:", error);
            handleDialog("خطأ", "حدث خطأ أثناء جلب طلبات المكافآت.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (show) {
            fetchRequests();
        }
    }, [show]);

    const handleProcessRequest = (request, status) => {
        handleDialog(
            `تأكيد ${status === 'approved' ? 'القبول' : 'الرفض'}`,
            `هل أنت متأكد من ${status === 'approved' ? `قبول طلب مكافأة ${request.prizes.name} للطالب ${request.studentName}؟ سيتم خصم ${request.prize_cost} نجوم إذا كان رصيده كافيًا.` : `رفض طلب مكافأة ${request.prizes.name} للطالب ${request.studentName}؟`}`,
            "confirm",
            async () => {
                setIsProcessing(true);
                try {
                    // 1. تحديث حالة الطلب
                    const { error: updateError } = await supabase
                        .from('reward_requests')
                        .update({ status: status, updated_at: new Date().toISOString() })
                        .eq('id', request.id);

                    if (updateError) throw updateError;
                    
                    let dialogMessage = `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح.`;
                    
                    // 2. تحديث نجوم الطالب إذا تم القبول
                    if (status === 'approved') {
                        const studentToUpdate = students.find(s => s.id === request.student_id);
                        
                        if (!studentToUpdate || request.currentStars < request.prize_cost) {
                            dialogMessage += " (ملاحظة: رصيد الطالب غير كافٍ، لم يتم الخصم.)";
                        } else {
                            const updatedStudents = students.map(s => {
                                if (s.id === request.student_id) {
                                    const newConsumedStars = (s.consumedStars || 0) + request.prize_cost;
                                    return {
                                        ...s,
                                        consumedStars: newConsumedStars,
                                        stars: (s.acquiredStars || 0) - newConsumedStars
                                    };
                                }
                                return s;
                            });
                            
                            await updateStudentsData(updatedStudents); // حفظ النجوم المحدثة في DB
                        }
                    }
                    
                    // 3. إعادة جلب الطلبات وعرض رسالة النجاح
                    await fetchRequests();
                    handleDialog("نجاح", dialogMessage, "success");
                    
                    // تحديث بيانات الطلاب في الواجهة الرئيسية لضمان انعكاس النجوم
                    if (status === 'approved') {
                        fetchDataFromSupabase(); 
                    }
                    
                } catch (error) {
                    console.error(`Error processing request:`, error);
                    handleDialog("خطأ", "حدث خطأ أثناء معالجة الطلب.", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        );
    };


    return (
        <CustomModal show={show} onClose={onClose} title="إدارة طلبات المكافآت المعلقة" className="max-w-4xl">
            <div className="p-4">
                <p className="text-gray-400 mb-4">هذه النافذة تعرض جميع طلبات المكافآت المعلقة. الطلبات المقبولة سيتم خصم نجومها من رصيد الطالب (إذا كان كافياً).</p>
                
                {isProcessing && <p className="text-center text-blue-400 mb-4"><FaSyncAlt className="inline animate-spin mr-2"/> جاري المعالجة...</p>}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {requests.length === 0 && !isProcessing && (
                        <div className="p-6 bg-gray-700 rounded-lg text-center text-gray-300">
                            لا توجد طلبات مكافآت معلقة حاليًا.
                        </div>
                    )}
                    
                    {requests.map(request => (
                        <div key={request.id} className="p-4 bg-gray-700 rounded-lg shadow-md border border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                                <p className="text-lg font-bold text-white mb-1">الطالب: <span className="text-blue-400">{request.studentName}</span></p>
                                <p className="text-md text-gray-300">المكافأة المطلوبة: <span className="font-semibold text-purple-400">{request.prizes.name}</span></p>
                                <p className="text-sm text-gray-400 flex flex-wrap items-center gap-3">
                                    <span className="flex items-center gap-1">التكلفة: <span className="font-bold text-yellow-400">{request.prize_cost} <FaStar className="inline"/></span></span>
                                    <span className="flex items-center gap-1">رصيده الحالي: <span className={`font-bold ${request.isSufficient ? 'text-green-400' : 'text-red-400'}`}>{request.currentStars} <FaStar className="inline"/></span></span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${request.isSufficient ? 'bg-green-600/50 text-green-100' : 'bg-red-600/50 text-red-100'}`}>
                                        {request.isSufficient ? 'رصيد كافٍ' : 'رصيد غير كافٍ'}
                                    </span>
                                </p>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleProcessRequest(request, 'approved')}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                        isProcessing
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                >
                                    <FaCheckCircle /> قبول
                                </button>
                                <button
                                    onClick={() => handleProcessRequest(request, 'rejected')}
                                    disabled={isProcessing}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                        isProcessing
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                                >
                                    <FaTimes /> رفض
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </CustomModal>
    );
};

export default RewardRequestsModal;