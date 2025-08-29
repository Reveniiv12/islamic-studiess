import React from "react";
import { FaUpload, FaCamera, FaUserCircle } from "react-icons/fa";

const GradeModal = ({
    title,
    studentData,
    setStudentData,
    onSave,
    onCancel,
    isAddForm,
    showCamera,
    setShowCamera,
    startCamera,
    capturePhoto,
    stopCamera,
    videoRef,
    canvasRef,
    handleFileUpload,
    filePhotoInputRef
}) => {
    return (
        <div className="mb-4 md:mb-8 p-4 md:p-6 rounded-xl bg-gray-800 shadow-lg max-w-full md:max-w-lg mx-auto border border-gray-700">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-400 text-right">{title}</h3>
            <div className="flex items-center justify-center mb-4">
                <img src={studentData.photo || '/images/1.webp'} alt="صورة الطالب" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
            </div>
            <input type="text" placeholder="اسم الطالب" value={studentData.name} onChange={(e) => setStudentData({ ...studentData, name: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
            <input type="text" placeholder="السجل المدني" value={studentData.nationalId} onChange={(e) => setStudentData({ ...studentData, nationalId: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
            <input type="text" placeholder="رقم ولي الأمر" value={studentData.parentPhone || ''} onChange={(e) => setStudentData({ ...studentData, parentPhone: e.target.value })} className="w-full mb-3 p-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-right text-sm" />
            <div className="flex flex-col gap-2 mb-4">
                <label className="block text-sm font-medium text-gray-300 text-right">{isAddForm ? "إضافة صورة الطالب:" : "تغيير صورة الطالب:"}</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => filePhotoInputRef.current.click()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-md text-sm"
                    >
                        <FaUpload /> رفع صورة
                    </button>
                    <input
                        type="file"
                        ref={filePhotoInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => { setShowCamera(true); startCamera(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md text-sm"
                    >
                        <FaCamera /> التقاط صورة
                    </button>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={onSave} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm">
                    حفظ
                </button>
                <button onClick={onCancel} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm">
                    إلغاء
                </button>
            </div>
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" dir="rtl">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-blue-400 text-right">التقاط صورة</h3>
                        <video ref={videoRef} autoPlay className="w-full h-auto rounded-lg mb-4 border border-gray-600"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="flex gap-2">
                            <button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md text-sm">
                                <FaCamera /> التقاط
                            </button>
                            <button onClick={() => { setShowCamera(false); stopCamera(); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeModal;