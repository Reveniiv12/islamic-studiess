// src/components/StarsModal.jsx

import React, { useState } from 'react';
import { FaStar, FaSave, FaTimes } from 'react-icons/fa';

const StarsModal = ({ students, onClose, onSave }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudentsSelected, setAllStudentsSelected] = useState(false);
  const [stars, setStars] = useState(1);

  // تحديد/إلغاء تحديد جميع الطلاب
  const toggleSelectAll = () => {
    if (allStudentsSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
    setAllStudentsSelected(!allStudentsSelected);
  };

  // تحديد/إلغاء تحديد طالب معين
  const toggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // حفظ النجوم للطلاب المحددين
  const saveStars = () => {
    if (selectedStudents.length === 0) {
      alert("يرجى اختيار الطلاب أولاً.");
      return;
    }

    const updatedStudents = students.map(student => {
      if (selectedStudents.includes(student.id)) {
        // إضافة النجوم الجديدة إلى النجوم الموجودة، مع الحد الأقصى 10
        const currentStars = student.stars || 0;
        const newStarsTotal = Math.min(currentStars + stars, 10);
        return {
          ...student,
          stars: newStarsTotal
        };
      }
      return student;
    });

    onSave(updatedStudents);
    setSelectedStudents([]);
    setAllStudentsSelected(false);
    setStars(1);
  };

  const isSaveDisabled = () => {
    return selectedStudents.length === 0 || stars < 1;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <h3 className="text-xl font-bold text-gray-100">إدارة النجوم</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold text-gray-100 mb-4">منح النجوم للطلاب</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">عدد النجوم</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={stars}
                    onChange={(e) => setStars(Number(e.target.value))}
                    className="w-20 p-2 border border-gray-600 rounded-lg text-center text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <span className="text-yellow-400 text-2xl"><FaStar /></span>
                </div>
              </div>
              <button
                onClick={saveStars}
                className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isSaveDisabled() ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
                disabled={isSaveDisabled()}
              >
                <FaSave />
                منح النجوم
              </button>
            </div>

            <div className="bg-gray-700 p-5 rounded-xl shadow-md border border-gray-600">
              <h4 className="font-semibold text-gray-100 mb-4">الطلاب</h4>
              <div className="flex items-center mb-4 pb-2 border-b border-gray-600">
                <input
                  type="checkbox"
                  checked={allStudentsSelected}
                  onChange={toggleSelectAll}
                  className="accent-blue-500 ml-2"
                />
                <label className="font-semibold text-gray-300">تحديد الكل</label>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map(student => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedStudents.includes(student.id) ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        readOnly
                        className="accent-blue-500 ml-2"
                      />
                      <span className="text-gray-100">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-yellow-400 font-bold">{student.stars || 0}</span>
                       <FaStar className="text-yellow-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors font-semibold">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarsModal;