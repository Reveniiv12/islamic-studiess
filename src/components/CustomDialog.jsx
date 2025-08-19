// src/components/CustomDialog.jsx
import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaQuestionCircle } from 'react-icons/fa';

const CustomDialog = ({ title, message, type, onConfirm, onClose }) => {
    let icon = null;
    let iconColor = '';
    let buttonClass = '';

    switch (type) {
        case 'success':
            icon = <FaCheckCircle className="text-4xl" />;
            iconColor = 'text-green-500';
            buttonClass = 'bg-green-600 hover:bg-green-500';
            break;
        case 'error':
            icon = <FaTimesCircle className="text-4xl" />;
            iconColor = 'text-red-500';
            buttonClass = 'bg-red-600 hover:bg-red-500';
            break;
        case 'confirm':
            icon = <FaQuestionCircle className="text-4xl" />;
            iconColor = 'text-yellow-500';
            buttonClass = 'bg-blue-600 hover:bg-blue-500';
            break;
        case 'info':
        default:
            icon = <FaQuestionCircle className="text-4xl" />;
            iconColor = 'text-blue-500';
            buttonClass = 'bg-blue-600 hover:bg-blue-500';
            break;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center border border-gray-700">
                <div className={`flex justify-center mb-4 ${iconColor}`}>
                    {icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    {type === 'confirm' ? (
                        <>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-500 transition-colors"
                            >
                                نعم
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                            >
                                إلغاء
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded-lg font-bold text-white ${buttonClass} transition-colors`}
                        >
                            إغلاق
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomDialog;