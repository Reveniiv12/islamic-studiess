// src/components/CurriculumModal.jsx
import React, { useState } from 'react';

// دالة جديدة لجلب تاريخ اليوم بالتقويم الهجري بصيغة YYYY/MM/DD
const getHijriToday = () => {
    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(today);
    const [day, month, year] = hijriDate.split('/');
    return `${year}/${month}/${day}`;
};

const CurriculumModal = ({ curriculum, onClose, onSave }) => {
  const [newPart, setNewPart] = useState({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
  const [editingPart, setEditingPart] = useState(null);

  const handleAddPart = () => {
    if (newPart.start && newPart.end && newPart.dueDate) {
      const updatedCurriculum = [...curriculum, { ...newPart, id: Date.now() }];
      onSave(updatedCurriculum);
      setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
    }
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setNewPart(part);
  };

  const handleUpdatePart = () => {
    if (newPart.start && newPart.end && newPart.dueDate) {
      const updatedCurriculum = curriculum.map(part =>
        part.id === editingPart.id ? newPart : part
      );
      onSave(updatedCurriculum);
      setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' });
      setEditingPart(null);
    }
  };

  const handleDeletePart = (id) => {
    const updatedCurriculum = curriculum.filter(part => part.id !== id);
    onSave(updatedCurriculum);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        <div className="p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-100">منهج التلاوة والحفظ</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
          </div>
          <div className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-700">
            <h4 className="font-semibold mb-2 text-gray-100">{editingPart ? 'تعديل الجزء' : 'إضافة جزء جديد'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">نوع التسميع</label>
                    <select
                        value={newPart.type}
                        onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
                        className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="memorization">حفظ</option>
                        <option value="recitation">تلاوة</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">تاريخ التسليم (هجري)</label>
                    <input
                        type="text"
                        value={newPart.dueDate}
                        onChange={(e) => setNewPart({ ...newPart, dueDate: e.target.value })}
                        className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="YYYY/MM/DD"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">من سورة</label>
                    <input
                        type="text"
                        value={newPart.start}
                        onChange={(e) => setNewPart({ ...newPart, start: e.target.value })}
                        className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">إلى سورة</label>
                    <input
                        type="text"
                        value={newPart.end}
                        onChange={(e) => setNewPart({ ...newPart, end: e.target.value })}
                        className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                {editingPart ? (
                    <button
                        onClick={handleUpdatePart}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                    >
                        حفظ التعديل
                    </button>
                ) : (
                    <button
                        onClick={handleAddPart}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                    >
                        إضافة
                    </button>
                )}
                {editingPart && (
                    <button
                        onClick={() => { setEditingPart(null); setNewPart({ start: '', end: '', dueDate: getHijriToday(), type: 'memorization' }); }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500 transition-colors"
                    >
                        إلغاء
                    </button>
                )}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-2 text-gray-100">المنهج الحالي</h4>
            <div className="space-y-2">
                {curriculum.length > 0 ? (
                    curriculum.map(part => (
                        <div key={part.id} className="p-4 bg-gray-700 rounded-xl shadow-sm flex justify-between items-center border border-gray-600">
                            <div className="text-gray-100">
                                <p className="font-semibold">{part.start} - {part.end}</p>
                                <p className="text-sm text-gray-400">
                                    <span className="ml-2">{part.type === 'memorization' ? 'حفظ' : 'تلاوة'}</span>
                                    <span>(تاريخ التسليم: {part.dueDate})</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditPart(part)}
                                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-500 transition-colors"
                                >
                                    تعديل
                                </button>
                                <button
                                    onClick={() => handleDeletePart(part.id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-500 transition-colors"
                                >
                                    حذف
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">لم يتم إضافة أي أجزاء للمنهج بعد.</p>
                )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition-colors">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumModal;