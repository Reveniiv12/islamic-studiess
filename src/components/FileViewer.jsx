import React, { useState } from 'react';
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/cjs/Page/AnnotationLayer.css';
import 'react-pdf/dist/cjs/Page/TextLayer.css';

// هذا هو الحل النهائي لمشكلة مسار ملف العامل.
// يستخدم `URL` و `import.meta.url` لإنشاء مسار صحيح وآمن
// يتجنب مشاكل المسارات المطلقة والمشكلات المتعلقة بالبناء
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const FileViewer = ({ files, currentIndex, onClose, onPrev, onNext }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  if (!files || files.length === 0 || currentIndex === null) {
    return null;
  }

  const currentFile = files[currentIndex];
  const isImage = currentFile.type.startsWith('image/');
  const isPDF = currentFile.type === 'application/pdf';

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to the first page when a new PDF is loaded
  }

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(prevPageNumber => prevPageNumber + 1);
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(prevPageNumber => prevPageNumber - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl hover:text-gray-400 transition-colors z-50">
        <FaTimes />
      </button>

      {/* Main Navigation (between files) */}
      <button
        onClick={onPrev}
        className="absolute left-4 md:left-8 text-white text-4xl p-2 rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-80 transition-colors z-40"
        style={{ opacity: currentIndex > 0 ? 1 : 0.2 }}
        disabled={currentIndex === 0}
      >
        <FaArrowRight />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 md:right-8 text-white text-4xl p-2 rounded-full bg-gray-700 bg-opacity-50 hover:bg-opacity-80 transition-colors z-40"
        style={{ opacity: currentIndex < files.length - 1 ? 1 : 0.2 }}
        disabled={currentIndex === files.length - 1}
      >
        <FaArrowLeft />
      </button>

      {/* File Content Area */}
      <div className="flex flex-col items-center justify-center h-full w-full max-w-5xl p-8">
        <div className="w-full h-full flex items-center justify-center relative">
          {isImage ? (
            <img src={currentFile.url} alt={currentFile.name} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
          ) : isPDF ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Document
                file={currentFile.url}
                onLoadSuccess={onDocumentLoadSuccess}
                className="w-full h-full flex flex-col items-center overflow-auto"
              >
                <Page
                  pageNumber={pageNumber}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow-lg rounded-lg"
                />
              </Document>
              {numPages > 1 && (
                <div className="flex justify-center items-center mt-4 text-white gap-4">
                  <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500">
                    <FaArrowRight />
                  </button>
                  <span>{pageNumber} / {numPages}</span>
                  <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500">
                    <FaArrowLeft />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white text-center">
              <p>نوع الملف غير مدعوم للعرض.</p>
              <p className="text-gray-400 mt-2">{currentFile.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* File Index Counter */}
      <div className="absolute bottom-4 left-0 w-full text-center text-white text-lg">
        {currentIndex + 1} / {files.length}
      </div>
    </div>
  );
};

export default FileViewer;
