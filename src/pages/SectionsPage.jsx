// src/SectionsPage.jsx
import React, { useState, useEffect } from 'react'; // 1. استيراد الخطافات اللازمة
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gradesData } from '../data/mockData';
import { supabase } from '../supabaseClient'; // 2. استيراد Supabase
import { FaGraduationCap, FaArrowRight, FaUsers, FaSpinner } from 'react-icons/fa'; // 3. استيراد أيقونة التحميل

const SectionsPage = () => {
    const { gradeId } = useParams();
    const navigate = useNavigate();
    const selectedGrade = gradesData.find(grade => grade.id === gradeId);

    // 4. تعريف المتغيرات لحفظ الأعداد وحالة التحميل
    const [sectionCounts, setSectionCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(true);

    // 5. منطق جلب البيانات وحساب عدد الطلاب (نفس المنطق من الملف المرجعي)
    useEffect(() => {
        const fetchStudentCounts = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // جلب حقل القسم للطلاب المرتبطين بهذا المعلم وهذا الصف
                const { data, error } = await supabase
                    .from("students")
                    .select("section")
                    .eq("teacher_id", user.id)
                    .eq("grade_level", gradeId);

                if (error) throw error;

                // حساب عدد الطلاب في كل فصل
                const counts = {};
                data.forEach((student) => {
                    if (student.section) {
                        counts[student.section] = (counts[student.section] || 0) + 1;
                    }
                });

                setSectionCounts(counts);
            } catch (err) {
                console.error("Error fetching section counts:", err);
            } finally {
                setLoadingCounts(false);
            }
        };

        if (selectedGrade) {
            fetchStudentCounts();
        }
    }, [gradeId, selectedGrade]);

    if (!selectedGrade) {
        return (
            <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
                <p className="text-xl">لم يتم العثور على الصف.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen">
            <header className="bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center">
                <div className="flex flex-col items-center gap-2 md:gap-4 mb-4 md:mb-0">
                    <FaGraduationCap className="text-4xl md:text-5xl text-blue-400" />
                    <h1 className="text-xl md:text-3xl font-extrabold text-blue-400">
                        اختر فصلاً
                    </h1>
                    <p className="text-sm md:text-lg font-medium text-gray-400">
                        الصف: {selectedGrade.name}
                    </p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-700">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        
                        {/* الفصول الحالية */}
                        {selectedGrade.sections.map(section => {
                            // 6. الحصول على العدد الحقيقي من State
                            const studentCount = sectionCounts[section] || 0;

                            return (
                                <Link
                                    key={section}
                                    to={`/grades/${gradeId}/sections/${section}`}
                                    className="flex flex-col items-center justify-center gap-2 p-4 md:p-6 bg-gray-700 text-blue-400 rounded-xl shadow-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 border border-gray-600 group"
                                >
                                    {/* اسم الفصل */}
                                    <span className="text-lg md:text-xl font-bold">
                                        فصل {section}
                                    </span>
                                    
                                    {/* 7. قسم عدد الطلاب مع حالة التحميل */}
                                    <div className="flex items-center gap-2 text-gray-300 bg-gray-800/50 px-3 py-1 rounded-full text-xs md:text-sm group-hover:bg-gray-700 transition-colors">
                                        {loadingCounts ? (
                                            // عرض أيقونة التحميل إذا كانت البيانات لم تصل بعد
                                            <FaSpinner className="animate-spin text-blue-300" />
                                        ) : (
                                            <>
                                                <FaUsers className="text-blue-300" />
                                                <span className="font-medium">{studentCount} طالب</span>
                                            </>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    {/* زر الرجوع أسفل الفصول */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
                        >
                            <FaArrowRight /> رجوع
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SectionsPage;