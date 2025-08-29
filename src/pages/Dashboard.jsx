import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient"; // تم تعديل هذا السطر
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // بيانات الطالب عند الدخول (لعرض درجاته)
  const [studentGrades, setStudentGrades] = useState(null);

  // جلب دور المستخدم (teacher أو student)
useEffect(() => {
  if (!loading && user) {
    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error || !data) {
        setRole("student");
      } else {
        setRole(data.role);
      }
    };
    fetchRole();
  }
}, [loading, user]);

  // جلب بيانات الطلاب والمدرسة
  useEffect(() => {
    if (role === "teacher" && user) {
      const fetchStudents = async () => {
        // قراءة الطلاب بناءً على teacher_id
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("teacher_id", user.id);

        if (error) {
          console.error("خطأ في جلب بيانات الطلاب:", error);
          setGradesLoading(false);
          return;
        }

        setStudents(data);
        setGradesLoading(false);
      };
      fetchStudents();
    } else if (role === "student" && user) {
      const fetchStudentData = async () => {
        // قراءة بيانات طالب بناءً على user_id
        const { data, error } = await supabase
          .from("students")
          .select("grades")
          .eq("user_id", user.id)
          .single();
        
        if (error || !data) {
          console.error("خطأ في جلب درجات الطالب:", error);
        } else {
          setStudentGrades(data.grades);
        }
        setGradesLoading(false);
      };
      fetchStudentData();
    }
  }, [role, user]);

  // تحديث الدرجات
  const handleSaveGrades = async (studentId) => {
    const studentToUpdate = students.find((s) => s.id === studentId);
    if (!studentToUpdate) return;
    try {
      const { error } = await supabase
        .from("students")
        .update({ grades: studentToUpdate.grades })
        .eq("id", studentId);

      if (error) {
        console.error("خطأ في حفظ الدرجات:", error);
        alert("فشل حفظ الدرجات، حاول مرة أخرى.");
        return;
      }
      alert("تم حفظ الدرجات بنجاح!");
    } catch (error) {
      console.error("خطأ في حفظ الدرجات:", error);
      alert("فشل حفظ الدرجات، حاول مرة أخرى.");
    }
  };

  // حذف طالب
  const handleDeleteStudent = async (studentId) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) {
        console.error("خطأ في حذف الطالب:", error);
        alert("فشل حذف الطالب، حاول مرة أخرى.");
        return;
      }

      setStudents(students.filter((stud) => stud.id !== studentId));
      alert("تم حذف الطالب بنجاح!");
    } catch (error) {
      console.error("خطأ في حذف الطالب:", error);
      alert("فشل حذف الطالب، حاول مرة أخرى.");
    }
  };

  // بقية دوال الكود
  const handleGradeChange = (studentId, field, value) => {
    setStudents(
      students.map((stud) => {
        if (stud.id === studentId) {
          return {
            ...stud,
            grades: { ...stud.grades, [field]: parseFloat(value) || 0 },
          };
        }
        return stud;
      })
    );
  };

  const handleCreateStudentAccount = async () => {
    if (!newStudentEmail) {
      setError("الرجاء إدخال بريد إلكتروني.");
      return;
    }
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newStudentEmail,
        password: "password123", // يمكن تغيير كلمة المرور هذه لتكون أكثر أمانًا
        options: {
          data: {
            role: "student",
          },
        },
      });

      if (error) {
        setError(`خطأ: ${error.message}`);
      } else {
        alert("تم إنشاء حساب الطالب بنجاح!");
        setNewStudentEmail("");
      }
    } catch (error) {
      setError("حدث خطأ غير متوقع.");
      console.error("Signup error:", error);
    }
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h1>لوحة التحكم</h1>
      {loading ? (
        <p>جاري التحميل...</p>
      ) : (
        <>
          {role === "teacher" && (
            <>
              <h2>حساب المعلم</h2>
              <p>مرحباً بك، المعلم!</p>

              <h3>إضافة حساب طالب</h3>
              <input
                type="email"
                placeholder="بريد إلكتروني للطالب"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
              />
              <button onClick={handleCreateStudentAccount}>
                إنشاء حساب طالب
              </button>
              {error && <p style={{ color: "red" }}>{error}</p>}
              
              <hr style={{ margin: "20px 0" }} />
              
              <h3>درجات الطلاب</h3>
              {gradesLoading ? (
                <p>جاري تحميل الدرجات...</p>
              ) : (
                <table border="1" cellPadding="8" style={{ marginTop: 20, width: "100%" }}>
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>الرقم الوطني</th>
                      <th>الاختبار الشهري</th>
                      <th>الاختبار النهائي</th>
                      <th>الواجبات</th>
                      <th>المشاركة</th>
                      <th>الحضور والغياب</th>
                      <th>العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stud) => (
                      <tr key={stud.id}>
                        <td>{stud.name}</td>
                        <td>{stud.national_id}</td>
                        {["monthlyTest", "finalTest", "homework", "participation", "attendance"].map((field) => (
                          <td key={field}>
                            <input
                              type="number"
                              value={stud.grades[field] || ""}
                              onChange={(e) => handleGradeChange(stud.id, field, e.target.value)}
                              style={{ width: 60 }}
                            />
                          </td>
                        ))}
                        <td>
                          <button onClick={() => handleSaveGrades(stud.id)}>حفظ</button>
                          <button onClick={() => handleDeleteStudent(stud.id)} style={{ marginLeft: 10 }}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
          
          {role === "student" && (
            <>
              <h3>درجاتك</h3>
              {!studentGrades ? (
                <p>لا توجد بيانات درجات</p>
              ) : (
                <table border="1" cellPadding="8" style={{ marginTop: 20, width: "100%" }}>
                  <tbody>
                    <tr>
                      <th>الاختبار الشهري</th>
                      <td>{studentGrades.monthlyTest || 0}</td>
                    </tr>
                    <tr>
                      <th>الاختبار النهائي</th>
                      <td>{studentGrades.finalTest || 0}</td>
                    </tr>
                    <tr>
                      <th>الواجبات</th>
                      <td>{studentGrades.homework || 0}</td>
                    </tr>
                    <tr>
                      <th>المشاركة</th>
                      <td>{studentGrades.participation || 0}</td>
                    </tr>
                    <tr>
                      <th>الحضور والغياب</th>
                      <td>{studentGrades.attendance || 0}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}