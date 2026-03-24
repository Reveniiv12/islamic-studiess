import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

export default function AccessDenied() {
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
    </div>
  );
}
