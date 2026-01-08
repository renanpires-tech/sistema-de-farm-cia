
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Hook customizado para facilitar o uso do AuthContext.
// Garante que o contexto seja consumido dentro de um AuthProvider.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
