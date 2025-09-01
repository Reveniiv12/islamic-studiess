// src/components/StarsModal.jsx

import React, { useState, useEffect } from 'react';
import { FaStar, FaSave, FaTimes, FaGift, FaTrash, FaPlusCircle } from 'react-icons/fa';
import { supabase } from "../supabaseClient";

const StarsModal = ({ students = [], onClose, onSave, prizes = [], onUpdatePrizes, teacherId }) => {
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudentsSelected, setAllStudentsSelected] = useState(false);
  const [stars, setStars] = useState(1);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeCost, setNewPrizeCost] = useState(1);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const areAllStudentsSelected = students.length > 0 && selectedStudents.length === students.length;
    setAllStudentsSelected(areAllStudentsSelected);
  }, [selectedStudents, students]);

  const toggleSelectAll = () => {
    if (allStudentsSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const saveStars = async () => {
    if (selectedStudents.length === 0) {
      setMessage({ text: "يرجى اختيار الطلاب أولاً.", type: "error" });
      return;
    }
    if (stars < 1 || stars > 10) {
      setMessage({ text: "عدد النجوم يجب أن يكون بين 1 و 10.", type: "error" });
      return;
    }

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
      setMessage({ 
        text: `تم منح ${stars} نجمة للطلاب المحددين بنجاح!`, 
        type: "success" 
      });
      setSelectedStudents([]);
      setStars(1);
    } catch (error) {
      setMessage({ 
        text: "حدث خطأ أثناء حفظ النجوم. يرجى المحاولة مرة أخرى.", 
        type: "error" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addPrize = async () => {
    if (!newPrizeName.trim() || newPrizeCost < 1) {
      setMessage({ text: "يرجى إدخال اسم وتكلفة صحيحة للجائزة.", type: "error" });
      return;
    }
    if (!teacherId) {
      setMessage({ text: "حدث خطأ: معرف المعلم غير متوفر.", type: "error" });
      return;
    }
    
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('prizes')
        .insert([{ name: newPrizeName.trim(), cost: newPrizeCost, teacher_id: teacherId }])
        .select();

      if (error) throw error;
      
      onUpdatePrizes([...prizes, ...data]);
      setNewPrizeName('');
      setNewPrizeCost(1);
      setMessage({ text: `تمت إضافة جائزة "${newPrizeName.trim()}" بنجاح.`, type: "success" });

    } catch (error) {
      setMessage({ text: `حدث خطأ في إضافة الجائزة: ${error.message}`, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePrize = async (prizeId) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('prizes')
        .delete()
        .eq('id', prizeId);
      
      if (error) throw error;
      
      const updatedPrizes = prizes.filter(p => p.id !== prizeId);
      onUpdatePrizes(updatedPrizes);
      setMessage({ text: "تم حذف الجائزة بنجاح.", type: "success" });
    } catch (error) {
      setMessage({ text: `حدث خطأ في حذف الجائزة: ${error.message}`, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const redeemPrize = async (studentId, prizeId) => {
    if (selectedStudents.length !== 1 || selectedStudents[0] !== studentId) {
      setMessage({ text: "يجب تحديد طالب واحد فقط لاستخدام الجائزة.", type: "error" });
      return;
    }
    
    const student = students.find(s => s.id === studentId);
    const prize = prizes.find(p => p.id === prizeId);

    if (student && prize) {
      if (student.stars >= prize.cost) {
        setIsSaving(true);
        const updatedStudents = students.map(s => {
          if (s.id === studentId) {
            const newConsumedStars = (s.consumedStars || 0) + prize.cost;
            return {
              ...s,
              consumedStars: newConsumedStars,
              stars: (s.acquiredStars || 0) - newConsumedStars
            };
          }
          return s;
        });

        try {
          await onSave(updatedStudents);
          setMessage({ 
            text: `تم استهلاك جائزة "${prize.name}" بنجاح للطالب ${student.name}.`, 
            type: "success" 
          });
          setSelectedStudents([]);
        } catch (error) {
          setMessage({ 
            text: "حدث خطأ أثناء حفظ النجوم. يرجى المحاولة مرة أخرى.", 
            type: "error" 
          });
        } finally {
          setIsSaving(false);
        }
      } else {
        setMessage({ 
          text: `لا يوجد لدى الطالب ${student.name} نجوم كافية لاستخدام هذه الجائزة.`, 
          type: "error" 
        });
      }
    }
  };

  const isSaveDisabled = selectedStudents.length === 0 || stars < 1 || isSaving;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h3 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <FaStar className="text-yellow-400" /> إدارة النجوم
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSaving}
          >
            <FaTimes className="text-3xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          {message.text && (
            <div className={`p-3 rounded-lg text-center mb-4 font-semibold ${
              message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {message.text}
            </div>
          )}

          {/* Stars Management Section */}
          <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <h4 className="text-xl md:text-2xl font-bold text-blue-400 flex items-center gap-2">
                <FaStar className="text-xl" /> منح النجوم
              </h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-lg">
                  <input
                    type="number"
                    value={stars}
                    onChange={(e) => setStars(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="w-20 p-2 text-center bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    disabled={isSaving}
                  />
                  <span>نجمة</span>
                </label>
                <button
                  onClick={saveStars}
                  disabled={isSaveDisabled}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${
                    isSaveDisabled 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaving ? (
                    <span className="animate-spin">↻</span>
                  ) : (
                    <>
                      <FaSave /> حفظ
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600">
                <label className="flex items-center gap-3 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allStudentsSelected}
                    onChange={toggleSelectAll}
                    className="form-checkbox h-5 w-5 text-blue-600 bg-gray-900 border-gray-500 rounded focus:ring-blue-500"
                    disabled={isSaving}
                  />
                  <span className="text-lg font-semibold text-white">تحديد الكل</span>
                </label>
              </div>
              {students.length === 0 ? (
                <div className="text-center text-gray-500 col-span-full py-4">لا يوجد طلاب لعرضهم.</div>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => !isSaving && toggleStudent(student.id)}
                    className={`bg-gray-700 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors border-2 ${
                      selectedStudents.includes(student.id) 
                        ? 'border-blue-500 ring-2 ring-blue-500' 
                        : 'border-gray-600 hover:bg-gray-600'
                    } ${
                      message.type === 'success' && selectedStudents.includes(student.id)
                        ? 'animate-pulse bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}}
                        className="form-checkbox h-5 w-5 text-blue-600 bg-gray-900 border-gray-500 rounded focus:ring-blue-500"
                        disabled={isSaving}
                      />
                      <span className="text-lg font-medium text-white">{student.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-300">الحالية:</span>
                        <span className="text-yellow-400 font-bold">{student.stars || 0}</span>
                        <FaStar className="text-yellow-400 text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-300">مكتسبة:</span>
                        <span className="text-green-400 font-bold">{student.acquiredStars || 0}</span>
                        <FaStar className="text-green-400 text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-300">مستهلكة:</span>
                        <span className="text-red-400 font-bold">{student.consumedStars || 0}</span>
                        <FaStar className="text-red-400 text-xs" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prizes Section */}
          <div className="p-6 bg-gray-900 rounded-xl border border-gray-700">
            <h4 className="text-xl md:text-2xl font-bold text-purple-400 flex items-center gap-2 mb-6">
              <FaGift className="text-xl" /> الجوائز والمكافآت
            </h4>
            
            {/* Add New Prize Form */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex-grow flex flex-col md:flex-row gap-4 w-full">
                <input
                  type="text"
                  value={newPrizeName}
                  onChange={(e) => setNewPrizeName(e.target.value)}
                  placeholder="اسم الجائزة"
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSaving}
                />
                <div className="flex items-center gap-2">
                  <label className="text-lg">التكلفة:</label>
                  <input
                    type="number"
                    value={newPrizeCost}
                    onChange={(e) => setNewPrizeCost(Math.max(1, Number(e.target.value)))}
                    className="w-20 p-2 text-center bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    disabled={isSaving}
                  />
                  <span className="text-lg">نجمة</span>
                </div>
              </div>
              <button
                onClick={addPrize}
                disabled={isSaving || !newPrizeName.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${
                  isSaving || !newPrizeName.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } w-full md:w-auto mt-4 md:mt-0`}
              >
                <FaPlusCircle /> إضافة جائزة
              </button>
            </div>
            
            {/* Prizes List */}
            <div className="space-y-4">
              {prizes.length === 0 ? (
                <div className="text-center text-gray-500 py-4">لا توجد جوائز حاليًا.</div>
              ) : (
                prizes.map((prize) => (
                  <div key={prize.id} className="bg-gray-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between border border-gray-700">
                    <div className="flex-grow mb-4 md:mb-0">
                      <h5 className="text-xl font-bold text-white">{prize.name}</h5>
                      <p className="text-gray-400 flex items-center gap-1 mt-1">
                        التكلفة:
                        <span className="font-bold text-yellow-400">{prize.cost}</span>
                        <FaStar className="text-yellow-400 text-sm" />
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          if (selectedStudents.length === 1) {
                            const studentName = students.find(s => s.id === selectedStudents[0])?.name;
                            if(window.confirm(`هل أنت متأكد من استهلاك جائزة "${prize.name}" للطالب ${studentName}؟`)) {
                              redeemPrize(selectedStudents[0], prize.id);
                            }
                          } else {
                            setMessage({ text: "يرجى تحديد طالب واحد فقط لاستخدام الجائزة.", type: "error" });
                          }
                        }}
                        disabled={isSaving || selectedStudents.length !== 1}
                        className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-semibold text-lg transition-colors ${
                          isSaving || selectedStudents.length !== 1
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <FaGift /> استهلاك
                      </button>
                      <button
                        onClick={() => {
                          if(window.confirm(`هل أنت متأكد من حذف جائزة "${prize.name}"؟`)) {
                            deletePrize(prize.id);
                          }
                        }}
                        disabled={isSaving}
                        className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl font-semibold text-lg transition-colors ${
                          isSaving
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        <FaTrash /> حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end bg-gray-900">
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className={`bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold text-lg transition-colors ${
              isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-500'
            }`}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarsModal;