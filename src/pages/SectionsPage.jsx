// src/SectionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { FaGraduationCap, FaArrowRight } from 'react-icons/fa';

const SectionsPage = () => {
    const { gradeId } = useParams();
    const navigate = useNavigate();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const gradesRef = collection(db, "grades");
        const q = query(gradesRef, orderBy("name"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const gradesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGrades(gradesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching grades: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const selectedGrade = grades.find(grade => grade.id === gradeId);

    if (loading) {
        return (
            <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">
                <p className="text-xl">جاري تحميل الفصول...</p>
            </div>
        );
    }

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
                    <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                        فصول الصف {selectedGrade.name}
                    </h1>
                </div>
            </header>
            <div className="max-w-7xl mx-auto">
                <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg border border-gray-700">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
