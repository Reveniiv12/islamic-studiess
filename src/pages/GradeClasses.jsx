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
      <h2 className="text-4xl font-extrabold text-blue-900 mb-8 text-center">
        الصف: {selectedGrade.name} - اختر الفصل
      </h2>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex flex-wrap gap-4">
            {selectedGrade.sections.map(section => (
              <Link
                key={section}
                to={`/grades/${gradeId}/sections/${section}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105 text-lg font-semibold text-center"
              >
                فصل {section}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeClasses;