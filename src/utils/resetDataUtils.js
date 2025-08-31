// src/utils/resetDataUtils.js
import { supabase } from '../supabaseClient';

/**
 * Resets all grades, notes, and curriculum for all students in a section.
 * @param {Array} students - Array of student objects.
 * @param {string} teacherId - The ID of the currently logged-in teacher.
 * @param {Function} handleDialog - Function to display dialog messages.
 * @param {Function} refreshDataFunction - Function to refresh data in the parent component.
 */
export const resetStudentData = async (students, teacherId, handleDialog, refreshDataFunction) => {
  try {
    if (students.length === 0) {
      handleDialog("تحذير", "لا يوجد طلاب لحذف بياناتهم.", "warning");
      return;
    }

    // 1. Prepare student data to be reset
    const studentUpdates = students.map(student => {
      // Keep the existing student data (name, national_id, etc.)
      const baseStudent = {
        id: student.id,
        name: student.name,
        national_id: student.nationalId,
        phone: student.phone,
        parent_phone: student.parentPhone,
        photo: student.photo,
        grade_level: student.grade_level,
        section: student.section,
        teacher_id: teacherId
      };

      // Reset the grades, stars, and recitation history
      const resetData = {
        grades: {
          tests: Array(2).fill(null),
          homework: Array(10).fill(null),
          performance_tasks: Array(5).fill(null),
          participation: Array(10).fill(null),
          quran_recitation: Array(5).fill(null),
          quran_memorization: Array(5).fill(null),
          oral_test: Array(5).fill(null),
          weekly_notes: Array(20).fill(null),
        },
        stars: 0,
        acquired_stars: 0,
        consumed_stars: 0,
        recitation_history: [],
      };

      // Return the student object with old data and reset data combined.
      return { ...baseStudent, ...resetData };
    });
    
    // 2. Perform upsert operations on students table in batches
    const batchSize = 50;
    for (let i = 0; i < studentUpdates.length; i += batchSize) {
      const batch = studentUpdates.slice(i, i + batchSize);
      const { error: studentsUpdateError } = await supabase
        .from('students')
        .upsert(batch);

      if (studentsUpdateError) {
        throw studentsUpdateError;
      }
    }
    
    // 3. Delete absences and book absences from their separate tables
    const studentIds = students.map(student => student.id);
    
    // Delete from absences table
    const { error: absencesDeleteError } = await supabase
      .from('absences')
      .delete()
      .in('student_id', studentIds);
    
    if (absencesDeleteError) {
      throw absencesDeleteError;
    }
    
    // Delete from book_absences table
    const { error: bookAbsencesDeleteError } = await supabase
      .from('book_absences')
      .delete()
      .in('student_id', studentIds);
      
    if (bookAbsencesDeleteError) {
      throw bookAbsencesDeleteError;
    }


    // 4. Prepare and reset curriculum data
    // Get grade and section IDs from the first student in the list
    const gradeId = students[0].grade_level;
    const sectionId = students[0].section;
    
    const curriculumUpdate = {
        grade_id: gradeId,
        section_id: sectionId,
        teacher_id: teacherId,
        recitation: [],
        homework: []
    };
    
    const { error: curriculumUpdateError } = await supabase
      .from('curriculum')
      .upsert([curriculumUpdate], { onConflict: 'grade_id,section_id' });

    if (curriculumUpdateError) {
      throw curriculumUpdateError;
    }

    handleDialog("نجاح", "تم حذف جميع الدرجات والملاحظات والمناهج بنجاح.", "success");
    refreshDataFunction();
  } catch (error) {
    console.error("Error resetting data:", error);
    handleDialog("خطأ", `حدث خطأ أثناء حذف البيانات: ${error.message}`, "error");
  }
};

/**
 * Deletes a single part of the recitation curriculum.
 */
export const deleteCurriculumPart = async (partId, gradeId, sectionId, teacherId, currentCurriculum, setCurriculum, handleDialog) => {
    try {
        const updatedCurriculum = currentCurriculum.filter(part => part.id !== partId);
        const { error } = await supabase
            .from('curriculum')
            .update({ recitation: updatedCurriculum })
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId);

        if (error) throw error;

        setCurriculum(updatedCurriculum);
        handleDialog("نجاح", "تم حذف الجزء بنجاح", "success");
    } catch (error) {
        console.error("Error deleting curriculum part:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حذف جزء المنهج.", "error");
    }
};

/**
 * Deletes all recitation and memorization curriculum parts for a section.
 */
export const deleteAllCurriculum = async (gradeId, sectionId, teacherId, handleDialog, setCurriculum) => {
    try {
        const { error } = await supabase
            .from('curriculum')
            .update({ recitation: [] })
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId);

        if (error) throw error;

        setCurriculum([]);
        handleDialog("نجاح", "تم حذف جميع أجزاء المنهج بنجاح", "success");
    } catch (error) {
        console.error("Error deleting all curriculum:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حذف جميع أجزاء المنهج.", "error");
    }
};

/**
 * Deletes a single part of the homework curriculum.
 */
export const deleteHomeworkPart = async (partId, gradeId, sectionId, teacherId, currentHomeworkCurriculum, setHomeworkCurriculum, handleDialog) => {
    try {
        const updatedHomeworkCurriculum = currentHomeworkCurriculum.filter(part => part.id !== partId);
        const { error } = await supabase
            .from('curriculum')
            .update({ homework: updatedHomeworkCurriculum })
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId);

        if (error) throw error;

        setHomeworkCurriculum(updatedHomeworkCurriculum);
        handleDialog("نجاح", "تم حذف المهمة بنجاح", "success");
    } catch (error) {
        console.error("Error deleting homework part:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حذف المهمة.", "error");
    }
};

/**
 * Deletes all homework, performance tasks, and tests for a section.
 */
export const deleteAllHomework = async (gradeId, sectionId, teacherId, handleDialog, setHomeworkCurriculum) => {
    try {
        const { error } = await supabase
            .from('curriculum')
            .update({ homework: [] })
            .eq('grade_id', gradeId)
            .eq('section_id', sectionId)
            .eq('teacher_id', teacherId);

        if (error) throw error;

        setHomeworkCurriculum([]);
        handleDialog("نجاح", "تم حذف جميع المهام بنجاح", "success");
    } catch (error) {
        console.error("Error deleting all homework:", error);
        handleDialog("خطأ", "حدث خطأ أثناء حذف جميع المهام.", "error");
    }
};
