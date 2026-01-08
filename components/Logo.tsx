
import React from 'react';

// Componente reutilizável para o logo da "Drogaria São Paulo".
// Isso evita duplicação de código e facilita a manutenção.
const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0 relative" style={{ width: '32px', height: '32px' }}>
        <div className="absolute top-0 left-0 w-1/2 h-full bg-red-500"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-cyan-400"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="white" strokeWidth="4" strokeLinecap="square" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="white" strokeWidth="4" strokeLinecap="square" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-light text-gray-300">Drogaria</span>
        <span className="text-xl font-bold text-white">São Paulo</span>
      </div>
    </div>
  );
};

export default Logo;
