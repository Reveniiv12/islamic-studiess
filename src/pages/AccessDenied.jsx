import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaQrcode, FaTimes } from "react-icons/fa";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

export default function AccessDenied() {
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render(
        (decodedText) => {
          // نجاح القراءة
          if (decodedText.includes('/student-view/')) {
            scanner.clear();
            setShowScanner(false);
            // استخراج المسار من الرابط (في حال كان الرابط كاملاً)
            try {
              const url = new URL(decodedText);
              window.location.href = url.pathname + url.search;
            } catch (e) {
              // إذا كان الرابط نسبياً وليس كاملاً
              navigate(decodedText);
            }
          } else {
             // في حال كان الرابط لصفحة أخرى، قم بالانتقال إليها
             window.location.href = decodedText;
          }
        },
        (error) => {
          // يمكن تجاهل أخطاء القراءة المستمرة
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [showScanner, navigate]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center p-6 text-white font-['Noto_Sans_Arabic',sans-serif]"
    >
      <div className="flex flex-col items-center max-w-lg w-full">
        
        {/* أيقونة التحذير الحمراء */}
        <div className="mb-8">
          <FaExclamationTriangle className="text-[#ff4d4d] text-8xl" />
        </div>

        {/* النص الأساسي الكبير */}
        <h1 className="text-3xl md:text-4xl font-bold text-center leading-tight mb-6">
          عذراً، الوصول إلى هذه المنطقة محظور
        </h1>

        {/* النص الفرعي الرمادي */}
        <p className="text-[#94a3b8] text-lg md:text-xl text-center leading-relaxed mb-12">
          الرجاء تسجيل الدخول بحساب المعلم أو الإدارة
          <br />
          للحصول على صلاحية الوصول.
        </p>

        {/* زر قارئ QR */}
        {!showScanner ? (
           <button 
             onClick={() => setShowScanner(true)}
             className="mb-8 flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg shadow-xl transition-all w-full max-w-xs active:scale-95 group"
           >
             <FaQrcode className="text-2xl group-hover:scale-110 transition-transform" />
             تسجيل الدخول عبر QR
           </button>
        ) : (
           <div className="w-full max-w-md bg-white text-black p-4 rounded-2xl shadow-2xl relative mb-8 animate-fadeIn">
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white flex items-center justify-center rounded-full shadow-lg hover:bg-rose-600 transition-colors z-10"
              >
                <FaTimes />
              </button>
              <h3 className="text-center font-bold mb-4 text-indigo-900">ضع رمز الـ QR أمام الكاميرا</h3>
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden"></div>
           </div>
        )}

        {/* البطاقة السفلية الداكنة */}
        <div className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl p-8 py-10 text-center shadow-2xl">
          <p className="text-[#94a3b8] text-lg">
            أي استفسار، يرجى التواصل مع مدير النظام.
          </p>
        </div>

      </div>

      {/* نص صغير في الأسفل جداً اختياري */}
      <div className="absolute bottom-10 opacity-20 text-xs tracking-widest uppercase">
        403 — Forbidden Access
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        /* تحسين مظهر مكتبة QR */
        #qr-reader {
           border: 2px solid #e2e8f0 !important;
           border-radius: 12px;
        }
        #qr-reader__scan_region {
           background-color: #f8fafc;
        }
        #qr-reader__dashboard_section_csr span {
           color: #334155 !important;
        }
        #qr-reader button {
           background-color: #4f46e5;
           color: white;
           border: none;
           padding: 8px 16px;
           border-radius: 8px;
           font-weight: bold;
           margin: 5px;
           cursor: pointer;
        }
        #qr-reader button:hover {
           background-color: #4338ca;
        }
        #qr-reader__camera_selection {
           padding: 8px;
           border-radius: 8px;
           border: 1px solid #cbd5e1;
           margin-bottom: 10px;
           width: 100%;
        }
      `}</style>
    </div>
  );
}
