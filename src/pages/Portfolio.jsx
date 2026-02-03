import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  FaUpload, FaTrash, FaEdit, FaExternalLinkAlt, FaFilePdf, FaGripVertical, 
  FaExclamationTriangle, FaHome, FaFileExport, FaFolderPlus, FaLayerGroup,
  FaLock, FaUnlock, FaCog, FaBoxOpen
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import FileViewer from '../components/FileViewer';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ItemTypes = { 
  FILE: 'file',
  CATEGORY: 'category' 
};

// --- دالة إنشاء الصورة المصغرة ---
const createPdfThumbnail = async (file) => {
  const fileReader = new FileReader();
  return new Promise((resolve) => {
    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      try {
        const loadingTask = pdfjs.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const originalViewport = page.getViewport({ scale: 1 });
        const targetWidth = 1000; 
        const scale = targetWidth / originalViewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      } catch (error) {
        console.error("Error generating thumbnail:", error);
        resolve(null);
      }
    };
    fileReader.readAsArrayBuffer(file);
  });
};

// --- مكون الملف القابل للسحب والترتيب ---
const DraggableFile = ({ file, index, onDeleteClick, onEditClick, onClick, isEditMode, moveFile, onDragEnd }) => {
  const ref = useRef(null);
  
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.FILE,
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item, monitor) {
      if (!ref.current || !isEditMode) return;
      
      const dragIndex = item.index; 
      const hoverIndex = index;     
      const sourceListId = item.categoryId; 
      const targetListId = file.category_id; 

      // إذا كان السحب داخل نفس التصنيف
      if (sourceListId === targetListId) {
          // إذا كان العنصر فوق نفسه، لا تفعل شيئاً
          if (dragIndex === hoverIndex) return;

          // --- التعديل هنا: تم إزالة الحسابات الهندسية (BoundingRect) ---
          // في نظام الشبكة (Grid)، الحسابات الدقيقة تسبب مشاكل عند الانتقال بين الأسطر
          // التبديل المباشر عند تغيير الـ Index هو الحل الأكثر استقراراً

          moveFile(dragIndex, hoverIndex, sourceListId, targetListId);
          
          // تحديث الـ index للعنصر المسحوب ليمثل موقعه الجديد فوراً
          item.index = hoverIndex;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FILE,
    item: () => {
      return { id: file.id, index, categoryId: file.category_id };
    },
    canDrag: isEditMode,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: (item, monitor) => {
        if (onDragEnd) {
            onDragEnd(); 
        }
    }
  });

  drag(drop(ref));

  return (
    <div 
      ref={ref}
      style={{ opacity: isDragging ? 0 : 1 }} 
      data-handler-id={handlerId}
      className={`group bg-slate-800/40 border border-slate-700 rounded-2xl p-4 transition-all shadow-sm relative ${isEditMode ? 'hover:border-blue-500/50 cursor-move' : ''}`}
    >
      {isEditMode && (
        <div className="absolute top-2 left-2 text-white bg-blue-600 p-1.5 rounded-md z-20 shadow-lg pointer-events-none opacity-70">
          <FaGripVertical size={10} />
        </div>
      )}

      <div 
        className="aspect-video bg-slate-950 rounded-xl mb-4 flex items-center justify-center cursor-pointer overflow-hidden border border-slate-800 relative" 
        onClick={() => !isEditMode && onClick()} 
      >
        {file.type.includes('pdf') ? (
            file.thumbnail_url ? (
                <img src={file.thumbnail_url} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="PDF" />
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <FaFilePdf size={40} className="text-red-500 mb-2" />
                    <span className="text-[10px] text-slate-400">PDF</span>
                </div>
            )
        ) : (
          <img src={file.url} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
        )}
      </div>

      <div className="flex justify-between items-center gap-2">
        <p className="text-xs font-bold truncate text-slate-300 flex-1" dir="auto">{file.name}</p>
        <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEditClick(file); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"><FaEdit size={14}/></button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteClick(file); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><FaTrash size={14}/></button>
        </div>
      </div>
    </div>
  );
};

// --- منطقة "غير مصنف" ---
const UnclassifiedZone = ({ children, onDropFile, uploading, onUpload, maxFileSize }) => {
    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.FILE,
        drop: (item) => onDropFile(item.id, null), 
        collect: (monitor) => ({ isOver: monitor.isOver() }),
    });

    return (
        <div ref={drop} className={`mt-10 pt-10 border-t border-slate-800 transition-colors ${isOver ? 'bg-blue-900/10 rounded-3xl p-4 border border-blue-500' : ''}`}>
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FaBoxOpen className="text-slate-500 text-xl" />
                    <h3 className="text-xl font-bold text-slate-400">ملفات غير مصنفة</h3>
                </div>
                <div className="flex flex-col items-end">
                    <label className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${uploading ? 'bg-slate-800 text-slate-500' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                        <FaUpload size={14} />
                        {uploading ? '...' : 'رفع هنا'}
                        <input type="file" multiple className="hidden" onChange={(e) => onUpload(e, null)} disabled={uploading} />
                    </label>
                    <span className="text-[9px] text-slate-500 mt-1 pl-1">الحد الأقصى: {maxFileSize}MB</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[100px]">
                {children}
                {React.Children.count(children) === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">
                        {isOver ? 'أفلت الملف لجعله غير مصنف' : 'لا توجد ملفات غير مصنفة'}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- مكون القسم (Category) ---
const DraggableCategory = ({ category, index, moveCategory, children, onDelete, onEdit, onUpload, uploading, isEditMode, onDropFile, maxFileSize }) => {
  const ref = useRef(null);
  
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CATEGORY,
    collect(monitor) { return { handlerId: monitor.getHandlerId() }; },
    hover(item, monitor) {
      if (!ref.current || !isEditMode) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      moveCategory(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isOver }, dropFile] = useDrop({
    accept: ItemTypes.FILE,
    drop: (item) => onDropFile(item.id, category.id), 
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CATEGORY,
    item: { id: category.id, index },
    canDrag: isEditMode,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(dropFile(ref)));

  return (
    <div 
      ref={ref} 
      style={{ opacity: isDragging ? 0.3 : 1 }}
      data-handler-id={handlerId}
      className={`mb-10 bg-slate-900/50 border rounded-3xl p-6 relative transition-all duration-200 ${isOver ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isEditMode && (
             <div className="cursor-move text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg">
                <FaGripVertical />
             </div>
          )}
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <FaLayerGroup className="text-blue-500 text-lg" />
             {category.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex flex-col items-end mr-4">
              <label className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${uploading ? 'bg-slate-800 text-slate-500' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'}`}>
                  <FaUpload size={14} />
                  {uploading ? '...' : 'رفع هنا'}
                  <input type="file" multiple className="hidden" onChange={(e) => onUpload(e, category.id)} disabled={uploading} />
              </label>
              <span className="text-[9px] text-slate-500 mt-1 pl-1">الحد الأقصى: {maxFileSize}MB</span>
           </div>
           
           <button onClick={() => onEdit(category)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"><FaEdit /></button>
           <button onClick={() => onDelete(category)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-lg"><FaTrash /></button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[100px]">
        {children}
        {React.Children.count(children) === 0 && (
           <div className={`col-span-full border-2 border-dashed rounded-xl flex items-center justify-center p-8 text-sm transition-colors ${isOver ? 'border-blue-500 text-blue-400 bg-blue-900/10' : 'border-slate-800 text-slate-600'}`}>
             {isOver ? 'أفلت الملف هنا' : 'اسحب الملفات هنا أو قم بالرفع المباشر'}
           </div>
        )}
      </div>
    </div>
  );
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]); 
  const [teacherInfo, setTeacherInfo] = useState({ name: '', school: '', photo: '', semester: '', userId: '' });
  const [loading, setLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [newName, setNewName] = useState('');
  const [editType, setEditType] = useState(null);

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ active: false, current: 0, total: 0 });

  const [isEditMode, setIsEditMode] = useState(false);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(5); 
  const [newCategoryName, setNewCategoryName] = useState('');

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    
    const { data: cData } = await supabase.from('categories').select('*').eq('user_id', user.id).order('order_index', { ascending: true });
    
    const { data: fData } = await supabase.from('files').select('*').eq('user_id', user.id).order('order_index', { ascending: true }).order('created_at', { ascending: true });
    
    const { data: sData } = await supabase.from('settings').select('*').eq('id', 'general').single();
    
    setCategories(cData || []);
    setFiles(fData || []);
    
    // --- هنا التعديل: استعادة رسم الخرائط الصحيح للبيانات ---
    if (sData) {
        setTeacherInfo({
          name: sData.teacher_name || 'اسم المعلم',
          school: sData.school_name || 'اسم المدرسة',
          photo: sData.teacher_photo || '/images/default_teacher.png', // التأكد من قراءة العمود الصحيح
          semester: sData.current_semester || 'غير محدد',
          userId: user.id
        });
    } else {
        setTeacherInfo(prev => ({ ...prev, userId: user.id }));
    }
    
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const newOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order_index)) + 1 : 0;
    const { data, error } = await supabase.from('categories').insert([{ user_id: user.id, name: newCategoryName, order_index: newOrder }]).select();
    if (!error && data) {
      setCategories([...categories, data[0]]);
      setNewCategoryName('');
    }
  };

  const moveCategory = useCallback((dragIndex, hoverIndex) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories];
      const [draggedItem] = updatedCategories.splice(dragIndex, 1);
      updatedCategories.splice(hoverIndex, 0, draggedItem);
      
      const updates = updatedCategories.map((cat, index) => ({ id: cat.id, user_id: cat.user_id, name: cat.name, order_index: index }));
      supabase.from('categories').upsert(updates).then(); 
      
      return updatedCategories;
    });
  }, []);

  const moveFile = useCallback((dragIndex, hoverIndex, sourceCatId, targetCatId) => {
    setFiles((prevFiles) => {
        if (sourceCatId !== targetCatId) return prevFiles; 

        const categoryFiles = prevFiles.filter(f => f.category_id === sourceCatId);
        if(!categoryFiles[dragIndex]) return prevFiles;

        const draggedFileObj = categoryFiles[dragIndex]; 
        const updatedCatFiles = [...categoryFiles];
        updatedCatFiles.splice(dragIndex, 1);
        updatedCatFiles.splice(hoverIndex, 0, draggedFileObj);

        const reorderedIds = updatedCatFiles.map(f => f.id);
        const newFiles = prevFiles.map(f => {
            if (f.category_id === sourceCatId) {
                const newIndex = reorderedIds.indexOf(f.id);
                if (newIndex !== -1) return { ...f, order_index: newIndex };
            }
            return f;
        });
        
        return newFiles.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });
  }, []);

const handleSaveOrder = async (categoryId) => {
    const currentFiles = filesRef.current;
    
    // الحصول على معلومات المستخدم الحالي للتأكد من إرسالها
    const { data: { user } } = await supabase.auth.getUser();

    const categoryFiles = currentFiles
        .filter(f => f.category_id === categoryId)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // التعديل هنا: إضافة user_id ضمن البيانات المرسلة
    const updates = categoryFiles.map((f, i) => ({
        id: f.id,
        user_id: user.id, // <--- هذا السطر ضروري جداً لنجاح الـ Upsert
        category_id: f.category_id, // يفضل إرسال هذا أيضاً لضمان تطابق البيانات
        order_index: i
    }));

    if (updates.length > 0) {
        // نستخدم upsert مع تجاهل التكرار للحقول الأخرى
        const { error } = await supabase.from('files').upsert(updates);
        
        if (error) {
            console.error("Error saving order:", error);
            // يمكنك هنا إظهار رسالة خطأ للمستخدم
        }
    }
  };

  const handleDropFileToCategory = async (fileId, newCategoryId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, category_id: newCategoryId, order_index: 9999 } : f));
    await supabase.from('files').update({ category_id: newCategoryId, order_index: 9999 }).eq('id', fileId);
    fetchData(); 
  };

  const handleFileUpload = async (e, categoryId = null) => {
    const uploadedFiles = Array.from(e.target.files);
    if(uploadedFiles.length === 0) return;
    const MAX_SIZE_BYTES = maxFileSizeMB * 1024 * 1024;
    setUploadStatus({ active: true, current: 0, total: uploadedFiles.length });
    const { data: { user } } = await supabase.auth.getUser();

    const currentMaxIndex = files.filter(f => f.category_id === categoryId).length;

    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setUploadStatus(prev => ({ ...prev, current: i + 1 }));
        
        if (file.size > MAX_SIZE_BYTES) {
            setErrorMessage(`الملف ${file.name} أكبر من ${maxFileSizeMB}MB`);
            setErrorModalOpen(true);
            continue; 
        }
        
        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${fileId}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('portfolio-files').upload(filePath, file);
        if (uploadError) continue;
        const { data: { publicUrl: fileUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(filePath);
        let thumbnailUrl = null;
        if (file.type.includes('pdf')) {
             const blob = await createPdfThumbnail(file);
             if (blob) {
                 const tPath = `${user.id}/${fileId}_thumb.jpg`;
                 await supabase.storage.from('portfolio-files').upload(tPath, blob);
                 const { data: { publicUrl } } = supabase.storage.from('portfolio-files').getPublicUrl(tPath);
                 thumbnailUrl = publicUrl;
             }
        }

        const { data: newFile } = await supabase.from('files').insert([{ 
            user_id: user.id, 
            category_id: categoryId, 
            name: file.name,
            url: fileUrl, 
            type: file.type,
            storage_path: filePath,
            thumbnail_url: thumbnailUrl,
            order_index: currentMaxIndex + i 
        }]).select();

        if(newFile) setFiles(prev => [...prev, newFile[0]]);
    }
    setTimeout(() => setUploadStatus({ active: false, current: 0, total: 0 }), 1000);
  };

  const confirmDelete = async () => {
      if (!itemToDelete) return;
      if (deleteType === 'file') {
          if (itemToDelete.storage_path) await supabase.storage.from('portfolio-files').remove([itemToDelete.storage_path]);
          if (itemToDelete.thumbnail_url) {
               const thumbPath = itemToDelete.storage_path.replace(/(\.[^.]+)$/, '_thumb.jpg');
               await supabase.storage.from('portfolio-files').remove([thumbPath]);
          }
          await supabase.from('files').delete().eq('id', itemToDelete.id);
          setFiles(files.filter(f => f.id !== itemToDelete.id));
      } else {
          await supabase.from('categories').delete().eq('id', itemToDelete.id);
          setCategories(categories.filter(c => c.id !== itemToDelete.id));
          setFiles(files.filter(f => f.category_id !== itemToDelete.id));
      }
      setIsDeleteModalOpen(false);
  };

  const handleUpdateName = async () => {
      if (!newName.trim() || !itemToEdit) return;
      const table = editType === 'file' ? 'files' : 'categories';
      await supabase.from(table).update({ name: newName }).eq('id', itemToEdit.id);
      if (editType === 'file') setFiles(files.map(f => f.id === itemToEdit.id ? { ...f, name: newName } : f));
      else setCategories(categories.map(c => c.id === itemToEdit.id ? { ...c, name: newName } : c));
      setIsEditModalOpen(false);
  };

  const handleExportPDF = async () => {
     if (files.length === 0) return;
     setIsExporting(true);
     try {
       const mergedPdf = await PDFDocument.create();
       const sortedFiles = [];
       categories.forEach(cat => sortedFiles.push(...files.filter(f => f.category_id === cat.id).sort((a,b)=>(a.order_index||0)-(b.order_index||0))));
       sortedFiles.push(...files.filter(f => !f.category_id).sort((a,b)=>(a.order_index||0)-(b.order_index||0)));

       for (const file of sortedFiles) {
         const fileBytes = await fetch(file.url).then(res => res.arrayBuffer());
         if (file.type.includes('pdf')) {
           const srcPdf = await PDFDocument.load(fileBytes);
           const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
           copiedPages.forEach((page) => mergedPdf.addPage(page));
         } else {
           let image;
           if (file.type.includes('png')) image = await mergedPdf.embedPng(fileBytes);
           else image = await mergedPdf.embedJpg(fileBytes);
           const page = mergedPdf.addPage([image.width, image.height]);
           page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
         }
       }
       const pdfBytes = await mergedPdf.save();
       const blob = new Blob([pdfBytes], { type: 'application/pdf' });
       const link = document.createElement('a');
       link.href = URL.createObjectURL(blob);
       link.download = `portfolio.pdf`;
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
     } catch (e) { setErrorMessage('خطأ في التصدير'); setErrorModalOpen(true); }
     setIsExporting(false);
  };

  if (loading) return <div className="h-screen bg-[#0f172a] flex items-center justify-center text-blue-400 font-bold tracking-widest">جاري التحميل...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-['Noto_Sans_Arabic'] flex flex-col lg:flex-row" dir="rtl">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-6 space-y-6 shrink-0">
           <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <img src={teacherInfo.photo} className="w-full h-full rounded-2xl object-cover border-2 border-blue-500 shadow-lg" alt="Teacher" />
            </div>
            <h2 className="text-xl font-bold truncate text-white">{teacherInfo.name}</h2>
            <p className="text-slate-500 text-sm mt-1">{teacherInfo.school}</p>
          </div>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center gap-2 border border-slate-700 font-bold text-sm"><FaHome /> العودة للرئيسية</button>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
             <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold text-xs"><FaCog /> إعدادات الرفع</div>
             <label className="block text-xs text-slate-500 mb-2">أقصى حجم للملف الواحد:</label>
             <select value={maxFileSizeMB} onChange={(e) => setMaxFileSizeMB(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-blue-500 outline-none">
                 <option value={2}>2 ميجابايت</option>
                 <option value={5}>5 ميجابايت</option>
                 <option value={10}>10 ميجابايت</option>
                 <option value={50}>50 ميجابايت</option>
             </select>
          </div>
          <a href={`/portfolio/${teacherInfo.userId}`} target="_blank" rel="noreferrer" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg"><FaExternalLinkAlt size={14}/> معاينة الملف العام</a>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
                <h1 className="text-3xl font-black text-white">إدارة ملف الإنجاز</h1>
                <p className="text-slate-500 text-sm mt-1">أنشئ أقساماً ونظم ملفاتك</p>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)} 
                  className={`px-6 py-3 rounded-full font-bold transition-all shadow-lg flex items-center gap-2 ${isEditMode ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                    {isEditMode ? <><FaUnlock /> حفظ الترتيب</> : <><FaLock /> ترتيب الملفات</>}
                </button>
                {files.length > 0 && <button onClick={handleExportPDF} disabled={isExporting} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all shadow-lg flex items-center gap-2">{isExporting ? '...' : <><FaFileExport /> PDF</>}</button>}
            </div>
          </div>

          {/* Add Category */}
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 mb-8 flex gap-3 items-center">
             <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="اسم القسم الجديد..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
             <button onClick={handleAddCategory} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 whitespace-nowrap"><FaFolderPlus /> إضافة</button>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            {categories.map((category, catIndex) => {
               const categoryFiles = files
                    .filter(f => f.category_id === category.id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

               return (
                <DraggableCategory
                    key={category.id}
                    index={catIndex}
                    category={category}
                    moveCategory={moveCategory}
                    uploading={uploadStatus.active}
                    onUpload={handleFileUpload}
                    onDelete={(c) => { setItemToDelete(c); setDeleteType('category'); setIsDeleteModalOpen(true); }}
                    onEdit={(c) => { setItemToEdit(c); setEditType('category'); setNewName(c.name); setIsEditModalOpen(true); }}
                    isEditMode={isEditMode}
                    onDropFile={handleDropFileToCategory}
                    maxFileSize={maxFileSizeMB}
                >
                    {categoryFiles.map((file, fileIndex) => (
                    <DraggableFile
                        key={file.id}
                        file={file}
                        index={fileIndex} 
                        onDeleteClick={(f) => { setItemToDelete(f); setDeleteType('file'); setIsDeleteModalOpen(true); }}
                        onEditClick={(f) => { setItemToEdit(f); setEditType('file'); setNewName(f.name); setIsEditModalOpen(true); }}
                        onClick={() => setCurrentFileIndex(files.findIndex(x => x.id === file.id))}
                        isEditMode={isEditMode}
                        moveFile={moveFile}
                        onDragEnd={() => handleSaveOrder(category.id)}
                    />
                    ))}
                </DraggableCategory>
              );
            })}

            {/* Unclassified Zone */}
            <UnclassifiedZone 
                onDropFile={handleDropFileToCategory} 
                uploading={uploadStatus.active}
                onUpload={handleFileUpload}
                maxFileSize={maxFileSizeMB}
            >
                {files
                    .filter(f => !f.category_id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((file, index) => (
                    <DraggableFile
                        key={file.id}
                        file={file}
                        index={index}
                        onDeleteClick={(f) => { setItemToDelete(f); setDeleteType('file'); setIsDeleteModalOpen(true); }}
                        onEditClick={(f) => { setItemToEdit(f); setEditType('file'); setNewName(f.name); setIsEditModalOpen(true); }}
                        onClick={() => setCurrentFileIndex(files.findIndex(x => x.id === file.id))}
                        isEditMode={isEditMode}
                        moveFile={moveFile}
                        onDragEnd={() => handleSaveOrder(null)}
                    />
                ))}
            </UnclassifiedZone>
          </div>
        </main>

        {/* Modals */}
        {uploadStatus.active && (<div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"><div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl flex flex-col items-center"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-white">جاري الرفع {uploadStatus.current}/{uploadStatus.total}</p></div></div>)}
        {errorModalOpen && <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-950/70" onClick={()=>setErrorModalOpen(false)}></div><div className="relative bg-slate-900 border border-slate-700 p-8 rounded-3xl"><div className="text-center mb-4 text-amber-500"><FaExclamationTriangle size={30} className="mx-auto"/></div><p className="text-white text-center mb-6">{errorMessage}</p><button onClick={()=>setErrorModalOpen(false)} className="w-full bg-slate-800 py-3 rounded text-white">حسناً</button></div></div>}
        {isEditModalOpen && <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60" onClick={()=>setIsEditModalOpen(false)}><div className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm" onClick={e=>e.stopPropagation()}><input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full bg-slate-800 p-3 rounded mb-4 text-white"/><button onClick={handleUpdateName} className="w-full bg-blue-600 py-3 rounded text-white font-bold">حفظ</button></div></div>}
        {isDeleteModalOpen && <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/60" onClick={()=>setIsDeleteModalOpen(false)}><div className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm" onClick={e=>e.stopPropagation()}><p className="text-white text-center mb-6">هل أنت متأكد؟</p><div className="flex gap-2"><button onClick={confirmDelete} className="flex-1 bg-red-600 py-2 rounded text-white">حذف</button><button onClick={()=>setIsDeleteModalOpen(false)} className="flex-1 bg-slate-800 py-2 rounded text-white">إلغاء</button></div></div></div>}
        {currentFileIndex !== null && <FileViewer files={files} currentIndex={currentFileIndex} onClose={() => setCurrentFileIndex(null)} onNext={() => setCurrentFileIndex(prev => Math.min(files.length-1, prev+1))} onPrev={() => setCurrentFileIndex(prev => Math.max(0, prev-1))} />}
      </div>
    </DndProvider>
  );
};

export default Portfolio;
