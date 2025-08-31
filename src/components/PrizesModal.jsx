// src/components/PrizesModal.jsx

import React from 'react';
import { FaStar, FaTimes, FaGift } from 'react-icons/fa';

const PrizesModal = ({ prizes = [], onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <FaGift className="text-purple-400" /> المكافآت المتاحة
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar">
          {prizes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">لا توجد مكافآت متاحة حاليًا.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {prizes.map((prize) => (
                <div key={prize.id} className="bg-gray-700 p-4 rounded-xl flex items-center justify-between border border-gray-600">
                  <div>
                    <h5 className="text-lg font-bold text-white">{prize.name}</h5>
                    <p className="text-gray-400 flex items-center gap-1 mt-1">
                      التكلفة:
                      <span className="font-bold text-yellow-400">{prize.cost}</span>
                      <FaStar className="text-yellow-400 text-sm" />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-900">
          <button 
            onClick={onClose} 
            className="bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold text-lg transition-colors hover:bg-gray-500"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrizesModal;