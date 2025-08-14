// src/pages/EditHomework.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const EditHomework = () => {
  const { gradeId, classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const snapshot = await getDocs(
          collection(db, `grades/${gradeId}/classes/${classId}/students`)
        );
        const data = snapshot.docs.map((docSnap) => {
          return {
            id: docSnap.id,
            ...docSnap.data(),
            homework: docSnap.data().homework || Array(11).fill(0),
          };
        });
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
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
              homework: stu.homework.map((val, i) =>
                i === index ? Math.min(Math.max(Number(value), 0), 1) : val
              ),
            }
          : stu
      )
    );
  };

  const handleSave = async (studentId) => {
    const student = students.find((stu) => stu.id === studentId);
    if (!student) return;
    
    try {
      const studentRef = doc(
        db,
        `grades/${gradeId}/classes/${classId}/students`,
        studentId
      );
      await updateDoc(studentRef, {
        homework: student.homework,
      });
      setSuccess(`تم حفظ درجات الواجبات للطالب ${student.name}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error saving homework:", error);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          تعديل درجات الواجبات
          <span className="block text-lg text-gray-600 mt-1">
            الصف {gradeId} - الفصل {classId}
          </span>
        </h2>
        
        {success && (
          <div className="mb-4 bg-green-100 border-l-4 border-green-500 p-4">
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم الطالب</th>
                {[...Array(10)].map((_, i) => (
                  <th key={i} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    واجب {i + 1}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المجموع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">حفظ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((stu) => {
                const totalHomework = stu.homework.slice(0, 10).reduce((a, b) => a + b, 0);
                return (
                  <tr key={stu.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stu.name}
                    </td>
                    {stu.homework.slice(0, 10).map((score, idx) => (
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