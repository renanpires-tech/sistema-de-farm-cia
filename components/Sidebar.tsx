
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Pill, Users, ShoppingCart, Archive, AlertTriangle, Tag } from 'lucide-react';
import Logo from './Logo';

// Array de objetos para configurar os itens da navegação
const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/medicamentos', icon: Pill, label: 'Medicamentos' },
  { to: '/categorias', icon: Tag, label: 'Categorias' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/estoque', icon: Archive, label: 'Estoque' },
  { to: '/alertas', icon: AlertTriangle, label: 'Alertas' },
];

// Componente da barra lateral (Sidebar) com a navegação principal da aplicação.
const Sidebar: React.FC = () => {
  const linkClasses = "flex items-center p-3 my-1 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors";
  const activeLinkClasses = "bg-blue-600 text-white";

  return (
    <aside className="w-64 bg-gray-900 text-white flex-shrink-0 p-4 border-r border-gray-700 hidden md:block">
      <div className="mb-8">
        <Logo />
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                <item.icon className="mr-3" size={20} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
