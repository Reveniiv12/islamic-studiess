// src/GradeClasses.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { gradesData } from '../data/mockData'; // استيراد البيانات

const GradeClasses = () => {
  const { gradeId } = useParams();
  const selectedGrade = gradesData.find(grade => grade.id === gradeId);

  if (!selectedGrade) {
    return (
      <div className="p-8 text-center text-red-500">
        لم يتم العثور على الصف.
      </div>
    );
  }

  return (
    <div className="p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-extrabold text-blue-900 mb-6">
        الفصول الدراسية لصف {selectedGrade.name}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedGrade.sections.map(section => (
          <Link
            key={section.id}
            to={`/grades/${gradeId}/${section.id}`}
            className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {section.name}
            </h3>
            <p className="text-gray-600">
              عدد الطلاب: {section.studentCount}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GradeClasses;