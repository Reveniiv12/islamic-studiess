import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaFilePdf, FaImage, FaGraduationCap, FaSchool, FaCalendarAlt } from 'react-icons/fa';
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
        // 1. جلب الملفات
        const { data: fData } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        // 2. جلب البيانات من جدول settings (المصدر الموحد للداشبورد)
        const { data: sData } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'general')
          .single();

        setFiles(fData || []);
        
        if (sData) {
          setTeacherInfo({
            name: sData.teacher_name || 'اسم المعلم',
            school: sData.school_name || 'المدرسة',
            photo: sData.teacher_photo || '/images/default_teacher.png',
            semester: sData.current_semester || 'الفصل الأول',
            academicYear: sData.academic_year || '1447 هـ'
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-blue-400 font-bold">جاري تحميل الملف الرقمي...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Noto_Sans_Arabic'] pb-20" dir="rtl">
      
      {/* Header Section - التصميم الذي تفضله مع إضافة صورة المعلم */}
      <div className="relative h-80 bg-gradient-to-l from-blue-900 to-indigo-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pattern-grid-lg"></div>
        <div className="relative text-center z-10 flex flex-col items-center">
          {/* صورة المعلم المضافة للتصميم */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 animate-pulse"></div>
            <img 
              src={teacherInfo.photo} 
              alt={teacherInfo.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-white/10 relative z-10 shadow-2xl"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">ملف الإنجاز الرقمي</h1>
        </div>
      </div>

      {/* Teacher Info Card - Floating - البيانات المحدثة */}
      <div className="max-w-5xl mx-auto -mt-16 px-4 relative z-20">
        <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400 shadow-inner"><FaGraduationCap size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">المعلم</p>
                <p className="text-lg font-bold text-white">{teacherInfo.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400 shadow-inner"><FaSchool size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">المدرسة</p>
                <p className="text-lg font-bold text-white">{teacherInfo.school}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400 shadow-inner"><FaCalendarAlt size={28}/></div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">الفصل / السنة</p>
                <p className="text-lg font-bold text-white">{teacherInfo.semester} | {teacherInfo.academicYear}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files Grid - المعرض الرقمي */}
      <div className="max-w-6xl mx-auto mt-16 px-4">
        <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 bg-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-white">المعرض الرقمي</h2>
          </div>
          <span className="bg-slate-800 px-4 py-1.5 rounded-full text-slate-400 text-xs font-bold border border-slate-700">
            {files.length} ملفات موثقة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {files.map((file, index) => (
            <div 
              key={file.id}
              onClick={() => setCurrentFileIndex(index)}
              className="group relative bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer hover:-translate-y-2 shadow-xl hover:shadow-blue-500/10"
            >
              <div className="aspect-video bg-slate-900 flex items-center justify-center overflow-hidden relative">
                {file.type.includes('pdf') ? (
                  <FaFilePdf size={56} className="text-red-500 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <img src={file.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                )}
                
                {/* Overlay عند التمرير */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                  <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    استعراض الآن
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-2 h-2 rounded-full ${file.type.includes('pdf') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{file.type.split('/')[1]}</span>
                </div>
                <p className="text-sm font-bold truncate text-slate-100 group-hover:text-blue-400 transition-colors">{file.name}</p>
              </div>
            </div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
             <p className="text-slate-500 font-medium tracking-wide">لا توجد ملفات متوفرة حالياً في هذا الملف.</p>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      {currentFileIndex !== null && (
        <FileViewer 
          files={files} 
          currentIndex={currentFileIndex} 
          onClose={() => setCurrentFileIndex(null)}
          onNext={() => {
            if (currentFileIndex < files.length - 1) {
              setCurrentFileIndex(currentFileIndex + 1);
            }
          }}
          onPrev={() => {
            if (currentFileIndex > 0) {
              setCurrentFileIndex(currentFileIndex - 1);
            }
          }}
        />
      )}
    </div>
  );
};

export default PortfolioPublic;