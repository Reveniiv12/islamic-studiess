// src/pages/ReportGenerator.jsx
import React, { useState, useRef } from "react";
import { FaPrint, FaArrowRight, FaFileAlt, FaImage, FaTrash, FaDownload, FaCloudUploadAlt, FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const ReportGenerator = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const strategiesList = [
    "التعلم النشط", "التعلم التعاوني", "العصف الذهني", "حل المشكلات", "التعلم القائم على المشاريع",
    "التعلم بالاكتشاف", "التعلم القائم على الاستقصاء", "التعلم المتمركز حول المتعلم", "المناقشة والحوار",
    "التعلم باللعب", "التعليم المتمايز", "التعليم المقلوب", "التعلم القائم على المشكلات (PBL)",
    "التعلم الذاتي", "التعليم باستخدام التقنية", "التعليم القائم على المحاكاة", "التعليم بالقصص",
    "التعليم بالتجارب العملية", "التقويم البنائي المستمر", "التعليم القائم على التفكير"
  ];

  const presetGoals = [
    "تنمية مهارات التفكير الناقد والتحليلي لدى المتعلمين.",
    "إكساب المتعلمين القدرة على حل المشكلات واتخاذ القرار.",
    "تعزيز مهارات التعلم الذاتي والبحث المستمر عن المعرفة.",
    "تنمية مهارات التواصل الفعّال شفهيًا وكتابيًا.",
    "رفع مستوى التحصيل العلمي وتحسين جودة المخرجات التعليمية.",
    "ربط المعرفة النظرية بالتطبيقات العملية في الحياة الواقعية.",
    "تنمية مهارات العمل الجماعي والتعاون الإيجابي.",
    "تعزيز القيم الأخلاقية والسلوكية الإيجابية.",
    "تنمية مهارات استخدام التقنيات الحديثة في التعلم والتدريب.",
    "بناء الثقة بالنفس وتنمية الدافعية نحو التعلم.",
    "إكساب المتعلمين مهارات التخطيط والتنظيم وإدارة الوقت.",
    "تنمية مهارات الإبداع والابتكار في أداء المهام.",
    "تعزيز القدرة على التكيف مع المتغيرات والتعلم المستمر.",
    "تنمية مهارات الاستماع الفعّال واحترام وجهات النظر المختلفة.",
    "إكساب المتعلمين مهارات التقويم الذاتي وتحسين الأداء.",
    "تعزيز روح المبادرة وتحمل المسؤولية الفردية الجماعية.",
    "تنمية مهارات القيادة وبناء الشخصية الإيجابية.",
    "تعزيز الوعي بأهمية الانضباط والالتزام بالأنظمة والتعليمات.",
    "تنمية القدرة على توظيف المعرفة في مواقف جديدة.",
    "تعزيز ثقافة الجودة والاتقان في التعلم والعمل."
  ];

  const targetAudienceOptions = [
    "طلاب", "معلمون", "أولياء أمور", "إداريون", "المجتمع المحلي", "فئات موجهة"
  ];

  const [formData, setFormData] = useState({
    school: "مدرسة الطرف المتوسطة",
    programName: "",
    executor: "",
    day: "",
    date: "",
    duration: "حصة دراسية",
    location: "الفصل",
    targetAudience: "طلاب",
    beneficiariesCount: "",
    selectedStrategies: [],
    goals: "",
    managerName: "أ.عبدالمنعم بن محمد الربيع",
    supervisorName: "أ. ",
    showSupervisor: false,
    showExtraText: false,
    extraText: ""
  });

  const [images, setImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // دالة التقاط الصورة المحسنة لمحاكاة الطباعة بدقة
  const captureReportImage = async () => {
    if (!reportRef.current) return null;
    
    // إعدادات لضمان ثبات الخطوط ومنع انزياحها
    return await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#e9e9e1",
      width: 794, 
      height: 1123,
      windowWidth: 794,
      scrollX: 0,
      scrollY: -window.scrollY, // حل مشكلة الإزاحة الناتجة عن التمرير
      onclone: (clonedDoc) => {
        const report = clonedDoc.getElementById("report-template");
        if (report) {
          report.style.transform = "none";
          report.style.position = "relative";
          report.style.margin = "0";
          report.style.display = "block";
          // إجبار محرك الريندر على معاملة النصوص بدقة الطباعة
          const allTexts = report.querySelectorAll('p, span, h2');
          allTexts.forEach(el => {
            el.style.lineHeight = "1.2";
          });
        }
      }
    });
  };

  const handleSaveAsImage = async () => {
    const canvas = await captureReportImage();
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `تقرير_${formData.programName || "نشاط"}.png`;
      link.click();
    }
  };

  const handleSaveToPortfolio = async () => {
    if (!reportRef.current) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('يجب تسجيل الدخول لحفظ التقرير');
        return;
      }

      const canvas = await captureReportImage();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const fileId = uuidv4();
        const fileName = `report_${fileId}.png`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio-files')
          .upload(filePath, blob, { contentType: 'image/png' });

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('portfolio-files')
          .getPublicUrl(filePath);

        await supabase.from('files').insert([{
          user_id: user.id,
          name: formData.programName || "تقرير نشاط",
          url: publicURLData.publicUrl,
          type: 'image/png',
          size: blob.size,
          storage_path: filePath
        }]);

        setShowSuccessModal(true);
      }, 'image/png');

    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleGoalSelect = (e) => {
    const selectedGoal = e.target.value;
    if (selectedGoal) {
      setFormData(prev => ({
        ...prev,
        goals: prev.goals ? prev.goals + "\n" + selectedGoal : selectedGoal
      }));
    }
  };

  const handleStrategyToggle = (strategy) => {
    const current = formData.selectedStrategies;
    const updated = current.includes(strategy)
      ? current.filter(s => s !== strategy)
      : [...current, strategy];
    setFormData({ ...formData, selectedStrategies: updated });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 2) {
      alert("يمكنك إرفاق صورتين فقط كحد أقصى");
      return;
    }
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-['Noto_Sans_Arabic',sans-serif] pb-10" dir="rtl">
      
      <div className="bg-gray-800 border-b border-gray-700 p-4 mb-6 sticky top-0 z-50 no-print shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition font-bold">
            <FaArrowRight /> العودة للوحة التحكم
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSaveToPortfolio} 
              disabled={isSaving}
              className={`${isSaving ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'} text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition font-bold`}
            >
              <FaCloudUploadAlt /> {isSaving ? 'جاري الحفظ...' : 'حفظ في ملف الإنجاز'}
            </button>
            <button onClick={handleSaveAsImage} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition font-bold">
              <FaDownload /> حفظ كصورة
            </button>
            <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-md transition font-bold">
              <FaPrint /> طباعة التقرير
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 no-print self-start overflow-y-auto max-h-[85vh]">
          <div className="flex items-center gap-3 mb-6 text-emerald-400 border-b border-gray-700 pb-4">
            <FaFileAlt className="text-2xl" />
            <h2 className="text-2xl font-bold">إدخال البيانات</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">اسم المدرسة</label>
              <input name="school" value={formData.school} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">اسم البرنامج</label>
              <input name="programName" value={formData.programName} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500" placeholder="اكتب اسم النشاط هنا" />
            </div>

            <div className="md:col-span-2 p-4 bg-gray-900/50 rounded-xl border border-gray-700 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="showSupervisor" checked={formData.showSupervisor} onChange={handleChange} className="accent-emerald-500 w-5 h-5" />
                <span className="text-sm font-bold text-gray-300">إضافة حقل "المشرف التربوي" في التقرير</span>
              </label>
              {formData.showSupervisor && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">اسم المشرف</label>
                  <input name="supervisorName" value={formData.supervisorName} onChange={handleChange} placeholder="اكتب اسم المشرف هنا..." className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500 text-sm" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">المنفذ</label>
              <input name="executor" value={formData.executor} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">اليوم</label>
                <input name="day" value={formData.day} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">التاريخ</label>
                <input name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">العدد (المستفيدين)</label>
              <input type="number" name="beneficiariesCount" value={formData.beneficiariesCount} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">الفئة المستهدفة</label>
              <select name="targetAudience" value={formData.targetAudience} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500">
                {targetAudienceOptions.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">المدة</label>
              <select name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none">
                <option>حصة دراسية</option>
                <option>نصف ساعة</option>
                <option>ساعة</option>
                <option>ساعتان</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">مكان التنفيذ</label>
              <select name="location" value={formData.location} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none">
                <option>الفصل</option>
                <option>مركز مصادر التعلم</option>
                <option>المختبر</option>
                <option>الساحة الداخلية</option>
                <option>الساحة الخارجية</option>
                <option>قاعة التدريب</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-2">الاستراتيجيات (اختر متعدد)</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-900 p-3 rounded-xl border border-gray-700 max-h-32 overflow-y-auto text-xs">
                {strategiesList.map((s, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-white cursor-pointer hover:bg-gray-800 p-1 rounded transition">
                    <input type="checkbox" checked={formData.selectedStrategies.includes(s)} onChange={() => handleStrategyToggle(s)} className="accent-emerald-500 w-4 h-4" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-gray-400">الأهداف التعليمية</label>
              <select onChange={handleGoalSelect} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-emerald-400 text-sm outline-none cursor-pointer">
                <option value="">+ اختر هدفاً لإضافته للقائمة</option>
                {presetGoals.map((goal, idx) => (
                  <option key={idx} value={goal}>{idx + 1}. {goal}</option>
                ))}
              </select>
              <textarea name="goals" value={formData.goals} rows="3" onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white resize-none outline-none focus:ring-2 ring-emerald-500 text-sm"></textarea>
            </div>

            <div className="md:col-span-2 p-4 bg-gray-900/50 rounded-xl border border-gray-700 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="showExtraText" checked={formData.showExtraText} onChange={handleChange} className="accent-emerald-500 w-5 h-5" />
                <span className="text-sm font-bold text-gray-300">تفعيل حقل "نص إضافي" بجانب الأهداف</span>
              </label>
              {formData.showExtraText && (
                <textarea name="extraText" value={formData.extraText} rows="2" onChange={handleChange} placeholder="اكتب النص الإضافي هنا..." className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none focus:ring-2 ring-emerald-500 text-sm"></textarea>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-2 flex items-center gap-2">
                <FaImage className="text-emerald-400" /> إرفاق صور التنفيذ (حد أقصى 2)
              </label>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full text-xs text-gray-400 file:bg-gray-700 file:text-white file:border-0 file:py-2 file:px-4 file:rounded-lg cursor-pointer" />
              <div className="flex gap-4 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 border border-gray-600 rounded-lg overflow-hidden group">
                    <img src={img} className="w-full h-full object-contain bg-gray-800" alt="preview" />
                    <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-600 p-1 text-xs opacity-0 group-hover:opacity-100 transition"><FaTrash /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-1">مدير المدرسة</label>
              <input name="managerName" value={formData.managerName} onChange={handleChange} className="w-full bg-gray-700 border-gray-600 rounded-lg p-2 text-white outline-none" />
            </div>
          </div>
        </div>

        {/* جزء المعاينة - تم توحيد ارتفاع الأسطر هنا أيضاً */}
        <div ref={reportRef} id="report-template" className="bg-[#e9e9e1] shadow-2xl mx-auto overflow-hidden print:shadow-none print:m-0 text-black relative" style={{ width: "210mm", height: "297mm", minWidth: "210mm" }}>
          <div className="w-full">
            <img src="/images/report_header.png" alt="الشعار" className="w-full h-auto block" style={{ maxHeight: "220px", objectFit: "cover" }} />
          </div>

          <div className="flex justify-center -mt-6 relative z-10">
            <div className="px-12 py-2 text-white font-bold text-xl shadow-lg" style={{ backgroundColor: "#0a3943", borderRadius: "15px", border: "3px solid #3c9b98ff" }}>
              {formData.school}
            </div>
          </div>

          <div className="px-10 mt-6">
            <div style={{ backgroundColor: "#3eb3a3", height: "130px", borderRadius: "15px", display: "flex", justifyContent: "center", alignItems: "center", padding: "0 30px" }}>
              <h2 className="text-black text-3xl font-black text-center" style={{ transform: "translateY(-15px)", lineHeight: "1.1" }}>
                {formData.programName || "اسم البرنامج / النشاط"}
              </h2>
            </div>
          </div>

          <div className="px-10" style={{ marginTop: "-45px" }}>
            <div style={{ backgroundColor: "white", border: "4px solid black", borderRadius: "20px", padding: "15px 25px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-300 pb-3 mb-3 text-right">
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">المنفذ:</span><span className="font-black text-[16px]">{formData.executor}</span></div>
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">اليوم:</span><span className="font-black text-[16px]">{formData.day}</span></div>
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">التاريخ:</span><span className="font-black text-[16px]">{formData.date}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right">
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">المدة:</span><span className="font-black text-[16px]">{formData.duration}</span></div>
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">المكان:</span><span className="font-black text-[16px]">{formData.location}</span></div>
                <div className="flex items-baseline gap-2"><span className="font-bold text-[14px]">العدد:</span><span className="font-black text-[16px]">{formData.beneficiariesCount}</span></div>
              </div>
            </div>
          </div>

          <div className="px-10 mt-6">
            <div style={{ backgroundColor: "#3eb3a3", minHeight: "520px", borderRadius: "80px 0 0 0", padding: "30px 40px" }}>
              <div className="border-b border-black/20 pb-4 mb-4 text-right">
                <p className="font-bold text-sm" style={{ lineHeight: "1.2" }}>الفئة المستهدفة: <span className="font-black text-md">{formData.targetAudience}</span></p>
                <p className="font-bold text-sm mt-2" style={{ lineHeight: "1.2" }}>الاستراتيجيات: <span className="font-black text-md">{formData.selectedStrategies.join(" - ") || "لم تحدد"}</span></p>
              </div>

              <div className={`grid gap-4 mb-4 ${formData.showExtraText ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="text-right">
                  <p className="font-bold text-black text-xs mb-1">الأهداف المكتسبة:</p>
                  <div className="bg-white/20 p-3 rounded-xl min-h-[100px] h-full">
                    <p className="text-black font-bold text-xs whitespace-pre-line" style={{ lineHeight: "1.5" }}>{formData.goals}</p>
                  </div>
                </div>
                {formData.showExtraText && (
                  <div className="text-right">
                    <p className="font-bold text-black text-xs mb-1">نص إضافي:</p>
                    <div className="bg-white/40 p-3 rounded-xl min-h-[100px] h-full border border-black/10">
                      <p className="text-black font-bold text-xs whitespace-pre-line" style={{ lineHeight: "1.5" }}>{formData.extraText}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`grid gap-8 mt-8 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <div key={idx} className="h-64 bg-white/40 rounded-2xl overflow-hidden border-2 border-white/60 shadow-md flex items-center justify-center p-1">
                      <img src={img} alt="activity" className="max-w-full max-h-full object-contain" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="h-64 border-2 border-dashed border-black/10 rounded-2xl flex items-center justify-center text-black/20 font-bold bg-white/5">صورة 1</div>
                    <div className="h-64 border-2 border-dashed border-black/10 rounded-2xl flex items-center justify-center text-black/20 font-bold bg-white/5">صورة 2</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="px-10 mt-10 flex justify-between items-end">
            {formData.showSupervisor ? (
              <div style={{ background: "linear-gradient(to left, #1d72b8, #3eb3a3)", height: "70px", borderRadius: "35px", display: "flex", alignItems: "center", padding: "0 30px", color: "white", minWidth: "250px" }} className="shadow-lg">
                <div className="text-center w-full">
                  <p className="text-[10px] font-bold opacity-90 mb-0">المشرف التربوي</p>
                  <p className="text-lg font-black" style={{ lineHeight: "1" }}>{formData.supervisorName}</p>
                </div>
              </div>
            ) : <div />}

            <div style={{ background: "linear-gradient(to right, #1d72b8, #3eb3a3)", height: "70px", borderRadius: "35px", display: "flex", alignItems: "center", padding: "0 30px", color: "white", minWidth: "250px" }} className="shadow-lg">
              <div className="text-center w-full">
                <p className="text-[10px] font-bold opacity-90 mb-0">مدير المدرسة</p>
                <p className="text-lg font-black" style={{ lineHeight: "1" }}>{formData.managerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300 shadow-2xl">
          <div className="bg-[#1e2530] w-full max-w-sm rounded-[2rem] p-8 border border-gray-700 shadow-2xl transform animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">نجاح</h3>
              <p className="text-gray-400 mb-8 font-medium">تم حفظ التقرير في ملف الإنجاز بنجاح!</p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => navigate('/portfolio')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <FaExternalLinkAlt className="text-sm" /> الانتقال إلى ملف الإنجاز
                </button>
                
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-[#28a745] hover:bg-[#218838] text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

<style dangerouslySetInnerHTML={{ __html: `
  @media print {
    @page { 
      size: A4; 
      margin: 0; 
    }
    body { 
      margin: 0 !important; 
      padding: 0 !important; 
      background: white !important;
    }
    .no-print { 
      display: none !important; 
    }
    #report-template { 
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 0 !important;
      margin: 0 auto !important;
      border: none !important; 
      box-shadow: none !important;
      width: 210mm !important; 
      height: 297mm !important; 
      overflow: hidden !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  
  @keyframes zoom-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-in {
    animation-fill-mode: forwards;
  }
`}} />
    </div>
  );
};

export default ReportGenerator;