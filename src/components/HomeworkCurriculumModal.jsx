import React, { useState } from 'react';
import { getHijriToday } from '../utils/recitationUtils';

const HomeworkCurriculumModal = ({ homeworkCurriculum, onClose, onSave }) => {
    const [newPart, setNewPart] = useState({
        name: '',
        type: 'homework', // 'homework', 'performanceTask', or 'test'
        dueDate: getHijriToday()
    });
    const [editingPart, setEditingPart] = useState(null);

    // Dynamic options for the name dropdown based on type and max count
    const getOptionsForType = (type) => {
        let count = 0;
        let prefix = '';
        if (type === 'homework') {
            count = 10;
            prefix = 'واجب ';
        } else if (type === 'performanceTask') {
            count = 3;
            prefix = 'مهمة أدائية ';
        } else if (type === 'test') {
            count = 2;
            prefix = 'اختبار ';
        }
        
        const existingNames = homeworkCurriculum.filter(p => p.type === type).map(p => p.name);
        
        const options = [];
        for (let i = 1; i <= count; i++) {
            const optionName = `${prefix}${i}`;
            if (!existingNames.includes(optionName) || (editingPart && editingPart.name === optionName)) {
                options.push(optionName);
            }
        }
        return options;
    };

    const handleAddPart = () => {
        if (newPart.name && newPart.dueDate) {
            const updatedCurriculum = [...homeworkCurriculum, { ...newPart, id: Date.now() }];
            onSave(updatedCurriculum);
            setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
        }
    };

    const handleEditPart = (part) => {
        setEditingPart(part);
        setNewPart(part);
    };

    const handleUpdatePart = () => {
        if (newPart.name && newPart.dueDate) {
            const updatedCurriculum = homeworkCurriculum.map(part =>
                part.id === editingPart.id ? newPart : part
            );
            onSave(updatedCurriculum);
            setNewPart({ name: '', type: 'homework', dueDate: getHijriToday() });
            setEditingPart(null);
        }
    };

    const handleDeletePart = (id) => {
        const updatedCurriculum = homeworkCurriculum.filter(part => part.id !== id);
        onSave(updatedCurriculum);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-100">الواجبات والمهام الأدائية والاختبارات</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>

                    <div className="mb-6 p-4 border border-gray-700 rounded-xl bg-gray-700">
                        <h4 className="font-semibold mb-2 text-gray-100">{editingPart ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">نوع المهمة</label>
                                <select
                                    value={newPart.type}
                                    onChange={(e) => setNewPart({ ...newPart, type: e.target.value, name: '' })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="homework">واجب</option>
                                    <option value="performanceTask">مهمة أدائية</option>
                                    <option value="test">اختبار</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">اسم المهمة</label>
                                <select
                                    value={newPart.name}
                                    onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">اختر اسماً</option>
                                    {getOptionsForType(newPart.type).map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">تاريخ الاستحقاق (هجري)</label>
                                <input
                                    type="text"
                                    value={newPart.dueDate}
                                    onChange={(e) => setNewPart({ ...newPart, dueDate: e.target.value })}
                                    className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="YYYY/MM/DD"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            {editingPart ? (
                                <button onClick={handleUpdatePart} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-500 transition-colors">تحديث</button>
                            ) : (
                                <button onClick={handleAddPart} className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">إضافة</button>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 text-gray-100">الواجبات والمهام المضافة</h4>
                        {homeworkCurriculum.length > 0 ? (
                            <ul className="divide-y divide-gray-600">
                                {homeworkCurriculum.map(part => (
                                    <li key={part.id} className="py-2 flex justify-between items-center text-sm">
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-300">{part.name}</span>
                                            <span className="text-gray-400 mr-2">({part.type === 'homework' ? 'واجب' : part.type === 'performanceTask' ? 'مهمة أدائية' : 'اختبار'})</span>
                                            <span className="text-gray-500 block">تاريخ الاستحقاق: {part.dueDate}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditPart(part)} className="text-blue-400 hover:text-blue-300">تعديل</button>
                                            <button onClick={() => handleDeletePart(part.id)} className="text-red-400 hover:text-red-300">حذف</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-sm">لا توجد واجبات أو مهام أدائية أو اختبارات مضافة.</p>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-end">
                    <button onClick={onClose} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-500 transition-colors">إغلاق</button>
                </div>
            </div>
        </div>
    );
};

export default HomeworkCurriculumModal;