// src/pages/AddStudent.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient"; // تم إضافة هذا السطر
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
      
      const { data, error } = await supabase
        .from('students') // اسم الجدول المقابل للمجموعة
        .insert([
          { 
            name, 
            national_id: nationalId, // ملاحظة: يفضل استخدام snake_case في Supabase
            phone, 
            image_url: imageUrl, 
            view_key: viewKey,
            grades: {}, // إذا كان grades كائنًا JSON
          }
        ]);

      if (error) {
        console.error("خطأ أثناء إضافة الطالب:", error);
        setMessage("حدث خطأ أثناء الإضافة، حاول مرة أخرى.");
        return;
      }
      
      const studentLink = `${window.location.origin}/student-grades/${viewKey}`;
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
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">الرقم الوطني/الإقامة</label>
          <input
            type="text"
            placeholder="الرقم الوطني/الإقامة"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
          <input
            type="tel"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">رابط صورة الطالب</label>
          <input
            type="url"
            placeholder="رابط الصورة"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          إضافة الطالب
        </button>
      </form>
      
      {message && (
        <div className="mt-4 p-4 rounded-md bg-green-100 text-green-700 border border-green-200">
          {message}
        </div>
      )}
    </div>
  );
};

export default AddStudent;