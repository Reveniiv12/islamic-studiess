// CurriculumModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaSave, FaPen, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { getHijriToday } from '../utils/recitationUtils';
import { supabase } from '../supabaseClient';
import CustomDialog from "./CustomDialog.jsx";

// إضافة activeSemester إلى props
const CurriculumModal = ({ gradeId, sectionId, currentPeriod, activeSemester, onClose }) => {
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPart, setNewPart] = useState({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
  const [editingPart, setEditingPart] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  
  // Dialog States
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

  // ==========================================================
  // دوال الهيكلة الجديدة (semester -> period)
  // ==========================================================
  
  // دالة لاستخراج المنهج الصحيح بناءً على الفصل والفترة
  const extractCurriculum = (data, semesterKey, periodKey) => {
    if (!data) return [];
    
    // محاولة الوصول للهيكل الجديد
    const semesterData = data.recitation?.[semesterKey];
    if (semesterData && semesterData[periodKey]) {
        return semesterData[periodKey];
    }

    // دعم التوافقية: إذا كانت البيانات قديمة (مسطحة) ونحن في الفصل الأول، نعرضها
    // أما إذا كنا في الفصل الثاني والبيانات مسطحة، نعود بمصفوفة فارغة (لأن القديم يخص الفصل الأول)
    if (semesterKey === 'semester1' && data.recitation && !data.recitation.semester1) {
         // فحص إذا كان القديم مخزن كـ period1 مباشرة
         if (Array.isArray(data.recitation)) return periodKey === 'period1' ? data.recitation : [];
         return data.recitation[periodKey] || [];
    }

    return [];
  };

  // دالة لبناء الهيكل الكامل عند الحفظ (دون فقدان بيانات الفصول الأخرى)
  const getFullCurriculumStructure = (existingData, semesterKey, periodKey, newPeriodData) => {
    let currentRecitationTree = existingData?.recitation || {};
    let currentHomeworkTree = existingData?.homework || {};

    // 1. التأكد من أن الهيكل الجذري كائن وليس مصفوفة (تصحيح البيانات القديمة)
    if (Array.isArray(currentRecitationTree)) {
        // إذا كان مصفوفة، نعتبرها بيانات الفصل الأول-الفترة الأولى القديمة
        currentRecitationTree = {
            semester1: { period1: currentRecitationTree, period2: [] },
            semester2: { period1: [], period2: [] }
        };
    } else if (currentRecitationTree.period1 && !currentRecitationTree.semester1) {
        // إذا كان هيكل فترات مسطح (بدون فصول)
        currentRecitationTree = {
            semester1: { ...currentRecitationTree },
            semester2: { period1: [], period2: [] }
        };
    }

    // 2. التأكد من وجود مفتاح الفصل الدراسي الحالي
    if (!currentRecitationTree[semesterKey]) {
        currentRecitationTree[semesterKey] = { period1: [], period2: [] };
    }

    // 3. تحديث الفترة المحددة داخل الفصل المحدد
    currentRecitationTree[semesterKey] = {
        ...currentRecitationTree[semesterKey],
        [periodKey]: newPeriodData
    };

    return { updatedRecitation: currentRecitationTree, homework: currentHomeworkTree };
  };

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
            
            // استخدام الدالة الجديدة للاستخراج
            if (data) {
                setCurriculum(extractCurriculum(data, activeSemester, currentPeriod));
            } else {
                setCurriculum([]);
            }
        }
        setLoading(false);
    };

    fetchCurriculum();
  }, [gradeId, sectionId, currentPeriod, activeSemester]); // تمت إضافة activeSemester للمصفوفة

  const saveCurriculumToSupabase = async (updatedPeriodCurriculum) => {
    try {
        const { data: existingCurriculum } = await supabase
            .from('curriculum')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId)
            .single();

        // بناء الهيكل الكامل
        const { updatedRecitation, homework } = getFullCurriculumStructure(
            existingCurriculum, 
            activeSemester, 
            currentPeriod, 
            updatedPeriodCurriculum
        );

        const { error } = await supabase
            .from('curriculum')
            .upsert({
                grade_id: gradeId,
                section_id: sectionId,
                teacher_id: teacherId,
                recitation: updatedRecitation, 
                homework: homework, // الحفاظ على الواجبات كما هي
            }, { onConflict: 'grade_id,section_id' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error saving curriculum:", error);
        throw error;
    }
  };

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
        const newCurriculumPart = [...curriculum, { ...newPart, id: Date.now() }];
        await saveCurriculumToSupabase(newCurriculumPart);

        setCurriculum(newCurriculumPart);
        setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
        handleDialog("نجاح", "تم إضافة الجزء بنجاح", "success");
    } catch (error) {
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

    setLoading(true);
    try {
        const updatedCurriculum = curriculum.map(part =>
            part.id === editingPart.id ? newPart : part
        );
        
        await saveCurriculumToSupabase(updatedCurriculum);

        setCurriculum(updatedCurriculum);
        setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
        setEditingPart(null);
        handleDialog("نجاح", "تم تحديث الجزء بنجاح", "success");
    } catch (error) {
        handleDialog("خطأ", "حدث خطأ أثناء تحديث جزء المنهج.", "error");
    } finally {
        setLoading(false);
    }
  };

  const deleteCurriculumPart = async (partId) => {
    try {
        const updatedCurriculum = curriculum.filter(part => part.id !== partId);
        await saveCurriculumToSupabase(updatedCurriculum);
        setCurriculum(updatedCurriculum);
        handleDialog("نجاح", "تم حذف الجزء بنجاح", "success");
    } catch (error) {
        handleDialog("خطأ", "حدث خطأ أثناء حذف الجزء.", "error");
    }
  };

  const deleteAllCurriculum = async () => {
    try {
        await saveCurriculumToSupabase([]);
        setCurriculum([]);
        handleDialog("نجاح", "تم حذف كل أجزاء منهج هذه الفترة بنجاح", "success");
    } catch (error) {
        handleDialog("خطأ", "حدث خطأ أثناء حذف كل المنهج.", "error");
    }
  };
    
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-['Noto_Sans_Arabic',sans-serif]">
      <div className="bg-gray-800 rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-2xl text-right overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-blue-400">
                إدارة منهج التلاوة والحفظ
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                 {activeSemester === 'semester1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني'} - 
                 {currentPeriod === 'period1' ? ' الفترة الأولى' : ' الفترة الثانية'}
              </p>
          </div>
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
                    () => deleteAllCurriculum()
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
                <p className="text-gray-400 text-center">لا يوجد منهج محدد للفصل الدراسي الحالي.</p>
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
                                        () => deleteCurriculumPart(part.id)
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