// src/components/StudentMaterialsView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { FaFolder, FaFilePdf, FaArrowRight, FaBoxOpen, FaSpinner } from 'react-icons/fa';
import FileViewer from './FileViewer'; 

import { Document, Page, pdfjs } from 'react-pdf';

// إعداد الـ Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// مكون معاينة الـ PDF
const PdfThumbnail = ({ url }) => {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-center bg-white relative">
      <Document 
        file={url} 
        loading={
          <div className="flex items-center justify-center w-full h-full bg-gray-800">
            <FaFilePdf size={40} className="text-red-500 animate-pulse" />
          </div>
        }
        error={
            <div className="flex items-center justify-center w-full h-full bg-gray-800">
              <FaFilePdf size={40} className="text-red-500" />
            </div>
        }
      >
        <Page 
          pageNumber={1} 
          width={280} 
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
        />
      </Document>
    </div>
  );
};

const StudentMaterialsView = ({ show, onClose, gradeId, sectionId, teacherId, activeSemester, title }) => {
  const [materials, setMaterials] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // دالة الجلب
  const fetchMaterials = useCallback(async () => {
    if (!gradeId || !sectionId) return;

    try {
      // 1. تم إضافة cover_image للاستعلام
      const { data: assignments, error } = await supabase
        .from('folder_assignments')
        .select(`
          course_folders (
            id, 
            title, 
            is_hidden, 
            created_at,
            order_index,
            cover_image, 
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
            cover_image: folder.cover_image, // تخزين الصورة
            files: folder.folder_contents
              .filter(content => content.is_visible && content.library_files)
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map(content => ({
                name: content.library_files.file_name,
                type: content.library_files.file_type,
                url: content.library_files.file_data 
              }))
          }));

        formattedMaterials.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setMaterials(formattedMaterials);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }, [gradeId, sectionId]);

  useEffect(() => {
    if (show) {
      setLoading(true);
      fetchMaterials().then(() => setLoading(false));
      setSelectedTopic(null);
    }
  }, [show, fetchMaterials]);

  useEffect(() => {
    if (!show) return;

    const channel = supabase
      .channel('materials-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folder_assignments', filter: `grade_id=eq.${gradeId}` }, () => fetchMaterials())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_folders' }, () => fetchMaterials())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folder_contents' }, () => fetchMaterials())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library_files' }, () => fetchMaterials())
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

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
        
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
                className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer transition-all shadow-lg group relative overflow-hidden"
              >
                {/* 2. تم تحديث عرض المجلد لدعم الصورة */}
                <div className="flex items-center justify-between mb-4 h-16">
                  {item.cover_image ? (
                     <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-600 shadow-sm">
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                     </div>
                  ) : (
                     <FaFolder className="text-5xl text-yellow-600 group-hover:text-yellow-400 transition-colors shadow-sm" />
                  )}
                  
                  <span className="bg-gray-900 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700 h-fit">
                    {item.files?.length || 0} ملفات
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate mt-2">
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
            <div className="flex items-center gap-3 mb-8 border-b border-gray-700 pb-4">
               {/* عرض صورة المجلد المصغرة بجانب العنوان إن وجدت */}
               {selectedTopic.cover_image ? (
                  <img src={selectedTopic.cover_image} alt="Folder" className="w-10 h-10 object-cover rounded border border-gray-600" />
               ) : (
                  <FaFolder className="text-3xl text-yellow-500" />
               )}
               <h3 className="text-2xl font-bold text-white">{selectedTopic.title}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedTopic.files?.map((file, idx) => (
                <div 
                  key={idx}
                  onClick={() => openFileViewer(idx)}
                  // 3. تم إزالة hover:-translate-y-2 لمنع حركة العنصر
                  // والاكتفاء بتغيير لون الإطار عند التمرير
                  className="group relative bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden hover:border-blue-500 cursor-pointer shadow-xl transition-colors"
                >
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                    {file.type?.includes('pdf') ? (
                       <PdfThumbnail url={file.url} />
                    ) : (
                      <img src={file.url} alt="thumbnail" className="w-full h-full object-cover" />
                    )}
                    
                    {/* 3. تم إزالة طبقة الـ Overlay وكلمة "عرض" بالكامل لتجنب مشاكل الجوال */}
                  </div>

                  <div className="p-4 bg-gray-800/80">
                    <p className="text-sm font-bold truncate text-gray-200 text-right" dir="auto">
                        {file.name}
                    </p>
                    <span className="text-[10px] text-gray-500 uppercase mt-1 block text-left tracking-wider">
                        {file.type?.split('/')[1] || 'FILE'}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!selectedTopic.files || selectedTopic.files.length === 0) && (
                 <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
                    <p className="text-gray-500 text-lg">هذا المجلد فارغ حالياً.</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewerOpen && selectedTopic && createPortal(
        <div style={{ position: 'relative', zIndex: 9999 }}>
            <FileViewer 
              files={selectedTopic.files}
              currentIndex={currentFileIndex}
              onClose={() => setViewerOpen(false)}
              onNext={() => setCurrentFileIndex((prev) => (prev + 1) % selectedTopic.files.length)}
              onPrev={() => setCurrentFileIndex((prev) => (prev - 1 + selectedTopic.files.length) % selectedTopic.files.length)}
            />
        </div>,
        document.body
      )}

    </div>
  );
};

export default StudentMaterialsView;