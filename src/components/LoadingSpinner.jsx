// src/components/LoadingSpinner.jsx

import React from 'react';
import './LoadingSpinner.css'; // يجب أن يكون هذا الملف موجودًا بنفس المجلد

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">جاري التحميل...</p>
    </div>
  );
};

export default LoadingSpinner;
