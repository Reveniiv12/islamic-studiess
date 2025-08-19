// src/SectionsPage.jsx
 import React from 'react';
 import { useParams, Link, useNavigate } from 'react-router-dom';
 import { gradesData } from '../data/mockData';
 import { FaGraduationCap, FaArrowRight } from 'react-icons/fa';
 
 const SectionsPage = () => {
     const { gradeId } = useParams();
     const navigate = useNavigate();
     const selectedGrade = gradesData.find(grade => grade.id === gradeId);
 
     if (!selectedGrade) {
         return (
             <div className="p-8 text-center text-red-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
                 <p className="text-xl">لم يتم العثور على الصف.</p>
             </div>
         );
     }
 
     return (
         <div className="p-4 md:p-8 font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen">
             <header className="bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center">
                 <div className="flex flex-col items-center gap-2 md:gap-4 mb-4 md:mb-0">
                     <FaGraduationCap className="text-4xl md:text-5xl text-blue-400" />
                     <h1 className="text-xl md:text-3xl font-extrabold text-blue-400">
                         اختر فصلاً
                     </h1>
                     <p className="text-sm md:text-lg font-medium text-gray-400">
                         الصف: {selectedGrade.name}
                     </p>
                 </div>
             </header>
 
             <div className="max-w-6xl mx-auto">
                 <div className="bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-700">
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                         
                         {/* الفصول الحالية */}
                         {selectedGrade.sections.map(section => (
                             <Link
                                 key={section}
                                 to={`/grades/${gradeId}/sections/${section}`}
                                 className="block p-4 md:p-6 bg-gray-700 text-blue-400 rounded-xl shadow-md hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 text-lg md:text-xl font-bold text-center border border-gray-600"
                             >
                                 فصل {section}
                             </Link>
                         ))}
                     </div>
                     {/* زر الرجوع أسفل الفصول */}
                     <div className="flex justify-center mt-6">
                         <button
                             onClick={() => navigate(-1)}
                             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
                         >
                             <FaArrowRight /> رجوع
                         </button>
                     </div>
                 </div>
             </div>
         </div>
     );
 };
 
 export default SectionsPage;