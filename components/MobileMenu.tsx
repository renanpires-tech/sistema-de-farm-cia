
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Pill, Users, ShoppingCart, Archive, AlertTriangle, Tag, X } from 'lucide-react';
import Logo from './Logo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/medicamentos', icon: Pill, label: 'Medicamentos' },
  { to: '/categorias', icon: Tag, label: 'Categorias' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/estoque', icon: Archive, label: 'Estoque' },
  { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
];

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  // Fecha o menu quando a rota muda
  React.useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu lateral */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-50 md:hidden transform transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 overflow-y-auto h-full">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || 
                              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="mr-3" size={20} />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default MobileMenu;
