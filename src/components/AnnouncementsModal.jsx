// src/components/AnnouncementsModal.jsx
import React, { useState } from "react";
import CustomModal from "./CustomModal";
import { supabase } from "../supabaseClient";
import { FaTrash, FaPlusCircle, FaEye, FaEyeSlash } from "react-icons/fa";

// Update the props to receive the numeric IDs
const AnnouncementsModal = ({ announcements, onClose, gradeId, sectionId, teacherId, onSave, handleDialog }) => {
  const [newAnnouncement, setNewAnnouncement] = useState("");

  const handleAddAnnouncement = async () => {
    if (newAnnouncement.trim() === "") {
      handleDialog("خطأ", "لا يمكن إضافة إعلان فارغ.", "error");
      return;
    }

    try {
      // Ensure gradeId is converted to an integer if it's a string from useParams
      const numericGradeId = parseInt(gradeId, 10);
      
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          content: newAnnouncement,
          grade_id: numericGradeId, // Use the numeric gradeId
          section_id: sectionId, // Use the text sectionId
          teacher_id: teacherId,
          is_visible: true, 
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;
      
      onSave([...data, ...announcements]); 
      setNewAnnouncement("");
      
      // الإجراء: إغلاق النافذة أولاً ثم عرض رسالة النجاح
      onClose(); 
      handleDialog("نجاح", "تمت إضافة الإعلان بنجاح.", "success");
    } catch (error) {
      console.error("Error adding announcement:", error);
      handleDialog("خطأ", "حدث خطأ أثناء إضافة الإعلان.", "error");
    }
  };

  const handleToggleVisibility = async (announcement) => {
    const newVisibility = !announcement.is_visible;
    const actionText = newVisibility ? "إظهار" : "إخفاء";
    
    // إغلاق النافذة المنبثقة قبل طلب التأكيد
    onClose(); 
    
    handleDialog(
        "تأكيد الإجراء",
        `هل أنت متأكد من ${actionText} هذا الإعلان عن صفحة الطالب؟`,
        "confirm",
        async () => {
            try {
                const { error } = await supabase
                    .from('announcements')
                    .update({ is_visible: newVisibility })
                    .eq('id', announcement.id);

                if (error) throw error;

                // تحديث الحالة المحلية
                onSave(announcements.map(ann => 
                    ann.id === announcement.id ? { ...ann, is_visible: newVisibility } : ann
                ));
                
                handleDialog("نجاح", `تم ${actionText} الإعلان بنجاح.`, "success");
            } catch (error) {
                console.error("Error toggling visibility:", error);
                handleDialog("خطأ", `حدث خطأ أثناء ${actionText} الإعلان.`, "error");
            }
        }
    );
  };

  const handleDeleteAnnouncement = async (id) => {
    
    // إغلاق النافذة المنبثقة قبل طلب التأكيد
    onClose(); 
    
    handleDialog(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا الإعلان؟",
      "confirm",
      async () => {
        try {
          const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

          if (error) throw error;
          onSave(announcements.filter(ann => ann.id !== id));
          
          handleDialog("نجاح", "تم حذف الإعلان بنجاح.", "success");
        } catch (error) {
          console.error("Error deleting announcement:", error);
          handleDialog("خطأ", "حدث خطأ أثناء حذف الإعلان.", "error");
        }
      }
    );
  };

  return (
    <CustomModal title="إدارة الإعلانات الهامة" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="اكتب إعلانًا جديدًا..."
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            className="flex-grow p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
          />
          <button
            onClick={handleAddAnnouncement}
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
          >
            <FaPlusCircle className="inline-block ml-2" />
            إضافة
          </button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"
              >
                <div className="flex-grow">
                    <p className="text-sm text-gray-300">{ann.content}</p>
                    {/* NEW: حالة العرض للطالب */}
                    <span className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${
                        ann.is_visible 
                            ? 'bg-green-600/50 text-green-100' 
                            : 'bg-red-600/50 text-red-100'
                    }`}>
                        {ann.is_visible ? 'مرئي للطلاب' : 'مخفي عن الطلاب'}
                    </span>
                </div>
                
                {/* NEW: زر تبديل الرؤية والحذف */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                        onClick={() => handleToggleVisibility(ann)}
                        className={`p-2 rounded-full transition-colors ${
                            ann.is_visible 
                                ? 'text-green-400 hover:bg-green-900' 
                                : 'text-red-400 hover:bg-red-900'
                        }`}
                        title={ann.is_visible ? "إخفاء عن الطلاب" : "إظهار للطلاب"}
                    >
                        {ann.is_visible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        title="حذف الإعلان"
                    >
                        <FaTrash />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">لا توجد إعلانات حاليًا.</p>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default AnnouncementsModal;