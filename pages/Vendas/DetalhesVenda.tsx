import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Venda } from '../../types';
import { ArrowLeft, Calendar, User, Package } from 'lucide-react';
import { vendasService } from '../../services/vendas';
import Loading from '../../components/Loading';
import { logger } from '../../utils/logger';

const DetalhesVenda: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadVenda(parseInt(id));
      logger.info(`Visualizando detalhes da venda ${id}`);
    }
  }, [id]);

  const loadVenda = async (vendaId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vendasService.getById(vendaId);
      setVenda(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar venda';
      setError(errorMessage);
      logger.error(`Erro ao carregar venda ${vendaId}`, err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !venda) {
    return (
      <div className="container mx-auto">
        <button
          onClick={() => navigate('/vendas')}
          className="mb-4 flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para lista de vendas
        </button>
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-red-200">
          <p className="font-semibold">Erro ao carregar venda</p>
          <p>{error || 'Venda não encontrada'}</p>
        </div>
      </div>
    );
  }

  const dataVenda = new Date(venda.dataVenda);

  return (
    <div className="container mx-auto">
      <button
        onClick={() => navigate('/vendas')}
        className="mb-6 flex items-center text-blue-400 hover:text-blue-300"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para lista de vendas
      </button>

      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Venda #{venda.id}</h1>
              <p className="text-gray-400 flex items-center gap-2 mt-1">
                <Calendar size={16} />
                {dataVenda.toLocaleDateString('pt-BR')} às {dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Valor Total</p>
              <p className="text-3xl font-bold text-green-400">R$ {venda.valorTotal?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Cliente */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} />
              Cliente
            </h2>
            <div className="bg-gray-700 rounded-lg p-4">
              {venda.cliente ? (
                <>
                  <p className="text-white font-medium">{venda.cliente.nome}</p>
                  <p className="text-gray-400 text-sm mt-1">CPF: {venda.cliente.cpf}</p>
                  {venda.cliente.email && (
                    <p className="text-gray-400 text-sm">Email: {venda.cliente.email}</p>
                  )}
                  {venda.cliente.telefone && (
                    <p className="text-gray-400 text-sm">Telefone: {venda.cliente.telefone}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Cliente não informado</p>
              )}
            </div>
          </div>

          {/* Itens da Venda */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package size={20} />
              Itens da Venda ({venda.itens?.length || 0})
            </h2>
            <div className="space-y-2">
              {venda.itens && venda.itens.length > 0 ? (
                venda.itens.map((item, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{item.nomeMedicamento}</p>
                      <p className="text-gray-400 text-sm">
                        {item.quantidade} x R$ {item.precoUnitario.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-white font-bold">
                      R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">Nenhum item encontrado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesVenda;

