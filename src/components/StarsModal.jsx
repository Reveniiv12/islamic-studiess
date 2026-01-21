// src/components/StarsModal.jsx

import React, { useState, useEffect } from 'react';
import { 
  FaStar, FaSave, FaTimes, FaGift, FaTrash, 
  FaPlusCircle, FaMinusCircle, FaEdit, 
  FaUserGraduate, FaExclamationTriangle, FaCheckCircle, FaCheck 
} from 'react-icons/fa';
import { supabase } from "../supabaseClient";

// --- مكونات فرعية مساعدة (UI Components) ---

const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[70] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl animate-fade-in-down whitespace-nowrap ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
      <span className="font-semibold text-sm md:text-base">{message}</span>
    </div>
  );
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <FaExclamationTriangle className="text-yellow-500" /> {title}
        </h3>
        <p className="text-gray-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            إلغاء
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-bold"
          >
            نعم، احذف
          </button>
        </div>
      </div>
    </div>
  );
};

// --- المكون الرئيسي ---

const StarsModal = ({ students = [], onClose, onSave, prizes = [], onUpdatePrizes, teacherId }) => {
  const [activeTab, setActiveTab] = useState('students'); 
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [stars, setStars] = useState(1);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState(1);
  
  const [notification, setNotification] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, prizeId: null, prizeName: '' });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedStudentsData, setEditedStudentsData] = useState({});

  useEffect(() => {
    if (notification.text) {
      const timer = setTimeout(() => {
        setNotification({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (isEditMode) {
      const initialData = {};
      students.forEach(s => {
        initialData[s.id] = {
          stars: s.stars || 0,
          acquiredStars: s.acquiredStars || 0,
          consumedStars: s.consumedStars || 0
        };
      });
      setEditedStudentsData(initialData);
    }
  }, [isEditMode, students]);

  const showNotify = (text, type = 'success') => setNotification({ text, type });

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleStudent = (studentId) => {
    if (isEditMode) return;
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // --- Logic: Manual Edits ---
  const handleManualInputChange = (studentId, field, value) => {
    setEditedStudentsData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: Number(value)
      }
    }));
  };

  const saveManualEdits = async () => {
    setIsSaving(true);
    const updatedStudents = students.map(student => {
      if (editedStudentsData[student.id]) {
        return {
          ...student,
          stars: Number(editedStudentsData[student.id].stars),
          acquiredStars: Number(editedStudentsData[student.id].acquiredStars),
          consumedStars: Number(editedStudentsData[student.id].consumedStars),
        };
      }
      return student;
    });

    try {
      await onSave(updatedStudents);
      showNotify("تم حفظ التعديلات اليدوية!", "success");
      setIsEditMode(false);
    } catch (error) {
      showNotify("حدث خطأ أثناء الحفظ.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Logic: Bulk Stars ---
  const saveStars = async () => {
    if (selectedStudents.length === 0) return showNotify("اختر طلاباً أولاً.", "error");
    setIsSaving(true);
    const updatedStudents = students.map(student => {
      if (selectedStudents.includes(student.id)) {
        const newAcquiredStars = (student.acquiredStars || 0) + stars;
        return {
          ...student,
          acquiredStars: newAcquiredStars,
          stars: newAcquiredStars - (student.consumedStars || 0)
        };
      }
      return student;
    });
    try {
      await onSave(updatedStudents);
      showNotify(`تم منح ${stars} نجوم!`, "success");
      setSelectedStudents([]);
      setStars(1);
    } catch (error) {
      showNotify("فشل الحفظ.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const removeStars = async () => {
    if (selectedStudents.length === 0) return showNotify("اختر طلاباً أولاً.", "error");
    setIsSaving(true);
    const updatedStudents = students.map(student => {
      if (selectedStudents.includes(student.id)) {
        const currentAcquired = student.acquiredStars || 0;
        const newAcquiredStars = Math.max(0, currentAcquired - stars);
        const currentConsumed = student.consumedStars || 0;
        const newBalance = Math.max(0, newAcquiredStars - currentConsumed);
        return {
          ...student,
          acquiredStars: newAcquiredStars,
          stars: newBalance
        };
      }
      return student;
    });
    try {
      await onSave(updatedStudents);
      showNotify(`تم إزالة ${stars} نجوم.`, "success");
      setSelectedStudents([]);
      setStars(1);
    } catch (error) {
      showNotify("فشل الإزالة.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Logic: Prizes ---
  const addPrize = async () => {
    if (!newPrizeName.trim() || newPrizeCost < 1) return showNotify("بيانات غير صحيحة.", "error");
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('prizes')
        .insert([{ name: newPrizeName.trim(), cost: newPrizeCost, teacher_id: teacherId }])
        .select();

      if (error) throw error;

      // تحقق إضافي لضمان أن البيانات مصفوفة وليست فارغة
      if (data && data.length > 0) {
        // نستخدم spread operator لضمان إنشاء مصفوفة جديدة كلياً
        const updatedList = [...prizes, ...data];
        onUpdatePrizes(updatedList);
        setNewPrizeName('');
        setNewPrizeCost(1);
        showNotify("تمت الإضافة بنجاح.", "success");
      } else {
        throw new Error("لم يتم إرجاع بيانات من الخادم");
      }
    } catch (error) {
      console.error(error);
      showNotify(`خطأ: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeletePrize = (prize) => {
    setConfirmModal({ isOpen: true, prizeId: prize.id, prizeName: prize.name });
  };

  const executeDeletePrize = async () => {
    const { prizeId } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });
    setIsSaving(true);
    try {
      const { error } = await supabase.from('prizes').delete().eq('id', prizeId);
      if (error) {
        if (error.code === '23503') throw new Error("الجائزة مرتبطة بسجلات سابقة ولا يمكن حذفها.");
        throw error;
      }
      const updatedPrizes = prizes.filter(p => p.id !== prizeId);
      onUpdatePrizes(updatedPrizes);
      showNotify("تم الحذف بنجاح.", "success");
    } catch (error) {
      showNotify(error.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // التغيير هنا: h-full للجوال، fixed و z-50 لضمان الظهور فوق كل شيء
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 md:bg-opacity-90 md:backdrop-blur-sm flex items-center justify-center font-sans overflow-hidden">
      
      {/* النافذة الرئيسية:
         - Mobile: h-full w-full rounded-none (ملء الشاشة)
         - Desktop: max-h-[90vh] rounded-3xl (نافذة منبثقة)
      */}
      <div className="relative bg-gray-800 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-3xl shadow-2xl flex flex-col border-0 md:border border-gray-700">
        
        <Toast message={notification.text} type={notification.type} />
        <ConfirmDialog 
          isOpen={confirmModal.isOpen}
          title="تأكيد الحذف"
          message={`حذف جائزة "${confirmModal.prizeName}"؟`}
          onConfirm={executeDeletePrize}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        />

        {/* --- Header --- */}
        {/* جعلنا الـ Header مرناً مع flex-wrap للجوال */}
        <div className="bg-gray-900 px-4 py-3 md:px-6 md:py-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 shrink-0">
          
          {/* Title & Close for Mobile Header */}
          <div className="flex w-full md:w-auto justify-between items-center">
             <div className="flex items-center gap-2 md:gap-3">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-gray-900 shadow-lg">
                 <FaStar className="text-base md:text-xl" />
               </div>
               <h2 className="text-lg md:text-2xl font-bold text-white">لوحة المكافآت</h2>
             </div>
             {/* زر الإغلاق يظهر هنا في الجوال فقط لسهولة الوصول */}
             <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white p-2">
                <FaTimes size={24} />
             </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex w-full md:w-auto bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'students' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2"><FaUserGraduate /> الطلاب</div>
            </button>
            <button
              onClick={() => setActiveTab('prizes')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                activeTab === 'prizes' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2"><FaGift /> الجوائز</div>
            </button>
          </div>

          {/* زر الإغلاق للديسك توب */}
          <button onClick={onClose} disabled={isSaving} className="hidden md:block text-gray-500 hover:text-white transition">
            <FaTimes className="text-2xl" />
          </button>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-800/50">
          
          {/* TAB 1: Students */}
          {activeTab === 'students' && (
            <div className="p-4 md:p-6 pb-24 md:pb-6"> {/* pb-24 للجوال لضمان عدم اختفاء المحتوى خلف أزرار التثبيت إن وجدت */}
              
              {/* Controls Bar */}
              <div className="bg-gray-900/80 backdrop-blur border border-gray-700 p-3 md:p-4 rounded-xl mb-4 md:mb-6 flex flex-col xl:flex-row gap-4 shadow-lg sticky top-0 z-30">
                {!isEditMode ? (
                  <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                    
                    {/* Select All */}
                    <button 
                      onClick={toggleSelectAll}
                      className="w-full md:w-auto px-4 py-3 md:py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-600 flex items-center justify-center gap-2 transition text-sm font-bold"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedStudents.length > 0 && selectedStudents.length === students.length ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                      }`}>
                        {selectedStudents.length === students.length && <FaCheck className="text-[10px] text-white" />}
                      </div>
                      تحديد الكل
                    </button>

                    <div className="hidden md:block w-px h-8 bg-gray-700 mx-2"></div>

                    {/* Actions Group */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2 w-full md:w-auto bg-gray-800 p-1 rounded-lg border border-gray-700">
                        <span className="text-gray-400 text-xs md:text-sm font-bold px-2">العدد:</span>
                        <input
                          type="number"
                          min="1" max="50"
                          value={stars}
                          onChange={(e) => setStars(Math.max(1, Number(e.target.value)))}
                          className="w-full md:w-16 text-center bg-gray-700 rounded py-1.5 text-white focus:outline-none font-bold"
                        />
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button
                          onClick={saveStars}
                          disabled={selectedStudents.length === 0 || isSaving}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <FaPlusCircle /> منح
                        </button>
                        <button
                          onClick={removeStars}
                          disabled={selectedStudents.length === 0 || isSaving}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <FaMinusCircle /> إزالة
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode Active Banner
                  <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                    <div className="w-full md:w-auto bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm">
                      <FaEdit /> وضع التعديل اليدوي
                    </div>
                    <span className="text-gray-400 text-xs text-center md:text-right">عدّل الأرقام في البطاقات ثم احفظ.</span>
                  </div>
                )}

                {/* Edit Mode Toggle Buttons */}
                <div className="flex items-center gap-2 w-full xl:w-auto xl:justify-end mt-2 xl:mt-0">
                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button onClick={saveManualEdits} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center gap-2 text-sm">
                        <FaSave /> حفظ
                      </button>
                      <button onClick={() => setIsEditMode(false)} disabled={isSaving} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold text-sm">
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditMode(true)} className="w-full xl:w-auto px-4 py-2 text-yellow-500 border border-yellow-500/30 rounded-lg text-sm font-bold flex justify-center items-center gap-2 hover:bg-yellow-500/10 transition">
                      <FaEdit /> تعديل الأرصدة
                    </button>
                  )}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {students.map((student) => {
                  const isSelected = selectedStudents.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => !isEditMode && toggleStudent(student.id)}
                      className={`relative p-3 md:p-4 rounded-xl border transition-all ${
                        isEditMode 
                          ? 'bg-gray-800 border-yellow-500/30' 
                          : isSelected
                            ? 'bg-blue-900/20 border-blue-500'
                            : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                       {isSelected && !isEditMode && (
                        <div className="absolute top-3 left-3 text-blue-500 bg-blue-900/80 rounded-full p-1 z-10">
                          <FaCheckCircle />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={student.photo || '/images/1.webp'} 
                          alt={student.name} 
                          className={`w-12 h-12 rounded-full object-cover border-2 ${isSelected ? 'border-blue-500' : 'border-gray-600'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-100 truncate text-base">{student.name}</h4>
                          {!isEditMode && <p className="text-[10px] text-gray-400">اضغط للتحديد</p>}
                        </div>
                      </div>

                      {/* Mini Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                         {/* رصيد */}
                         <div className="bg-gray-900/50 p-2 rounded text-center border border-gray-700/50">
                            <span className="block text-gray-500 mb-1">الرصيد</span>
                            {isEditMode ? (
                              <input
                                type="number"
                                className="w-full bg-gray-800 text-yellow-400 text-center rounded focus:outline-none border border-yellow-600"
                                value={editedStudentsData[student.id]?.stars ?? 0}
                                onChange={(e) => handleManualInputChange(student.id, 'stars', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-yellow-400 font-bold flex justify-center items-center gap-1">
                                {student.stars || 0} <FaStar size={8} />
                              </span>
                            )}
                         </div>
                         {/* مكتسب */}
                         <div className="bg-gray-900/50 p-2 rounded text-center border border-gray-700/50">
                            <span className="block text-gray-500 mb-1">مكتسب</span>
                            {isEditMode ? (
                              <input
                                type="number"
                                className="w-full bg-gray-800 text-green-400 text-center rounded focus:outline-none border border-green-600"
                                value={editedStudentsData[student.id]?.acquiredStars ?? 0}
                                onChange={(e) => handleManualInputChange(student.id, 'acquiredStars', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-green-500 font-bold">+{student.acquiredStars || 0}</span>
                            )}
                         </div>
                         {/* مستهلك */}
                         <div className="bg-gray-900/50 p-2 rounded text-center border border-gray-700/50">
                            <span className="block text-gray-500 mb-1">مستهلك</span>
                            {isEditMode ? (
                              <input
                                type="number"
                                className="w-full bg-gray-800 text-red-400 text-center rounded focus:outline-none border border-red-600"
                                value={editedStudentsData[student.id]?.consumedStars ?? 0}
                                onChange={(e) => handleManualInputChange(student.id, 'consumedStars', e.target.value)}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-red-500 font-bold">-{student.consumedStars || 0}</span>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Prizes */}
          {activeTab === 'prizes' && (
            <div className="p-4 md:p-6 pb-24">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Form */}
                <div className="bg-gray-700/30 border border-purple-500/20 p-4 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <FaPlusCircle className="text-purple-400" /> إضافة جائزة
                  </h3>
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="اسم الجائزة..."
                      value={newPrizeName}
                      onChange={(e) => setNewPrizeName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center bg-gray-900 border border-gray-600 rounded-lg px-3 flex-1">
                         <input
                           type="number"
                           min="1"
                           value={newPrizeCost}
                           onChange={(e) => setNewPrizeCost(Math.max(1, Number(e.target.value)))}
                           className="bg-transparent w-full text-white outline-none font-bold text-center py-3"
                         />
                         <FaStar className="text-yellow-500 ml-2" />
                      </div>
                      <button
                        onClick={addPrize}
                        disabled={isSaving || !newPrizeName.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                  <h3 className="text-gray-400 text-sm font-bold">الجوائز المتاحة ({prizes.length})</h3>
                  {prizes.map(prize => (
                    <div key={prize.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-xl">
                          🎁
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-100 text-sm md:text-base">{prize.name}</h4>
                          <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
                            {prize.cost} <FaStar />
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => requestDeletePrize(prize)}
                        className="p-2 text-gray-500 hover:text-red-400 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  {prizes.length === 0 && (
                     <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                       لا توجد جوائز.
                     </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer (Desktop Only) */}
        <div className="hidden md:flex bg-gray-900 px-6 py-4 border-t border-gray-700 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold border border-gray-600"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

export default StarsModal;