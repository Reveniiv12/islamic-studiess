// src/components/FilterGradesModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaFilter, 
  FaFileWord, 
  FaTimes, 
  FaSortAmountUp, 
  FaSortAmountDown,
  FaUserGraduate,
  FaCheckCircle
} from 'react-icons/fa';

const FilterGradesModal = ({ 
  students, 
  onClose, 
  onSave, 
  calculateTotalScore,
  gradeName,
  sectionName,
  schoolName,
  teacherName,
  currentSemester
}) => {
  const [threshold, setThreshold] = useState(50);
  const [condition, setCondition] = useState('less');
  const [noteText, setNoteText] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedForNote, setSelectedForNote] = useState([]);

  useEffect(() => {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const currentWeekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    setCurrentWeek(currentWeekNumber > 20 ? 20 : currentWeekNumber);
  }, []);

  useEffect(() => {
    const results = students.filter(student => {
      const score = parseFloat(calculateTotalScore(student.grades)) || 0;
      if (condition === 'greater') {
        return score >= parseFloat(threshold);
      } else {
        return score <= parseFloat(threshold);
      }
    });
    setFilteredStudents(results);
    setSelectedForNote(results.map(s => s.id));
  }, [students, threshold, condition, calculateTotalScore]);

  const toggleStudentSelection = (id) => {
    setSelectedForNote(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  // ----------------------------------------------------------------------
  // دالة التصدير إلى Word (RTL - من اليمين لليسار)
  // ----------------------------------------------------------------------
  const handleExport = async () => {
    if (filteredStudents.length === 0) return;
    try {
      const [{ Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun }, { saveAs }] = await Promise.all([
        import('docx'),
        import('file-saver')
      ]);

      const fontStyle = "Times New Roman";

      // 1. إعداد صف العناوين (Headers)
      // الترتيب هنا: العمود الأول في الكود (اسم الطالب) سيظهر في أقصى اليمين في ملف الوورد لأن الجدول bidiVisual
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "اسم الطالب", alignment: AlignmentType.CENTER, style: "TableHeader", bidirectional: true })],
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEEEE" },
          }),
          new TableCell({
            children: [new Paragraph({ text: "السجل المدني", alignment: AlignmentType.CENTER, style: "TableHeader", bidirectional: true })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEEEE" },
          }),
          new TableCell({
            children: [new Paragraph({ text: "المجموع", alignment: AlignmentType.CENTER, style: "TableHeader", bidirectional: true })],
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEEEE" },
          }),
          new TableCell({
            children: [new Paragraph({ text: "الحالة", alignment: AlignmentType.CENTER, style: "TableHeader", bidirectional: true })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            shading: { fill: "EEEEEE" },
          }),
        ],
      });

      // 2. إعداد صفوف البيانات
      const tableRows = filteredStudents.map(student => {
        const score = calculateTotalScore(student.grades);
        return new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: student.name, alignment: AlignmentType.CENTER, bidirectional: true })] }),
            new TableCell({ children: [new Paragraph({ text: student.nationalId, alignment: AlignmentType.CENTER, bidirectional: true })] }),
            new TableCell({ children: [new Paragraph({ text: score.toString(), alignment: AlignmentType.CENTER, bidirectional: true })] }),
            new TableCell({ children: [new Paragraph({ text: condition === 'greater' ? `> ${threshold}` : `< ${threshold}`, alignment: AlignmentType.CENTER, bidirectional: true })] }),
          ],
        });
      });

      // 3. تجميع الجدول
      // bidiVisual: true هي المسؤولة عن جعل الأعمدة تترتب من اليمين لليسار
      const table = new Table({
        rows: [headerRow, ...tableRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        bidiVisual: true, 
      });

      // 4. محتوى المستند
      const docChildren = [
        // العنوان الرئيسي
        new Paragraph({
            text: `كشف تحليل الدرجات – ${condition === 'greater' ? 'الطلاب المتفوقين' : 'الطلاب المتعثرين'}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { after: 300 },
        }),

        // معلومات المدرسة والمعلم
        new Paragraph({
            children: [
                new TextRun({ text: `المدرسة: ${schoolName || '-'}`, bold: true, size: 24, font: fontStyle, rightToLeft: true }),
                new TextRun({ text: "   |   " }),
                new TextRun({ text: `المعلم: ${teacherName || '-'}`, bold: true, size: 24, font: fontStyle, rightToLeft: true }),
                new TextRun({ text: "   |   " }),
                new TextRun({ text: `${currentSemester || '-'}`, size: 24, font: fontStyle, rightToLeft: true }),
            ],
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 200 },
        }),

        // الصف والفصل
        new Paragraph({
            children: [
                new TextRun({ text: `${gradeName || '-'}`, bold: true, size: 24, font: fontStyle, rightToLeft: true }),
                new TextRun({ text: "   |   " }),
                new TextRun({ text: `الفصل: ${sectionName || '-'}`, bold: true, size: 24, font: fontStyle, rightToLeft: true }),
            ],
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 300 },
        }),

        table
      ];

      // 5. إنشاء المستند (إعداد الصفحة لتكون RTL)
      const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "TableHeader",
                    name: "Table Header",
                    run: {
                        bold: true,
                        size: 24, 
                        font: fontStyle,
                        color: "000000"
                    }
                },
                {
                    id: "Subtitle",
                    name: "Subtitle Style",
                    run: {
                        color: "666666",
                        italics: true,
                        size: 20,
                        font: fontStyle
                    }
                }
            ]
        },
        sections: [{
          properties: {
             bidi: true, // صفحة من اليمين لليسار
          },
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `تقرير_${condition === 'greater' ? 'متفوقين' : 'متعثرين'}.docx`);
      
    } catch (error) {
      console.error(error);
      alert("خطأ في تصدير ملف Word");
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim() || selectedForNote.length === 0) {
      alert("يرجى كتابة ملاحظة واختيار طالب واحد على الأقل");
      return;
    }
    
    if(!window.confirm(`سيتم إرسال الملاحظة لـ ${selectedForNote.length} طالب. هل أنت متأكد؟`)) return;

    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(today);
    const newNote = `(${hijriDate}): ${noteText}`;

    const updatedStudents = students.map(student => {
      if (selectedForNote.includes(student.id)) {
        const weeklyNotes = Array.isArray(student.grades?.weeklyNotes)
          ? [...student.grades.weeklyNotes]
          : Array(20).fill().map(() => []);
        
        if (!Array.isArray(weeklyNotes[currentWeek - 1])) weeklyNotes[currentWeek - 1] = [];
        weeklyNotes[currentWeek - 1].push(newNote);

        return { ...student, grades: { ...student.grades, weeklyNotes: weeklyNotes } };
      }
      return student;
    });

    onSave(updatedStudents);
    setNoteText('');
    alert("تم الحفظ بنجاح ✅");
  };

  const themeColor = condition === 'greater' ? 'green' : 'red';
  const themeGradient = condition === 'greater' ? 'from-green-600 to-teal-600' : 'from-red-600 to-orange-600';

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4 z-50">
      
      <div className="bg-gray-800 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] md:h-[85vh] flex flex-col overflow-hidden border border-gray-700">
        
        {/* Header - واجهة طبيعية (يسار ليمين في الترتيب، لكن المحتوى عربي) */}
        <div className="bg-gray-900 p-3 md:p-5 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-2 md:p-3 rounded-lg bg-gradient-to-br ${themeGradient} shadow-lg`}>
               <FaFilter className="text-white text-lg md:text-xl" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-bold text-white">تحليل الدرجات</h2>
              <p className="text-gray-400 text-[10px] md:text-xs mt-0.5 hidden sm:block">فلترة، تصدير، ومتابعة الطلاب</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-red-600 p-2 rounded-full">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Main Content - واجهة طبيعية (Controls Left, Results Right) */}
        <div className="flex flex-col lg:flex-row h-full overflow-hidden">
          
          {/* Controls Section (Left Side) */}
          <div className="w-full lg:w-1/3 bg-gray-800/50 p-4 md:p-6 border-b lg:border-b-0 lg:border-l border-gray-700 flex flex-col gap-4 lg:gap-8 overflow-y-auto max-h-[40vh] lg:max-h-full flex-shrink-0">
            
            {/* Condition Toggle */}
            <div>
              <div className="flex bg-gray-900 p-1 rounded-lg md:rounded-xl">
                <button 
                  onClick={() => setCondition('greater')}
                  className={`flex-1 py-2 md:py-3 rounded-md md:rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1 md:gap-2 transition-all ${condition === 'greater' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaSortAmountUp /> <span className="hidden sm:inline">المتفوقين</span> (أكبر)
                </button>
                <button 
                  onClick={() => setCondition('less')}
                  className={`flex-1 py-2 md:py-3 rounded-md md:rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1 md:gap-2 transition-all ${condition === 'less' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaSortAmountDown /> <span className="hidden sm:inline">المتعثرين</span> (أقل)
                </button>
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="p-3 md:p-5 bg-gray-700/30 rounded-lg md:rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-2 md:mb-4">
                <label className="text-gray-300 font-semibold text-sm">الدرجة الفاصلة</label>
                <span className={`text-xl md:text-2xl font-black text-${themeColor}-400`}>{threshold}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={threshold} 
                onChange={(e) => setThreshold(e.target.value)}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-600 accent-${themeColor}-500 touch-pan-x`}
              />
            </div>

            {/* Action Card */}
            <div className="bg-gray-900 p-3 md:p-5 rounded-lg md:rounded-xl border border-gray-700 shadow-inner">
                <div className="flex items-center gap-2 mb-2">
                   <select
                    value={currentWeek}
                    onChange={(e) => setCurrentWeek(Number(e.target.value))}
                    className="bg-gray-800 text-white border border-gray-600 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none flex-1"
                  >
                    {[...Array(20)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>الأسبوع {i + 1}</option>
                    ))}
                  </select>
                </div>

                <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="ملاحظة..."
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 text-sm h-16 md:h-24 resize-none mb-3 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500"
                ></textarea>

                <button 
                  onClick={handleAddNote}
                  disabled={selectedForNote.length === 0}
                  className={`w-full py-2 md:py-3 rounded-lg font-bold text-white shadow-lg text-sm md:text-base transition-transform active:scale-95 flex items-center justify-center gap-2 
                    ${selectedForNote.length > 0 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed opacity-50'}`}
                >
                  <FaCheckCircle /> إرسال ({selectedForNote.length})
                </button>
            </div>
          </div>

          {/* Results Section (Right Side) */}
          <div className="flex-1 bg-gray-800 p-3 md:p-6 flex flex-col overflow-hidden h-full">
            
            <div className="flex justify-between items-center mb-3 md:mb-6 pb-2 md:pb-4 border-b border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-lg md:text-2xl font-bold text-white">النتائج</h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  العدد: <span className={`text-${themeColor}-400 font-bold`}>{filteredStudents.length}</span>
                </p>
              </div>
              
              <button 
                onClick={handleExport}
                disabled={filteredStudents.length === 0}
                className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-xs md:text-sm font-semibold shadow-md"
              >
                <FaFileWord /> <span className="hidden sm:inline">تصدير Word</span>
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 md:pr-2 pb-10 md:pb-0">
              {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-4">
                  {filteredStudents.map(student => {
                    const score = calculateTotalScore(student.grades);
                    const isSelected = selectedForNote.includes(student.id);
                    return (
                      <div 
                        key={student.id} 
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`relative group p-3 md:p-4 rounded-xl border transition-all cursor-pointer select-none
                          ${isSelected 
                            ? `bg-gray-700 border-${themeColor}-500/50 shadow-lg shadow-${themeColor}-900/10` 
                            : 'bg-gray-800 border-gray-700 opacity-60 hover:opacity-100'
                          }`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={student.photo || '/images/1.webp'} 
                              alt={student.name} 
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 ${isSelected ? `border-${themeColor}-500` : 'border-gray-500'}`} 
                            />
                            {isSelected && (
                              <div className={`absolute -bottom-1 -right-1 bg-${themeColor}-500 text-white rounded-full p-0.5 md:p-1 text-[8px] md:text-[10px]`}>
                                <FaCheckCircle />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <h4 className="text-white font-bold truncate text-xs md:text-sm">{student.name}</h4>
                            <p className="text-gray-400 text-[10px] md:text-xs truncate">{student.nationalId}</p>
                          </div>
                          <div className={`text-lg md:text-xl font-black ${condition === 'greater' ? 'text-green-400' : 'text-red-400'}`}>
                            {score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 min-h-[150px]">
                  <FaUserGraduate className="text-4xl md:text-6xl mb-2 md:mb-4" />
                  <p className="text-sm md:text-lg">لا توجد نتائج</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FilterGradesModal;