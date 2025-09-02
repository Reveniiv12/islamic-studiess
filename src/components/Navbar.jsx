import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// لم يعد هناك حاجة إلى استدعاء signOut بشكل مستقل، فهو ضمن supabase.auth
import { FaSignOutAlt, FaHome } from "react-icons/fa";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر

const Navbar = () => {
    const navigate = useNavigate();
    const [teacherName, setTeacherName] = useState("المعلم");
    const [schoolName, setSchoolName] = useState("المدرسة");

    useEffect(() => {
        // Load teacher and school info from localStorage
        const savedTeacherName = localStorage.getItem("teacherName") || "المعلم";
        const savedSchoolName = localStorage.getItem("schoolName") || "المدرسة";
        setTeacherName(savedTeacherName);
        setSchoolName(savedSchoolName);
    }, []);

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut(); // تم تعديل هذا السطر
            if (error) {
                console.error("Logout Error:", error);
                alert("فشل تسجيل الخروج، الرجاء المحاولة مرة أخرى.");
            } else {
                navigate("/login"); // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
            }
        } catch (error) {
            console.error("Logout Error:", error);
            alert("فشل تسجيل الخروج، الرجاء المحاولة مرة أخرى.");
        }
    };

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg font-['Noto_Sans_Arabic',sans-serif]">
            {/* الجزء الأيمن الفارغ لدفع العناصر */}
            <div className="flex-1"></div>


            {/* الجزء الأيسر - الروابط والأزرار */}
            <div className="flex-1 flex justify-end items-center gap-4">
                <Link to="/teacher" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
                    <FaHome />
                    الرئيسية
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md"
                >
                    <FaSignOutAlt />
                    تسجيل خروج
                </button>
            </div>
        </nav>
    );
};

export default Navbar;