// src/components/VerificationModal.jsx
import React, { useState } from "react";
import { FaTimes, FaUserCircle } from "react-icons/fa";
import { supabase } from "../supabaseClient";

const VerificationModal = ({ onClose, onVerificationSuccess, teacherId }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      let errorMessage = "خطأ في تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة";
      if (error.message === "Invalid login credentials") {
        errorMessage = "البيانات المدخلة غير صحيحة، يرجى التحقق منها.";
      }
      setError(errorMessage);
    } else {
      if (data.user.id !== teacherId) {
        setError("بيانات الاعتماد غير صحيحة أو لا تطابق حسابك.");
      } else {
        onVerificationSuccess(data.user);
        onClose();
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex justify-center items-center p-4" dir="rtl">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center pb-3 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">تأكيد الهوية</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="mt-4 text-center">
          <FaUserCircle className="w-16 h-16 text-blue-400 mb-2 mx-auto" />
          <p className="text-gray-400 text-sm mt-2">
            يرجى إدخال بيانات حسابك لتأكيد العملية.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">البريد الإلكتروني</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="البريد الإلكتروني"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">كلمة المرور</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="كلمة المرور"
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm text-center font-medium mt-2">
              {error}
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                {loading && (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </span>
              تأكيد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationModal;