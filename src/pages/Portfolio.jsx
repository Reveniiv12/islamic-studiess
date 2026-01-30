import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaUpload, 
  FaTrash, 
  FaUserEdit, 
  FaExternalLinkAlt, 
  FaFilePdf, 
  FaTimes, 
  FaGripVertical, 
  FaExclamationTriangle,
  FaHome
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import FileViewer from '../components/FileViewer';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = { FILE: 'file' };

const DraggableFile = ({ file, index, moveFile, onDeleteClick, onClick }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: { id: file.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.FILE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveFile(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="group bg-slate-800/40 border border-slate-700 rounded-2xl p-4 hover:border-blue-500/50 transition-all shadow-sm relative"
    >
      <div className="absolute top-2 left-2 text-slate-600 hover:text-white cursor-move p-2 z-20">
        <FaGripVertical />
      </div>

      <div 
        className="aspect-video bg-slate-950 rounded-xl mb-4 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-800" 
        onClick={() => onClick(index)}
      >
        {file.type.includes('pdf') ? (
          <FaFilePdf size={40} className="text-red-500" />
        ) : (
          <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs font-bold truncate text-slate-300 w-40">{file.name}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(file);
          }} 
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all z-20"
        >
          <FaTrash size={14}/>
        </button>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({ 
    name: '', 
    school: '', 
    photo: '', 
    semester: '',
    userId: '' // تخزين المعرف لاستخدامه في الـ QR
  });
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // جلب بيانات المستخدم الحالي من نظام المصادقة
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    
    // جلب ملفات الإنجاز
    const { data: fData } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    // جلب البيانات من جدول settings الموحد
    const { data: sData } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'general')
      .single();
    
    setFiles(fData || []);

    if (sData) {
      setTeacherInfo({
        name: sData.teacher_name || 'اسم المعلم',
        school: sData.school_name || 'اسم المدرسة',
        photo: sData.teacher_photo || '/images/default_teacher.png',
        semester: sData.current_semester || 'غير محدد',
        userId: user.id // حفظ الـ ID الفعلي للمستخدم هنا
      });
    }
    setLoading(false);
  };

  const moveFile = (dragIndex, hoverIndex) => {
    const updatedFiles = [...files];
    const [draggedItem] = updatedFiles.splice(dragIndex, 1);
    updatedFiles.splice(hoverIndex, 0, draggedItem);
    setFiles(updatedFiles);
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of uploadedFiles) {
      const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('portfolio-files').upload(filePath, file);
      if (uploadError) continue;

      const { data: { publicUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
      
      await supabase.from('files').insert([{ 
        user_id: user.id, 
        name: file.name, 
        url: publicUrl, 
        type: file.type,
        storage_path: filePath 
      }]);
    }
    fetchData();
    setUploading(false);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    if (fileToDelete.storage_path) {
      await supabase.storage.from('portfolio-files').remove([fileToDelete.storage_path]);
    }
    const { error } = await supabase.from('files').delete().eq('id', fileToDelete.id);
    if (!error) {
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
    }
  };

  if (loading) return <div className="h-screen bg-[#0f172a] flex items-center justify-center text-blue-400 font-bold tracking-widest">جاري تحميل لوحة التحكم...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Noto_Sans_Arabic'] flex flex-col lg:flex-row" dir="rtl">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-6 space-y-6 shrink-0">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <img 
                src={teacherInfo.photo} 
                className="w-full h-full rounded-2xl object-cover border-2 border-blue-500 shadow-lg shadow-blue-500/20" 
                alt="Teacher" 
              />
            </div>
            <h2 className="text-xl font-bold truncate text-white">{teacherInfo.name}</h2>
            <p className="text-slate-500 text-sm mt-1">{teacherInfo.school}</p>
            <div className="mt-3 inline-block px-4 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800">
               {teacherInfo.semester}
            </div>
          </div>

          <button 
            onClick={() => navigate('/')} 
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 text-sm font-semibold"
          >
            <FaHome /> العودة للرئيسية
          </button>

          {/* إصلاح الـ QR Code ليوجه للمسار العام المعرف في App.jsx */}
          <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center">
            {teacherInfo.userId && (
              <QRCodeSVG 
                value={`${window.location.origin}/portfolio/${teacherInfo.userId}`} 
                size={140} 
              />
            )}
            <p className="text-black text-[10px] mt-2 font-bold uppercase tracking-wider">QR الملف العام</p>
          </div>

          <a 
            href={`/portfolio/${teacherInfo.userId}`} 
            target="_blank" 
            rel="noreferrer" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-blue-600/20"
          >
            <FaExternalLinkAlt size={14}/> معاينة الملف العام
          </a>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
                <h1 className="text-3xl font-black text-white">إدارة ملف الإنجاز</h1>
                <p className="text-slate-500 text-sm mt-1">قم بترتيب ملفاتك الرقمية وتوثيق إنجازاتك</p>
            </div>
            <label className={`cursor-pointer px-8 py-3 rounded-full font-bold transition-all shadow-lg ${uploading ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
              {uploading ? 'جاري الرفع...' : 'رفع ملفات جديدة'}
              <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {files.map((file, index) => (
              <DraggableFile
                key={file.id}
                file={file}
                index={index}
                moveFile={moveFile}
                onDeleteClick={(f) => {
                    setFileToDelete(f);
                    setIsDeleteModalOpen(true);
                }}
                onClick={(idx) => setCurrentFileIndex(idx)}
              />
            ))}
          </div>

          {files.length === 0 && !uploading && (
            <div className="text-center py-20 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-700">
               <p className="text-slate-500">ابدأ برفع ملفاتك الرقمية (صور أو PDF)</p>
            </div>
          )}
        </main>

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <FaExclamationTriangle size={30} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">تأكيد الحذف</h3>
              <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
                سيتم حذف هذا الملف نهائياً من ملفك العام.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all">إلغاء</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all">حذف</button>
              </div>
            </div>
          </div>
        )}

        {/* File Viewer */}
        {currentFileIndex !== null && (
          <FileViewer 
            files={files} 
            currentIndex={currentFileIndex} 
            onClose={() => setCurrentFileIndex(null)}
            onNext={() => currentFileIndex < files.length - 1 && setCurrentFileIndex(currentFileIndex + 1)}
            onPrev={() => currentFileIndex > 0 && setCurrentFileIndex(currentFileIndex - 1)}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default Portfolio;