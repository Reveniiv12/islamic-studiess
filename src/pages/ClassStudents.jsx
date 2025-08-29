import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid"; // تم إضافة هذا السطر لمفتاح العرض

export default function ClassStudents() {
  const { gradeId, classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  const [newStudent, setNewStudent] = useState({
    name: "",
    nationalId: "",
    phone: "",
    imageUrl: "",
    viewKey: ""
  });

  useEffect(() => {
    async function fetchStudents() {
      // قراءة البيانات من جدول واحد مع ربطها بالـ gradeId و classId
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('grade_id', gradeId) // استخدام .eq للبحث
        .eq('class_id', classId);

      if (error) {
        console.error("خطأ في جلب بيانات الطلاب:", error);
        return;
      }
      setStudents(data);
    }
    fetchStudents();
  }, [gradeId, classId]);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.nationalId) return;
    
    // إنشاء مفتاح العرض لكل طالب
    const viewKey = uuidv4();

    // إضافة البيانات إلى جدول الطلاب
    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          name: newStudent.name,
          national_id: newStudent.nationalId, // ملاحظة: يفضل snake_case
          phone: newStudent.phone,
          image_url: newStudent.imageUrl,
          view_key: viewKey,
          grade_id: gradeId, // ربط الطالب بالصف والمرحلة
          class_id: classId,
          grades: {} // إذا كان grades كائنًا
        }
      ]);

    if (error) {
      console.error("خطأ في إضافة الطالب:", error);
      return;
    }
    
    // تحديث قائمة الطلاب بعد الإضافة
    setStudents(prevStudents => [...prevStudents, data[0]]);
    setNewStudent({
      name: "",
      nationalId: "",
      phone: "",
      imageUrl: "",
      viewKey: ""
    });
  };

  const goToStudent = (studentId) => {
    navigate(`/grades/${gradeId}/sections/${classId}/students/${studentId}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">طلاب الفصل</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="p-4 border rounded shadow hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            onClick={() => goToStudent(student.id)}
          >
            {/* مربع QR Code إذا كان موجود */}
            {student.view_key ? ( // تم تغيير viewKey إلى view_key
              <div className="w-12 h-12 bg-white p-1 rounded-lg flex-shrink-0">
                <QRCode
                  value={`${window.location.origin}/student-grades/${student.view_key}`} // تم تغيير viewKey إلى view_key
                  size={40}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex-shrink-0"></div>
            )}

            {/* بيانات الطالب */}
            <div>
              <p className="font-semibold">{student.name}</p>
              <p className="text-sm text-gray-500">
                السجل المدني: {student.national_id} {/* تم تغيير nationalId إلى national_id */}
              </p>

              {/* رابط صفحة الطالب إذا كان فيه viewKey */}
              {student.view_key && ( // تم تغيير viewKey إلى view_key
                <a
                  href={`${window.location.origin}/student-grades/${student.view_key}`} // تم تغيير viewKey إلى view_key
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  الدخول لصفحة الطالب
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* هنا يمكنك إضافة فورم إضافة طالب جديد باستخدام handleAddStudent */}
      {/* <button onClick={handleAddStudent}>إضافة طالب جديد</button> */}
    </div>
  );
}