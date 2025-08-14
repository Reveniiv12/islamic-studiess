// ExcelActions.jsx
const ExcelActions = ({ onImport, onExport }) => {
  const fileInputRef = React.useRef(null);

  return (
    <div className="excel-actions flex flex-col items-start gap-2">
      {/* استيراد */}
      <button
        onClick={() => fileInputRef.current.click()}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        استيراد من Excel
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* تصدير */}
      <button
        onClick={onExport}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        تصدير إلى Excel
      </button>

      {/* الملاحظات */}
      <button
        onClick={() => alert("هنا سيتم فتح نافذة الملاحظات")}
        className="bg-yellow-500 text-black px-4 py-2 rounded"
      >
        الملاحظات
      </button>
    </div>
  );
};

export default ExcelActions;
