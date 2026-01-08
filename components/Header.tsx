
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  onMenuToggle: () => void;
}

// Componente Header que exibe o logo, informações do usuário e o botão de sair.
const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900 shadow-md p-3 sm:p-4 flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Botão hamburger para mobile */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <Logo />
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center mr-2 sm:mr-4">
          <UserIcon className="text-gray-400 mr-1 sm:mr-2" size={18} />
          <span className="text-white font-medium text-sm sm:text-base hidden sm:inline">
            {user?.username}
          </span>
          <span className="text-white font-medium text-sm sm:hidden">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 text-sm sm:text-base"
          aria-label="Sair do sistema"
        >
          <LogOut className="mr-1 sm:mr-2" size={18} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
