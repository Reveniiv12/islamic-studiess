// src/components/NotesModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient'; 
import { FaPlus, FaTrash, FaEdit, FaUsers, FaUser, FaHistory, FaClipboardList, FaTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

// ... (مكونات Toast و CustomDialog تبقى كما هي بدون تغيير) ...
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500'
  };

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl text-white border ${bgColors[type] || bgColors.info} transition-all animate-fade-in-down w-[90%] md:w-auto text-sm md:text-base`}>
      {type === 'success' && <FaCheckCircle className="flex-shrink-0" />}
      {type === 'error' && <FaExclamationTriangle className="flex-shrink-0" />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

const CustomDialog = ({ isOpen, type, title, message, initialValue, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState(initialValue || '');

  useEffect(() => {
    setInputValue(initialValue || '');
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="p-4 md:p-5 border-b border-gray-700 bg-gray-900/50">
          <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
            {type === 'danger' && <FaExclamationTriangle className="text-red-500" />}
            {type === 'edit' && <FaEdit className="text-blue-500" />}
            {title}
          </h3>
        </div>
        <div className="p-4 md:p-6">
          <p className="text-gray-300 mb-4 text-sm md:text-base">{message}</p>
          {type === 'prompt' && (
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              rows="3"
              autoFocus
            />
          )}
        </div>
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium">إلغاء</button>
          <button onClick={() => onConfirm(type === 'prompt' ? inputValue : undefined)} className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{type === 'prompt' ? 'حفظ التغييرات' : 'تأكيد'}</button>
        </div>
      </div>
    </div>
  );
};

// ... (مكون StudentSelector يبقى كما هو) ...
const StudentSelector = ({ students, selectedIds, onSelect, mode = 'multi' }) => {
    const handleClick = (studentId) => {
      if (mode === 'single') {
        onSelect(selectedIds.includes(studentId) ? [] : [studentId]);
      } else {
        if (selectedIds.includes(studentId)) {
          onSelect(selectedIds.filter(id => id !== studentId));
        } else {
          onSelect([...selectedIds, studentId]);
        }
      }
    };
  
    const handleSelectAll = () => {
      if (selectedIds.length === students.length) {
        onSelect([]);
      } else {
        onSelect(students.map(s => s.id));
      }
    };
  
    return (
      <div className="bg-gray-800 w-full md:w-1/3 flex flex-col h-56 md:h-full border-b md:border-b-0 md:border-l border-gray-700 flex-shrink-0">
        <div className="p-3 md:p-4 border-b border-gray-700 bg-gray-900 flex-shrink-0">
          <h4 className="font-bold text-gray-100 mb-0 flex justify-between items-center text-sm md:text-base">
            <span>قائمة الطلاب</span>
            <div className="flex items-center gap-2">
                 <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full">{students.length}</span>
                {mode === 'multi' && (
                <button onClick={handleSelectAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold">
                    {selectedIds.length === students.length ? 'إلغاء الكل' : 'تحديد الكل'}
                </button>
                )}
            </div>
          </h4>
        </div>
  
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {students.map(student => {
            const isSelected = selectedIds.includes(student.id);
            return (
              <div
                key={student.id}
                onClick={() => handleClick(student.id)}
                className={`
                  flex items-center p-2 md:p-3 rounded-xl cursor-pointer transition-all duration-200 border select-none
                  ${isSelected ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20 transform scale-[1.01]' : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'}
                `}
              >
                <img src={student.photo || '/images/1.webp'} alt={student.name} className={`w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 ${isSelected ? 'border-white' : 'border-gray-500'} ml-3 flex-shrink-0`} />
                <div className="flex flex-col min-w-0">
                  <span className={`font-semibold text-xs md:text-sm truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>{student.name}</span>
                  {isSelected && <span className="text-[10px] text-blue-200 hidden md:inline">تم التحديد</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
};

// ----------------------------------------------------------------------
// المكون الرئيسي NotesModal (مع التعديلات لاستقبال initialTab و initialSelectedIds)
// ----------------------------------------------------------------------
const NotesModal = ({ students = [], onClose, onSave, initialTab, initialSelectedIds }) => { // <--- تم إضافة Props هنا
  
  // تعيين الحالة الأولية بناءً على المدخلات أو القيم الافتراضية
  const [activeTab, setActiveTab] = useState(initialTab || 'group_note');
  const [selectedStudentIds, setSelectedStudentIds] = useState(initialSelectedIds || []);
  
  const [currentWeek, setCurrentWeek] = useState(1);
  const [noteType, setNoteType] = useState('custom');
  const [customNote, setCustomNote] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // إدارة القوالب
  const [templates, setTemplates] = useState([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');

  // إدارة التنبيهات
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  // جلب القوالب
  useEffect(() => {
    fetchTemplates();
  }, []);

  // دالة لجلب القوالب من قاعدة البيانات
  const fetchTemplates = async () => {
    setIsTemplatesLoading(true);
    try {
      const { data, error } = await supabase.from('note_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast("فشل في تحميل القوالب", "error");
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  // تحديد الأسبوع الحالي
  useEffect(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const currentWeekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    setCurrentWeek(currentWeekNumber > 20 ? 20 : currentWeekNumber);
  }, []);

  // تصفير الحقول عند تغيير التبويب (لكن لا نصفر إذا كان هناك تحديد قادم من الخارج لأول مرة)
  useEffect(() => {
    // نقوم بتفريغ حقول الملاحظات فقط، أما تحديد الطلاب فنبقيه إذا كنا في نفس الجلسة أو نغيره حسب الحاجة
    // هنا سنقوم بتصفير التحديد فقط إذا غيرنا التبويب يدوياً وليس عند التحميل الأولي
    if (activeTab !== initialTab) {
        // setSelectedStudentIds([]); // يمكنك تفعيل هذا السطر إذا أردت إلغاء التحديد عند تغيير التبويب
    }
    setCustomNote('');
    setSelectedTemplate('');
  }, [activeTab]);

  // دوال المساعدة
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeDialog = () => setDialog(prev => ({ ...prev, isOpen: false }));
  
  const openConfirmDialog = (title, message, onConfirm, type = 'danger') => {
    setDialog({ isOpen: true, type, title, message, onConfirm: () => { onConfirm(); closeDialog(); }, onCancel: closeDialog });
  };
  const openPromptDialog = (title, message, initialValue, onConfirm) => {
    setDialog({ isOpen: true, type: 'prompt', title, message, initialValue, onConfirm: (val) => { if (val) onConfirm(val); closeDialog(); }, onCancel: closeDialog });
  };

const getHijriDate = () => {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'Asia/Riyadh' // هذا السطر يضمن ثبات التاريخ وعدم تذبذبه
    }).format(new Date());
};

  const getNoteText = () => noteType === 'custom' ? customNote : templates.find(t => t.id === selectedTemplate)?.text || '';

  // العمليات
  const handleAddTemplate = async () => {
    if (!newTemplateText.trim()) { showToast("الرجاء كتابة نص القالب أولاً", "error"); return; }
    setIsAddingTemplate(true);
    try {
      const { data, error } = await supabase.from('note_templates').insert([{ text: newTemplateText }]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setTemplates([data[0], ...templates]); setNewTemplateText(''); setSelectedTemplate(data[0].id); showToast("تم إضافة القالب", "success");
      }
    } catch (error) { console.error(error); showToast("حدث خطأ", "error"); } finally { setIsAddingTemplate(false); }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    openConfirmDialog("حذف القالب", "هل أنت متأكد؟", async () => {
        try {
            const { error } = await supabase.from('note_templates').delete().eq('id', selectedTemplate);
            if (error) throw error;
            setTemplates(prev => prev.filter(t => t.id !== selectedTemplate)); setSelectedTemplate(''); showToast("تم الحذف", "success");
        } catch (error) { showToast("فشل الحذف", "error"); }
    });
  };

  const handleSaveNote = () => {
    const text = getNoteText();
    if (!text.trim() || selectedStudentIds.length === 0) { showToast("يرجى اختيار الطلاب وكتابة الملاحظة", "error"); return; }
    const fullNote = `(${getHijriDate()}): ${text}`;
    const updatedStudents = students.map(student => {
      if (!selectedStudentIds.includes(student.id)) return student;
      const weeklyNotes = [...(student.grades?.weeklyNotes || Array(20).fill().map(() => []))];
      if (!weeklyNotes[currentWeek - 1]) weeklyNotes[currentWeek - 1] = [];
      weeklyNotes[currentWeek - 1] = [...weeklyNotes[currentWeek - 1], fullNote];
      return { ...student, grades: { ...student.grades, weeklyNotes } };
    });
    onSave(updatedStudents); showToast("تم حفظ الملاحظة", "success"); setCustomNote('');
  };

  const handleDeleteSingleNote = (studentId, weekIndex, noteIndex) => {
    openConfirmDialog("حذف ملاحظة", "هل أنت متأكد؟", () => {
        const updatedStudents = students.map(student => {
          if (student.id !== studentId) return student;
          const weeklyNotes = [...(student.grades?.weeklyNotes || [])];
          if (weeklyNotes[weekIndex]) weeklyNotes[weekIndex] = weeklyNotes[weekIndex].filter((_, i) => i !== noteIndex);
          return { ...student, grades: { ...student.grades, weeklyNotes } };
        });
        onSave(updatedStudents); showToast("تم الحذف", "success");
    });
  };

  const handleEditSingleNote = (studentId, weekIndex, noteIndex, currentText) => {
    openPromptDialog("تعديل الملاحظة", "النص الجديد:", currentText, (newText) => {
        if (newText !== currentText) {
          const updatedStudents = students.map(student => {
            if (student.id !== studentId) return student;
            const weeklyNotes = [...(student.grades?.weeklyNotes || [])];
            if (weeklyNotes[weekIndex]) weeklyNotes[weekIndex][noteIndex] = newText;
            return { ...student, grades: { ...student.grades, weeklyNotes } };
          });
          onSave(updatedStudents); showToast("تم التعديل", "success");
        }
    });
  };

  const handleDeleteGroupNote = (text) => {
    openConfirmDialog("حذف جماعي", "سيتم الحذف من الجميع. متأكد؟", () => {
        const updatedStudents = students.map(student => {
          const weeklyNotes = (student.grades?.weeklyNotes || []).map(weekNotes => {
            if (!Array.isArray(weekNotes)) return [];
            return weekNotes.filter(note => note !== text);
          });
          return { ...student, grades: { ...student.grades, weeklyNotes } };
        });
        onSave(updatedStudents); showToast("تم الحذف الجماعي", "success");
    });
  };

  const handleEditGroupNote = (oldText) => {
    openPromptDialog("تعديل جماعي", "سيتم التعديل للجميع:", oldText, (newText) => {
        if (newText && newText !== oldText) {
          const updatedStudents = students.map(student => {
            const weeklyNotes = (student.grades?.weeklyNotes || []).map(weekNotes => {
              if (!Array.isArray(weekNotes)) return [];
              return weekNotes.map(note => note === oldText ? newText : note);
            });
            return { ...student, grades: { ...student.grades, weeklyNotes } };
          });
          onSave(updatedStudents); showToast("تم التعديل الجماعي", "success");
        }
    });
  };

  // --- دوال العرض ---
  const renderAddNoteSection = (isPrivate = false) => (
    <div className="flex-1 p-4 md:p-6 bg-gray-800 flex flex-col gap-4 md:gap-6 overflow-y-auto">
        <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <h3 className="text-gray-100 font-bold mb-4 flex items-center gap-2 text-sm md:text-base">
                {isPrivate ? <FaUser className="text-purple-400"/> : <FaUsers className="text-blue-400"/>}
                {isPrivate ? 'إرسال ملاحظة خاصة' : 'إرسال ملاحظة جماعية'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                 <div>
                    <label className="text-gray-400 text-xs md:text-sm mb-1 block">الأسبوع الدراسي</label>
                    <select value={currentWeek} onChange={(e) => setCurrentWeek(Number(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white text-sm">
                        {[...Array(20)].map((_, i) => <option key={i + 1} value={i + 1}>الأسبوع {i + 1}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-gray-400 text-xs md:text-sm mb-1 block">نوع الإدخال</label>
                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-600">
                        <button onClick={() => setNoteType('custom')} className={`flex-1 py-1 rounded-md text-xs md:text-sm transition-all ${noteType === 'custom' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>مخصص</button>
                        <button onClick={() => setNoteType('template')} className={`flex-1 py-1 rounded-md text-xs md:text-sm transition-all ${noteType === 'template' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>قوالب</button>
                    </div>
                </div>
            </div>
            {noteType === 'custom' ? (
                <textarea value={customNote} onChange={(e) => setCustomNote(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white h-24 md:h-32 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500 text-sm" placeholder="اكتب نص الملاحظة هنا..." />
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} disabled={isTemplatesLoading} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 appearance-none text-sm">
                                <option value="">{isTemplatesLoading ? 'جاري التحميل...' : 'اختر قالباً...'}</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.text}</option>)}
                            </select>
                        </div>
                        {selectedTemplate && <button onClick={handleDeleteTemplate} className="p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-900 rounded-lg transition-all"><FaTrash /></button>}
                    </div>
                    <div className="flex gap-2 items-center bg-gray-900/50 p-2 rounded-lg border border-gray-600 border-dashed">
                       <input type="text" value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} placeholder="قالب جديد..." className="flex-1 bg-transparent border-none text-xs md:text-sm text-white focus:ring-0 placeholder-gray-500 focus:outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()} />
                       <button onClick={handleAddTemplate} disabled={isAddingTemplate} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-md text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50">حفظ</button>
                    </div>
                </div>
            )}
            <button onClick={handleSaveNote} disabled={selectedStudentIds.length === 0} className={`mt-4 w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm md:text-base ${selectedStudentIds.length > 0 ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                <FaPlus /> {isPrivate ? 'إرسال للطالب المحدد' : `إرسال إلى (${selectedStudentIds.length}) طلاب`}
            </button>
        </div>
    </div>
  );

  const renderStudentHistory = () => {
    const student = students.find(s => s.id === selectedStudentIds[0]);
    if (!student) return <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-3 p-4"><FaUser className="text-4xl md:text-5xl opacity-20"/><p className="text-sm md:text-base">يرجى اختيار طالب لعرض سجله</p></div>;

    const notesFlat = [];
    (student.grades?.weeklyNotes || []).forEach((weekNotes, wIndex) => {
        if(Array.isArray(weekNotes)) weekNotes.forEach((note, nIndex) => notesFlat.push({ week: wIndex + 1, text: note, nIndex }));
    });

    return (
        <div className="flex-1 bg-gray-800 p-4 md:p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
                <img src={student.photo || '/images/1.webp'} className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-blue-500"/>
                <div><h3 className="text-lg md:text-xl font-bold text-white">{student.name}</h3><p className="text-gray-400 text-xs md:text-sm">عدد الملاحظات: {notesFlat.length}</p></div>
            </div>
            <div className="space-y-4">
                {notesFlat.length === 0 ? <p className="text-center text-gray-500 py-10 text-sm">لا توجد ملاحظات مسجلة</p> : notesFlat.map((item, idx) => (
                    <div key={`${item.week}-${item.nIndex}`} className="bg-gray-700 p-4 rounded-lg border border-gray-600 group hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold bg-blue-900 text-blue-200 px-2 py-1 rounded">الأسبوع {item.week}</span>
                            <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditSingleNote(student.id, item.week - 1, item.nIndex, item.text)} className="text-yellow-400 hover:text-yellow-300 p-1 bg-gray-800 rounded"><FaEdit /></button>
                                <button onClick={() => handleDeleteSingleNote(student.id, item.week - 1, item.nIndex)} className="text-red-400 hover:text-red-300 p-1 bg-gray-800 rounded"><FaTrash /></button>
                            </div>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderGroupHistory = () => {
    const allNotesMap = {};
    students.forEach(std => { (std.grades?.weeklyNotes || []).forEach(weekNotes => { if(Array.isArray(weekNotes)) weekNotes.forEach(note => allNotesMap[note] = (allNotesMap[note] || 0) + 1); }); });
    const groupNotes = Object.entries(allNotesMap).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]);

    return (
        <div className="flex-1 bg-gray-800 p-4 md:p-6 overflow-y-auto">
             <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg mb-6 flex gap-3">
                <FaHistory className="text-blue-400 text-xl mt-1 flex-shrink-0" />
                <div><h3 className="text-blue-200 font-bold mb-1 text-sm md:text-base">أرشيف الملاحظات المرسلة</h3><p className="text-xs text-blue-300 opacity-80 leading-relaxed">تنبيه: التعديل أو الحذف سيطبق على الجميع.</p></div>
            </div>
            <div className="space-y-3">
                {groupNotes.length === 0 ? <p className="text-center text-gray-500 text-sm">الأرشيف فارغ</p> : groupNotes.map(([text, count], idx) => (
                    <div key={idx} className="bg-gray-700 p-3 md:p-4 rounded-lg border border-gray-600 flex justify-between items-center group hover:bg-gray-650 transition-colors">
                        <div className="flex-1 ml-4 min-w-0"><p className="text-gray-200 text-xs md:text-sm mb-2 truncate">{text}</p><span className="text-[10px] md:text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-600">{count} طالب</span></div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleEditGroupNote(text)} className="p-2 bg-gray-800 border border-gray-600 hover:border-yellow-500 text-yellow-400 rounded-lg transition-all"><FaEdit /></button>
                            <button onClick={() => handleDeleteGroupNote(text)} className="p-2 bg-gray-800 border border-gray-600 hover:border-red-500 text-red-400 rounded-lg transition-all"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <CustomDialog isOpen={dialog.isOpen} type={dialog.type} title={dialog.title} message={dialog.message} initialValue={dialog.initialValue} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />

        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center md:p-4 z-50 font-sans">
        <div className="bg-gray-900 w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col border-0 md:border border-gray-700">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-2 flex justify-between items-center flex-shrink-0">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar flex-1 pb-1 md:pb-0">
                    {[
                        { id: 'group_note', label: 'جماعية', fullLabel: 'ملاحظة جماعية', icon: <FaUsers /> },
                        { id: 'student_history', label: 'السجل', fullLabel: 'سجل الطالب', icon: <FaClipboardList /> },
                        { id: 'private_note', label: 'خاصة', fullLabel: 'ملاحظة خاصة', icon: <FaUser /> },
                        { id: 'group_history', label: 'الأرشيف', fullLabel: 'سجل الملاحظات الجماعية', icon: <FaHistory /> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}>
                            {tab.icon} <span className="hidden md:inline">{tab.fullLabel}</span> <span className="inline md:hidden">{tab.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-red-600 rounded-full transition-colors mx-1"><FaTimes size={20} /></button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                {activeTab !== 'group_history' && (
                    <StudentSelector students={students} selectedIds={selectedStudentIds} onSelect={setSelectedStudentIds} mode={['student_history', 'private_note'].includes(activeTab) ? 'single' : 'multi'} />
                )}
                {activeTab === 'group_note' && renderAddNoteSection(false)}
                {activeTab === 'student_history' && renderStudentHistory()}
                {activeTab === 'private_note' && renderAddNoteSection(true)}
                {activeTab === 'group_history' && renderGroupHistory()}
            </div>
        </div>
        </div>
    </>
  );
};

export default NotesModal;
