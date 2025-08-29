// src/pages/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // تم تعديل هذا السطر
import { FaUserCircle, FaPlus, FaSearch } from 'react-icons/fa';

const StudentList = () => {
    const { gradeId, sectionId } = useParams();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStudent, setNewStudent] = useState({
        name: '',
        id: '',
        phone: '',
        imageUrl: '',
        grade_id: gradeId, // إضافة حقول جديدة
        section: sectionId, // إضافة حقول جديدة
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [message, setMessage] = useState('');
    const [activeStudent, setActiveStudent] = useState(null);
    const [transferClass, setTransferClass] = useState('');

    // دالة لجلب الطلاب من Supabase
    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('section', sectionId)
            .order('name', { ascending: true }); // ترتيب حسب الاسم

        if (error) {
            console.error("Error fetching students:", error);
        } else {
            setStudents(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        // جلب الطلاب عند تحميل المكون لأول مرة
        fetchStudents();
        
        // الاشتراك في التغييرات اللحظية
        const channel = supabase
            .channel('students_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'students',
                    filter: `grade_id=eq.${gradeId}&section=eq.${sectionId}`
                },
                () => {
                    fetchStudents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gradeId, sectionId]);

    const handleAddStudent = async () => {
        if (!newStudent.name || !newStudent.id) {
            setMessage("الرجاء إدخال اسم ورقم السجل المدني.");
            return;
        }

        try {
            const { error } = await supabase
                .from('students')
                .insert({
                    name: newStudent.name,
                    national_id: newStudent.id,
                    phone: newStudent.phone,
                    image_url: newStudent.imageUrl,
                    grade_id: gradeId,
                    section: sectionId
                });

            if (error) {
                console.error("Error adding student:", error);
                setMessage("حدث خطأ أثناء إضافة الطالب.");
            } else {
                setMessage("تم إضافة الطالب بنجاح!");
                setNewStudent({ name: '', id: '', phone: '', imageUrl: '', grade_id: gradeId, section: sectionId });
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setMessage("حدث خطأ غير متوقع.");
        }
    };
    
    const handleDeleteStudent = async (studentId) => {
        try {
          const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', studentId);
            
            if (error) {
                console.error("Error deleting student:", error);
                setMessage("فشل حذف الطالب.");
            } else {
                setMessage("تم حذف الطالب بنجاح!");
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setMessage("حدث خطأ غير متوقع.");
        }
    };
    
    const handleTransfer = async () => {
        if (!activeStudent || !transferClass) {
            return;
        }

        try {
            const { error } = await supabase
                .from('students')
                .update({ section: transferClass })
                .eq('id', activeStudent);

            if (error) {
                console.error("Error transferring student:", error);
                setMessage("فشل نقل الطالب.");
            } else {
                setMessage(`تم نقل الطالب بنجاح إلى ${transferClass}!`);
                setActiveStudent(null);
                setTransferClass('');
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setMessage("حدث خطأ غير متوقع.");
        }
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (student.id && student.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-900 font-['Noto_Sans_Arabic',sans-serif] text-white p-8">
            <h1 className="text-3xl font-bold mb-6 text-center">طلاب صف {gradeId} - فصل {sectionId}</h1>

            {message && (
              <div className="bg-blue-600 text-white p-3 rounded-md text-center mb-4 transition-all duration-300">
                {message}
              </div>
            )}
            
            <div className="max-w-4xl mx-auto space-y-8">
                {/* قسم إضافة طالب جديد */}
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaPlus />
                        إضافة طالب جديد
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="اسم الطالب"
                                value={newStudent.name}
                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                className="w-full p-2 rounded-md bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="رقم السجل المدني"
                                value={newStudent.id}
                                onChange={(e) => setNewStudent({ ...newStudent, id: e.target.value })}
                                className="w-full p-2 rounded-md bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddStudent}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        إضافة الطالب
                    </button>
                </div>
                
                {/* قسم البحث */}
                <div className="relative">
                    <FaSearch className="absolute right-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ابحث عن طالب..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pr-10 rounded-lg bg-gray-800 text-white border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {loading ? (
                    <p className="text-center text-blue-400">جاري تحميل الطلاب...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map(student => (
                            <div key={student.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-start space-y-4">
                                <FaUserCircle className="text-5xl text-blue-400 self-center" />
                                <h3 className="text-lg font-semibold text-white truncate w-full text-right">
                                    {student.name}
                                </h3>
                                <p className="text-sm text-gray-400 text-right">
                                    السجل المدني: {student.national_id}
                                </p>
                                <div className="flex w-full justify-between items-center mt-auto pt-4 border-t border-gray-700">
                                    <Link
                                        to={`/grades/${gradeId}/sections/${sectionId}/students/${student.id}`}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        عرض الدرجات
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteStudent(student.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;