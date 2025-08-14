// src/AllStudentsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { gradesData } from "../data/mockData";
import SectionGrades from "./SectionGrades"; // نستفيد من المكون الأصلي

const AllStudentsPage = () => {
    const { gradeId } = useParams();
    const [allStudents, setAllStudents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // جمع كل الطلاب من جميع فصول الصف المحدد
        const grade = gradesData.find(g => g.id === gradeId);
        if (!grade) return;

        const students = [];
        grade.sections.forEach(section => {
            const storageKey = `grades_${gradeId}_${section}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                students.push(...JSON.parse(savedData));
            }
        });

        setAllStudents(students);
    }, [gradeId]);

    return (
        <SectionGrades 
            students={allStudents}
            gradeId={gradeId}
            sectionId="all" // لنستخدمها للتمييز في الواجهة
            onBack={() => navigate(`/grades/${gradeId}`)}
        />
    );
};

export default AllStudentsPage;