import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const EditParticipation = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError('');
        
        // جلب بيانات الطلاب من مجموعة 'students' في Firestore
        const querySnapshot = await getDocs(collection(db, 'students'));
        
        const studentsList = querySnapshot.docs.map(doc => {
          const studentData = doc.data();
          
          // إذا لم توجد بيانات المشاركة، ننشئ مصفوفة جديدة بقيم صفرية
          if (!studentData.participation) {
            studentData.participation = Array(11).fill(0);
          } else if (studentData.participation.length < 11) {
            // إذا كانت المصفوفة موجودة ولكنها غير مكتملة، نكملها بقيم صفرية
            const newParticipation = [...studentData.participation];
            while (newParticipation.length < 11) {
              newParticipation.push(0);
            }
            studentData.participation = newParticipation;
          }
          
          return { 
            id: doc.id, 
            ...studentData 
          };
        });
        
        setStudents(studentsList);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('حدث خطأ أثناء جلب بيانات الطلاب');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleChange = async (studentId, value, index) => {
    try {
 // التحقق من أن القيمة رقمية وتقع بين 0 و1
    const numericValue = Math.min(Math.max(parseInt(value) || 0, 0), 1); // تم تصحيح الأقواس هنا
      
      // تحديث حالة الطلاب المحلية
      setStudents(prevStudents => 
        prevStudents.map(student => {
          if (student.id === studentId) {
            const newParticipation = [...student.participation];
            newParticipation[index] = numericValue;
            
            // حساب المجموع التلقائي (الخانة 10)
            if (index < 10) {
              const sum = newParticipation.slice(0, 10).reduce((a, b) => a + b, 0);
              newParticipation[10] = sum;
            }
            
            return { ...student, participation: newParticipation };
          }
          return student;
        })
      );
      
      // العثور على الطالب المحدث
      const updatedStudent = students.find(s => s.id === studentId);
      if (!updatedStudent) return;
      
      // تحديث Firestore
      await updateDoc(doc(db, 'students', studentId), {
        participation: updatedStudent.participation
      });
      
      setSuccess('تم تحديث المشاركة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating participation:', err);
      setError('حدث خطأ أثناء تحديث المشاركة');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">تعديل درجات المشاركة</h1>
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            <p>{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {students.map(student => (
            <div key={student.id} className="border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold text-lg mb-3 text-gray-800">{student.name}</h2>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {student.participation.map((score, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 mb-1">
                      {idx < 10 ? `مشاركة ${idx + 1}` : 'المجموع'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={idx < 10 ? "1" : "10"}
                      value={score}
                      onChange={(e) => handleChange(student.id, e.target.value, idx)}
                      className={`w-full px-2 py-1 border rounded text-center ${
                        idx === 10 ? 'bg-gray-100 font-bold' : ''
                      }`}
                      readOnly={idx === 10}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditParticipation;