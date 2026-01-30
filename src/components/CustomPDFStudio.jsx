import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const CustomPDFStudio = ({ files, currentIndex, onBack, onNext, onPrev }) => {
  const currentFile = files[currentIndex];
  if (!currentFile) return null;

  const isPDF = currentFile.type === 'application/pdf' || currentFile.url.endsWith('.pdf');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-10 animate-in fade-in duration-300">
      
      {/* 1. زر الإغلاق في الزاوية العلوية (خارج الإطار) */}
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 z-[1010] p-4 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all border border-white/20 shadow-2xl"
        title="إغلاق العرض"
      >
        <FaTimes size={24} />
      </button>

      {/* 2. منطقة التنقل - الأسهم موضوعة في الخلفية الشفافة */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 sm:px-12 z-[1005] pointer-events-none">
        <button 
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`pointer-events-auto p-5 sm:p-7 rounded-full bg-white/5 hover:bg-blue-600/80 text-white transition-all border border-white/10 shadow-2xl backdrop-blur-xl group ${currentIndex === 0 ? 'opacity-0 invisible' : 'opacity-100'}`}
        >
          <FaChevronRight size={32} className="group-hover:scale-125 transition-transform" />
        </button>

        <button 
          onClick={onNext}
          disabled={currentIndex === files.length - 1}
          className={`pointer-events-auto p-5 sm:p-7 rounded-full bg-white/5 hover:bg-blue-600/80 text-white transition-all border border-white/10 shadow-2xl backdrop-blur-xl group ${currentIndex === files.length - 1 ? 'opacity-0 invisible' : 'opacity-100'}`}
        >
          <FaChevronLeft size={32} className="group-hover:scale-125 transition-transform" />
        </button>
      </div>

      {/* 3. حاوية الملف المركزية (العائمة) */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#1e1e1e] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5 flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* شريط علوي صغير داخل النافذة */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[11px] font-bold text-slate-300 truncate max-w-xs">{currentFile.name}</p>
          </div>
          <span className="text-[10px] bg-white/5 text-slate-400 px-3 py-1 rounded-lg border border-white/10">
            {currentIndex + 1} من {files.length}
          </span>
        </div>

        {/* مساحة عرض المحتوى */}
        <div className="flex-1 overflow-hidden">
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
            <div className="h-full w-full flex items-center justify-center p-6 bg-[#111]">
              <img 
                src={currentFile.url} 
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
                alt={currentFile.name} 
              />
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-viewer-theme .rpv-core__viewer { background-color: #1a1a1b !important; }
        .rpv-default-layout__toolbar { 
          background-color: #0f172a !important; 
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
          color: white !important;
          padding: 8px !important;
        }
        .rpv-core__inner-pages { background-color: #1a1a1b !important; padding: 20px 0 !important; }
        /* تحسين التمرير */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default CustomPDFStudio;