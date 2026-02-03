import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaFilePdf, FaGraduationCap, FaSchool, FaCalendarAlt, FaLayerGroup } from 'react-icons/fa';
import FileViewer from '../components/FileViewer';

const PortfolioPublic = () => {
  const { userId } = useParams();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState({ name: '', school: '', photo: '', semester: '', academicYear: '' });
  const [currentFileIndex, setCurrentFileIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الأقسام
        const { data: cData } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('order_index', { ascending: true });

        // جلب الملفات
        const { data: fData } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        // جلب الإعدادات
        const { data: sData } = await supabase.from('settings').select('*').eq('id', 'general').single();

        setCategories(cData || []);
        setFiles(fData || []);
        
        if (sData) {
          setTeacherInfo({
            name: sData.teacher_name || 'معلم متعاون',
            school: sData.school_name || 'وزارة التعليم',
            photo: sData.teacher_photo || '/images/default_teacher.png',
            semester: sData.current_semester || '',
            academicYear: sData.academic_year || '1446 هـ' 
          });
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [userId]);

  // --- التعديل الجديد: إنشاء قائمة عرض مرتبة بصرياً ---
  // تقوم هذه الدالة بدمج الملفات بنفس ترتيب ظهورها في الشاشة (قسم تلو الآخر)
  const sortedDisplayFiles = useMemo(() => {
    let orderedList = [];

    // 1. إضافة ملفات كل قسم بالترتيب
    categories.forEach((category) => {
      const categoryFiles = files
        .filter((f) => f.category_id === category.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      orderedList = [...orderedList, ...categoryFiles];
    });

    // 2. إضافة الملفات غير المصنفة في النهاية
    const unclassifiedFiles = files
      .filter((f) => !f.category_id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    orderedList = [...orderedList, ...unclassifiedFiles];

    return orderedList;
  }, [categories, files]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-blue-400 font-bold">جاري تحميل ملف الإنجاز...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Noto_Sans_Arabic'] pb-20" dir="rtl">
      {/* Header Section */}
      <div className="relative h-80 bg-gradient-to-l from-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pattern-grid-lg"></div>
        <div className="relative text-center z-10 flex flex-col items-center">
          <div className="mb-4 relative">
             <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 animate-pulse"></div>
             <img src={teacherInfo.photo} alt={teacherInfo.name} className="w-28 h-28 rounded-full object-cover border-4 border-white/10 relative z-10 shadow-2xl"/>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">ملف الإنجاز الرقمي</h1>
          <p className="text-blue-200 tracking-widest uppercase text-sm font-light">E-Portfolio Showcase</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="max-w-5xl mx-auto -mt-16 px-4 relative z-20 mb-16">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4"><div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400"><FaGraduationCap size={28}/></div><div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">المعلم</p><p className="text-lg font-bold text-white">{teacherInfo.name}</p></div></div>
            <div className="flex items-center gap-4"><div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400"><FaSchool size={28}/></div><div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">المدرسة</p><p className="text-lg font-bold text-white">{teacherInfo.school}</p></div></div>
            <div className="flex items-center gap-4"><div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400"><FaCalendarAlt size={28}/></div><div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">الفصل الدراسي</p><p className="text-lg font-bold text-white">{teacherInfo.semester}</p></div></div>
        </div>
      </div>

      {/* Categories & Files */}
      <div className="max-w-6xl mx-auto px-4 space-y-16">
        {categories.map((category) => {
           // هنا نستخدم الفلترة العادية للعرض فقط داخل القسم
           const categoryFiles = files
                .filter(f => f.category_id === category.id)
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

           if (categoryFiles.length === 0) return null; 
           
           return (
             <div key={category.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                  <FaLayerGroup className="text-blue-500 text-xl" />
                  <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{categoryFiles.length} ملفات</span>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                 {categoryFiles.map((file) => (
                   <div 
                     key={file.id}
                     // التعديل: البحث عن الاندكس في القائمة المرتبة كلياً
                     onClick={() => setCurrentFileIndex(sortedDisplayFiles.findIndex(f => f.id === file.id))}
                     className="group relative bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer hover:-translate-y-2 shadow-xl"
                   >
                     <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
                       {file.type.includes('pdf') ? (
                          file.thumbnail_url ? 
                          <img src={file.thumbnail_url} loading="lazy" alt="PDF" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :
                          <div className="flex flex-col items-center"><FaFilePdf size={50} className="text-red-500 mb-3"/><span className="text-[10px] text-slate-400">PDF</span></div>
                       ) : (
                         <img src={file.url} loading="lazy" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       )}
                       <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                          <span className="bg-white/90 text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">فتح</span>
                       </div>
                     </div>
                     <div className="p-4"><p className="text-sm font-bold truncate text-slate-200 group-hover:text-blue-400 transition-colors" dir="auto">{file.name}</p></div>
                   </div>
                 ))}
               </div>
             </div>
           );
        })}
        
        {/* ملفات غير مصنفة */}
        {files.filter(f => !f.category_id).length > 0 && (
             <div className="pt-8 border-t border-slate-800">
               <h2 className="text-xl font-bold text-slate-400 mb-6">ملفات أخرى</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {files.filter(f => !f.category_id)
                       .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                       .map((file) => (
                    <div 
                     key={file.id}
                     // التعديل: البحث عن الاندكس في القائمة المرتبة كلياً
                     onClick={() => setCurrentFileIndex(sortedDisplayFiles.findIndex(f => f.id === file.id))}
                     className="group relative bg-slate-800/30 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all cursor-pointer"
                   >
                     <div className="aspect-video bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                       {file.type.includes('pdf') ? (
                          file.thumbnail_url ? <img src={file.thumbnail_url} className="w-full h-full object-cover opacity-60" alt="thumb"/> : <FaFilePdf size={40} className="text-slate-600"/>
                       ) : ( <img src={file.url} className="w-full h-full object-cover opacity-60" alt="file"/> )}
                     </div>
                     <div className="p-4"><p className="text-sm font-bold truncate text-slate-400" dir="auto">{file.name}</p></div>
                   </div>
                  ))}
               </div>
             </div>
        )}
      </div>

      {currentFileIndex !== null && (
        <FileViewer 
          files={sortedDisplayFiles} // التعديل: تمرير القائمة المرتبة
          currentIndex={currentFileIndex} 
          onClose={() => setCurrentFileIndex(null)} 
          onNext={() => setCurrentFileIndex(prev => Math.min(sortedDisplayFiles.length - 1, prev + 1))} 
          onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))} 
        />
      )}
    </div>
  );
};

export default PortfolioPublic;
