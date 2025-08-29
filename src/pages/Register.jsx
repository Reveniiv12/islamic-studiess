// src/pages/Register.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { FaUserPlus } from "react-icons/fa";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // حالة جديدة لعرض الرسائل
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage(""); // مسح الرسائل القديمة
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (user) {
      // بعد إنشاء المستخدم بنجاح، احفظ دوره في جدول profiles
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            role,
          },
        ]);

      if (insertError) {
        console.error("Error inserting profile data:", insertError);
        // لا توقف العملية إذا فشل إدخال الدور، لأن المستخدم تم إنشاؤه
        setMessage("تم إنشاء الحساب بنجاح، ولكن حدث خطأ في حفظ الدور. يرجى الاتصال بالمسؤول.");
      } else {
        setMessage("تم إرسال رابط تأكيد إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد لتفعيل الحساب.");
        // هنا يمكنك إظهار رسالة فقط بدلاً من التوجيه
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center font-['Noto_Sans_Arabic',sans-serif] p-4 text-white">
      <div className="max-w-md w-full p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center">
          <FaUserPlus className="w-16 h-16 text-green-400 mb-2" />
          <h2 className="text-3xl font-extrabold text-white text-center">
            إنشاء حساب جديد
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <form className="space-y-6" onSubmit={handleRegister}>
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
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="البريد الإلكتروني"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="كلمة المرور"
              />
            </div>
            <div>
              <label htmlFor="role" className="sr-only">الدور</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 text-white bg-gray-700 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="student">طالب</option>
                <option value="teacher">معلم</option>
              </select>
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="text-green-400 text-sm text-center font-medium">
                {message}
              </div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                {loading ? '...جاري التحميل' : 'إنشاء حساب'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}