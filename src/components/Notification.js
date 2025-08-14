import React, { useEffect, useRef } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';

const Notification = ({ message, type, onClose }) => {
    const notificationRef = useRef(null);
    let bgColor, icon;

    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            icon = <FaCheckCircle className="text-xl" />;
            break;
        case 'error':
            bgColor = 'bg-red-600';
            icon = <FaTimesCircle className="text-xl" />;
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            icon = <FaExclamationCircle className="text-xl" />;
            break;
        default:
            bgColor = 'bg-blue-500';
            icon = <FaExclamationCircle className="text-xl" />;
            break;
    }

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // إخفاء التنبيه بعد 5 ثوانٍ تلقائياً
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) {
        return null;
    }

    return (
        <div
            ref={notificationRef}
            className="fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg z-[100] max-w-sm w-full transition-all duration-300 transform animate-fade-in"
            style={{ 
                backgroundColor: bgColor,
            }}
        >
            <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-bold text-lg">{message}</span>
                </div>
                <button onClick={onClose} className="text-white hover:text-gray-200 transition">
                    <FaTimesCircle className="text-xl" />
                </button>
            </div>
            <style>{`
                .animate-fade-in {
                    animation: fade-in 0.5s forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
};

export default Notification;