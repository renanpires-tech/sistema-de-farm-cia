import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Venda } from '../../types';
import { PlusCircle, ShoppingCart, Eye, Calendar, User } from 'lucide-react';
import { vendasService } from '../../services/vendas';
import Loading from '../../components/Loading';
import { logger } from '../../utils/logger';

// Componente de Card de Venda
const VendaCard: React.FC<{ venda: Venda; onViewDetails: (id: number) => void }> = ({ venda, onViewDetails }) => {
  const dataVenda = new Date(venda.dataVenda);
  
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-blue-500 transition-all duration-300 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Venda #{venda.id}</h3>
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
              <Calendar size={14} />
              {dataVenda.toLocaleDateString('pt-BR')} às {dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button
          onClick={() => onViewDetails(venda.id)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Eye size={18} />
          Detalhes
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
            <User size={14} />
            Cliente
          </p>
          {venda.cliente ? (
            <>
              <p className="text-white font-medium">{venda.cliente.nome}</p>
              {venda.cliente.cpf && (
                <p className="text-xs text-gray-500">CPF: {venda.cliente.cpf}</p>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">Cliente não informado</p>
          )}
        </div>
        
        <div>
          <p className="text-sm text-gray-400 mb-1">Itens</p>
          <p className="text-white font-medium">{venda.itens?.length || 0} item(s)</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Valor Total</span>
          <span className="text-2xl font-bold text-green-400">
            R$ {venda.valorTotal?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Página de Listagem de Vendas
const ListaVendas: React.FC = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadVendas();
    logger.info('Página de listagem de vendas acessada');
  }, []);

  const loadVendas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vendasService.getAll();
      setVendas(data);
      logger.info(`Listagem de vendas carregada: ${data.length} vendas encontradas`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar vendas';
      setError(errorMessage);
      logger.error('Erro ao carregar vendas', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (id: number) => {
    logger.info(`Visualização de detalhes da venda ${id}`);
    navigate(`/vendas/${id}`);
  };

  const handleNewSale = () => {
    logger.info('Navegação para nova venda');
    navigate('/vendas/nova');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Histórico de Vendas</h1>
        <button
          onClick={handleNewSale}
          className="flex items-center justify-center w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
        >
          <PlusCircle size={20} className="mr-2" />
          Nova Venda
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {vendas.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhuma venda registrada</p>
          <p className="text-gray-500 text-sm mb-4">Comece registrando sua primeira venda</p>
          <button
            onClick={handleNewSale}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Criar Primeira Venda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {vendas.map((venda) => (
            <VendaCard key={venda.id} venda={venda} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListaVendas;

