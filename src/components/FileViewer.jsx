import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaTimes, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
// تم تعديل مسار استيراد ملفات CSS ليعمل في بيئة الإنشاء
import 'react-pdf/dist/umd/Page/AnnotationLayer.css';
import 'react-pdf/dist/umd/Page/TextLayer.css';

// تأكد من أن هذا المسار لا يزال صحيحاً
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FileViewer = ({ files, currentIndex, onClose, onPrev, onNext }) => {
  const file = files[currentIndex];
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  if (!file) {
    return null;
  }

  const isPDF = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" dir="rtl">
      <div className="relative w-full h-full max-w-4xl max-h-screen bg-gray-800 rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button onClick={onClose} className="text-white hover:text-red-400 transition-colors p-2 rounded-full bg-gray-700">
            <FaTimes size={24} />
          </button>
          <h2 className="text-xl font-bold text-blue-400 truncate flex-1 text-center px-4">
            {file.name}
          </h2>
          {isPDF && (
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm">
                صفحة {pageNumber} من {numPages}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {isPDF ? (
            <Document
              file={file.url}
              onLoadSuccess={onDocumentLoadSuccess}
              className="w-full h-full flex flex-col items-center"
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="w-full h-full"
              />
            </Document>
          ) : (
            <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg" />
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={() => onPrev()}
            disabled={currentIndex === 0}
            className={`p-3 rounded-full transition-colors ${
              currentIndex === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaChevronRight size={20} />
          </button>

          <div className="flex gap-2">
            {isPDF && (
              <>
                <button
                  onClick={() => setPageNumber(prevPage => prevPage - 1)}
                  disabled={pageNumber <= 1}
                  className={`p-2 rounded-lg transition-colors text-white ${
                    pageNumber <= 1 ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  <FaChevronRight size={16} />
                </button>
                <button
                  onClick={() => setPageNumber(prevPage => prevPage + 1)}
                  disabled={pageNumber >= numPages}
                  className={`p-2 rounded-lg transition-colors text-white ${
                    pageNumber >= numPages ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  <FaChevronLeft size={16} />
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => onNext()}
            disabled={currentIndex === files.length - 1}
            className={`p-3 rounded-full transition-colors ${
              currentIndex === files.length - 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <FaChevronLeft size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
