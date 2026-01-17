// src/components/StudentControlPanel.jsx
import React, { useState, useEffect } from 'react';
import CustomModal from './CustomModal';
import { supabase } from '../supabaseClient';
import { 
  FaLock, 
  FaUnlock, 
  FaSave, 
  FaEye, 
  FaCheckSquare, 
  FaSquare, 
  FaLayerGroup, 
  FaStar, 
  FaRegStar 
} from 'react-icons/fa';

const StudentControlPanel = ({ show, onClose, handleDialog, teacherId }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    is_locked: false,
    lock_message: "عذراً، الصفحة مغلقة حالياً للتحديث ورصد الدرجات.",
    allowed_views: [],
    default_view: null
  });

  // جلب الإعدادات عند فتح النافذة
  useEffect(() => {
    if (show) fetchSettings();
  }, [show]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('student_view_config')
        .eq('id', 'general')
        .single();

      if (error) throw error;

      if (data && data.student_view_config) {
        const loadedConfig = {
            ...data.student_view_config,
            allowed_views: Array.isArray(data.student_view_config.allowed_views) 
                ? data.student_view_config.allowed_views 
                : [],
            default_view: data.student_view_config.default_view || null
        };
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teacherId) {
        handleDialog("خطأ", "لا يمكن الحفظ، معرف المعلم مفقود", "error");
        return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'general',
          student_view_config: config
        }, { onConflict: 'id' });

      if (error) throw error;

      handleDialog("نجاح", "تم حفظ إعدادات عرض الطالب بنجاح", "success");
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      handleDialog("خطأ", "حدث خطأ أثناء حفظ الإعدادات", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleViewOption = (optionId) => {
    setConfig(prev => {
      const currentViews = prev.allowed_views || [];
      let newViews;
      let newDefault = prev.default_view;

      if (currentViews.includes(optionId)) {
        newViews = currentViews.filter(id => id !== optionId);
        if (newDefault === optionId) newDefault = null;
      } else {
        newViews = [...currentViews, optionId];
      }
      return { ...prev, allowed_views: newViews, default_view: newDefault };
    });
  };

  const setDefaultView = (optionId) => {
      if (config.allowed_views.includes(optionId)) {
          setConfig(prev => ({ 
              ...prev, 
              default_view: optionId === prev.default_view ? null : optionId 
          }));
      }
  };

  const isSelected = (id) => config.allowed_views?.includes(id);
  const isDefault = (id) => config.default_view === id;

  const renderOption = (id, label) => (
    <div className={`flex flex-col sm:flex-row items-center justify-between p-3 rounded-lg border transition-all gap-3 ${
        isSelected(id) ? 'bg-gray-700 border-gray-500 shadow-sm' : 'bg-gray-800 border-gray-700 opacity-70'
    }`}>
        <div 
            onClick={() => toggleViewOption(id)}
            className="flex items-center gap-3 cursor-pointer w-full sm:w-auto hover:opacity-80 transition-opacity"
        >
            {isSelected(id) ? <FaCheckSquare className="text-blue-400 text-xl flex-shrink-0" /> : <FaSquare className="text-gray-500 text-xl flex-shrink-0" />}
            <span className={`font-medium text-sm sm:text-base ${isSelected(id) ? 'text-white' : 'text-gray-400'}`}>{label}</span>
        </div>

        {isSelected(id) && (
            <button
                onClick={() => setDefaultView(id)}
                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full sm:w-auto border ${
                    isDefault(id) 
                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400 hover:bg-yellow-600/30' 
                    : 'bg-gray-600/30 border-gray-500 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
                }`}
                title="تعيين هذه الصفحة لتفتح تلقائياً للطالب"
            >
                {isDefault(id) ? <FaStar className="text-yellow-400" /> : <FaRegStar />}
                {isDefault(id) ? 'الصفحة الافتراضية' : 'تعيين كافتراضي'}
            </button>
        )}
    </div>
  );

  const renderSemesterGroup = (title, semPrefix, colorClass, borderClass) => (
    <div className={`p-4 rounded-xl border ${borderClass} bg-gray-800/40 mb-4`}>
        <h4 className={`font-bold text-md mb-3 flex items-center gap-2 ${colorClass}`}>
            <FaLayerGroup /> {title}
        </h4>
        <div className="grid grid-cols-1 gap-2">
            {renderOption(`${semPrefix}_period1`, "الفترة الأولى")}
            {renderOption(`${semPrefix}_period2`, "الفترة الثانية")}
        </div>
    </div>
  );

  if (!show) return null;

  return (
    <CustomModal title="لوحة تحكم صفحة الطالب" onClose={onClose}>
      {/* 🔥🔥 التعديلات هنا 🔥🔥
          1. max-h-[80vh]: تحديد أقصى ارتفاع ليناسب شاشات الجوال
          2. overflow-y-auto: السماح بالتمرير العمودي
          3. p-1: إضافة هوامش داخلية صغيرة لمنع قص الظلال
          4. gap-4 md:gap-6: تقليل المسافات بين العناصر على الجوال
      */}
      <div 
        className="flex flex-col gap-4 md:gap-6 text-right font-['Noto_Sans_Arabic',sans-serif] max-h-[80vh] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" 
        dir="rtl"
      >
        
        {/* 1. قسم القفل */}
        <div className={`p-4 rounded-xl border-2 transition-colors ${config.is_locked ? 'bg-red-900/10 border-red-500/50' : 'bg-green-900/10 border-green-500/50'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              {config.is_locked ? <FaLock className="text-red-500"/> : <FaUnlock className="text-green-500"/>}
              حالة الصفحة: {config.is_locked ? <span className="text-red-400">مغلقة</span> : <span className="text-green-400">مفتوحة</span>}
            </h3>
            <button
              onClick={() => setConfig({ ...config, is_locked: !config.is_locked })}
              className={`w-full sm:w-auto px-6 py-2 rounded-lg font-bold transition-all shadow-lg ${config.is_locked ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
            >
              {config.is_locked ? 'فتح الصفحة للطلاب' : 'قفل الصفحة'}
            </button>
          </div>

          {config.is_locked && (
            <div className="mt-2 animate-fadeIn">
              <label className="block text-gray-300 mb-2 text-sm font-medium">رسالة القفل (ستظهر للطالب):</label>
              <textarea
                value={config.lock_message}
                onChange={(e) => setConfig({ ...config, lock_message: e.target.value })}
                className="w-full p-3 rounded-lg bg-gray-900/50 border border-gray-600 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                rows="2"
                placeholder="مثال: جاري تحديث الدرجات، يرجى العودة لاحقاً..."
              />
            </div>
          )}
        </div>

        {/* 2. قسم الصلاحيات والصفحة الافتراضية */}
        <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
          <div className="mb-4">
             <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-1">
                <FaEye className="text-blue-400"/> إعدادات العرض
             </h3>
             <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                حدد الفترات التي تود إظهارها. اضغط على زر "تعيين كافتراضي" <FaStar className="inline text-yellow-500 mx-1"/> بجانب الفترة ليدخل الطالب عليها مباشرة.
             </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderSemesterGroup("الفصل الدراسي الأول", "sem1", "text-indigo-400", "border-indigo-500/30")}
              {renderSemesterGroup("الفصل الدراسي الثاني", "sem2", "text-teal-400", "border-teal-500/30")}
          </div>
        </div>

        {/* 3. أزرار التحكم السفلية */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2 border-t border-gray-700 pt-4 pb-2">
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl font-bold hover:bg-gray-600 hover:text-white transition-all w-full sm:w-auto"
          >
            إلغاء
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg flex justify-center items-center gap-2 w-full sm:w-auto transform active:scale-[0.98]"
          >
            {loading ? <span className="animate-spin text-xl">⌛</span> : <FaSave className="text-lg" />} 
            <span>حفظ التغييرات</span>
          </button>
        </div>

      </div>
    </CustomModal>
  );
};

export default StudentControlPanel;