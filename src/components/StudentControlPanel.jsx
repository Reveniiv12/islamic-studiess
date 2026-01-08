// src/components/StudentControlPanel.jsx
import React, { useState, useEffect } from 'react';
import CustomModal from './CustomModal';
import { supabase } from '../supabaseClient';
import { FaLock, FaUnlock, FaSave, FaEye, FaCheckSquare, FaSquare } from 'react-icons/fa';

const StudentControlPanel = ({ show, onClose, handleDialog, teacherId }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    is_locked: false,
    lock_message: "عذراً، الصفحة مغلقة حالياً للتحديث ورصد الدرجات.",
    allowed_views: [] // ['period1', 'period2', 'semester1', 'semester2']
  });

  // الخيارات المتاحة للعرض
  const viewOptions = [
    { id: 'period1', label: 'الفترة الأولى' },
    { id: 'period2', label: 'الفترة الثانية' },
    { id: 'semester1', label: 'الفصل الدراسي الأول' },
    { id: 'semester2', label: 'الفصل الدراسي الثاني' },
  ];

  // جلب الإعدادات عند الفتح
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
        setConfig(data.student_view_config);
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
      if (currentViews.includes(optionId)) {
        return { ...prev, allowed_views: currentViews.filter(id => id !== optionId) };
      } else {
        return { ...prev, allowed_views: [...currentViews, optionId] };
      }
    });
  };

  if (!show) return null;

  return (
    <CustomModal title="لوحة تحكم صفحة الطالب" onClose={onClose}>
      <div className="flex flex-col gap-6 text-right" dir="rtl">
        
        {/* قسم القفل */}
        <div className={`p-4 rounded-xl border-2 ${config.is_locked ? 'bg-red-900/20 border-red-500' : 'bg-green-900/20 border-green-500'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              {config.is_locked ? <FaLock className="text-red-500"/> : <FaUnlock className="text-green-500"/>}
              حالة الصفحة: {config.is_locked ? <span className="text-red-400">مغلقة (لا يمكن للطلاب الدخول)</span> : <span className="text-green-400">مفتوحة</span>}
            </h3>
            <button
              onClick={() => setConfig({ ...config, is_locked: !config.is_locked })}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${config.is_locked ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
            >
              {config.is_locked ? 'فتح الصفحة' : 'قفل الصفحة'}
            </button>
          </div>

          {config.is_locked && (
            <div className="mt-2">
              <label className="block text-gray-300 mb-2 text-sm">رسالة القفل (ستظهر للطالب):</label>
              <textarea
                value={config.lock_message}
                onChange={(e) => setConfig({ ...config, lock_message: e.target.value })}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-red-500"
                rows="3"
                placeholder="اكتب رسالة للطلاب..."
              />
            </div>
          )}
        </div>

        {/* قسم تحديد العرض */}
        <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <FaEye className="text-blue-400"/> تحديد ما يمكن للطالب عرضه:
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            حدد الفترات أو الفصول التي تريد أن تظهر للطالب. إذا تم تحديد أكثر من خيار، ستظهر للطالب قائمة ليختار منها.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {viewOptions.map((option) => {
              const isSelected = config.allowed_views?.includes(option.id);
              return (
                <div 
                  key={option.id}
                  onClick={() => toggleViewOption(option.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-blue-600/20 border-blue-500' 
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <span className={`font-medium ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                    {option.label}
                  </span>
                  {isSelected ? <FaCheckSquare className="text-blue-400 text-xl" /> : <FaSquare className="text-gray-600 text-xl" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* زر الحفظ */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg flex justify-center items-center gap-2"
          >
            {loading ? <span className="animate-spin">⌛</span> : <FaSave />} حفظ الإعدادات
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-500 transition-all"
          >
            إلغاء
          </button>
        </div>

      </div>
    </CustomModal>
  );
};

export default StudentControlPanel;