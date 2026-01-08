
import React, { useState, useEffect } from 'react';
import type { MovimentacaoEstoque, Medicamento } from '../../types';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { estoqueService, type MovimentacaoEstoqueResponse } from '../../services/estoque';
import { medicamentosService } from '../../services/medicamentos';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import MovimentacaoForm from '../../components/forms/MovimentacaoForm';
import { logger } from '../../utils/logger';

// Página para gerenciar o Estoque
const Estoque: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movimentacaoTipo, setMovimentacaoTipo] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMovimentacoes();
    loadMedicamentos();
    logger.info('Página de estoque acessada');
  }, []);

  const loadMedicamentos = async () => {
    try {
      // Carrega TODOS os medicamentos (ativos e inativos) para gerenciamento de estoque
      // É necessário ter acesso a todos para registrar movimentações mesmo em medicamentos inativos
      const data = await medicamentosService.getAll();
      setMedicamentos(data);
      logger.info(`Medicamentos carregados para estoque: ${data.length} medicamentos (ativos e inativos)`);
    } catch (err) {
      logger.error('Erro ao carregar medicamentos', err);
      setError('Erro ao carregar lista de medicamentos. Tente novamente.');
    }
  };

  const loadMovimentacoes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Tenta carregar o histórico de movimentações
      const movimentacoesData = await estoqueService.getAll();
      setMovimentacoes(movimentacoesData);
      
      if (movimentacoesData.length === 0) {
        logger.info('Nenhuma movimentação encontrada no histórico');
      } else {
        logger.info(`Histórico de movimentações carregado: ${movimentacoesData.length} registros`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar movimentações';
      // Não exibe erro se for 404 (endpoint não existe)
      if (err instanceof Error && (
        errorMsg.includes('404') || 
        errorMsg.includes('not found') ||
        errorMsg.includes('Not Found')
      )) {
        logger.info('Endpoint de histórico de movimentações não disponível');
        setMovimentacoes([]);
      } else {
        setError(errorMsg);
        logger.error('Erro ao carregar movimentações', err);
        setMovimentacoes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (tipo: 'ENTRADA' | 'SAIDA') => {
    setMovimentacaoTipo(tipo);
    setIsModalOpen(true);
    logger.info(`Modal de ${tipo === 'ENTRADA' ? 'entrada' : 'saída'} aberto`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveMovimentacao = async (data: { medicamentoId: number; quantidade: number; observacao?: string }) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const medicamento = medicamentos.find(m => m.id === data.medicamentoId);
      const medicamentoNome = medicamento?.nome || `ID ${data.medicamentoId}`;
      
      // Validações adicionais
      if (!medicamento) {
        throw new Error('Medicamento não encontrado na lista');
      }
      
      if (movimentacaoTipo === 'SAIDA' && medicamento.estoque < data.quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${medicamento.estoque} unidades`);
      }
      
      logger.info(`Registrando ${movimentacaoTipo === 'ENTRADA' ? 'entrada' : 'saída'} de estoque`, {
        medicamentoId: data.medicamentoId,
        medicamento: medicamentoNome,
        quantidade: data.quantidade,
        estoqueAtual: medicamento.estoque,
        observacao: data.observacao || 'Sem observação',
      });
      
      let response;
      const tipoTexto = movimentacaoTipo === 'ENTRADA' ? 'entrada' : 'saída';
      
      if (movimentacaoTipo === 'ENTRADA') {
        response = await estoqueService.registrarEntrada({
          medicamentoId: data.medicamentoId,
          quantidade: data.quantidade,
          observacao: data.observacao,
        });
        
        logger.audit('ESTOQUE_ENTRADA', 'Estoque', data.medicamentoId, {
          medicamento: response.nome || medicamentoNome,
          quantidade: data.quantidade,
          estoqueAnterior: medicamento.estoque,
          estoqueNovo: response.quantidadeAtual,
          observacao: data.observacao || 'Sem observação',
        });
      } else {
        response = await estoqueService.registrarSaida({
          medicamentoId: data.medicamentoId,
          quantidade: data.quantidade,
          observacao: data.observacao,
        });
        
        logger.audit('ESTOQUE_SAIDA', 'Estoque', data.medicamentoId, {
          medicamento: response.nome || medicamentoNome,
          quantidade: data.quantidade,
          estoqueAnterior: medicamento.estoque,
          estoqueNovo: response.quantidadeAtual,
          observacao: data.observacao || 'Sem observação',
        });
      }

      // Atualiza o medicamento na lista local com os dados retornados pelo backend
      setMedicamentos(prevMedicamentos => 
        prevMedicamentos.map(med => {
          if (med.id === response.medicamentoId) {
            return {
              ...med,
              estoque: response.quantidadeAtual,
              ativo: response.status === 'ATIVO',
            };
          }
          return med;
        })
      );
      
      // Recarrega o histórico de movimentações após registrar nova movimentação
      await loadMovimentacoes();
      
      handleCloseModal();
      
      logger.success(`Movimentação de ${tipoTexto} registrada`, {
        medicamento: response.nome || medicamentoNome,
        quantidade: data.quantidade,
        estoqueAnterior: medicamento.estoque,
        estoqueNovo: response.quantidadeAtual,
        tipo: movimentacaoTipo,
      });
      
      const mensagemSucesso = `✅ Movimentação de ${tipoTexto} registrada com sucesso!\n\n` +
        `${response.nome || medicamentoNome}\n` +
        `Quantidade movimentada: ${data.quantidade} unidades\n` +
        `Estoque anterior: ${medicamento.estoque} unidades\n` +
        `Estoque atual: ${response.quantidadeAtual} unidades`;
      
      alert(mensagemSucesso);
    } catch (err: any) {
      let errorMessage = `Erro ao registrar ${movimentacaoTipo === 'ENTRADA' ? 'entrada' : 'saída'}`;
      
      if (err?.response?.status === 400) {
        errorMessage = err.message || 'Dados inválidos. Verifique a quantidade e o medicamento selecionado.';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Medicamento não encontrado no sistema.';
      } else if (err?.response?.status === 422) {
        errorMessage = err.message || 'Não foi possível realizar a movimentação. Estoque insuficiente ou dados inválidos.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Log detalhado do erro com informações do backend
      const errorDetails: any = {
        medicamentoId: data.medicamentoId,
        quantidade: data.quantidade,
        tipo: movimentacaoTipo,
      };
      
      if (err?.response?.data) {
        errorDetails.backendError = err.response.data;
        errorDetails.statusCode = err.response.status;
      }
      
      logger.error(`Erro ao registrar ${movimentacaoTipo} de estoque`, err, errorDetails);
      
      // Melhora a mensagem de erro com informações do backend
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (typeof err?.response?.data === 'string') {
        errorMessage = err.response.data;
      }
      
      setError(errorMessage);
      alert(`❌ ${errorMessage}\n\nDetalhes: Medicamento ID ${data.medicamentoId}, Quantidade: ${data.quantidade}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMovimentacoes = movimentacoes.filter(mov => {
    const nome = mov.medicamentoNome?.toLowerCase() || '';
    const observacao = mov.observacao?.toLowerCase() || '';
    const filterLower = filter.toLowerCase();
    return nome.includes(filterLower) || observacao.includes(filterLower);
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Controle de Estoque</h1>
             <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={() => handleOpenModal('ENTRADA')}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                    <ArrowUpCircle size={20} className="mr-2" />
                    Registrar Entrada
                </button>
                 <button
                  onClick={() => handleOpenModal('SAIDA')}
                  className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                    <ArrowDownCircle size={20} className="mr-2" />
                    Registrar Saída
                </button>
             </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200">
            <p className="font-semibold">ℹ️ Informação:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Lista de Medicamentos com Estoque */}
        {medicamentos.length > 0 && (
          <div className="mb-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Medicamentos Disponíveis</h2>
              <p className="text-sm text-gray-400 mt-1">Estoque atualizado em tempo real</p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicamentos.map((med) => {
                  const validade = new Date(med.dataValidade);
                  const hoje = new Date();
                  const diffDias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
                  const isVencido = diffDias < 0;
                  const validadeProxima = diffDias >= 0 && diffDias <= 30;
                  
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-lg border ${
                        med.estoque === 0 ? 'border-red-600 bg-red-900/20' :
                        med.estoque <= 10 ? 'border-yellow-600 bg-yellow-900/20' :
                        isVencido ? 'border-red-600 bg-red-900/20' :
                        validadeProxima ? 'border-orange-600 bg-orange-900/20' :
                        'border-gray-600 bg-gray-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm">
                            {med.nome} {med.dosagem ? `(${med.dosagem})` : ''}
                          </h3>
                          {!med.ativo && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-red-100">
                              INATIVO
                            </span>
                          )}
                        </div>
                      </div>
                      {med.descricao && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{med.descricao}</p>
                      )}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estoque:</span>
                          <span className={`font-bold ${
                            med.estoque === 0 ? 'text-red-400' :
                            med.estoque <= 10 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {med.estoque} unidades
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Validade:</span>
                          <span className={`font-medium ${
                            isVencido ? 'text-red-400' :
                            validadeProxima ? 'text-orange-400' :
                            'text-gray-300'
                          }`}>
                            {validade.toLocaleDateString('pt-BR')}
                            {isVencido && ' (Vencido)'}
                            {validadeProxima && !isVencido && ` (${diffDias}d)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
             <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-2">Histórico de Movimentações</h2>
                <input 
                  type="text" 
                  placeholder="Filtrar por nome do medicamento ou observação..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:max-w-sm px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base" 
                />
             </div>
             {/* Versão Desktop - Tabela */}
             <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Medicamento</th>
                            <th scope="col" className="px-6 py-3">Tipo</th>
                            <th scope="col" className="px-6 py-3">Quantidade</th>
                            <th scope="col" className="px-6 py-3">Estoque Antes</th>
                            <th scope="col" className="px-6 py-3">Estoque Depois</th>
                            <th scope="col" className="px-6 py-3">Data/Hora</th>
                            <th scope="col" className="px-6 py-3">Observação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovimentacoes.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                              {filter ? (
                                'Nenhuma movimentação encontrada com o filtro aplicado'
                              ) : (
                                <div>
                                  <p className="mb-2">Nenhuma movimentação registrada no histórico</p>
                                  <p className="text-xs text-gray-500">
                                    Use os botões acima para registrar entrada ou saída de estoque
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredMovimentacoes.map((mov) => {
                            // Obtém data de movimentação de múltiplas fontes possíveis
                            const dataMov = mov.data || mov.dataMovimentacao || mov.data_movimentacao || '';
                            let dataFormatada = '-';
                            if (dataMov) {
                              try {
                                const dataObj = new Date(dataMov);
                                if (!isNaN(dataObj.getTime())) {
                                  dataFormatada = dataObj.toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  });
                                }
                              } catch (e) {
                                logger.warn('Erro ao formatar data', { dataMov, error: e });
                              }
                            }
                            
                            // Obtém quantidade anterior (aceita ambos os formatos)
                            const quantidadeAnterior = mov.quantidadeAnterior !== undefined && mov.quantidadeAnterior !== null
                              ? mov.quantidadeAnterior
                              : (mov.quantidade_anterior !== undefined && mov.quantidade_anterior !== null
                                ? mov.quantidade_anterior
                                : null);
                            
                            // Obtém quantidade atual (aceita ambos os formatos)
                            const quantidadeAtual = mov.quantidadeAtual !== undefined && mov.quantidadeAtual !== null
                              ? mov.quantidadeAtual
                              : (mov.quantidade_atual !== undefined && mov.quantidade_atual !== null
                                ? mov.quantidade_atual
                                : null);
                            
                            return (
                              <tr key={mov.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                  {mov.medicamentoNome || `Medicamento ID ${mov.medicamentoId || mov.medicamento_id || 'N/A'}`}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`flex items-center text-xs font-semibold ${mov.tipo === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                                    {mov.tipo === 'ENTRADA' ? <ArrowUpCircle size={16} className="mr-2"/> : <ArrowDownCircle size={16} className="mr-2"/>}
                                    {mov.tipo}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold">{mov.quantidade}</td>
                                <td className="px-6 py-4 text-gray-300">
                                  {quantidadeAnterior !== null ? quantidadeAnterior : '-'}
                                </td>
                                <td className={`px-6 py-4 font-semibold ${
                                  mov.tipo === 'ENTRADA' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {quantidadeAtual !== null ? quantidadeAtual : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-300 text-sm">{dataFormatada}</td>
                                <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate" title={mov.observacao || ''}>
                                  {mov.observacao || '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Versão Mobile/Tablet - Cards */}
            <div className="lg:hidden p-4 space-y-4">
              {filteredMovimentacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {filter ? (
                    'Nenhuma movimentação encontrada com o filtro aplicado'
                  ) : (
                    <div>
                      <p className="mb-2">Nenhuma movimentação registrada no histórico</p>
                      <p className="text-xs text-gray-500">
                        Use os botões acima para registrar entrada ou saída de estoque
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                filteredMovimentacoes.map((mov) => {
                  const dataMov = mov.data || mov.dataMovimentacao || mov.data_movimentacao || '';
                  let dataFormatada = '-';
                  if (dataMov) {
                    try {
                      const dataObj = new Date(dataMov);
                      if (!isNaN(dataObj.getTime())) {
                        dataFormatada = dataObj.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }
                    } catch (e) {
                      logger.warn('Erro ao formatar data', { dataMov, error: e });
                    }
                  }
                  
                  const quantidadeAnterior = mov.quantidadeAnterior ?? mov.quantidade_anterior ?? null;
                  const quantidadeAtual = mov.quantidadeAtual ?? mov.quantidade_atual ?? null;
                  
                  return (
                    <div key={mov.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-sm mb-1">
                            {mov.medicamentoNome || `Medicamento ID ${mov.medicamentoId || mov.medicamento_id || 'N/A'}`}
                          </h3>
                        </div>
                        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${
                          mov.tipo === 'ENTRADA' 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-red-900/50 text-red-400'
                        }`}>
                          {mov.tipo === 'ENTRADA' ? <ArrowUpCircle size={14} className="mr-1"/> : <ArrowDownCircle size={14} className="mr-1"/>}
                          {mov.tipo}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <span className="text-gray-400">Quantidade:</span>
                          <span className="text-white font-bold ml-2">{mov.quantidade}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Data:</span>
                          <span className="text-white ml-2">{dataFormatada}</span>
                        </div>
                        {quantidadeAnterior !== null && (
                          <div>
                            <span className="text-gray-400">Antes:</span>
                            <span className="text-white ml-2">{quantidadeAnterior}</span>
                          </div>
                        )}
                        {quantidadeAtual !== null && (
                          <div>
                            <span className={`font-semibold ${mov.tipo === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                              Depois: <span className="text-white">{quantidadeAtual}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {mov.observacao && (
                        <div className="pt-3 border-t border-gray-600">
                          <span className="text-gray-400 text-xs">Observação: </span>
                          <span className="text-gray-300 text-xs">{mov.observacao}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
        </div>

        {/* Modal de Movimentação */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={movimentacaoTipo === 'ENTRADA' ? 'Registrar Entrada de Estoque' : 'Registrar Saída de Estoque'}
        >
          <MovimentacaoForm
            onSubmit={handleSaveMovimentacao}
            onCancel={handleCloseModal}
            medicamentos={medicamentos}
            tipo={movimentacaoTipo}
            isLoading={isSubmitting}
          />
        </Modal>
    </div>
  );
};

export default Estoque;
