import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Medicamentos from '../pages/Medicamentos';
import Clientes from '../pages/Clientes';
import ListaVendas from '../pages/Vendas/ListaVendas';
import NovaVenda from '../pages/Vendas/NovaVenda';
import DetalhesVenda from '../pages/Vendas/DetalhesVenda';
import DetalhesMedicamento from '../pages/Medicamentos/DetalhesMedicamento';
import Estoque from '../pages/Estoque';
import Alertas from '../pages/Alertas';
import Categorias from '../pages/Categorias';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileMenu from '../components/MobileMenu';
import Loading from '../components/Loading';

// Componente para proteger rotas que exigem autenticação.
// Se o usuário não estiver autenticado, ele é redirecionado para a página de login.
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return isAuthenticated ? (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden w-full md:w-auto">
        <Header onMenuToggle={toggleMobileMenu} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-800 p-3 sm:p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  ) : <Navigate to="/login" />;
};

// Componente que define todas as rotas da aplicação.
const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();

  // Exibe um indicador de carregamento enquanto o estado de autenticação está sendo verificado
  if (isLoading) {
    return <Loading />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="medicamentos" element={<Medicamentos />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="vendas" element={<ListaVendas />} />
          <Route path="vendas/nova" element={<NovaVenda />} />
          <Route path="vendas/:id" element={<DetalhesVenda />} />
          <Route path="medicamentos/:id" element={<DetalhesMedicamento />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="alertas" element={<Alertas />} />
        </Route>
        {/* Rota de fallback para qualquer caminho não correspondido */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
