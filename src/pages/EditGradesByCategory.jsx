// src/pages/EditGradesByCategory.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

const EditGradesByCategory = () => {
  const { grade, classNumber, category } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const studentsRef = collection(db, "grades", grade, classNumber, "students");
        const querySnapshot = await getDocs(studentsRef);
        const studentList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentList);
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
      const studentRef = doc(db, "grades", grade, classNumber, "students", id);
      await updateDoc(studentRef, {
        [`grades.${category}`]: Number(value)
      });
      
      setSuccess('تم تحديث الدرجات بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error updating grade:", error);
    }
  };

  const getCategoryName = () => {
    switch(category) {
      case 'monthlyTest': return 'الاختبار الشهري';
      case 'finalTest': return 'الاختبار النهائي';
      case 'homework': return 'الواجبات';
      case 'participation': return 'المشاركة';
      case 'attendance': return 'الحضور';
      default: return category;
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
          تحرير درجات: {getCategoryName()}
          <span className="block text-lg text-gray-600 mt-1">
            الصف {grade} - الفصل {classNumber}
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

        <div className="space-y-4">
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <span className="font-medium">{student.name}</span>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue={student?.grades?.[category] || 0}
                onBlur={(e) => handleChange(student.id, e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditGradesByCategory;