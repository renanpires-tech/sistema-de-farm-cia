
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';

// Componente principal que encapsula toda a aplicação.
// Ele utiliza o AuthProvider para gerenciar o estado de autenticação
// e o AppRoutes para controlar a navegação entre as páginas.
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
