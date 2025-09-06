import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaUpload, FaTrash, FaQrcode, FaFilePdf, FaArrowRight, FaUserEdit } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FileViewer from '../components/FileViewer';
import { v4 as uuidv4 } from 'uuid';

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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));
  
  const isPDF = file.type === 'application/pdf';

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className="relative flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-move transform transition-transform hover:scale-105 hover:shadow-xl"
      data-handler-id={handlerId}
      onClick={() => onClick(index)}
    >
      <button onClick={(e) => { e.stopPropagation(); onRemove(file.id); }} className="absolute top-2 left-2 text-red-500 hover:text-red-300 transition-colors z-10 p-1">
        <FaTrash />
      </button>
      <div className="flex items-center justify-center w-full h-48 mb-4">
        {isPDF ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <FaFilePdf size={64} className="text-red-500 mb-2" />
            <p className="text-sm text-gray-400">ملف PDF</p>
          </div>
        ) : (
          <img src={file.url} alt={file.name} className="w-full h-full object-contain rounded-md" />
        )}
      </div>
      <div className="absolute bottom-0 w-full p-2 bg-gray-900 bg-opacity-70 text-center text-white text-sm truncate">
        {file.name}
      </div>
    </div>
  );
};

const Portfolio = () => {
  const [files, setFiles] = useState([]);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState({
    name: '',
    semester: '',
    course: '',
    school: '',
    year: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = session.user;
        const publicUrl = `${window.location.origin}/portfolio/${user.id}`;
        setQrCodeData(publicUrl);
        fetchData(user.id);
      } else {
        navigate('/login');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  const fetchData = async (userId) => {
    // جلب الملفات
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (filesError) {
      console.error('Error fetching files:', filesError);
    } else {
      setFiles(filesData);
    }

    // جلب بيانات المعلم
    const { data: teacherInfoData, error: teacherInfoError } = await supabase
      .from('teacher_info')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (teacherInfoError && teacherInfoError.code !== 'PGRST116') {
      console.error('Error fetching teacher info:', teacherInfoError);
    } else if (teacherInfoData) {
      setTeacherInfo(teacherInfoData);
    }
  };

  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('يجب تسجيل الدخول لرفع الملفات.');
      return;
    }

    for (const file of uploadedFiles) {
      const fileId = uuidv4();
      const fileExtension = file.name.split('.').pop();
      const newFileName = `${fileId}.${fileExtension}`;
      const filePath = `${user.id}/${newFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      const { data: publicURLData } = supabase.storage
        .from('portfolio-files')
        .getPublicUrl(filePath);

      const { data: insertData, error: insertError } = await supabase
        .from('files')
        .insert([
          { 
            user_id: user.id,
            name: file.name,
            url: publicURLData.publicUrl,
            type: file.type,
            size: file.size,
            storage_path: filePath
          },
        ]);

      if (insertError) {
        console.error('Error saving file data to database:', insertError);
      } else {
        fetchData(user.id);
      }
    }
  };

  const removeFile = async (id) => {
    const fileToRemove = files.find(f => f.id === id);
    if (!fileToRemove) return;

    const { error: storageError } = await supabase.storage
      .from('portfolio-files')
      .remove([fileToRemove.storage_path]);
      
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      return;
    }

    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting file data from database:', dbError);
    } else {
      setFiles(files.filter(file => file.id !== id));
    }
  };

  const moveFile = (dragIndex, hoverIndex) => {
    const updatedFiles = [...files];
    const [draggedItem] = updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedItem);
    setFiles(updatedFiles);
  };
  
  const saveTeacherInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('teacher_info')
      .upsert({ user_id: user.id, ...teacherInfo }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving teacher info:', error);
    } else {
      setIsEditModalOpen(false);
    }
  };
  
  const openViewer = (index) => {
    setCurrentFileIndex(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setCurrentFileIndex(null);
  };

  const showNext = () => {
    if (currentFileIndex < files.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  const showPrev = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };
  
  const handleBackToDashboard = () => {
    navigate('/teacher-dashboard');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-['Noto_Sans_Arabic',sans-serif]" dir="rtl">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 text-center sm:text-right">
          <button 
            onClick={handleBackToDashboard} 
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors mb-4 sm:mb-0"
          >
            <span>العودة للوحة التحكم</span>
            <FaArrowRight />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-400 flex-1">ملف الإنجاز</h1>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
              <FaUpload />
              رفع ملف جديد
            </label>
            <input
                id="file-upload"
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                accept=".pdf, image/*"
            />
            <button onClick={() => setIsEditModalOpen(true)} className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
              <FaUserEdit />
              تعديل بيانات المعلم
            </button>
          </div>
          
          <div className="flex-1 w-full md:w-auto mt-4 md:mt-0">
            <div className="p-4 bg-gray-900 rounded-lg flex flex-col items-center shadow-md">
              <h3 className="text-xl font-semibold mb-2 text-white">رمز QR للعرض العام</h3>
              {qrCodeData ? (
                <QRCodeSVG value={qrCodeData} size={128} level="M" includeMargin={false} fgColor="#fff" bgColor="#111827" />
              ) : (
                <div className="w-32 h-32 bg-gray-800 flex items-center justify-center text-gray-400">جاري التحميل...</div>
              )}
              <a 
                href={qrCodeData} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-2 text-sm text-blue-400 hover:underline"
              >
                عرض الصفحة العامة
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {files.map((file, index) => (
            <DraggableFile
              key={file.id}
              file={file}
              index={index}
              moveFile={moveFile}
              onRemove={removeFile}
              onClick={openViewer}
            />
          ))}
        </div>

        {files.length === 0 && (
          <p className="text-center text-gray-400 mt-10">لا توجد ملفات مرفوعة حتى الآن. ابدأ برفع ملفاتك!</p>
        )}
      </div>

      {isViewerOpen && (
        <FileViewer
          files={files}
          currentIndex={currentFileIndex}
          onClose={closeViewer}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
      
      {/* Edit Teacher Info Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4" dir="rtl">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-auto text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">تعديل بيانات العرض العام</h3>
            <div className="space-y-4 text-right">
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم المدرس</label>
                <input
                  type="text"
                  value={teacherInfo.name || ''}
                  onChange={(e) => setTeacherInfo({ ...teacherInfo, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">اسم المدرسة</label>
                <input
                  type="text"
                  value={teacherInfo.school || ''}
                  onChange={(e) => setTeacherInfo({ ...teacherInfo, school: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">المقرر الدراسي</label>
                <input
                  type="text"
                  value={teacherInfo.course || ''}
                  onChange={(e) => setTeacherInfo({ ...teacherInfo, course: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">الفصل الدراسي</label>
                <input
                  type="text"
                  value={teacherInfo.semester || ''}
                  onChange={(e) => setTeacherInfo({ ...teacherInfo, semester: e.target.value })}
                  className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">السنة الدراسية</label>
                <input
                  type="text"
                  value={teacherInfo.year || ''}
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
    </DndProvider>
  );
};

export default Portfolio;
