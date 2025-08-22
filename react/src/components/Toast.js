// Toast.js
import React, { useEffect } from 'react';
import './toast.css';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000); // 3초 뒤 닫기
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast">
      {message}
    </div>
  );
}
