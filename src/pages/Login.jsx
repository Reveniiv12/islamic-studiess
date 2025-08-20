// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { FaUserCircle } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("المدرسة");

  // Load school name from Firestore on component mount
  useEffect(() => {
    const schoolRef = doc(db, "settings", "schoolInfo");
    const unsubscribe = onSnapshot(schoolRef, (docSnap) => {
      if (docSnap.exists()) {
        setSchoolName(docSnap.data().name);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // navigation is handled by the onAuthStateChanged listener
    } catch (err) {
      let errorMessage = "خطأ في تسجيل الدخول: البريد الإلكتروني أو كلمة المرور غير صحيحة";
      switch (err.code) {
        case "auth/invalid-email":
          errorMessage = "صيغة البريد الإلكتروني غير صحيحة.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
          break;
        case "auth/invalid-credential":
          errorMessage = "البيانات المدخلة غير صحيحة، يرجى التحقق منها.";
          break;
        default:
          errorMessage = "فشلت عملية تسجيل الدخول. الرجاء المحاولة مرة أخرى.";
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center font-['Noto_Sans_Arabic',sans-serif] p-4 text-white">
      <div className="max-w-md w-full p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center">
          <FaUserCircle className="w-16 h-16 text-blue-400 mb-2" />
          <h2 className="text-3xl font-extrabold text-white text-center">
            تسجيل الدخول
          </h2>
          <p className="text-gray-400 text-center mt-2">{schoolName}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="البريد الإلكتروني"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-400 group-hover:text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2h-2V7A3 3 0 0113 7z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
