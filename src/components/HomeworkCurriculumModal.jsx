// HomeworkCurriculumModal.jsx
import React, { useState, useEffect } from 'react';
import { getHijriToday } from '../utils/recitationUtils';
import { supabase } from '../supabaseClient';
import { FaTimes, FaPlus, FaSave, FaPen, FaTrash } from 'react-icons/fa';

// إضافة handleDialog إلى props
const HomeworkCurriculumModal = ({ gradeId, sectionId, currentPeriod, onClose, handleDialog }) => {
    const [homeworkCurriculum, setHomeworkCurriculum] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newPart, setNewPart] = useState({
        name: '',
        type: 'homework', // 'homework', 'performanceTask', or 'test'
        dueDate: getHijriToday()
    });
    const [editingPart, setEditingPart] = useState(null);
    const [teacherId, setTeacherId] = useState(null);

    // دوال مساعدة لدعم التوافق والتعامل مع هيكل الفترات
    const extractHomeworkCurriculum = (data, period) => {
        if (!data) return [];
        if (Array.isArray(data.homework)) { // تنسيق قديم
            return period === 'period1' ? data.homework : [];
        }
        return data.homework?.[period] || [];
    };

    const getFullCurriculumStructure = (existingData, currentPeriod, newHomeworkCurriculumPart) => {
        let recitation = {};
        let homework = {};

        // معالجة منهج التلاوة (للحفاظ عليه)
        if (existingData && Array.isArray(existingData.recitation)) {
            recitation = { period1: existingData.recitation, period2: [] };
        } else {
            recitation = existingData?.recitation || { period1: [], period2: [] };
        }

        // معالجة منهج الواجبات
        if (existingData && Array.isArray(existingData.homework)) {
            homework = { period1: existingData.homework, period2: [] };
        } else {
            homework = existingData?.homework || { period1: [], period2: [] };
        }

        // تحديث الجزء النشط فقط ضمن هيكل الواجبات
        const updatedHomework = { ...homework, [currentPeriod]: newHomeworkCurriculumPart };
        return { recitation, updatedHomework };
    };
    // نهاية الدوال المساعدة

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

                    setHomeworkCurriculum(extractHomeworkCurriculum(data, currentPeriod) || []);
                } catch (error) {
                    console.error("Error fetching homework curriculum:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchHomeworkCurriculum();
    }, [gradeId, sectionId, currentPeriod]);

    // **الدالة المعدلة لإخفاء الخيارات المضافة**
    const getOptionsForType = (type) => {
        let count = 0;
        let prefix = '';
        if (type === 'homework') {
            count = 10;
            prefix = 'واجب ';
        } else if (type === 'performanceTask') {
            count = 4; // تم التعديل إلى 4 ليتوافق مع SectionGrades
            prefix = 'مهمة أدائية ';
        } else if (type === 'test') {
            count = 2; // تم التعديل إلى 2 ليتوافق مع SectionGrades
            prefix = 'اختبار ';
        }
        
        // استخراج أسماء المهام الموجودة من نفس النوع، مع استثناء المهمة التي يتم تعديلها حالياً
        const existingNames = homeworkCurriculum
            .filter(p => p.type === type)
            .filter(p => !editingPart || p.id !== editingPart.id) // تجاهل المهمة التي يتم تعديلها
            .map(p => p.name);
        
        const options = [];
        for (let i = 1; i <= count; i++) {
            const optionName = `${prefix}${i}`;
            
            // إضافة الاسم للقائمة فقط إذا لم يكن موجوداً بالفعل
            if (!existingNames.includes(optionName)) {
                options.push(optionName);
            }
        }
        
        // إذا كنا في وضع التعديل، تأكد من إضافة اسم الجزء الأصلي ليتوفر في القائمة
        if (editingPart && editingPart.type === type && !options.includes(editingPart.name)) {
            options.push(editingPart.name);
        }

        return options;
    };
    // **نهاية الدالة المعدلة**

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
            const { recitation, updatedHomework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, newHomeworkCurriculumPart);
            
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
        if (!teacherId) {
            if (handleDialog) handleDialog("خطأ", "هوية المعلم غير متوفرة. لا يمكن التحديث.", "error");
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

            const { recitation, updatedHomework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, updatedHomeworkCurriculum);

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
            console.error("Error updating homework curriculum part:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePart = async (id) => {
        if (!teacherId) {
            if (handleDialog) handleDialog("خطأ", "هوية المعلم غير متوفرة. لا يمكن الحذف.", "error");
            return;
        }

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

            const { recitation, updatedHomework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, updatedHomeworkCurriculum);

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
            // إعادة تعيين وضع التعديل إذا تم حذف العنصر الذي يتم تعديله
            if (editingPart && editingPart.id === id) {
                setEditingPart(null);
                setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
            }
            if (handleDialog) handleDialog("نجاح", "تم حذف المهمة بنجاح.", "success");
            
        } catch (error) {
            if (handleDialog) handleDialog("خطأ", `فشل حذف المهمة: ${error.message}`, "error");
            console.error("Error deleting homework curriculum part:", error);
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
    
    // دالة لتهيئة وضع التعديل
    const handleEditClick = (part) => {
        setEditingPart(part);
        setNewPart({ name: part.name, type: part.type, dueDate: part.dueDate });
    };

    // دالة لإلغاء وضع التعديل
    const handleCancelEdit = () => {
        setEditingPart(null);
        setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div dir="rtl" className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-100">
                            الواجبات والمهام الأدائية والاختبارات 
                            <span className="text-base text-gray-400 mr-2"> (الفترة {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'})</span>
                        </h3>
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
