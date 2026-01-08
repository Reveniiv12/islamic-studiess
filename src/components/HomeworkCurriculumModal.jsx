// src/components/HomeworkCurriculumModal.jsx
import React, { useState, useEffect } from 'react';
import { getHijriToday } from '../utils/recitationUtils';
import { supabase } from '../supabaseClient';
import { FaTimes, FaPlus, FaSave, FaPen, FaTrash } from 'react-icons/fa';

// إضافة activeSemester إلى props
const HomeworkCurriculumModal = ({ gradeId, sectionId, currentPeriod, activeSemester, onClose, handleDialog }) => {
    const [homeworkCurriculum, setHomeworkCurriculum] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPart, setNewPart] = useState({
        name: '',
        type: 'homework', // 'homework', 'performanceTask', or 'test'
        dueDate: getHijriToday()
    });
    const [editingPart, setEditingPart] = useState(null);
    const [teacherId, setTeacherId] = useState(null);

    // ==========================================================
    // دوال التعامل مع الهيكل الجديد (Semester -> Period)
    // ==========================================================
    
    const extractHomeworkCurriculum = (data, semesterKey, periodKey) => {
        if (!data) return [];

        // 1. محاولة الوصول للهيكل الجديد (الهرمي)
        const semesterData = data.homework?.[semesterKey];
        if (semesterData && semesterData[periodKey]) {
            return semesterData[periodKey];
        }

        // 2. دعم التوافقية: إذا كنا في الفصل الأول والبيانات قديمة (مسطحة)
        if (semesterKey === 'semester1' && data.homework && !data.homework.semester1) {
             if (Array.isArray(data.homework)) return periodKey === 'period1' ? data.homework : [];
             return data.homework[periodKey] || [];
        }

        // إذا كنا في الفصل الثاني ولا توجد بيانات له، نرجع مصفوفة فارغة (لا نعرض بيانات الفصل الأول)
        return [];
    };

    const getFullCurriculumStructure = (existingData, semesterKey, periodKey, newPeriodData) => {
        let currentRecitationTree = existingData?.recitation || {};
        let currentHomeworkTree = existingData?.homework || {};

        // 1. تصحيح هيكل الواجبات إذا كان قديماً (مسطحاً)
        if (Array.isArray(currentHomeworkTree)) {
            currentHomeworkTree = {
                semester1: { period1: currentHomeworkTree, period2: [] },
                semester2: { period1: [], period2: [] }
            };
        } else if (currentHomeworkTree.period1 && !currentHomeworkTree.semester1) {
            // إذا كان هيكل فترات بدون فصول
            currentHomeworkTree = {
                semester1: { ...currentHomeworkTree },
                semester2: { period1: [], period2: [] }
            };
        }

        // 2. التأكد من وجود كائن الفصل الدراسي
        if (!currentHomeworkTree[semesterKey]) {
            currentHomeworkTree[semesterKey] = { period1: [], period2: [] };
        }

        // 3. تحديث الفترة المحددة داخل الفصل المحدد
        currentHomeworkTree[semesterKey] = {
            ...currentHomeworkTree[semesterKey],
            [periodKey]: newPeriodData
        };

        return { recitation: currentRecitationTree, updatedHomework: currentHomeworkTree };
    };
    // ==========================================================

    useEffect(() => {
        const fetchHomeworkCurriculum = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setTeacherId(user.id);
                try {
                    const { data, error } = await supabase
                        .from('curriculum')
                        .select('*') 
                        .eq('grade_id', gradeId)
                        .eq('section_id', sectionId)
                        .eq('teacher_id', user.id)
                        .single();
                    
                    if (error && error.code !== 'PGRST116') {
                        if (handleDialog) {
                             handleDialog("خطأ", `فشل جلب المنهج: ${error.message}`, "error");
                        } else {
                             console.error("Error fetching homework curriculum:", error);
                        }
                        throw error;
                    }

                    // استخدام دالة الاستخراج الجديدة مع الفصل الدراسي
                    setHomeworkCurriculum(extractHomeworkCurriculum(data, activeSemester, currentPeriod) || []);
                } catch (error) {
                    console.error("Error fetching homework curriculum:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchHomeworkCurriculum();
    }, [gradeId, sectionId, currentPeriod, activeSemester]); // تمت إضافة activeSemester

    const getOptionsForType = (type) => {
        let count = 0;
        let prefix = '';
        if (type === 'homework') {
            count = 10;
            prefix = 'واجب ';
        } else if (type === 'performanceTask') {
            count = 4; 
            prefix = 'مهمة أدائية ';
        } else if (type === 'test') {
            count = 2; 
            prefix = 'اختبار ';
        }
        
        const existingNames = homeworkCurriculum
            .filter(p => p.type === type)
            .filter(p => !editingPart || p.id !== editingPart.id) 
            .map(p => p.name);
        
        const options = [];
        for (let i = 1; i <= count; i++) {
            const optionName = `${prefix}${i}`;
            if (!existingNames.includes(optionName)) {
                options.push(optionName);
            }
        }
        
        if (editingPart && editingPart.type === type && !options.includes(editingPart.name)) {
            options.push(editingPart.name);
        }

        return options;
    };

    const handleAddPart = async () => {
        if (!newPart.name || !newPart.dueDate) {
            if (handleDialog) handleDialog("تنبيه", "يرجى تعبئة جميع الحقول المطلوبة.", "warning");
            return;
        }
        if (!teacherId) {
            if (handleDialog) handleDialog("خطأ", "هوية المعلم غير متوفرة. لا يمكن الإضافة.", "error");
            return;
        }

        setLoading(true);
        try {
            const { data: existingCurriculum } = await supabase
                .from('curriculum')
                .select('*')
                .eq('grade_id', gradeId)
                .eq('section_id', sectionId)
                .eq('teacher_id', teacherId)
                .single();

            const newHomeworkCurriculumPart = [...homeworkCurriculum, { ...newPart, id: Date.now() }];
            
            // استخدام دالة الهيكلة الجديدة
            const { recitation, updatedHomework } = getFullCurriculumStructure(
                existingCurriculum, 
                activeSemester, 
                currentPeriod, 
                newHomeworkCurriculumPart
            );
            
            const { error } = await supabase
                .from('curriculum')
                .upsert({
                    grade_id: gradeId,
                    section_id: sectionId,
                    teacher_id: teacherId, 
                    recitation: recitation,
                    homework: updatedHomework
                }, { onConflict: 'grade_id,section_id' });

            if (error) throw error;
            
            setHomeworkCurriculum(newHomeworkCurriculumPart);
            setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() }); 
            if (handleDialog) handleDialog("نجاح", "تمت إضافة المهمة بنجاح.", "success");

        } catch (error) {
            if (handleDialog) handleDialog("خطأ", `فشل إضافة المهمة: ${error.message}`, "error");
            console.error("Error adding homework curriculum part:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePart = async () => {
        if (!newPart.name || !newPart.dueDate) {
            if (handleDialog) handleDialog("تنبيه", "يرجى تعبئة جميع الحقول المطلوبة.", "warning");
            return;
        }

        setLoading(true);
        try {
            const updatedHomeworkCurriculum = homeworkCurriculum.map(part =>
                part.id === editingPart.id ? newPart : part
            );
            
            const { data: existingCurriculum } = await supabase
                .from('curriculum')
                .select('*')
                .eq('grade_id', gradeId)
                .eq('section_id', sectionId)
                .eq('teacher_id', teacherId)
                .single();

            const { recitation, updatedHomework } = getFullCurriculumStructure(
                existingCurriculum, 
                activeSemester, 
                currentPeriod, 
                updatedHomeworkCurriculum
            );

            const { error } = await supabase
                .from('curriculum')
                .upsert({
                    grade_id: gradeId,
                    section_id: sectionId,
                    teacher_id: teacherId,
                    recitation: recitation,
                    homework: updatedHomework,
                }, { onConflict: 'grade_id,section_id' });

            if (error) throw error;
            
            setHomeworkCurriculum(updatedHomeworkCurriculum);
            setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
            setEditingPart(null);
            if (handleDialog) handleDialog("نجاح", "تم تحديث المهمة بنجاح.", "success");

        } catch (error) {
            if (handleDialog) handleDialog("خطأ", `فشل تحديث المهمة: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePart = async (id) => {
        setLoading(true);
        try {
            const updatedHomeworkCurriculum = homeworkCurriculum.filter(part => part.id !== id);

            const { data: existingCurriculum } = await supabase
                .from('curriculum')
                .select('*')
                .eq('grade_id', gradeId)
                .eq('section_id', sectionId)
                .eq('teacher_id', teacherId)
                .single();

            const { recitation, updatedHomework } = getFullCurriculumStructure(
                existingCurriculum, 
                activeSemester, 
                currentPeriod, 
                updatedHomeworkCurriculum
            );

            const { error } = await supabase
                .from('curriculum')
                .upsert({
                    grade_id: gradeId,
                    section_id: sectionId,
                    teacher_id: teacherId,
                    recitation: recitation,
                    homework: updatedHomework,
                }, { onConflict: 'grade_id,section_id' });

            if (error) throw error;
            
            setHomeworkCurriculum(updatedHomeworkCurriculum);
            if (editingPart && editingPart.id === id) {
                setEditingPart(null);
                setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
            }
            if (handleDialog) handleDialog("نجاح", "تم حذف المهمة بنجاح.", "success");
            
        } catch (error) {
            if (handleDialog) handleDialog("خطأ", `فشل حذف المهمة: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const getPartTypeInfo = (type) => {
        switch (type) {
            case 'homework': return { name: 'واجب', color: 'bg-yellow-600' };
            case 'performanceTask': return { name: 'مهمة أدائية', color: 'bg-green-600' };
            case 'test': return { name: 'اختبار', color: 'bg-blue-600' };
            default: return { name: '', color: 'bg-gray-600' };
        }
    };
    
    const handleEditClick = (part) => {
        setEditingPart(part);
        setNewPart({ name: part.name, type: part.type, dueDate: part.dueDate });
    };

    const handleCancelEdit = () => {
        setEditingPart(null);
        setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-['Noto_Sans_Arabic',sans-serif]">
            <div dir="rtl" className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-bold text-gray-100">
                                الواجبات والمهام والاختبارات
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {activeSemester === 'semester1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'} - 
                                {currentPeriod === 'period1' ? ' الفترة الأولى' : ' الفترة الثانية'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>

                    <div className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-700">
                        <h4 className="font-semibold mb-3 text-gray-100 flex items-center gap-2">
                            {editingPart ? <FaPen className="text-blue-400" /> : <FaPlus className="text-green-400" />}
                            {editingPart ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">نوع المهمة</label>
                                <select
                                    value={newPart.type}
                                    onChange={(e) => setNewPart({ ...newPart, type: e.target.value, name: '' })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    disabled={loading}
                                >
                                    <option value="homework">واجب</option>
                                    <option value="performanceTask">مهمة أدائية</option>
                                    <option value="test">اختبار</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">اسم المهمة</label>
                                <select
                                    value={newPart.name}
                                    onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    disabled={loading}
                                >
                                    <option value="">اختر اسماً</option>
                                    {getOptionsForType(newPart.type).map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">تاريخ الاستحقاق (هجري)</label>
                                <input
                                    type="text"
                                    value={newPart.dueDate}
                                    onChange={(e) => setNewPart({ ...newPart, dueDate: e.target.value })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="YYYY/MM/DD"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4 gap-3">
                            {editingPart && (
                                <button onClick={handleCancelEdit} className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors flex items-center gap-1" disabled={loading}>
                                    <FaTimes />
                                    إلغاء التعديل
                                </button>
                            )}
                            {editingPart ? (
                                <button onClick={handleUpdatePart} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-500 transition-colors flex items-center gap-1" disabled={loading}>
                                    <FaSave />
                                    تحديث المهمة
                                </button>
                            ) : (
                                <button onClick={handleAddPart} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-1" disabled={loading}>
                                    <FaPlus />
                                    إضافة المهمة
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-gray-100">الواجبات والمهام المضافة ({homeworkCurriculum.length})</h4>
                        {loading ? (
                            <p className="text-gray-400 text-center">جاري تحميل المنهج...</p>
                        ) : (
                            homeworkCurriculum.length > 0 ? (
                                <ul className="divide-y divide-gray-600">
                                    {homeworkCurriculum.map(part => (
                                        <li 
                                            key={part.id} 
                                            className={`py-3 flex justify-between items-center text-sm border-l-4 pr-3 ${editingPart?.id === part.id ? 'bg-gray-600' : ''}`} 
                                            style={{ borderColor: getPartTypeInfo(part.type).color }}
                                        >
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-300">{part.name}</span>
                                                <span className={`text-xs mr-2 px-2 py-0.5 rounded-full ${getPartTypeInfo(part.type).color} text-white`}>
                                                    {getPartTypeInfo(part.type).name}
                                                </span>
                                                <span className="text-gray-500 block mt-1">تاريخ الاستحقاق: {part.dueDate}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditClick(part)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                    <FaPen /> تعديل
                                                </button>
                                                <button onClick={() => handleDeletePart(part.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1">
                                                    <FaTrash /> حذف
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm text-center">لا توجد واجبات أو مهام أدائية أو اختبارات مضافة في هذه الفترة.</p>
                            )
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end">
                    <button onClick={onClose} className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                        إغلاق النافذة
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeworkCurriculumModal;