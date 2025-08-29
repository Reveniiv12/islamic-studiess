// src/pages/EditGradesByCategory.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر

const EditGradesByCategory = () => {
  const { grade, classNumber, category } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // قراءة الطلاب من جدول واحد مع ربطهم بـ grade و classNumber
        const { data, error } = await supabase
          .from("students")
          .select("id, name, grades") // جلب فقط الأعمدة التي تحتاجها
          .eq("grade_id", grade) // البحث بناءً على grade_id
          .eq("class_id", classNumber); // البحث بناءً على class_id

        if (error) {
          console.error("Error fetching students:", error);
          return;
        }

        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [grade, classNumber]);

  const handleChange = async (id, value) => {
    try {
      // Supabase لا يدعم تحديث جزء من JSON بشكل مباشر مثل 
      // الحل هو قراءة السجل أولاً، تعديل الكائن، ثم تحديثه بالكامل
      const { data: currentStudent, error: fetchError } = await supabase
        .from('students')
        .select('grades')
        .eq('id', id)
        .single();

      if (fetchError || !currentStudent) {
          console.error("Error fetching current student data:", fetchError);
          return;
      }

      // تعديل كائن grades
      const updatedGrades = {
          ...currentStudent.grades,
          [category]: Number(value),
      };

      // تحديث السجل في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('students')
        .update({ grades: updatedGrades })
        .eq('id', id);

      if (updateError) {
        console.error("Error updating grades:", updateError);
        return;
      }
      
      setSuccess("تم حفظ التغييرات بنجاح!");
      setTimeout(() => setSuccess(""), 3000);

      // تحديث حالة الواجهة (UI) على الفور
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === id ? { ...student, grades: updatedGrades } : student
        )
      );

    } catch (error) {
      console.error("Error updating grades:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">
        تعديل درجات الطلاب: {category}
      </h1>
      {loading && <p>جاري التحميل...</p>}
      {success && (
        <div className="rounded-md bg-green-100 border-l-4 border-green-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {students.map(student => (
          <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <span className="font-semibold">{student.name}</span>
            <input
              type="number"
              value={student.grades?.[category] || ""}
              onChange={(e) => handleChange(student.id, e.target.value)}
              className="w-24 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EditGradesByCategory;