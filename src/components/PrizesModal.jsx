// src/components/PrizesModal.jsx (مكون جديد لصفحة الطالب)
import React from 'react';
import { FaStar, FaGift, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import CustomDialog from './CustomDialog'; // يفترض أن هذا المكون موجود

const PrizesModal = ({ prizes = [], onClose, currentStars, pendingRequest, onRequest, handleDialog }) => {
  const isRequestPending = !!pendingRequest;

  const handleRequestClick = (prize) => {
    // تم نقل منطق التحقق الأساسي (pendingRequest و currentStars) إلى requestReward في StudentView.jsx
    // ولكن نترك التحقق المرئي هنا لتعطيل الزر
    if (isRequestPending) {
        handleDialog("خطأ", `لديك طلب مكافأة معلق (${pendingRequest.prizes.name}). لا يمكنك تقديم طلب آخر حتى يتم معالجته.`, "error");
        return;
    }
    
    if (currentStars < prize.cost) {
        handleDialog("خطأ", `رصيدك الحالي (${currentStars} نجمة) غير كافٍ لطلب مكافأة "${prize.name}" التي تكلفتها ${prize.cost} نجوم.`, "error");
        return;
    }
    
    // استدعاء دالة طلب المكافأة في المكون الأب
    onRequest(prize);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h3 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <FaGift className="text-purple-400" /> المكافآت المتاحة
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="text-3xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          <div className="mb-6 p-4 rounded-xl bg-blue-900/30 border border-blue-700">
            <p className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <FaStar className="text-yellow-400" /> رصيدك الحالي: 
              <span className="text-white text-xl">{currentStars || 0}</span> نجوم
            </p>
            {isRequestPending && (
                <p className="text-sm text-yellow-400 mt-2 flex items-center gap-1">
                    <FaExclamationCircle /> لديك طلب معلق على مكافأة: {pendingRequest.prizes?.name}
                </p>
            )}
          </div>

          <div className="space-y-4">
            {prizes.length === 0 ? (
              <div className="text-center text-gray-500 py-4">لا توجد جوائز متاحة حاليًا.</div>
            ) : (
              prizes.map((prize) => {
                const isAffordable = currentStars >= prize.cost;
                const isDisabled = isRequestPending || !isAffordable;
                
                return (
                  <div 
                    key={prize.id} 
                    className={`p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between border-2 transition-all ${
                      isAffordable && !isRequestPending ? 'bg-gray-700 border-green-500 shadow-lg' : 'bg-gray-800 border-gray-700 opacity-70'
                    }`}
                  >
                    <div className="flex-grow mb-3 md:mb-0">
                      <h5 className="text-xl font-bold text-white">{prize.name}</h5>
                      <p className="text-gray-400 flex items-center gap-1 mt-1">
                        التكلفة:
                        <span className="font-bold text-yellow-400">{prize.cost}</span>
                        <FaStar className="text-yellow-400 text-sm" />
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleRequestClick(prize)}
                      disabled={isDisabled}
                      className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-semibold text-lg transition-colors w-full md:w-auto ${
                        isDisabled
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={isDisabled ? (isRequestPending ? "لديك طلب معلق" : "رصيدك غير كافٍ") : "المطالبة بالمكافأة"}
                    >
                      <FaGift /> مطالبة الآن
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-900">
          <button
            onClick={onClose}
            className={`bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold text-lg hover:bg-gray-500 transition-colors`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrizesModal;