// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: studentData, error } = await supabase
          .from("students")
          .select("grades")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching grades:", error);
          setData(null);
        } else if (studentData && studentData.grades) {
          setData(studentData.grades);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (!data)
    return (
      <div className="text-center mt-10 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بيانات</h3>
        <p className="mt-1 text-gray-600">لم يتم تسجيل أي درجات لك بعد</p>
      </div>
    );

  const getCategoryName = (key) => {
    switch (key) {
      case "monthlyTest":
        return "الاختبار الشهري";
      case "finalTest":
        return "الاختبار النهائي";
      case "homework":
        return "الواجبات";
      case "participation":
        return "المشاركة";
      case "attendance":
        return "الحضور والغياب";
      default:
        return key;
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 font-['Noto_Sans_Arabic',sans-serif]">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white text-right">
          <h2 className="text-xl font-bold">درجاتك</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
              <li
                key={key}
                className="flex justify-between items-center border-b border-gray-100 pb-3"
              >
                <span className="text-gray-700 font-medium">
                  {getCategoryName(key)}
                </span>
                <span className="text-gray-900 text-lg font-bold">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}