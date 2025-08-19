import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import QRCode from "react-qr-code";

export default function ClassStudents() {
  const { gradeId, classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  const [newStudent, setNewStudent] = useState({
    name: "",
    nationalId: "",
    phone: "",
    imageUrl: "",
    viewKey: "" // لإضافة المفتاح الخاص بالعرض
  });

  useEffect(() => {
    async function fetchStudents() {
      const snapshot = await getDocs(
        collection(db, `grades/${gradeId}/classes/${classId}/students`)
      );
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    }
    fetchStudents();
  }, [gradeId, classId]);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.nationalId) return;
    await addDoc(
      collection(db, `grades/${gradeId}/classes/${classId}/students`),
      newStudent
    );
    setNewStudent({
      name: "",
      nationalId: "",
      phone: "",
      imageUrl: "",
      viewKey: ""
    });
    window.location.reload();
  };

  const goToStudent = (studentId) => {
    navigate(`/grade/${gradeId}/class/${classId}/student/${studentId}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        طلاب الفصل {classId} - الصف {gradeId}
      </h2>

      {/* نموذج إضافة طالب */}
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="اسم الطالب"
          value={newStudent.name}
          onChange={(e) =>
            setNewStudent({ ...newStudent, name: e.target.value })
          }
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="السجل المدني"
          value={newStudent.nationalId}
          onChange={(e) =>
            setNewStudent({ ...newStudent, nationalId: e.target.value })
          }
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="رقم للتواصل"
          value={newStudent.phone}
          onChange={(e) =>
            setNewStudent({ ...newStudent, phone: e.target.value })
          }
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="رابط الصورة الشخصية (اختياري)"
          value={newStudent.imageUrl}
          onChange={(e) =>
            setNewStudent({ ...newStudent, imageUrl: e.target.value })
          }
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="مفتاح العرض viewKey (اختياري)"
          value={newStudent.viewKey}
          onChange={(e) =>
            setNewStudent({ ...newStudent, viewKey: e.target.value })
          }
          className="border p-2 w-full"
        />
        <button
          onClick={handleAddStudent}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + إضافة طالب
        </button>
      </div>

      {/* عرض الطلاب */}
      <div className="grid grid-cols-2 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="p-4 border rounded shadow hover:bg-gray-100 cursor-pointer flex items-center gap-3"
            onClick={() => goToStudent(student.id)}
          >
            {/* مربع QR Code إذا كان موجود */}
            {student.viewKey ? (
              <div className="w-12 h-12 bg-white p-1 rounded-lg flex-shrink-0">
                <QRCode
                  value={`${window.location.origin}/student-view/${student.viewKey}`}
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
                السجل المدني: {student.nationalId}
              </p>

              {/* رابط صفحة الطالب إذا كان فيه viewKey */}
              {student.viewKey && (
                <a
                  href={`${window.location.origin}/student-view/${student.viewKey}`}
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
    </div>
  );
}
