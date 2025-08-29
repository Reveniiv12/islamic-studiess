// src/pages/EditHomework.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر

const EditHomework = () => {
  const { gradeId, classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        // جلب الطلاب من جدول 'students' بناءً على gradeId و classId
        const { data, error } = await supabase
          .from("students")
          .select("id, name, homework") // جلب فقط الأعمدة التي تحتاجها
          .eq("grade_id", gradeId)
          .eq("class_id", classId);

        if (error) {
          console.error("خطأ في جلب بيانات الطلاب:", error);
          return;
        }

        const studentList = data.map((student) => ({
          ...student,
          homework: student.homework || Array(11).fill(0),
        }));

        setStudents(studentList);
      } catch (error) {
        console.error("خطأ في جلب بيانات الطلاب:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [gradeId, classId]);

  const handleHomeworkChange = (studentId, index, value) => {
    setStudents((prev) =>
      prev.map((stu) =>
        stu.id === studentId
          ? {
              ...stu,
              homework: stu.homework.map((score, idx) =>
                idx === index ? Number(value) : score
              ),
            }
          : stu
      )
    );
  };

  const handleSave = async (studentId) => {
    try {
      const studentToSave = students.find((s) => s.id === studentId);
      if (!studentToSave) return;

      // تحديث حقل homework للطالب في قاعدة البيانات
      const { error } = await supabase
        .from("students")
        .update({ homework: studentToSave.homework })
        .eq("id", studentId);

      if (error) {
        console.error("خطأ في حفظ الواجبات:", error);
        return;
      }
      
      setSuccess("تم حفظ الواجبات بنجاح!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("خطأ في حفظ الواجبات:", error);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-['Noto_Sans_Arabic',sans-serif] text-right p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          تعديل درجات الواجبات
        </h1>

        {loading && <p className="text-center text-lg text-gray-600">جاري التحميل...</p>}
        {success && (
          <div className="bg-green-100 border-r-4 border-green-500 text-green-700 p-4 mb-4 rounded-md shadow">
            {success}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider"
                >
                  الاسم
                </th>
                {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => (
                  <th
                    key={num}
                    scope="col"
                    className="px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    واجب {num}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-6 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider text-center"
                >
                  المجموع
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">تعديل</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((stu) => {
                const totalHomework = stu.homework.reduce((sum, current) => sum + current, 0);

                return (
                  <tr key={stu.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stu.name}
                    </td>
                    {stu.homework.slice(0, 11).map((score, idx) => (
                      <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={1}
                          value={score}
                          onChange={(e) =>
                            handleHomeworkChange(stu.id, idx, e.target.value)
                          }
                          className="w-12 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-bold">
                      {totalHomework}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSave(stu.id)}
                        className="text-primary hover:text-secondary"
                      >
                        حفظ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EditHomework;