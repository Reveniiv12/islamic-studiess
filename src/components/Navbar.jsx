import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FaSignOutAlt, FaHome } from "react-icons/fa";

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
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout Error:", error);
            alert("فشل تسجيل الخروج، الرجاء المحاولة مرة أخرى.");
        }
    };

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg font-['Noto_Sans_Arabic',sans-serif]">
            {/* الجزء الأيمن الفارغ لدفع العناصر */}
            <div className="flex-1"></div>

            {/* الجزء الأوسط - اسم المدرسة والمعلم (في المنتصف) */}
            <div className="flex flex-col text-center">
                <span className="text-xl font-bold text-blue-400">{schoolName}</span>
                <span className="text-sm font-medium text-gray-400">{teacherName}</span>
            </div>

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
                    تسجيل الخروج
                </button>
            </div>
        </nav>
    );
};

export default Navbar;