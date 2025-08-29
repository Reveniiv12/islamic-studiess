// src/pages/Portfolio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // تم تعديل هذا السطر
import { FaUpload, FaTrash, FaQrcode, FaFilePdf, FaArrowRight, FaUserEdit } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FileViewer from '../components/FileViewer';

const ItemTypes = {
  FILE: 'file',
};

const DraggableFile = ({ file, index, moveFile, onRemove, onClick }) => {
  const ref = useRef(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.FILE,
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
      moveFile(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: () => ({ id: file.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="bg-gray-700 text-white rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow flex items-center justify-between cursor-pointer"
      data-handler-id={handlerId}
      onClick={() => onClick(file)}
    >
      <div className="flex items-center gap-2">
        <FaFilePdf className="text-red-400 text-lg" />
        <span className="truncate">{file.name}</span>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
        className="text-red-500 hover:text-red-400 p-1 rounded-full transition"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default function Portfolio() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({
    semester: "",
    year: "",
  });
  const fileInputRef = useRef(null);
  const fileDropRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // جلب بيانات الطالب عند التحميل
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          setLoading(true);
          
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error || !data) {
            console.error("Error fetching student data:", error);
            setLoading(false);
            return;
          }

          setStudent(data);
          setFiles(data.portfolio_files || []);
          setTeacherInfo({
            semester: data.semester || "",
            year: data.year || ""
          });
          setLoading(false);
        } else {
          navigate('/login');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  // دالة الرفع
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    const fileName = `${user.id}/${file.name}-${Date.now()}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('portfolios') // اسم البكت (bucket)
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading file:", error);
        alert('فشل رفع الملف.');
        return;
      }
      
      const publicURL = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/portfolios/${fileName}`;
      
      const newFile = {
        name: file.name,
        url: publicURL,
        id: fileName,
      };

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      
      // تحديث ملفات الإنجاز في جدول students
      const { error: updateError } = await supabase
        .from("students")
        .update({ portfolio_files: updatedFiles })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating portfolio files:", updateError);
        alert('تم رفع الملف ولكن فشل تحديث قاعدة البيانات.');
        return;
      }

      alert('تم رفع الملف بنجاح!');
    } catch (error) {
      console.error("Error uploading file:", error);
      alert('فشل رفع الملف.');
    }
  };

  // دالة الحذف
  const handleRemoveFile = async (fileId) => {
    try {
      // حذف الملف من Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('portfolios')
        .remove([fileId]);

      if (deleteError) {
        console.error("Error deleting file:", deleteError);
        alert('فشل حذف الملف من التخزين.');
        return;
      }
      
      // تحديث ملفات الإنجاز في جدول students
      const updatedFiles = files.filter(f => f.id !== fileId);
      const { error: updateError } = await supabase
        .from("students")
        .update({ portfolio_files: updatedFiles })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating portfolio files after deletion:", updateError);
        alert('تم حذف الملف ولكن فشل تحديث قاعدة البيانات.');
        return;
      }

      setFiles(updatedFiles);
      alert('تم حذف الملف بنجاح!');
    } catch (error) {
      console.error("Error removing file:", error);
      alert('فشل حذف الملف.');
    }
  };

  const saveTeacherInfo = async () => {
    try {
      const { error } = await supabase
        .from("students")
        .update({
          semester: teacherInfo.semester,
          year: teacherInfo.year,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving teacher info:", error);
        alert("فشل حفظ البيانات.");
        return;
      }

      alert("تم حفظ بيانات المعلم بنجاح!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error saving teacher info:", error);
      alert("فشل حفظ البيانات.");
    }
  };
  
  const moveFile = (dragIndex, hoverIndex) => {
    const dragFile = files[dragIndex];
    const updatedFiles = [...files];
    updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, dragFile);
    setFiles(updatedFiles);
    // تحديث الترتيب في قاعدة البيانات
    supabase
      .from('students')
      .update({ portfolio_files: updatedFiles })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) console.error("Error reordering files:", error);
      });
  };

  // ... بقية دوال الكود
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const openFileViewer = (file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const closeFileViewer = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
  };

  const getPublicPortfolioLink = () => {
    return `${window.location.origin}/portfolio/${user.id}`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-gray-900 min-h-screen text-gray-100 p-8 font-['Noto_Sans_Arabic',sans-serif] text-right">
        {loading ? (
          <p className="text-center">جاري التحميل...</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">ملف إنجاز الطالب: {student?.name}</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition"
                  title="تعديل معلومات المعلم"
                >
                  <FaUserEdit />
                </button>
                <a
                  href={getPublicPortfolioLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
                  title="عرض ملف الإنجاز العام"
                >
                  <FaArrowRight />
                </a>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDraggingOver ? "border-blue-500 bg-gray-800" : "border-gray-700"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full text-lg font-semibold transition"
              >
                <FaUpload className="inline-block ml-2" />
                رفع ملف
              </button>
              <p className="mt-2 text-gray-400">أو اسحب الملف وأفلته هنا</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {files.map((file, index) => (
                <DraggableFile
                  key={file.id}
                  index={index}
                  file={file}
                  moveFile={moveFile}
                  onRemove={handleRemoveFile}
                  onClick={openFileViewer}
                />
              ))}
            </div>

            {selectedFile && isModalOpen && (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="relative w-full max-w-4xl max-h-full bg-white rounded-lg shadow-xl overflow-hidden">
                  <FileViewer file={selectedFile} />
                  <button
                    onClick={closeFileViewer}
                    className="absolute top-2 right-2 text-gray-800 bg-white rounded-full p-2 hover:bg-gray-200 transition"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {isEditModalOpen && (
              <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">تعديل معلومات المعلم</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">الاسم</label>
                      <input
                        type="text"
                        value={student?.teacherName || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">المدرسة</label>
                      <input
                        type="text"
                        value={student?.schoolName || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">الفصل الدراسي</label>
                      <input
                        type="text"
                        value={teacherInfo.semester}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, semester: e.target.value })}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">السنة الدراسية</label>
                      <input
                        type="text"
                        value={teacherInfo.year}
                        onChange={(e) => setTeacherInfo({ ...teacherInfo, year: e.target.value })}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={saveTeacherInfo}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DndProvider>
  );
}
