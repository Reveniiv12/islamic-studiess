// src/pages/AddStudent.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";

const AddStudent = () => {
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const viewKey = uuidv4();
      const docRef = await addDoc(collection(db, "students"), {
        name,
        nationalId,
        phone,
        imageUrl,
        viewKey,
        grades: {},
      });

      const studentLink = `${window.location.origin}/student/${viewKey}`;
      setMessage(`تم إضافة الطالب بنجاح! رابط الطالب: ${studentLink}`);

      setName("");
      setNationalId("");
      setPhone("");
      setImageUrl("");
    } catch (error) {
      console.error("خطأ أثناء إضافة الطالب:", error);
      setMessage("حدث خطأ أثناء الإضافة، حاول مرة أخرى.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">إضافة طالب جديد</h2>
      <form onSubmit={handleAddStudent} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">اسم الطالب</label>
          <input
            type="text"
            placeholder="اسم الطالب"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* باقي الحقول بنفس النمط */}
        
        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          إضافة الطالب
        </button>
      </form>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes("نجاح") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddStudent;