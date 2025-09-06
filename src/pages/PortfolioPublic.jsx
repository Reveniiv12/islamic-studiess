import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaFilePdf } from 'react-icons/fa';
import FileViewer from '../components/FileViewer';

const PortfolioPublic = () => {
  const { userId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
          
        if (filesError) throw filesError;
        setFiles(filesData);
        
        if (filesData.length === 0) {
          setError("لا توجد ملفات في ملف الإنجاز هذا.");
        }
        
        const { data: teacherInfoData, error: teacherInfoError } = await supabase
          .from('teacher_info')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (teacherInfoError && teacherInfoError.code !== 'PGRST116') {
          throw teacherInfoError;
        }
        setTeacherInfo(teacherInfoData || {});
        
      } catch (e) {
        setError("حدث خطأ أثناء تحميل الملفات.");
        console.error("Error loading data from Supabase:", e);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    } else {
      setLoading(false);
      setError("معرف المستخدم غير متوفر.");
    }
  }, [userId]);
  
  const openViewer = (index) => {
    setCurrentFileIndex(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setCurrentFileIndex(null);
  };

  const showNext = () => {
    if (currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const showPrev = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white" dir="rtl">
        <p>جاري تحميل ملف الإنجاز...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400 text-center p-4" dir="rtl">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-['Noto_Sans_Arabic',sans-serif]" dir="rtl">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-blue-400">ملف الإنجاز</h1>
      
      {Object.keys(teacherInfo).length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8 max-w-xl mx-auto text-center">
          <p className="text-gray-300 font-semibold mb-4">بيانات المعلم</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacherInfo.name && (
              <p className="text-lg"><span className="text-gray-400">المدرس: </span><span className="text-white font-bold">{teacherInfo.name}</span></p>
            )}
            {teacherInfo.school && (
              <p className="text-lg"><span className="text-gray-400">المدرسة: </span><span className="text-white font-bold">{teacherInfo.school}</span></p>
            )}
            {teacherInfo.course && (
              <p className="text-md"><span className="text-gray-400">المقرر: </span><span className="text-white">{teacherInfo.course}</span></p>
            )}
            {teacherInfo.semester && (
              <p className="text-md"><span className="text-gray-400">الفصل الدراسي: </span><span className="text-white">{teacherInfo.semester}</span></p>
            )}
            {teacherInfo.year && (
              <p className="text-md"><span className="text-gray-400">السنة الدراسية: </span><span className="text-white">{teacherInfo.year}</span></p>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="relative flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-xl"
            onClick={() => openViewer(index)}
          >
            <div className="flex items-center justify-center w-full h-48 mb-4">
              {file.type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                  <FaFilePdf size={64} className="text-red-500 mb-2" />
                  <p className="text-sm text-gray-400">ملف PDF</p>
                </div>
              ) : (
                <img src={file.url} alt={file.name} className="w-full h-full object-contain rounded-md" />
              )}
            </div>
            <div className="absolute bottom-0 w-full p-2 bg-gray-900 bg-opacity-70 text-center text-white text-sm truncate">
              {file.name}
            </div>
          </div>
        ))}
      </div>
      
      {files.length === 0 && (
        <p className="text-center text-gray-400 mt-10">لا توجد ملفات مرفوعة حتى الآن.</p>
      )}

      {isViewerOpen && (
        <FileViewer
          files={files}
          currentIndex={currentFileIndex}
          onClose={closeViewer}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </div>
  );
};

export default PortfolioPublic;
