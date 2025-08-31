import React from 'react';
import { FaTimes } from 'react-icons/fa';

const CustomModal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-lg w-full border border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="إغلاق"
        >
          <FaTimes size={24} />
        </button>
        <h3 className="text-xl font-bold mb-4 text-blue-400 text-right">{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default CustomModal;