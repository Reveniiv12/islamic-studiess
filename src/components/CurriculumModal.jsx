// CurriculumModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaSave, FaPen, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { getHijriToday } from '../utils/recitationUtils';
import { supabase } from '../supabaseClient';
import CustomDialog from "./CustomDialog.jsx";

// إضافة currentPeriod إلى props
const CurriculumModal = ({ gradeId, sectionId, currentPeriod, onClose }) => {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPart, setNewPart] = useState({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
  const [editingPart, setEditingPart] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState("info");
  const [dialogAction, setDialogAction] = useState(null);

  const handleDialog = (title, message, type, action = null) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setDialogAction(() => action);
    setShowDialog(true);
  };

  const handleConfirmAction = () => {
    if (dialogAction) {
      dialogAction();
    }
    setShowDialog(false);
    setDialogAction(null);
  };

  // دوال مساعدة لدعم التوافق والتعامل مع هيكل الفترات
  const extractCurriculum = (data, period) => {
    if (!data) return [];
    if (Array.isArray(data.recitation)) { // تنسيق قديم: يعتبر period1
        return period === 'period1' ? data.recitation : [];
    }
    return data.recitation?.[period] || [];
  };

  const getFullCurriculumStructure = (existingData, currentPeriod, newRecitationPart) => {
    let recitation = {};
    let homework = {};

    // معالجة منهج التلاوة
    if (existingData && Array.isArray(existingData.recitation)) {
        recitation = { period1: existingData.recitation, period2: [] };
    } else {
        recitation = existingData?.recitation || { period1: [], period2: [] };
    }

    // معالجة منهج الواجبات (للحفاظ عليه)
    if (existingData && Array.isArray(existingData.homework)) {
         homework = { period1: existingData.homework, period2: [] };
    } else {
        homework = existingData?.homework || { period1: [], period2: [] };
    }

    // تحديث الجزء النشط فقط ضمن هيكل التلاوة
    const updatedRecitation = { ...recitation, [currentPeriod]: newRecitationPart };
    return { updatedRecitation, homework };
  };
  // نهاية الدوال المساعدة

  useEffect(() => {
    const fetchCurriculum = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setTeacherId(user.id);
            const { data, error } = await supabase
                .from('curriculum')
                .select('*')
                .eq('grade_id', gradeId)
                .eq('section_id', sectionId)
                .eq('teacher_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching curriculum:", error);
            }
            if (data) {
                setCurriculum(extractCurriculum(data, currentPeriod) || []);
            } else {
                setCurriculum([]);
            }
        }
        setLoading(false);
    };

    fetchCurriculum();
  }, [gradeId, sectionId, currentPeriod]); 

  const handleAddPart = async () => {
    if (!newPart.start || !newPart.end || !newPart.dueDate) {
        handleDialog("خطأ", "الرجاء إدخال جميع الحقول.", "error");
        return;
    }
    if (!teacherId) {
        handleDialog("خطأ", "لا يمكن إضافة المنهج. لم يتم تحديد المعلم.", "error");
        return;
    }

    setLoading(true);
    try {
        const { data: existingCurriculum, error: fetchError } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId)
            .single();

        const newCurriculumPart = [...curriculum, { ...newPart, id: Date.now() }];
        const { updatedRecitation, homework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, newCurriculumPart);

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_id: gradeId,
                section_id: sectionId,
                teacher_id: teacherId,
                recitation: updatedRecitation, 
                homework: homework,           
            }, { onConflict: 'grade_id,section_id' });

        if (error) throw error;

        setCurriculum(newCurriculumPart);
        setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
        handleDialog("نجاح", "تم إضافة الجزء بنجاح", "success");

    } catch (error) {
        console.error("Error adding curriculum part:", error);
        handleDialog("خطأ", "حدث خطأ أثناء إضافة جزء المنهج.", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePart = async () => {
    if (!newPart.start || !newPart.end || !newPart.dueDate) {
        handleDialog("خطأ", "الرجاء إدخال جميع الحقول.", "error");
        return;
    }
    if (!teacherId) {
        handleDialog("خطأ", "لا يمكن تحديث المنهج. لم يتم تحديد المعلم.", "error");
        return;
    }

    setLoading(true);
    try {
        const updatedCurriculum = curriculum.map(part =>
            part.id === editingPart.id ? newPart : part
        );

        const { data: existingCurriculum } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId)
            .single();

        const { updatedRecitation, homework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, updatedCurriculum);

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_id: gradeId,
                section_id: sectionId,
                teacher_id: teacherId,
                recitation: updatedRecitation,
                homework: homework,
            }, { onConflict: 'grade_id,section_id' });

        if (error) throw error;

        setCurriculum(updatedCurriculum);
        setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
        setEditingPart(null);
        handleDialog("نجاح", "تم تحديث الجزء بنجاح", "success");

    } catch (error) {
        console.error("Error updating curriculum part:", error);
        handleDialog("خطأ", "حدث خطأ أثناء تحديث جزء المنهج.", "error");
    } finally {
        setLoading(false);
    }
  };

  // دالة الحذف الجزئي (معدلة)
  const deleteCurriculumPart = async (partId, gId, sId, tId, currentCurriculum, setCurriculumState, dialogHandler) => {
    try {
        const updatedCurriculum = currentCurriculum.filter(part => part.id !== partId);

        const { data: existingCurriculum } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gId)
            .eq('section_id', sId)
            .eq('teacher_id', tId)
            .single();

        const { updatedRecitation, homework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, updatedCurriculum);

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_id: gId,
                section_id: sId,
                teacher_id: tId,
                recitation: updatedRecitation,
                homework: homework,
            }, { onConflict: 'grade_id,section_id' });

        if (error) throw error;

        setCurriculumState(updatedCurriculum);
        dialogHandler("نجاح", "تم حذف الجزء بنجاح", "success");
    } catch (error) {
        console.error("Error deleting curriculum part:", error);
        dialogHandler("خطأ", "حدث خطأ أثناء حذف الجزء.", "error");
    }
  };

  // دالة الحذف الكلي للفترة النشطة فقط (معدلة)
  const deleteAllCurriculum = async (gId, sId, tId, dialogHandler, setCurriculumState) => {
    try {
        const { data: existingCurriculum } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gId)
            .eq('section_id', sId)
            .eq('teacher_id', tId)
            .single();

        const { updatedRecitation, homework } = getFullCurriculumStructure(existingCurriculum, currentPeriod, []);

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_id: gId,
                section_id: sId,
                teacher_id: tId,
                recitation: updatedRecitation,
                homework: homework,
            }, { onConflict: 'grade_id,section_id' });

        if (error) throw error;

        setCurriculumState([]);
        dialogHandler("نجاح", "تم حذف كل أجزاء منهج هذه الفترة بنجاح", "success");
    } catch (error) {
        console.error("Error deleting all curriculum:", error);
        dialogHandler("خطأ", "حدث خطأ أثناء حذف كل المنهج.", "error");
    }
  };
    
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-['Noto_Sans_Arabic',sans-serif]">
      <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-2xl text-right overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-blue-400">
            إدارة منهج التلاوة والحفظ
            <span className="text-xl text-gray-400 mr-2"> (الفترة {currentPeriod === 'period1' ? 'الأولى' : 'الثانية'})</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4">جاري تحميل البيانات...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-6 bg-gray-700 p-4 rounded-lg">
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">اسم السورة :</label>
                <input
                  type="text"
                  value={newPart.start}
                  onChange={(e) => setNewPart({ ...newPart, start: e.target.value })}
                  className="p-2 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="مثال: سورة الفاتحة"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">من كم الى كم :</label>
                <input
                  type="text"
                  value={newPart.end}
                  onChange={(e) => setNewPart({ ...newPart, end: e.target.value })}
                  className="p-2 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="مثال: 1 الى 5 "
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">تاريخ التسميع:</label>
                <input
                  type="text"
                  value={newPart.dueDate}
                  onChange={(e) => setNewPart({ ...newPart, dueDate: e.target.value })}
                  className="p-2 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  placeholder="مثال: 1445/10/20"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-300 mb-1">نوع المنهج:</label>
                <select
                  value={newPart.type}
                  onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
                  className="p-2 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                >
                  <option value="memorization">حفظ</option>
                  <option value="recitation">تلاوة</option>
                </select>
              </div>
              <div className="md:col-span-2 mt-2">
                {editingPart ? (
                    <div className="flex gap-2">
                        <button onClick={handleUpdatePart} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm">
                            <FaSave /> حفظ التعديلات
                        </button>
                        <button onClick={() => { setEditingPart(null); setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' }); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-md text-sm">
                            إلغاء
                        </button>
                    </div>
                ) : (
                    <button onClick={handleAddPart} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm">
                        <FaPlus /> إضافة جزء جديد
                    </button>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-200 mb-4 flex justify-between items-center">
              أجزاء المنهج الحالية
              <button
                onClick={() => {
                  handleDialog(
                    "تأكيد حذف كل المناهج",
                    "هل أنت متأكد من حذف جميع أجزاء منهج التلاوة والحفظ في هذه الفترة؟ هذا الإجراء لا يمكن التراجع عنه.",
                    "confirm",
                    () => deleteAllCurriculum(gradeId, sectionId, teacherId, handleDialog, setCurriculum)
                  );
                }}
                className="bg-red-600 text-white py-1 px-3 rounded-lg text-sm flex items-center gap-2 hover:bg-red-500 transition-colors"
                title="حذف كل المناهج"
              >
                <FaExclamationTriangle />
                حذف الكل
              </button>
            </h3>
            {curriculum.length === 0 ? (
                <p className="text-gray-400 text-center">لا يوجد منهج محدد بعد.</p>
            ) : (
                <div className="space-y-4">
                    {curriculum.map((part) => (
                        <div key={part.id} className="bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center">
                            <div className="flex-1">
                                <p className="font-bold text-lg text-white">{part.start} - {part.end}</p>
                                <p className="text-sm text-gray-300">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${part.type === 'memorization' ? 'bg-purple-600 text-white' : 'bg-pink-600 text-white'}`}>
                                        {part.type === 'memorization' ? 'حفظ' : 'تلاوة'}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-400">تاريخ التسميع: {part.dueDate}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditingPart(part); setNewPart(part); }}
                                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                    title="تعديل"
                                >
                                    <FaPen />
                                </button>
                                <button
                                    onClick={() => {
                                      handleDialog(
                                        "تأكيد الحذف",
                                        "هل أنت متأكد من حذف هذا الجزء من المنهج؟",
                                        "confirm",
                                        () => deleteCurriculumPart(part.id, gradeId, sectionId, teacherId, curriculum, setCurriculum, handleDialog)
                                      );
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                    title="حذف"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </>
        )}
      </div>
      {showDialog && (
        <CustomDialog
          title={dialogTitle}
          message={dialogMessage}
          type={dialogType}
          onConfirm={handleConfirmAction}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
};

export default CurriculumModal;