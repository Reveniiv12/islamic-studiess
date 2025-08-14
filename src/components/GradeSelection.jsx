// src/components/GradeSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const grades = [
  { name: 'أول متوسط', id: 'first' },
  { name: 'ثاني متوسط', id: 'second' },
  { name: 'ثالث متوسط', id: 'third' }
];

const GradeSelection = () => {
  const navigate = useNavigate();

  const handleClick = (gradeId) => {
    navigate(`/grade/${gradeId}`);
  };

  return (
    <div className="flex justify-center gap-6">
      {grades.map((grade) => (
        <div
          key={grade.id}
          onClick={() => handleClick(grade.id)}
          className="bg-blue-500 text-white px-8 py-6 rounded-xl cursor-pointer hover:bg-blue-600 text-xl shadow-md"
        >
          {grade.name}
        </div>
      ))}
    </div>
  );
};

export default GradeSelection;
