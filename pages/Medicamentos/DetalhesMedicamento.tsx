import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Medicamento } from '../../types';
import { ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight, Package, Calendar, DollarSign, Building } from 'lucide-react';
import { medicamentosService } from '../../services/medicamentos';
import Loading from '../../components/Loading';
import { logger } from '../../utils/logger';

const DetalhesMedicamento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicamento, setMedicamento] = useState<Medicamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMedicamento(parseInt(id));
      logger.info(`Visualizando detalhes do medicamento ${id}`);
    }
  }, [id]);

  const loadMedicamento = async (medicamentoId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      logger.info(`Carregando detalhes do medicamento ${medicamentoId}`);
      const data = await medicamentosService.getById(medicamentoId);
      setMedicamento(data);
      logger.success(`Medicamento ${medicamentoId} carregado com sucesso`, { nome: data.nome });
    } catch (err: any) {
      let errorMessage = 'Erro ao carregar medicamento';
      
      // Tratamento detalhado de erros
      if (err?.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        if (status === 404) {
          errorMessage = 'Medicamento não encontrado';
        } else if (status === 500) {
          // Tenta extrair mensagem do backend
          const backendMessage = errorData?.message || errorData?.error || errorData?.detail;
          errorMessage = backendMessage || 'Erro interno do servidor. Verifique os logs para mais detalhes.';
        } else if (status === 400) {
          errorMessage = errorData?.message || errorData?.error || 'Dados inválidos';
        } else if (status === 401) {
          errorMessage = 'Não autorizado. Por favor, faça login novamente.';
        } else {
          errorMessage = errorData?.message || errorData?.error || `Erro ${status}: ${err.message || 'Erro desconhecido'}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message || 'Erro ao carregar medicamento';
      }
      
      setError(errorMessage);
      logger.error(`Erro ao carregar medicamento ${medicamentoId}`, err, {
        statusCode: err?.response?.status,
        errorData: err?.response?.data,
        errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!medicamento) return;
    
    try {
      const novoStatus = !medicamento.ativo;
      await medicamentosService.toggleStatus(medicamento.id, novoStatus);
      await loadMedicamento(medicamento.id);
      logger.audit('MEDICAMENTO_STATUS_ALTERADO', 'Medicamento', medicamento.id, {
        statusAnterior: medicamento.ativo,
        statusNovo: novoStatus,
      });
    } catch (err: any) {
      let errorMessage = 'Erro ao alterar status do medicamento';
      if (err?.response?.status === 400) {
        errorMessage = err.message || 'Dados inválidos';
      } else if (err?.response?.status === 500) {
        errorMessage = err.message || 'Erro interno do servidor. Verifique os logs.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      logger.error('Erro ao alterar status', err);
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !medicamento) {
    return (
      <div className="container mx-auto">
        <button
          onClick={() => navigate('/medicamentos')}
          className="mb-4 flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para lista de medicamentos
        </button>
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-red-200">
          <p className="font-semibold">Erro ao carregar medicamento</p>
          <p>{error || 'Medicamento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const validade = new Date(medicamento.dataValidade);
  const hoje = new Date();
  const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
  const isVencido = diffDias < 0;
  const validadeProxima = diffDias >= 0 && diffDias <= 30;

  return (
    <div className="container mx-auto">
      <button
        onClick={() => navigate('/medicamentos')}
        className="mb-6 flex items-center text-blue-400 hover:text-blue-300"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para lista de medicamentos
      </button>

      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {medicamento.nome} {medicamento.dosagem ? `(${medicamento.dosagem})` : ''}
              </h1>
              {medicamento.descricao && (
                <p className="text-gray-300 mt-2">{medicamento.descricao}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/medicamentos?edit=${medicamento.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit size={18} />
                Editar
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  medicamento.ativo
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {medicamento.ativo ? (
                  <>
                    <ToggleRight size={18} />
                    Desativar
                  </>
                ) : (
                  <>
                    <ToggleLeft size={18} />
                    Ativar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Informações Básicas</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building size={20} className="text-gray-400" />
                    <div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Categoria</p>
                    <p className="text-white font-medium">{medicamento.categoria.nome}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      medicamento.ativo 
                        ? 'bg-green-600 text-green-100' 
                        : 'bg-red-600 text-red-100'
                    }`}>
                      {medicamento.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estoque e Preço */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Estoque e Preço</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Quantidade em Estoque</p>
                      <p className={`text-2xl font-bold ${
                        medicamento.estoque === 0 ? 'text-red-400' :
                        medicamento.estoque <= 10 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {medicamento.estoque} unidades
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-sm">Preço Unitário</p>
                      <p className="text-2xl font-bold text-white">R$ {medicamento.preco.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validade e Alertas */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">Validade</h2>
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Data de Validade</p>
                    <p className={`text-xl font-bold ${
                      isVencido ? 'text-red-400' :
                      validadeProxima ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                      {validade.toLocaleDateString('pt-BR')}
                    </p>
                    {isVencido && (
                      <p className="text-red-400 text-sm mt-1">⚠️ Medicamento vencido</p>
                    )}
                    {validadeProxima && !isVencido && (
                      <p className="text-orange-400 text-sm mt-1">
                        ⚠️ Vence em {diffDias} {diffDias === 1 ? 'dia' : 'dias'}
                      </p>
                    )}
                    {!isVencido && !validadeProxima && (
                      <p className="text-gray-400 text-sm mt-1">
                        Válido por mais {diffDias} dias
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {(medicamento.estoque <= 10 || validadeProxima || isVencido) && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-4">Alertas</h2>
                  <div className="space-y-2">
                    {medicamento.estoque === 0 && (
                      <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                        <p className="text-red-200 text-sm">🔴 Estoque zerado</p>
                      </div>
                    )}
                    {medicamento.estoque > 0 && medicamento.estoque <= 10 && (
                      <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-3">
                        <p className="text-yellow-200 text-sm">⚠️ Estoque baixo: {medicamento.estoque} unidades</p>
                      </div>
                    )}
                    {isVencido && (
                      <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                        <p className="text-red-200 text-sm">🔴 Medicamento vencido</p>
                      </div>
                    )}
                    {validadeProxima && !isVencido && (
                      <div className="bg-orange-900/50 border border-orange-700 rounded-lg p-3">
                        <p className="text-orange-200 text-sm">⚠️ Validade próxima: {diffDias} dias</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesMedicamento;

