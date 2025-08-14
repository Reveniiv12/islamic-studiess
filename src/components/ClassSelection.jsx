// src/components/ClassSelection.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ClassSelection = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();

  const handleClassClick = (classNumber) => {
    navigate(`/grade/${gradeId}/class/${classNumber}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-center">اختر الفصل</h2>
      <div className="grid grid-cols-5 gap-4">
        {[...Array(10)].map((_, idx) => (
          <div
            key={idx}
            onClick={() => handleClassClick(idx + 1)}
            className="bg-green-500 text-white p-4 rounded-lg text-center cursor-pointer hover:bg-green-600"
          >
            فصل/{idx + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSelection;
