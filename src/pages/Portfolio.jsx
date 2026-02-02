import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaUpload, 
  FaTrash, 
  FaEdit, 
  FaExternalLinkAlt, 
  FaFilePdf, 
  FaGripVertical, 
  FaExclamationTriangle,
  FaHome,
  FaFileExport,
  FaTimesCircle
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import FileViewer from '../components/FileViewer';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend'; 
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ItemTypes = { FILE: 'file' };

// --- دالة إنشاء الصورة المصغرة (تم تحسين الدقة هنا) ---
const createPdfThumbnail = async (file) => {
  const fileReader = new FileReader();
  return new Promise((resolve) => {
    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      try {
        const loadingTask = pdfjs.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        // --- التعديل: زيادة الدقة ---
        // بدلاً من 300، نجعل العرض 1000 بكسل لضمان الوضوح على شاشات الجوال عالية الدقة
        const originalViewport = page.getViewport({ scale: 1 });
        const targetWidth = 1000; 
        const scale = targetWidth / originalViewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport
        }).promise;

        // تحسين الجودة عند التحويل إلى JPEG (0.9 بدلاً من 0.8)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
        
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        resolve(null);
      }
    };
    fileReader.readAsArrayBuffer(file);
  });
};

const DraggableFile = ({ file, index, moveFile, onDeleteClick, onEditClick, onClick }) => {
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
      className="group bg-slate-800/40 border border-slate-700 rounded-2xl p-4 hover:border-blue-500/50 transition-all shadow-sm relative touch-none"
    >
      <div className="absolute top-2 left-2 text-slate-600 hover:text-white cursor-move p-2 z-20">
        <FaGripVertical />
      </div>

      <div 
        className="aspect-video bg-slate-950 rounded-xl mb-4 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-800 relative" 
        onClick={() => onClick(index)}
      >
        {file.type.includes('pdf') ? (
            file.thumbnail_url ? (
                <img 
                  src={file.thumbnail_url} 
                  loading="lazy"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  alt="PDF Thumbnail" 
                />
            ) : (
                <div className="flex flex-col items-center justify-center animate-in fade-in">
                    <FaFilePdf size={40} className="text-red-500 mb-2" />
                    <span className="text-[10px] text-slate-400">PDF File</span>
                </div>
            )
        ) : (
          <img 
            src={file.url} 
            loading="lazy"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            alt="" 
          />
        )}
      </div>

      <div className="flex justify-between items-center gap-2">
        <p className="text-xs font-bold truncate text-slate-300 flex-1" dir="auto">{file.name}</p>
        
        <div className="flex gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(file);
              }} 
              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all z-20"
              title="تعديل الاسم"
            >
              <FaEdit size={14}/>
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(file);
              }} 
              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all z-20"
              title="حذف الملف"
            >
              <FaTrash size={14}/>
            </button>
        </div>
      </div>
    </div>
  );
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({ 
    name: '', school: '', photo: '', semester: '', userId: '' 
  });
  const [loading, setLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // --- نافذة الخطأ ---
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    
    const { data: fData } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
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
        userId: user.id
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
    if(uploadedFiles.length === 0) return;

    const MAX_SIZE = 4 * 1024 * 1024; // 4MB

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    for (const file of uploadedFiles) {
      if (file.size > MAX_SIZE) {
        setErrorMessage(`عذراً، الملف "${file.name}" حجمه كبير جداً. الحد الأقصى المسموح هو 4 ميجابايت.`);
        setErrorModalOpen(true);
        continue;
      }

      const fileId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const fileName = `${fileId}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('portfolio-files').upload(filePath, file);
      if (uploadError) {
          console.error("Upload error:", uploadError);
          setErrorMessage(`حدث خطأ أثناء رفع الملف: ${file.name}`);
          setErrorModalOpen(true);
          continue;
      }

      const { data: { publicUrl: fileUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
      
      let thumbnailUrl = null;

      if (file.type.includes('pdf')) {
          // استدعاء الدالة المحسنة لإنشاء الصورة
          const thumbnailBlob = await createPdfThumbnail(file);
          if (thumbnailBlob) {
              const thumbName = `${fileId}_thumb.jpg`;
              const thumbPath = `${user.id}/${thumbName}`;
              
              const { error: thumbError } = await supabase.storage
                  .from('portfolio-files')
                  .upload(thumbPath, thumbnailBlob);
              
              if (!thumbError) {
                  const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
                      .from('portfolio-files')
                      .getPublicUrl(thumbPath);
                  thumbnailUrl = thumbPublicUrl;
              }
          }
      }

      await supabase.from('files').insert([{ 
        user_id: user.id, 
        name: file.name,
        url: fileUrl, 
        type: file.type,
        storage_path: filePath,
        thumbnail_url: thumbnailUrl
      }]);
    }
    
    await fetchData();
    setUploading(false);
  };

  const openEditModal = (file) => {
    setFileToEdit(file);
    setNewFileName(file.name);
    setIsEditModalOpen(true);
  };

  const handleUpdateName = async () => {
    if (!newFileName.trim() || !fileToEdit) return;
    setUpdatingName(true);

    const { error } = await supabase
        .from('files')
        .update({ name: newFileName })
        .eq('id', fileToEdit.id);

    if (!error) {
        setFiles(files.map(f => f.id === fileToEdit.id ? { ...f, name: newFileName } : f));
        setIsEditModalOpen(false);
        setFileToEdit(null);
    }
    setUpdatingName(false);
  };

  const handleExportPDF = async () => {
    if (files.length === 0) return;
    setIsExporting(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const fileBytes = await fetch(file.url).then(res => res.arrayBuffer());

        if (file.type.includes('pdf')) {
          const srcPdf = await PDFDocument.load(fileBytes);
          const indices = srcPdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(srcPdf, indices);
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } else {
          let image;
          if (file.type.includes('png')) {
            image = await mergedPdf.embedPng(fileBytes);
          } else {
            image = await mergedPdf.embedJpg(fileBytes);
          }
          
          const page = mergedPdf.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }

      const pdfBytes = await mergedPdf.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${teacherInfo.name || 'portfolio'}_merged.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      setErrorMessage('حدث خطأ أثناء تصدير الملفات. يرجى المحاولة لاحقاً.');
      setErrorModalOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    if (fileToDelete.storage_path) {
      await supabase.storage.from('portfolio-files').remove([fileToDelete.storage_path]);
    }

    if (fileToDelete.thumbnail_url) {
        const thumbPath = fileToDelete.storage_path.replace(/(\.[^.]+)$/, '_thumb.jpg');
        await supabase.storage.from('portfolio-files').remove([thumbPath]);
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
    <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
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
            
            <div className="flex gap-3">
                {files.length > 0 && (
                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>جاري التصدير...</>
                        ) : (
                            <><FaFileExport /> تصدير PDF</>
                        )}
                    </button>
                )}

                <label className={`cursor-pointer px-8 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 ${uploading ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                    <FaUpload />
                    {uploading ? 'جاري الرفع...' : 'رفع ملفات'}
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>
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
                onEditClick={openEditModal}
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

        {/* --- Error Modal --- */}
        {errorModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setErrorModalOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
                <FaExclamationTriangle size={30} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-4">تنبيه</h3>
              <p className="text-slate-300 text-center text-sm mb-8 leading-relaxed">
                {errorMessage}
              </p>
              <button 
                onClick={() => setErrorModalOpen(false)} 
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <FaTrash size={30} />
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

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                <FaEdit size={30} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-6">تعديل اسم الملف</h3>
              
              <input 
                type="text" 
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 mb-6 text-center"
                placeholder="أدخل الاسم الجديد..."
              />

              <div className="flex gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all">إلغاء</button>
                <button 
                    onClick={handleUpdateName} 
                    disabled={updatingName}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                    {updatingName ? 'جاري الحفظ...' : 'حفظ'}
                </button>
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