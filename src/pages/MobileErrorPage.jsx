// src/pages/MobileErrorPage.jsx

import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const MobileErrorPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
      <FaExclamationTriangle className="text-red-500 text-6xl mb-4" />
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        عذراً، هذا التطبيق غير متوافق مع جهازك
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-6">
        الرجاء استخدام جهاز كمبيوتر مكتبي أو جهاز لوحي لتجربة أفضل.
      </p>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="text-gray-300">
          لأي استفسار، يرجى التواصل مع فريق الدعم.
        </p>
      </div>
    </div>
  );
};

export default MobileErrorPage;
