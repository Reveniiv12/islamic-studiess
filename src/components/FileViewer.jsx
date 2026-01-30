import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { FaChevronLeft, FaChevronRight, FaTimes, FaFileAlt, FaDownload } from 'react-icons/fa';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const FileViewer = ({ files, currentIndex, onClose, onPrev, onNext }) => {
  const currentFile = files[currentIndex];
  if (!currentFile) return null;

  const isPDF = currentFile.type === 'application/pdf' || currentFile.url?.endsWith('.pdf');

  // إعداد الإضافة لإخفاء العناصر غير المرغوب فيها
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    // 1. إزالة الشريط الجانبي تماماً (الذي ظهر في الصورة الأولى)
    sidebarTabs: (defaultTabs) => [],
    
    // 2. تخصيص شريط الأدوات العلوي (لإزالة الأدوات التي ظهرت في الصورة الثانية)
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const {
            CurrentPageInput,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            Zoom,
            ZoomIn,
            ZoomOut,
            EnterFullScreen,
          } = slots;
          return (
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-2">
                <GoToPreviousPage />
                <div className="flex items-center text-white text-sm">
                  <CurrentPageInput /> <span className="mx-1">/</span> <NumberOfPages />
                </div>
                <GoToNextPage />
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut />
                <Zoom />
                <ZoomIn />
              </div>
              <div className="flex items-center">
                <EnterFullScreen />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-2 sm:p-6 animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-6xl h-[92vh] bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header - شريط العنوان العلوي الخاص بك */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FaFileAlt size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {currentFile.name}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {isPDF ? 'PDF Document' : 'Image File'} • {currentIndex + 1} من {files.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={currentFile.url} 
              download 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
              title="تحميل الملف"
            >
              <FaDownload size={16} />
            </a>
            <button 
              onClick={onClose}
              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* منطقة العرض */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#0a0f1d]">
          
          <div className="absolute left-4 z-10 hidden md:block">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-4 rounded-2xl bg-slate-900/80 text-white border border-slate-700 hover:border-blue-500 hover:bg-blue-600 transition-all shadow-xl disabled:opacity-0 disabled:pointer-events-none"
            >
              <FaChevronLeft size={24} />
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-center">
            {isPDF ? (
              <div className="h-full w-full custom-viewer-theme">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={currentFile.url}
                    plugins={[defaultLayoutPluginInstance]}
                    theme="dark"
                  />
                </Worker>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-center h-full w-full">
                <img 
                  src={currentFile.url} 
                  className="max-h-full max-w-full object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800" 
                  alt={currentFile.name} 
                />
              </div>
            )}
          </div>

          <div className="absolute right-4 z-10 hidden md:block">
            <button 
              onClick={onNext}
              disabled={currentIndex === files.length - 1}
              className="p-4 rounded-2xl bg-slate-900/80 text-white border border-slate-700 hover:border-blue-500 hover:bg-blue-600 transition-all shadow-xl disabled:opacity-0 disabled:pointer-events-none"
            >
              <FaChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* شريط التنقل السفلي للهواتف */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-t border-slate-800">
          <button onClick={onPrev} disabled={currentIndex === 0} className="flex items-center gap-2 text-sm font-bold text-slate-400 disabled:opacity-20">
            <FaChevronLeft /> السابق
          </button>
          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
             {currentIndex + 1} / {files.length}
          </span>
          <button onClick={onNext} disabled={currentIndex === files.length - 1} className="flex items-center gap-2 text-sm font-bold text-slate-400 disabled:opacity-20">
            التالي <FaChevronRight />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .custom-viewer-theme .rpv-core__viewer { background-color: #0a0f1d !important; }
        .rpv-default-layout__toolbar { 
          background-color: #0f172a !important; 
          border-bottom: 1px solid #1e293b !important;
          color: white !important; 
        }
        /* إخفاء زر الشريط الجانبي تماماً من الـ Toolbar إذا ظل موجوداً */
        .rpv-default-layout__toolbar-left button:first-child { display: none !important; }
        
        .rpv-core__inner-pages { background-color: #0a0f1d !important; }
        .rpv-core__page-layer { box-shadow: 0 0 30px rgba(0,0,0,0.3) !important; margin-bottom: 20px !important; }
        .rpv-core__textbox { background-color: #1e293b !important; color: white !important; border: 1px solid #334155 !important; }
      `}</style>
    </div>
  );
};

export default FileViewer;