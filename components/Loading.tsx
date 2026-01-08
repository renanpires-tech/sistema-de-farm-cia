
import React from 'react';

// Componente de Loading que exibe um spinner animado no centro da tela.
// Útil para fornecer feedback visual durante o carregamento de dados.
const Loading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen w-screen bg-gray-900 bg-opacity-75 fixed top-0 left-0 z-50">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default Loading;
