// src/components/StudentMaterialsView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FaFolder, FaFilePdf, FaImage, FaArrowRight, FaBoxOpen, FaSpinner, FaEye } from 'react-icons/fa';
import FileViewer from './FileViewer'; 

const StudentMaterialsView = ({ show, onClose, gradeId, sectionId, teacherId, activeSemester, title }) => {
  const [materials, setMaterials] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. تعريف دالة الجلب باستخدام useCallback لتجنب مشاكل التكرار
  const fetchMaterials = useCallback(async () => {
    // إذا لم تكن هناك بيانات كافية، لا تقم بالجلب
    if (!gradeId || !sectionId) return;

    // لا نعرض Loading في كل تحديث تلقائي للحفاظ على تجربة المستخدم، فقط في البداية إذا كانت القائمة فارغة
    // setLoading(true); 
    
    try {
      const { data: assignments, error } = await supabase
        .from('folder_assignments')
        .select(`
          course_folders (
            id, 
            title, 
            is_hidden, 
            created_at,
            order_index,
            folder_contents (
              is_visible,
              order_index,
              library_files ( 
                id, 
                file_name, 
                file_type, 
                file_data 
              )
            )
          )
        `)
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId);

      if (error) {
        console.error("Error fetching materials:", error);
      } else {
        const formattedMaterials = assignments
          .map(item => item.course_folders)
          .filter(folder => folder && !folder.is_hidden)
          .map(folder => ({
            id: folder.id,
            title: folder.title,
            created_at: folder.created_at,
            order_index: folder.order_index,
            // ترتيب الملفات
            files: folder.folder_contents
              .filter(content => content.is_visible && content.library_files)
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map(content => ({
                name: content.library_files.file_name,
                type: content.library_files.file_type,
                url: content.library_files.file_data 
              }))
          }));

        // ترتيب المجلدات
        formattedMaterials.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        setMaterials(formattedMaterials);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
    // setLoading(false);
  }, [gradeId, sectionId]);

  // 2. الجلب الأولي عند فتح النافذة
  useEffect(() => {
    if (show) {
      setLoading(true); // تفعيل التحميل فقط عند الفتح الأول
      fetchMaterials().then(() => setLoading(false));
      setSelectedTopic(null);
    }
  }, [show, fetchMaterials]);

  // 3. الاشتراك في التحديثات المباشرة (Real-time)
  useEffect(() => {
    if (!show) return;

    const channel = supabase
      .channel('materials-realtime')
      // الاستماع لتغييرات تعيين المجلدات لهذا الصف والقسم
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'folder_assignments',
          filter: `grade_id=eq.${gradeId}` // فلترة مبدئية حسب الصف لتقليل البيانات
        },
        () => fetchMaterials()
      )
      // الاستماع لتغييرات المجلدات نفسها (مثل تغيير الاسم أو الإخفاء)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_folders' },
        () => fetchMaterials()
      )
      // الاستماع لتغييرات محتويات المجلد (إضافة/حذف ملفات)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folder_contents' },
        () => fetchMaterials()
      )
      // الاستماع لتغييرات الملفات (مثل تغيير الاسم)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'library_files' },
        () => fetchMaterials()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [show, gradeId, fetchMaterials]);


  const openFileViewer = (index) => {
    setCurrentFileIndex(index);
    setViewerOpen(true);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm overflow-y-auto animate-fadeIn flex flex-col">
      
      {/* رأس الصفحة */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition">
            <FaArrowRight className="text-white" />
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaBoxOpen className="text-blue-400" /> {title || "المواد الإثرائية والحلول"}
          </h2>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">
        
        {/* زر العودة */}
        {selectedTopic && (
          <button 
            onClick={() => setSelectedTopic(null)} 
            className="mb-6 text-blue-400 hover:text-blue-300 flex items-center gap-2 font-bold transition-colors"
          >
            <FaArrowRight /> العودة للمجلدات
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
             <FaSpinner className="animate-spin text-4xl mb-3 text-blue-500" />
             <p>جاري تحميل المواد الدراسية...</p>
          </div>
        ) : !selectedTopic ? (
          /* ================= عرض المجلدات ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedTopic(item)}
                className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:scale-[1.02] shadow-lg group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-center justify-between mb-4">
                  <FaFolder className="text-5xl text-yellow-600 group-hover:text-yellow-400 transition-colors shadow-sm" />
                  <span className="bg-gray-900 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700">
                    {item.files?.length || 0} ملفات
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                  {item.title}
                </h3>
              </div>
            ))}
            
            {materials.length === 0 && (
              <div className="col-span-full text-center py-20 flex flex-col items-center">
                <FaBoxOpen className="text-7xl text-gray-700 mb-4 opacity-50" />
                <p className="text-gray-400 text-xl font-medium">لا توجد مواد متاحة حالياً.</p>
              </div>
            )}
          </div>
        ) : (
          /* ================= عرض الملفات ================= */
          <div className="animate-slideUp">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
               <FaFolder className="text-3xl text-yellow-500" />
               <h3 className="text-2xl font-bold text-white">{selectedTopic.title}</h3>
            </div>
            
            {/* القائمة الرأسية */}
            <div className="flex flex-col gap-3">
              {selectedTopic.files?.map((file, idx) => (
                <div 
                  key={idx}
                  onClick={() => openFileViewer(idx)}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:bg-gray-750 flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  {/* الجانب الأيمن */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-600 overflow-hidden">
                        {file.type?.includes('pdf') ? (
                          <FaFilePdf className="text-2xl text-red-500" />
                        ) : (
                          <img src={file.url} alt="thumbnail" className="w-full h-full object-cover" />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <p className="text-white font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md dir-ltr text-right">
                            {file.name}
                        </p>
                        <span className="text-xs text-gray-500 uppercase mt-0.5">
                            {file.type?.split('/')[1] || 'FILE'}
                        </span>
                    </div>
                  </div>

                  {/* الجانب الأيسر */}
                  <div className="flex-shrink-0 mr-2">
                      <button className="bg-gray-700 group-hover:bg-blue-600 text-gray-300 group-hover:text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold px-3">
                          <span className="hidden sm:inline">عرض الملف</span>
                          <FaEye />
                      </button>
                  </div>
                </div>
              ))}
              
              {(!selectedTopic.files || selectedTopic.files.length === 0) && (
                 <div className="py-10 text-center border-2 border-dashed border-gray-700 rounded-xl">
                    <p className="text-gray-500 text-lg">هذا المجلد فارغ حالياً.</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* عارض الملفات */}
      {viewerOpen && selectedTopic && (
        <FileViewer 
          files={selectedTopic.files}
          currentIndex={currentFileIndex}
          onClose={() => setViewerOpen(false)}
          onNext={() => setCurrentFileIndex((prev) => (prev + 1) % selectedTopic.files.length)}
          onPrev={() => setCurrentFileIndex((prev) => (prev - 1 + selectedTopic.files.length) % selectedTopic.files.length)}
        />
      )}
    </div>
  );
};

export default StudentMaterialsView;