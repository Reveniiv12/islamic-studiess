import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const StudentList = () => {
  const { gradeId, classId } = useParams();
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    id: '', 
    phone: '', 
    imageUrl: '' 
  });
  
  // الإضافات الجديدة:
  const [searchQuery, setSearchQuery] = useState('');
  const [transferClass, setTransferClass] = useState('');
  const [activeStudent, setActiveStudent] = useState(null);

  const handleAddStudent = async () => {
    const studentWithNewFields = {
      ...newStudent,
      // الحقول الجديدة:
      stars: 0,
      recitation: { status: 'not-recited', parts: [] },
      weeklyNotes: Array(16).fill(''),
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newStudent.id}`
    };
    
    const docRef = await addDoc(
      collection(db, `grades/${gradeId}/classes/${classId}/students`),
      studentWithNewFields
    );
    setStudents([...students, { id: docRef.id, ...studentWithNewFields }]);
    setNewStudent({ name: '', id: '', phone: '', imageUrl: '' });
  };

  // دالة نقل الطالب الجديدة:
  const handleTransfer = async () => {
    if (!activeStudent || !transferClass) return;
    
    // كود النقل هنا ...
    console.log(`نقل الطالب ${activeStudent} إلى الفصل ${transferClass}`);
    setActiveStudent(null);
    setTransferClass('');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">طلاب المرحلة: {gradeId} - الفصل: {classId}</h2>

      {/* إضافة شريط البحث الجديد */}
      <input
        type="text"
        placeholder="ابحث عن طالب..."
        className="w-full p-2 border rounded mb-4"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="mb-4 flex gap-2">
        {/* حقول إضافة طالب الأصلية تبقى كما هي */}
        <input
          type="text"
          placeholder="اسم الطالب"
          value={newStudent.name}
          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
          className="p-2 border rounded"
        />
        {/* ... باقي حقول الإدخال */}
        <button onClick={handleAddStudent} className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600">
          +
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {students.map((student, idx) => (
          <div key={idx} className="border rounded p-4 shadow hover:shadow-lg relative">
            
            {/* الإضافات الجديدة داخل بطاقة الطالب */}
            <div className="absolute top-2 left-2 flex gap-2">
              {/* نظام النجوم */}
              <div className="stars">
                {[...Array(10)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`cursor-pointer ${i < student.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => console.log(`تحديث نجوم الطالب ${student.id} إلى ${i+1}`)}
                  >
                    ★
                  </span>
                ))}
              </div>
              
              {/* زر الملاحظات */}
              <button 
                onClick={() => console.log(`فتح ملاحظات الطالب ${student.id}`)}
                className="text-gray-600 hover:text-blue-500"
              >
                📝
              </button>
            </div>

            {/* QR Code جديد */}
            {student.qrCode && (
              <img 
                src={student.qrCode} 
                alt="QR Code" 
                className="w-16 h-16 mx-auto mb-2" 
              />
            )}

            {/* معلومات الطالب الأصلية تبقى كما هي */}
            <img src={student.imageUrl} alt={student.name} className="w-16 h-16 object-cover rounded-full mb-2" />
            <h3 className="font-semibold">{student.name}</h3>
            <p>السجل: {student.id}</p>
            <p>التواصل: {student.phone}</p>

            {/* حالة التسميع الجديدة */}
            <div className={`mt-2 text-center text-sm p-1 rounded ${
              student.recitation?.status === 'completed' ? 'bg-green-100 text-green-800' :
              student.recitation?.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {student.recitation?.status === 'completed' ? 'مكتمل' :
               student.recitation?.status === 'delayed' ? 'متأخر' : 'لم يحفظ'}
            </div>

            {/* زر النقل الجديد */}
            <select
              value={activeStudent === student.id ? transferClass : ''}
              onChange={(e) => {
                setActiveStudent(student.id);
                setTransferClass(e.target.value);
              }}
              className="mt-2 w-full p-1 border rounded text-sm"
            >
              <option value="">اختر فصل للنقل...</option>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={`class${i+1}`}>الفصل {i+1}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* نافذة النقل الجديدة */}
      {activeStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">تأكيد نقل الطالب</h3>
            <p>هل تريد نقل الطالب إلى {transferClass}؟</p>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setActiveStudent(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                إلغاء
              </button>
              <button 
                onClick={handleTransfer}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                تأكيد النقل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;