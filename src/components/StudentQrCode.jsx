// src/components/StudentQrCode.jsx
import React from 'react';
import QRCode from 'react-qr-code';

const StudentQrCode = ({ viewKey, size = 80 }) => {
  const studentViewUrl = `${window.location.origin}${viewKey}`;
  return (
    <div className="p-2 bg-white rounded-lg">
      <QRCode
        value={studentViewUrl}
        size={size}
        level="M"
      />
    </div>
  );
};

export default StudentQrCode;