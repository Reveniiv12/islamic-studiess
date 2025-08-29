// src/services/gradeService.js
import { supabase } from "../supabaseClient";

// إضافة فصل جديد
export const addSection = async (gradeId, sectionName) => {
  try {
    const { data, error } = await supabase
      .from("sections")
      .insert([
        {
          name: sectionName,
          grade_id: gradeId,
        },
      ])
      .select();

    if (error) throw error;
    return data[0].id; // إرجاع الـ ID الخاص بالفصل الجديد
  } catch (error) {
    console.error("Error adding section:", error);
    throw error;
  }
};

// إضافة طالب جديد
export const addStudent = async (gradeId, sectionId, studentData) => {
  try {
    const studentWithDefaults = {
      ...studentData,
      grade_id: gradeId,
      section_id: sectionId,
      grades: {
        tests: Array(5).fill(0),
        homework: Array(10).fill(0),
        participation: Array(10).fill(0),
        performanceTasks: 0,
        quranRecitation: Array(4).fill(0),
        quranMemorization: Array(4).fill(0),
        oralTest: Array(5).fill(0),
        weeklyNotes: Array(16).fill(""),
      },
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("students")
      .insert([studentWithDefaults])
      .select();

    if (error) throw error;
    return data[0].id; // إرجاع الـ ID الخاص بالطالب الجديد
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

// تحديث درجات الطالب
export const updateStudentGrades = async (gradeId, sectionId, studentId, grades) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .update({ grades: grades })
      .eq("id", studentId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating grades:", error);
    throw error;
  }
};

// جلب جميع الفصول لصف معين
export const getSections = async (gradeId) => {
  try {
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("grade_id", gradeId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching sections:", error);
    throw error;
  }
};

// جلب جميع الطلاب لفصل معين
export const getStudents = async (gradeId, sectionId) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("grade_id", gradeId)
      .eq("section_id", sectionId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

// جلب طالب واحد بواسطة الـ ID
export const getStudentById = async (gradeId, sectionId, studentId) => {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw error;
  }
};

// حذف طالب
export const deleteStudent = async (gradeId, sectionId, studentId) => {
  try {
    const { error } = await supabase.from("students").delete().eq("id", studentId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};