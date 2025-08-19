import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { FaUserCircle } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("مدرسة متوسطة الطرف");

  // Load school name from localStorage on component mount
  useEffect(() => {
    const savedSchoolName = localStorage.getItem("schoolName");
    if (savedSchoolName) {
      setSchoolName(savedSchoolName);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // التحقق من صحة الإدخال الأساسي
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/teacher");
    } catch (err) {
      let errorMessage = "خطأ في تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة";

      // تحسين رسائل الخطأ حسب نوع الخطأ
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "صيغة البريد الإلكتروني غير صحيحة";
          break;
        case "auth/user-not-found":
          errorMessage = "لا يوجد حساب مرتبط بهذا البريد الإلكتروني";
          break;
        case "auth/wrong-password":
          errorMessage = "كلمة المرور غير صحيحة";
          break;
        default:
          errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Noto_Sans_Arabic',sans-serif] text-right">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="/images/moe_logo_white.png"
            alt="شعار وزارة التعليم"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-400">
            {schoolName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            نظام إدارة الدرجات المدرسية - تسجيل الدخول
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-6 shadow-lg rounded-xl sm:px-10 border border-gray-700">
          {error && (
            <div className="mb-4 bg-red-900 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                البريد الإلكتروني
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 sm:text-sm text-right"
                  placeholder="example@school.edu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                كلمة المرور
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 sm:text-sm text-right"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-400">
                  تذكرني
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <span className="absolute right-0 inset-y-0 flex items-center pr-3">
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
