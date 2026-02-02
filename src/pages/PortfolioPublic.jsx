import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaFilePdf, FaGraduationCap, FaSchool, FaCalendarAlt } from 'react-icons/fa';
import FileViewer from '../components/FileViewer';

const PortfolioPublic = () => {
  const { userId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState({
    name: '',
    school: '',
    photo: '',
    semester: '',
    academicYear: ''
  });
  const [currentFileIndex, setCurrentFileIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. جلب الملفات (بما فيها عمود thumbnail_url الجديد تلقائياً)
        const { data: fData, error: fError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (fError) console.error("Files fetch error:", fError.message);

        // 2. جلب الإعدادات العامة
        const { data: sData, error: sError } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'general')
          .single();

        if (sError) console.error("Settings fetch error:", sError.message);

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
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-blue-400 font-bold">
      جاري تحميل ملف الإنجاز...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Noto_Sans_Arabic'] pb-20" dir="rtl">
      {/* Header Section */}
      <div className="relative h-80 bg-gradient-to-l from-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pattern-grid-lg"></div>
        <div className="relative text-center z-10 flex flex-col items-center">
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 animate-pulse"></div>
            <img 
              src={teacherInfo.photo} 
              alt={teacherInfo.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/10 relative z-10 shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">ملف الإنجاز الرقمي</h1>
          <p className="text-blue-200 tracking-widest uppercase text-sm font-light">E-Portfolio Showcase</p>
        </div>
      </div>

      {/* Floating Info Card */}
      <div className="max-w-5xl mx-auto -mt-16 px-4 relative z-20">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400"><FaGraduationCap size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">المعلم</p>
                <p className="text-lg font-bold text-white">{teacherInfo.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400"><FaSchool size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">المدرسة</p>
                <p className="text-lg font-bold text-white">{teacherInfo.school}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400"><FaCalendarAlt size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">الفصل / السنة</p>
                <p className="text-lg font-bold text-white">{teacherInfo.semester} | {teacherInfo.academicYear}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="max-w-6xl mx-auto mt-16 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {files.map((file, index) => (
            <div 
              key={file.id}
              onClick={() => setCurrentFileIndex(index)}
              className="group relative bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer hover:-translate-y-2 shadow-xl"
            >
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
                {/* --- التعديل هنا: منطق العرض الآمن --- */}
                {file.type.includes('pdf') ? (
                   file.thumbnail_url ? (
                     <img 
                        src={file.thumbnail_url} 
                        loading="lazy"
                        alt="PDF cover" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                     />
                   ) : (
                     <div className="flex flex-col items-center justify-center">
                        <FaFilePdf size={50} className="text-red-500 mb-3 shadow-lg drop-shadow-lg" />
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">PDF File</span>
                     </div>
                   )
                ) : (
                  <img 
                    src={file.url} 
                    loading="lazy"
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                )}
                
                {/* طبقة التراكب عند التحويم */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                   <span className="bg-white/90 text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                     فتح الملف
                   </span>
                </div>
              </div>
              
              <div className="p-5 border-t border-white/5">
                <p className="text-sm font-bold truncate text-slate-200 group-hover:text-blue-400 transition-colors" dir="auto">{file.name}</p>
              </div>
            </div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
             <p className="text-slate-500">لا توجد ملفات عامة متوفرة حالياً.</p>
          </div>
        )}
      </div>

      {currentFileIndex !== null && (
        <FileViewer 
          files={files} 
          currentIndex={currentFileIndex} 
          onClose={() => setCurrentFileIndex(null)}
          onNext={() => currentFileIndex < files.length - 1 && setCurrentFileIndex(currentFileIndex + 1)}
          onPrev={() => currentFileIndex > 0 && setCurrentFileIndex(currentFileIndex - 1)}
        />
      )}
    </div>
  );
};

export default PortfolioPublic;