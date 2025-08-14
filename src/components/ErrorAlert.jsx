import React from 'react';

const ErrorAlert = ({ message, onRetry }) => (
  <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
    <div className="text-red-500 mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mx-auto"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ</h3>
    <p className="text-gray-600 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        المحاولة مرة أخرى
      </button>
    )}
  </div>
);

export default ErrorAlert;