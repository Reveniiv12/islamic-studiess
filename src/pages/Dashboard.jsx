// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
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
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [error, setError] = useState("");

  // بيانات الطالب عند الدخول (لعرض درجاته)
  const [studentGrades, setStudentGrades] = useState(null);

  // جلب دور المستخدم (teacher أو student)
  useEffect(() => {
    if (!loading && user) {
      const fetchRole = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        } else {
          setRole("student"); // افتراضياً طالب لو ما فيه بيانات
        }
      };
      fetchRole();
    }
  }, [loading, user]);

  // جلب بيانات الطلاب والمدرسة
  useEffect(() => {
    if (role === "teacher") {
      const fetchStudents = async () => {
        setGradesLoading(true);
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const querySnapshot = await getDocs(q);
        let studentsArr = [];
        querySnapshot.forEach((doc) => {
          studentsArr.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentsArr);
        setGradesLoading(false);
      };
      fetchStudents();
    } else if (role === "student") {
      // جلب درجات الطالب الحالي
      const fetchStudentGrades = async () => {
        setGradesLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStudentGrades(docSnap.data().grades || null);
        }
        setGradesLoading(false);
      };
      fetchStudentGrades();
    }
  }, [role, user]);

  // إضافة طالب جديد (بريد فقط)
  const handleAddStudent = async () => {
    setError("");
    if (!newStudentEmail.includes("@")) {
      setError("أدخل بريد إلكتروني صحيح");
      return;
    }

    try {
      // تحقق أن الطالب ليس موجوداً مسبقاً
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newStudentEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError("الطالب موجود مسبقاً");
        return;
      }

      // إنشاء حساب طالب جديد في قاعدة البيانات (لا يشمل تسجيل دخول Firebase Auth، يحتاج تسجيل لاحق)
      // قم بإنشاء مستند جديد للبريد هذا (مع بيانات افتراضية)
      await setDoc(doc(db, "users", newStudentEmail), {
        email: newStudentEmail,
        role: "student",
        grades: {
          monthlyTest: 0,
          finalTest: 0,
          homework: 0,
          participation: 0,
          attendance: 0,
        },
      });

      setNewStudentEmail("");
      // تحديث قائمة الطلاب
      setStudents((prev) => [...prev, {
        id: newStudentEmail,
        email: newStudentEmail,
        role: "student",
        grades: {
          monthlyTest: 0,
          finalTest: 0,
          homework: 0,
          participation: 0,
          attendance: 0,
        },
      }]);
    } catch (err) {
      setError("خطأ في إضافة الطالب: " + err.message);
    }
  };

  // تحديث درجات طالب (للمدرس فقط)
  const handleGradeChange = (studentId, field, value) => {
    setStudents((prevStudents) =>
      prevStudents.map((stud) =>
        stud.id === studentId
          ? {
              ...stud,
              grades: {
                ...stud.grades,
                [field]: Number(value),
              },
            }
          : stud
      )
    );
  };

  // حفظ التعديلات للطالب (للمدرس فقط)
  const handleSaveGrades = async (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    try {
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, {
        grades: student.grades,
      });
      alert("تم حفظ الدرجات");
    } catch (err) {
      alert("خطأ في حفظ الدرجات: " + err.message);
    }
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  if (loading || gradesLoading) return <p>جاري التحميل...</p>;
  if (!user) return <p>يجب تسجيل الدخول.</p>;

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h2>مرحباً، {user.email}</h2>
      <button onClick={handleLogout}>تسجيل خروج</button>

      {role === "teacher" && (
        <>
          <h3>قائمة الطلاب</h3>
          <input
            type="email"
            placeholder="أدخل بريد الطالب لإضافته"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
          />
          <button onClick={handleAddStudent}>إضافة طالب</button>
          {error && <p style={{ color: "red" }}>{error}</p>}

          {students.length === 0 ? (
            <p>لا يوجد طلاب</p>
          ) : (
            <table border="1" cellPadding="8" style={{ marginTop: 20, width: "100%" }}>
              <thead>
                <tr>
                  <th>البريد</th>
                  <th>الاختبار الشهري</th>
                  <th>الاختبار النهائي</th>
                  <th>الواجبات</th>
                  <th>المشاركة</th>
                  <th>الحضور والغياب</th>
                  <th>حفظ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stud) => (
                  <tr key={stud.id}>
                    <td>{stud.email}</td>
                    {["monthlyTest", "finalTest", "homework", "participation", "attendance"].map((field) => (
                      <td key={field}>
                        <input
                          type="number"
                          value={stud.grades?.[field] || 0}
                          onChange={(e) => handleGradeChange(stud.id, field, e.target.value)}
                          style={{ width: 60 }}
                        />
                      </td>
                    ))}
                    <td>
                      <button onClick={() => handleSaveGrades(stud.id)}>حفظ</button>
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
    </div>
  );
}
