import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
    FaPlus, FaTrash, FaFileUpload, FaFilePdf, FaImage, FaTimes, 
    FaFolderOpen, FaSpinner, FaCheckCircle, FaExclamationCircle, 
    FaEye, FaEyeSlash, FaEdit, FaSave, FaTv, FaLayerGroup, FaCheckSquare, FaSquare,
    FaExclamationTriangle, FaArrowUp, FaArrowDown, FaShareAlt
} from 'react-icons/fa';
import CustomModal from './CustomModal'; 
import StudentMaterialsView from './StudentMaterialsView'; 
import imageCompression from 'browser-image-compression';

const ClassMaterialsManager = ({ show, onClose, gradeId, sectionId, teacherId, activeSemester, handleDialog }) => {
  const [folders, setFolders] = useState([]);
  const [teacherSections, setTeacherSections] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // حالات الإضافة
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTargetSections, setSelectedTargetSections] = useState([]); 
  
  // --- حالة نافذة إعادة التسمية ---
  const [renameModal, setRenameModal] = useState({
      isOpen: false,
      type: null, // 'folder' or 'file'
      id: null,
      currentName: ''
  });

  // حالات المشاركة
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [folderToShare, setFolderToShare] = useState(null);
  const [sharedSectionsState, setSharedSectionsState] = useState([]); 

  // حالات العرض والرفع
  const [activeAccordion, setActiveAccordion] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  
  // التنبيهات والتأكيد
  const [statusState, setStatusState] = useState(null);
  const [confirmState, setConfirmState] = useState(null); 
  
  const [showPreview, setShowPreview] = useState(false);

  // مرجع لإيقاف العملية
  const cancelOperationRef = useRef(false);

  useEffect(() => {
    if (show) {
        fetchFolders();
        fetchTeacherSections(); 
    }
  }, [show, gradeId, sectionId, activeSemester]);

  const fetchFolders = async () => {
    setLoading(true);
    const { data: assignments, error } = await supabase
        .from('folder_assignments')
        .select(`
            folder_id,
            course_folders (
                id, title, is_hidden, created_at, order_index,
                folder_contents (
                    id, is_visible, order_index,
                    library_files ( id, file_name, file_type, file_data )
                )
            )
        `)
        .eq('grade_id', gradeId)
        .eq('section_id', sectionId);

    if (error) {
        console.error(error);
    } else {
        const formattedFolders = assignments.map(a => ({
            id: a.course_folders.id,
            title: a.course_folders.title,
            is_hidden: a.course_folders.is_hidden,
            order_index: a.course_folders.order_index,
            created_at: a.course_folders.created_at,
            files: a.course_folders.folder_contents
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                .map(content => ({
                    content_id: content.id, 
                    file_id: content.library_files.id, 
                    name: content.library_files.file_name,
                    type: content.library_files.file_type,
                    url: content.library_files.file_data,
                    isVisible: content.is_visible,
                    order_index: content.order_index
                }))
        }));
        
        formattedFolders.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setFolders(formattedFolders);
    }
    setLoading(false);
  };

  const fetchTeacherSections = async () => {
     try {
        const { data, error } = await supabase.from('students').select('grade_level, section').eq('teacher_id', teacherId);
        if (!error && data) {
            const uniqueMap = new Map();
            data.forEach(student => {
                const key = `${student.grade_level}-${student.section}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, {
                        grade_id: student.grade_level,
                        section_id: student.section,
                        label: `الصف ${student.grade_level} - شعبة ${student.section}`, 
                        isCurrent: String(student.grade_level) === String(gradeId) && String(student.section) === String(sectionId)
                    });
                }
            });
            const sectionsArray = Array.from(uniqueMap.values());
            sectionsArray.sort((a, b) => a.grade_id.localeCompare(b.grade_id) || a.section_id.localeCompare(b.section_id));
            setTeacherSections(sectionsArray);
            
            const current = sectionsArray.find(s => s.isCurrent);
            if (current) setSelectedTargetSections([current]); 
        }
    } catch (err) { console.error(err); }
  };

  const toggleSectionSelection = (section, isEditMode = false) => {
      const targetState = isEditMode ? sharedSectionsState : selectedTargetSections;
      const setTargetState = isEditMode ? setSharedSectionsState : setSelectedTargetSections;

      const exists = targetState.find(s => s.grade_id === section.grade_id && s.section_id === section.section_id);
      
      if (exists) {
          setTargetState(targetState.filter(s => s !== exists));
      } else {
          setTargetState([...targetState, section]);
      }
  };

  // --- دوال التحريك ---
  const moveFolder = async (index, direction) => {
      const newFolders = [...folders];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newFolders.length) return;

      [newFolders[index], newFolders[targetIndex]] = [newFolders[targetIndex], newFolders[index]];
      
      const tempOrder = newFolders[index].order_index;
      newFolders[index].order_index = newFolders[targetIndex].order_index;
      newFolders[targetIndex].order_index = tempOrder;

      setFolders(newFolders);

      try {
          await supabase.from('course_folders').upsert([
              { id: newFolders[index].id, order_index: newFolders[index].order_index },
              { id: newFolders[targetIndex].id, order_index: newFolders[targetIndex].order_index }
          ], { onConflict: 'id' });
      } catch (err) { console.error(err); fetchFolders(); }
  };

  const moveFile = async (folderIndex, fileIndex, direction) => {
      const newFolders = [...folders];
      const files = newFolders[folderIndex].files;
      const targetIndex = fileIndex + direction;

      if (targetIndex < 0 || targetIndex >= files.length) return;

      [files[fileIndex], files[targetIndex]] = [files[targetIndex], files[fileIndex]];
      
      const tempOrder = files[fileIndex].order_index;
      files[fileIndex].order_index = files[targetIndex].order_index;
      files[targetIndex].order_index = tempOrder;

      setFolders(newFolders);

      try {
          await supabase.from('folder_contents').upsert([
              { id: files[fileIndex].content_id, order_index: files[fileIndex].order_index },
              { id: files[targetIndex].content_id, order_index: files[targetIndex].order_index }
          ]);
      } catch (err) { console.error(err); fetchFolders(); }
  };

  // --- دوال المشاركة ---
  const openShareModal = async (folder) => {
      setFolderToShare(folder);
      setStatusState({ type: 'loading', title: 'جاري التحميل', message: 'جاري جلب الفصول المرتبطة...' });

      const { data: existingAssignments } = await supabase
          .from('folder_assignments')
          .select('grade_id, section_id')
          .eq('folder_id', folder.id);
      
      if (existingAssignments) {
          const currentlyAssigned = teacherSections.filter(sec => 
              existingAssignments.some(assign => assign.grade_id === sec.grade_id && assign.section_id === sec.section_id)
          );
          setSharedSectionsState(currentlyAssigned);
          setIsShareModalOpen(true);
          setStatusState(null);
      }
  };

  const handleSaveShare = async () => {
      if (!folderToShare) return;
      setStatusState({ type: 'loading', title: 'جاري التحديث', message: 'يتم تحديث صلاحيات الوصول...' });

      await supabase.from('folder_assignments').delete().eq('folder_id', folderToShare.id);

      const newAssignments = sharedSectionsState.map(sec => ({
          folder_id: folderToShare.id,
          grade_id: sec.grade_id,
          section_id: sec.section_id
      }));

      if (newAssignments.length > 0) {
          const { error } = await supabase.from('folder_assignments').insert(newAssignments);
          if (error) {
              setStatusState({ type: 'error', title: 'خطأ', message: 'فشل تحديث المشاركة' });
              return;
          }
      }

      setIsShareModalOpen(false);
      setFolderToShare(null);
      setStatusState({ type: 'success', title: 'تم الحفظ', message: 'تم تحديث الفصول المرتبطة بنجاح.' });
      setTimeout(() => setStatusState(null), 1500); 
      fetchFolders();
  };

  // --- دوال الإضافة والرفع ---
  const handleAddTopic = async () => {
    if (!newTitle.trim()) return;
    if (selectedTargetSections.length === 0) {
        setStatusState({ type: 'error', title: 'تنبيه', message: 'يجب اختيار فصل واحد على الأقل.' });
        return;
    }

    setStatusState({ type: 'loading', title: 'جاري الإنشاء', message: 'جاري إنشاء المجلد المشترك...' });

    const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.order_index || 0)) : 0;

    const { data: folderData, error: folderError } = await supabase
        .from('course_folders')
        .insert({
            teacher_id: teacherId,
            semester: activeSemester,
            title: newTitle,
            is_hidden: false,
            order_index: maxOrder + 1
        })
        .select()
        .single();

    if (folderError) {
        setStatusState({ type: 'error', title: 'خطأ', message: 'فشل إنشاء المجلد' });
        return;
    }

    const assignments = selectedTargetSections.map(sec => ({
        folder_id: folderData.id,
        grade_id: sec.grade_id,
        section_id: sec.section_id
    }));

    await supabase.from('folder_assignments').insert(assignments);

    setNewTitle('');
    setIsAddingMode(false);
    setStatusState({ type: 'success', title: 'تمت العملية', message: 'تم إنشاء المجلد المشترك بنجاح.' });
    setTimeout(() => setStatusState(null), 1500);
    fetchFolders();
  };

  const computeFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const cancelOperation = () => {
    cancelOperationRef.current = true;
    setStatusState({ type: 'error', title: 'تم الإلغاء', message: 'تم إلغاء العملية من قبل المستخدم.' });
    setTimeout(() => setStatusState(null), 2000);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!selectedFolderId || files.length === 0) return;

    const MAX_SIZE_MB = 3;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    for (const file of files) {
        if (file.size > MAX_SIZE_BYTES) {
            setStatusState({ 
                type: 'error', 
                title: 'حجم الملف كبير', 
                message: `الملف "${file.name}" يتجاوز الحد المسموح (${MAX_SIZE_MB} ميجابايت).` 
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
    }

    cancelOperationRef.current = false;
    setStatusState({ type: 'loading', title: 'ذكاء البيانات', message: 'جاري الفحص والرفع...' });

    try {
        const currentFolder = folders.find(f => f.id === selectedFolderId);
        let currentMaxOrder = currentFolder.files.length > 0 
            ? Math.max(...currentFolder.files.map(f => f.order_index || 0)) 
            : 0;

        let uploadedCount = 0;
        let reusedCount = 0;

        for (const file of files) {
            if (cancelOperationRef.current) break;

            currentMaxOrder++; 

            const fileHash = await computeFileHash(file);
            
            if (cancelOperationRef.current) break;

            let fileData = '';
            if (file.type.startsWith('image/')) {
                 const compressed = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1920 });
                 fileData = await new Promise((r) => { const rd = new FileReader(); rd.readAsDataURL(compressed); rd.onloadend=()=>r(rd.result); });
            } else {
                 fileData = await new Promise((r) => { const rd = new FileReader(); rd.readAsDataURL(file); rd.onload=()=>r(rd.result); });
            }

            if (cancelOperationRef.current) break;

            const { data: existingFiles } = await supabase
                .from('library_files')
                .select('id')
                .eq('file_hash', fileHash)
                .limit(1);

            let libraryFileId;

            if (existingFiles && existingFiles.length > 0) {
                libraryFileId = existingFiles[0].id;
                reusedCount++;
            } else {
                const { data: newFile, error: uploadError } = await supabase
                    .from('library_files')
                    .insert({
                        teacher_id: teacherId,
                        file_hash: fileHash,
                        file_name: file.name,
                        file_type: file.type,
                        file_data: fileData
                    })
                    .select()
                    .single();
                
                if (uploadError) throw uploadError;
                libraryFileId = newFile.id;
                uploadedCount++;
            }

            const { data: existingLink } = await supabase
                .from('folder_contents')
                .select('id')
                .eq('folder_id', selectedFolderId)
                .eq('file_id', libraryFileId);

            if (!existingLink || existingLink.length === 0) {
                await supabase.from('folder_contents').insert({
                    folder_id: selectedFolderId,
                    file_id: libraryFileId,
                    is_visible: true,
                    order_index: currentMaxOrder
                });
            }
        }

        if (cancelOperationRef.current) {
             // Handled
        } else {
            setStatusState({ 
                type: 'success', 
                title: 'تمت العملية بذكاء', 
                message: `تم رفع ${uploadedCount} ملف، واستخدام ${reusedCount} ملف موجود.` 
            });
            setTimeout(() => setStatusState(null), 2000);
            fetchFolders();
        }

    } catch (error) {
        console.error(error);
        setStatusState({ type: 'error', title: 'خطأ', message: error.message || 'حدث خطأ أثناء الرفع' });
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- دوال الحذف والتعديل وإدارة المودال ---

  const handleDeleteFolder = (folderId) => {
    setConfirmState({
        title: "تأكيد حذف المجلد",
        message: "تنبيه هام: هذا المجلد مشترك. حذفه سيؤدي لإزالته نهائياً من جميع الفصول المرتبطة به. هل أنت متأكد تماماً؟",
        onConfirm: async () => {
            setConfirmState(null); 
            setStatusState({ type: 'loading', title: 'جاري الحذف', message: 'يتم حذف المجلد...' });
            
            const { error } = await supabase.from('course_folders').delete().eq('id', folderId);
            
            if (!error) {
                await fetchFolders();
                setStatusState({ type: 'success', title: 'تم الحذف', message: 'تم حذف المجلد بنجاح.' });
                setTimeout(() => setStatusState(null), 1500);
            } else {
                setStatusState({ type: 'error', title: 'خطأ', message: 'فشل حذف المجلد.' });
            }
        }
    });
  };

  const handleRemoveFileFromFolder = (contentId) => {
    setConfirmState({
        title: "إزالة الملف",
        message: "سيتم إزالة الملف من هذا المجلد في جميع الفصول، لكنه سيبقى في قاعدة البيانات.",
        onConfirm: async () => {
            setConfirmState(null);
            setStatusState({ type: 'loading', title: 'جاري الحذف', message: 'يتم إزالة الملف...' });
            
            const { error } = await supabase.from('folder_contents').delete().eq('id', contentId);
            
            if (!error) { 
                await fetchFolders(); 
                setStatusState(null); 
            } else {
                setStatusState({ type: 'error', title: 'خطأ', message: 'فشل حذف الملف.' });
            }
        }
    });
  };

  // 1. فتح نافذة التعديل
  const openRenameModal = (type, id, currentName) => {
      setRenameModal({
          isOpen: true,
          type: type,
          id: id,
          currentName: currentName
      });
  };

  // 2. تنفيذ الحفظ (تم التصحيح)
  const handleRenameSubmit = async () => {
      // FIX 2: استخراج القيم في متغيرات ثابتة قبل البدء
      const { type, id, currentName } = renameModal;

      if (!currentName.trim()) return;

      setRenameModal(prev => ({ ...prev, isOpen: false })); 
      setStatusState({ type: 'loading', title: 'جاري التحديث', message: 'يتم حفظ الاسم الجديد...' });

      let error = null;

      // استخدام المتغيرات المحلية type و id بدلاً من الحالة المباشرة
      if (type === 'folder') {
          const { error: err } = await supabase
              .from('course_folders')
              .update({ title: currentName })
              .eq('id', id);
          error = err;
      } else if (type === 'file') {
          const { error: err } = await supabase
              .from('library_files')
              .update({ file_name: currentName })
              .eq('id', id);
          error = err;
      }

      if (!error) {
          await fetchFolders();
          setStatusState({ type: 'success', title: 'تم الحفظ', message: 'تم تغيير الاسم بنجاح.' });
          setTimeout(() => setStatusState(null), 1500);
      } else {
          setStatusState({ type: 'error', title: 'خطأ', message: 'فشل تحديث الاسم.' });
      }
  };

  const toggleFolderVisibility = async (id, currentStatus) => {
      await supabase.from('course_folders').update({ is_hidden: !currentStatus }).eq('id', id);
      fetchFolders();
  };

  const toggleFileVisibility = async (contentId, currentStatus) => {
      await supabase.from('folder_contents').update({ is_visible: !currentStatus }).eq('id', contentId);
      fetchFolders();
  };

  if (!show) return null;

  return (
    <>
    <CustomModal title="المكتبة الذكية (Smart Library)" onClose={onClose}>
      {/* FIX 1: تعديل ارتفاع الحاوية ليكون مناسبًا للجوال ويسمح بالتمرير الداخلي */}
      <div className="relative flex flex-col h-[80vh] md:h-auto md:min-h-[500px] md:max-h-[85vh]">
        
        {/* --- Rename Modal --- */}
        {renameModal.isOpen && (
            <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center rounded-xl animate-fadeIn p-6 backdrop-blur-sm bg-gray-900/80">
                <div className="bg-gray-800 p-6 rounded-2xl border border-blue-500/50 w-full max-w-sm shadow-2xl transform scale-100 transition-all">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaEdit className="text-blue-400" /> 
                        {renameModal.type === 'folder' ? 'تعديل اسم المجلد' : 'تعديل اسم الملف'}
                    </h3>
                    
                    <input 
                        // FIX 2: إضافة Key لضمان تحديث الحقل عند تغيير العنصر
                        key={renameModal.id || 'rename-input'}
                        type="text" 
                        value={renameModal.currentName} 
                        onChange={(e) => setRenameModal({ ...renameModal, currentName: e.target.value })}
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-blue-500 mb-6 text-center"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    />

                    <div className="flex gap-3">
                        <button 
                            onClick={handleRenameSubmit} 
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold shadow-lg transition-transform active:scale-95"
                        >
                            حفظ
                        </button>
                        <button 
                            onClick={() => setRenameModal({ ...renameModal, isOpen: false })} 
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-transform active:scale-95"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Overlay Status (Alerts) */}
        {statusState && (
            <div className="absolute inset-0 bg-gray-900/95 z-[60] flex flex-col items-center justify-center rounded-xl animate-fadeIn p-6 text-center backdrop-blur-sm">
                {statusState.type === 'loading' && <FaSpinner className="text-5xl text-blue-500 animate-spin mb-4" />}
                {statusState.type === 'success' && <FaCheckCircle className="text-6xl text-green-500 mb-4 scale-110" />}
                {statusState.type === 'error' && <FaExclamationCircle className="text-6xl text-red-500 mb-4 animate-pulse" />}
                
                <h3 className="text-2xl font-bold text-white mb-2">{statusState.title}</h3>
                <p className="text-gray-300 text-lg mb-6">{statusState.message}</p>
                
                {statusState.type !== 'loading' ? (
                    <button onClick={() => setStatusState(null)} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-2 rounded-lg transition-all">موافق</button>
                ) : (
                    <button 
                        onClick={cancelOperation} 
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 px-8 py-2 rounded-lg transition-all flex items-center gap-2"
                    >
                        <FaTimes /> إلغاء العملية
                    </button>
                )}
            </div>
        )}

        {/* Share Modal */}
        {isShareModalOpen && folderToShare && (
            <div className="absolute inset-0 bg-gray-900/95 z-[70] flex flex-col items-center justify-center rounded-xl animate-fadeIn p-6 backdrop-blur-sm">
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-600 w-full max-w-lg shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaShareAlt className="text-blue-400" /> مشاركة المجلد: <span className="text-blue-200">{folderToShare.title}</span>
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">حدد الفصول التي تريد أن يظهر فيها هذا المجلد.</p>
                    
                    <div className="max-h-60 overflow-y-auto custom-scrollbar bg-gray-900/50 p-3 rounded-lg border border-gray-700 mb-6">
                        <div className="flex flex-wrap gap-2">
                            {teacherSections.map((sec, idx) => {
                                const isSelected = sharedSectionsState.some(s => s.grade_id === sec.grade_id && s.section_id === sec.section_id);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleSectionSelection(sec, true)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                            isSelected 
                                            ? 'bg-blue-600 text-white border-blue-500' 
                                            : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                                        }`}
                                    >
                                        {isSelected ? <FaCheckSquare /> : <FaSquare />}
                                        {sec.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSaveShare} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold">حفظ التغييرات</button>
                        <button onClick={() => setIsShareModalOpen(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg">إلغاء</button>
                    </div>
                </div>
            </div>
        )}

        {/* Confirm Overlay */}
        {confirmState && (
            <div className="absolute inset-0 bg-gray-900/95 z-[70] flex flex-col items-center justify-center rounded-xl animate-fadeIn p-6 text-center backdrop-blur-sm border border-yellow-500/20">
                <FaExclamationTriangle className="text-6xl text-yellow-500 mb-6 animate-bounce" />
                <h3 className="text-2xl font-bold text-white mb-2">{confirmState.title}</h3>
                <p className="text-gray-300 text-lg mb-8 max-w-md leading-relaxed">{confirmState.message}</p>
                <div className="flex gap-4 w-full max-w-sm justify-center">
                    <button 
                        onClick={confirmState.onConfirm} 
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-105"
                    >
                        نعم، نفذ
                    </button>
                    <button 
                        onClick={() => setConfirmState(null)} 
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-all border border-gray-600 hover:border-gray-500"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        )}

        {/* --- Header Controls --- */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex-shrink-0">
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setIsAddingMode(!isAddingMode)} 
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${isAddingMode ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
                >
                    {isAddingMode ? <><FaTimes /> إلغاء</> : <><FaPlus /> مجلد جديد</>}
                </button>
                <button 
                    onClick={() => setShowPreview(true)} 
                    className="flex-1 md:flex-none px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg flex items-center justify-center gap-2 font-bold"
                >
                    <FaTv /> معاينة الطالب
                </button>
            </div>
            <div className="text-gray-400 text-sm font-medium">{folders.length} مجلدات</div>
        </div>

        {/* --- Add New Folder --- */}
        {isAddingMode && (
            <div className="mb-6 bg-gray-800 p-5 rounded-xl border border-blue-500/30 shadow-2xl animate-fadeIn flex-shrink-0">
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaLayerGroup className="text-blue-400" /> إضافة مجلد مشترك</h4>
                <div className="flex flex-col gap-4">
                    <input type="text" placeholder="عنوان المجلد..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-blue-500" />
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">اختر الفصول:</p>
                        <div className="flex flex-wrap gap-2">
                            {teacherSections.map((sec, idx) => {
                                const isSelected = selectedTargetSections.some(s => s.grade_id === sec.grade_id && s.section_id === sec.section_id);
                                return (
                                    <button key={idx} onClick={() => toggleSectionSelection(sec)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                                        {isSelected ? <FaCheckSquare /> : <FaSquare />} {sec.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={handleAddTopic} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg">حفظ وإنشاء</button>
                </div>
            </div>
        )}

        {/* --- Folders List --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400"><FaSpinner className="animate-spin text-3xl mb-2" /><p>جاري التحميل...</p></div>
            ) : folders.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-xl"><FaFolderOpen className="text-6xl text-gray-700 mx-auto mb-4" /><p className="text-gray-500">لا توجد مجلدات.</p></div>
            ) : (
                <div className="grid grid-cols-1 gap-4 pb-10"> 
                    {folders.map((folder, fIndex) => (
                        <div key={folder.id} className={`group bg-gray-800 rounded-xl border transition-all ${folder.is_hidden ? 'border-red-900/50 opacity-75' : 'border-gray-700 hover:border-blue-500/50'}`}>
                            
                            {/* Folder Header */}
                            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setActiveAccordion(activeAccordion === folder.id ? null : folder.id)}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={(e) => { e.stopPropagation(); moveFolder(fIndex, -1); }} disabled={fIndex === 0} className="text-gray-500 hover:text-blue-400 disabled:opacity-20 text-xs"><FaArrowUp /></button>
                                        <button onClick={(e) => { e.stopPropagation(); moveFolder(fIndex, 1); }} disabled={fIndex === folders.length - 1} className="text-gray-500 hover:text-blue-400 disabled:opacity-20 text-xs"><FaArrowDown /></button>
                                    </div>

                                    <div className={`p-3 rounded-lg ${folder.is_hidden ? 'bg-gray-700' : 'bg-blue-900/30 text-blue-400'}`}>
                                        <FaFolderOpen className="text-xl" />
                                    </div>
                                    <div className="flex-1">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{folder.title}</h3>
                                            <p className="text-xs text-gray-500">{folder.files?.length || 0} ملفات</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center" onClick={(e)=>e.stopPropagation()}>
                                    <button onClick={()=>openShareModal(folder)} className="p-2 text-purple-400 hover:text-white" title="تعديل الفصول (مشاركة)"><FaShareAlt /></button>
                                    <button onClick={()=>toggleFolderVisibility(folder.id, folder.is_hidden)} className="p-2 text-gray-400 hover:text-white">{folder.is_hidden ? <FaEyeSlash /> : <FaEye />}</button>
                                    <button onClick={()=>openRenameModal('folder', folder.id, folder.title)} className="p-2 text-blue-400 hover:text-white"><FaEdit /></button>
                                    <button onClick={()=>handleDeleteFolder(folder.id)} className="p-2 text-red-400 hover:text-white"><FaTrash /></button>
                                </div>
                            </div>

                            {/* Folder Body */}
                            {activeAccordion === folder.id && (
                                <div className="bg-gray-900/50 border-t border-gray-700 p-4 animate-slideDown">
                                    <div className="mb-6">
                                        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                        <div onClick={()=>{setSelectedFolderId(folder.id); fileInputRef.current.click()}} className="border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group/upload">
                                            <FaFileUpload className="text-3xl text-gray-500 group-hover/upload:text-blue-500 mb-2" />
                                            <span className="text-sm text-gray-400">رفع ملفات (الحد الأقصى 3MB)</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {folder.files?.map((file, fileIdx) => (
                                            <div key={file.content_id} className={`flex items-center p-3 bg-gray-800 rounded-lg border ${!file.isVisible ? 'border-red-900/30 opacity-60' : 'border-gray-700'}`}>
                                                <div className="flex flex-col gap-1 mr-3 border-r border-gray-700 pr-2">
                                                    <button onClick={() => moveFile(fIndex, fileIdx, -1)} disabled={fileIdx === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px]"><FaArrowUp /></button>
                                                    <button onClick={() => moveFile(fIndex, fileIdx, 1)} disabled={fileIdx === folder.files.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-[10px]"><FaArrowDown /></button>
                                                </div>

                                                <div className="p-2 bg-gray-900 rounded-md ml-2">
                                                    {file.type?.includes('pdf') ? <FaFilePdf className="text-red-400" /> : <FaImage className="text-blue-400" />}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0 px-2 flex items-center group/title">
                                                    <p className="text-sm text-gray-200 truncate dir-ltr text-right ml-2">{file.name}</p>
                                                    <button 
                                                        onClick={() => openRenameModal('file', file.file_id, file.name)}
                                                        className="text-gray-500 hover:text-blue-400 transition-colors"
                                                        title="تعديل اسم الملف"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </div>

                                                <div className="flex gap-1 pr-2 border-r border-gray-700 mr-2">
                                                    <button onClick={()=>toggleFileVisibility(file.content_id, file.isVisible)} className="p-1.5 text-gray-400 hover:text-white">{!file.isVisible ? <FaEyeSlash /> : <FaEye />}</button>
                                                    <button onClick={()=>handleRemoveFileFromFolder(file.content_id)} className="p-1.5 text-red-500 hover:text-white"><FaTimes /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </CustomModal>

    {showPreview && (
        <StudentMaterialsView 
            show={showPreview}
            onClose={() => setShowPreview(false)}
            gradeId={gradeId}
            sectionId={sectionId}
            teacherId={teacherId}
            activeSemester={activeSemester}
            title="معاينة (نظام الملفات المشترك)"
        />
    )}
    </>
  );
};

export default ClassMaterialsManager;