// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "grades", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (!data) return (
    <div className="text-center mt-10 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بيانات</h3>
      <p className="mt-1 text-gray-600">لم يتم تسجيل أي درجات لك بعد</p>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white">
          <h2 className="text-xl font-bold">درجاتك</h2>
        </div>
        
        <div className="p-6">
          <ul className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
              <li key={key} className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-700">
                  {key === 'assignments' && 'الواجبات'}
                  {key === 'participation' && 'المشاركة'}
                  {key === 'monthly' && 'الاختبار الشهري'}
                  {key === 'final' && 'الاختبار النهائي'}
                  {key === 'attendance' && 'الحضور'}
                </span>
                <span className="font-bold text-lg bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}