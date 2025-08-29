// src/pages/StudentGradesPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر

const StudentGradesPublic = () => {
  const { studentId } = useParams();
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, name, grades")
          .eq("id", studentId)
          .single();

        if (error || !data) {
          console.error("Error fetching student data:", error);
          setError("لم يتم العثور على بيانات الطالب");
        } else {
          setGrades({
            id: data.id,
            name: data.name,
            grades: data.grades || {}
          });
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
        setError("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [studentId]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif]">
      <p className="text-xl">{error}</p>
    </div>
  );
  
  // دالة مساعدة لترجمة الفئات
  const getCategoryName = (key) => {
    switch (key) {
      case 'monthlyTest':
        return 'الاختبار الشهري';
      case 'finalTest':
        return 'الاختبار النهائي';
      case 'homework':
        return 'الواجبات';
      case 'participation':
        return 'المشاركة';
      case 'attendance':
        return 'الحضور';
      default:
        return key;
    }
  };

  return (
    <div className="bg-white min-h-screen font-['Noto_Sans_Arabic',sans-serif] p-8">
      <div className="max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-6 text-center">
          <h1 className="text-3xl font-bold">درجات الطالب</h1>
          {grades && <p className="mt-1">{grades.name}</p>}
        </div>
        
        <div className="p-6">
          {Object.keys(grades.grades).length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد درجات مسجلة بعد</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(grades.grades).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {getCategoryName(key)}
                  </h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-3xl font-bold text-primary">{value}</span>
                    {typeof value === 'number' && (
                      <span className="ml-2 text-sm text-gray-500">/100</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGradesPublic;