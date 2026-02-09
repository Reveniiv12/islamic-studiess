import React, { useEffect } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaFileAlt,
  FaDownload,
  FaImage
} from 'react-icons/fa';

const StudentPortfolioFileViewer = ({ files, currentIndex, onClose, onPrev, onNext }) => {
  const currentFile = files[currentIndex];

  // إغلاق العارض عند الضغط على زر ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!currentFile) return null;

  // ---------------------------------------------------------
  // دالة استخراج المعرف (ID)
  // ---------------------------------------------------------
  const getGoogleDriveId = (url) => {
    if (!url) return null;
    const strUrl = url.toString();

    const patterns = [
      /id=([a-zA-Z0-9_-]{25,})/,
      /\/d\/([a-zA-Z0-9_-]{25,})/,
      /file\/d\/([a-zA-Z0-9_-]{25,})/,
      /open\?id=([a-zA-Z0-9_-]{25,})/,
      /picture\/0?([\w-]{25,})/ // للروابط القديمة
    ];
    for (const pattern of patterns) {
      const match = strUrl.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const fileId = getGoogleDriveId(currentFile.file_url || currentFile.url);

  const isPDF =
    currentFile.file_type?.includes('pdf') ||
    currentFile.type === 'application/pdf' ||
    currentFile.file_name?.toLowerCase().endsWith('.pdf');

  // رابط التحميل
  const downloadUrl = fileId 
    ? `https://drive.google.com/uc?export=download&id=${fileId}` 
    : (currentFile.file_url || currentFile.url);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      
      <div className="relative w-full h-full sm:h-[95vh] sm:max-w-6xl bg-[#0f172a] sm:rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${isPDF ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {isPDF ? <FaFileAlt size={18} /> : <FaImage size={18} />}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-md" dir="auto">
                {currentFile.file_name || currentFile.name || 'ملف بدون عنوان'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                {currentIndex + 1} من {files.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fileId && (
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="hidden sm:flex items-center justify-center w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-700">
                <FaDownload size={14} />
              </a>
            )}
            <button onClick={onClose} className="flex items-center justify-center w-9 h-9 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 hover:border-red-500">
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex items-center justify-center bg-[#050914] overflow-hidden group">
          
          {/* زر السابق */}
          {currentIndex > 0 && (
            <button onClick={onPrev} className="absolute left-4 z-20 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/50 hover:bg-blue-600 text-white border border-white/10 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110">
              <FaChevronLeft size={20} />
            </button>
          )}

          <div className="w-full h-full flex items-center justify-center p-0 sm:p-2">
            {/* 🔥🔥 التعديل الجوهري هنا 🔥🔥
               نستخدم iframe دائماً إذا توفر ID، وهذا يحل مشكلة الصور
               ويجعلها قابلة للتكبير مثل PDF تماماً
            */}
            {fileId ? (
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                className="w-full h-full bg-slate-900 rounded-none sm:rounded-lg shadow-inner"
                loading="lazy"
                title="File Preview"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
               // Fallback: إذا فشل استخراج ID، نستخدم الطرق التقليدية
               isPDF ? (
                <div className="text-center p-8">
                    <FaFileAlt size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-red-400">لا يمكن معاينة PDF</p>
                </div>
               ) : (
                <img
                    src={currentFile.file_url || currentFile.url}
                    className="max-h-full max-w-full object-contain"
                    alt="preview"
                />
               )
            )}
          </div>

           {/* زر التالي */}
           {currentIndex < files.length - 1 && (
            <button onClick={onNext} className="absolute right-4 z-20 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-black/50 hover:bg-blue-600 text-white border border-white/10 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110">
              <FaChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <button onClick={onPrev} disabled={currentIndex === 0} className={`flex items-center gap-2 text-sm font-bold ${currentIndex === 0 ? 'text-slate-600' : 'text-white'}`}>
            <FaChevronRight className="rotate-180" size={14} /> السابق
          </button>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {currentIndex + 1} / {files.length}
          </span>
          <button onClick={onNext} disabled={currentIndex === files.length - 1} className={`flex items-center gap-2 text-sm font-bold ${currentIndex === files.length - 1 ? 'text-slate-600' : 'text-white'}`}>
            التالي <FaChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentPortfolioFileViewer;