import React from 'react';
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const FileViewer = ({ files, currentIndex, onClose, onPrev, onNext }) => {
  if (!files || files.length === 0 || currentIndex === null) {
    return null;
  }

  const currentFile = files[currentIndex];
  const isImage = currentFile.type.startsWith('image/');
  const isPDF = currentFile.type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl hover:text-gray-400 transition-colors z-50">
        <FaTimes />
      </button>

      {/* Navigation - Previous */}
      <button 
        onClick={onPrev}
        className="absolute left-4 md:left-8 text-white text-4xl p-2 rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-80 transition-colors z-40"
        style={{ opacity: currentIndex > 0 ? 1 : 0.2 }}
        disabled={currentIndex === 0}
      >
        <FaArrowRight />
      </button>

      {/* Navigation - Next */}
      <button 
        onClick={onNext}
        className="absolute right-4 md:right-8 text-white text-4xl p-2 rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-80 transition-colors z-40"
        style={{ opacity: currentIndex < files.length - 1 ? 1 : 0.2 }}
        disabled={currentIndex === files.length - 1}
      >
        <FaArrowLeft />
      </button>

      <div className="flex flex-col items-center justify-center h-full w-full max-w-5xl p-8">
        <div className="w-full h-full flex items-center justify-center relative">
          {isImage ? (
            <img src={currentFile.url} alt={currentFile.name} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
          ) : isPDF ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg shadow-xl">
              <FaFilePdf size={80} className="text-red-500 mb-4" />
              <p className="text-lg text-white font-semibold mb-2">{currentFile.name}</p>
              <a 
                href={currentFile.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4"
              >
                فتح الملف في نافذة جديدة
              </a>
            </div>
          ) : (
            <div className="text-white text-center">
              <p>نوع الملف غير مدعوم للعرض.</p>
              <p className="text-gray-400 mt-2">{currentFile.name}</p>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 left-0 w-full text-center text-white text-lg">
        {currentIndex + 1} / {files.length}
      </div>
    </div>
  );
};

export default FileViewer;
