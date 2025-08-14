// src/pages/StudentGradesPublic.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const StudentGradesPublic = () => {
  const { studentId } = useParams();
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const docRef = doc(db, "students", studentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGrades({
            id: docSnap.id,
            ...docSnap.data(),
            grades: docSnap.data().grades || {}
          });
        } else {
          setError("لم يتم العثور على بيانات الطالب");
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
      <div className="text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ</h3>
      <p className="text-gray-600">{error}</p>
    </div>
  );

  if (!grades) return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد بيانات</h3>
      <p className="mt-1 text-gray-600">لم يتم تسجيل أي درجات بعد</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-primary text-white">
          <h1 className="text-2xl font-bold">درجات الطالب</h1>
          {grades.name && <p className="mt-1">{grades.name}</p>}
        </div>
        
        <div className="p-6">
          {Object.keys(grades.grades).length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد درجات مسجلة بعد</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(grades.grades).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {key === 'monthlyTest' && 'الاختبار الشهري'}
                    {key === 'finalTest' && 'الاختبار النهائي'}
                    {key === 'homework' && 'الواجبات'}
                    {key === 'participation' && 'المشاركة'}
                    {key === 'attendance' && 'الحضور'}
                    {!['monthlyTest', 'finalTest', 'homework', 'participation', 'attendance'].includes(key) && key}
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