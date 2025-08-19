// src/components/HomeworkReport.jsx

import React from 'react';
import { calculateAverage, determinePerformanceLevel } from '../utils/gradeUtils';
import { isDateLate } from '../utils/dateUtils'; // تم تحديث مسار الاستيراد

const getHomeworkStatus = (homework, allGrades) => {
  const gradesForHomework = allGrades.filter(grade => grade.homeworkId === homework.id);
  
  if (gradesForHomework.length > 0) {
    return 'تم الحل';
  }
  
  if (isDateLate(homework.dueDate)) {
    return 'متأخر';
  }
  
  return 'لم يحل';
};

const HomeworkReport = ({ homeworks, grades }) => {
  const allScores = grades.map(g => g.score);
  const averageScore = calculateAverage(allScores);
  const performanceLevel = determinePerformanceLevel(averageScore);

  const stats = homeworks.reduce((acc, hw) => {
    const status = getHomeworkStatus(hw, grades);
    if (status === 'تم الحل') acc.solved++;
    else if (status === 'متأخر') acc.late++;
    else acc.unsolved++;
    return acc;
  }, { solved: 0, late: 0, unsolved: 0 });

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
      <h3 className="text-2xl font-bold text-gray-100 mb-4">تقرير الواجبات والمهام</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-green-600 rounded-lg p-4 text-white">
          <p className="text-4xl font-bold">{stats.solved}</p>
          <p className="text-sm">واجب محلول</p>
        </div>
        <div className="bg-red-600 rounded-lg p-4 text-white">
          <p className="text-4xl font-bold">{stats.late}</p>
          <p className="text-sm">واجب متأخر</p>
        </div>
        <div className="bg-yellow-500 rounded-lg p-4 text-white">
          <p className="text-4xl font-bold">{stats.unsolved}</p>
          <p className="text-sm">واجب لم يحل</p>
        </div>
      </div>
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold text-gray-100 mb-2">ملخص الأداء العام</h4>
        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <div>
            <p><strong>المتوسط:</strong> {averageScore.toFixed(2)}</p>
          </div>
          <div>
            <p><strong>مستوى الأداء:</strong> <span className="font-bold">{performanceLevel}</span></p>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-bold text-gray-100 mb-2">قائمة الواجبات</h4>
        <div className="space-y-2">
          {homeworks.length > 0 ? (
            homeworks.map(hw => {
              const status = getHomeworkStatus(hw, grades);
              const gradesForHomework = grades.filter(g => g.homeworkId === hw.id);
              const homeworkAverage = calculateAverage(gradesForHomework.map(g => g.score));
              
              return (
                <div key={hw.id} className="p-4 bg-gray-700 rounded-xl shadow-sm border border-gray-600">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-gray-100">{hw.title}</p>
                    <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                      status === 'تم الحل' ? 'bg-green-500' :
                      status === 'متأخر' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>تاريخ التسليم: {hw.dueDate}</p>
                    {gradesForHomework.length > 0 && (
                      <p>متوسط الدرجات: {homeworkAverage.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-center">لم يتم إضافة أي واجبات بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkReport;