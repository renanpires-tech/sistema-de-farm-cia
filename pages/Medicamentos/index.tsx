
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Medicamento, Categoria } from '../../types';
import { Edit, PlusCircle, Trash2, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { medicamentosService } from '../../services/medicamentos';
import { categoriasService } from '../../services/categorias';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import MedicamentoForm from '../../components/forms/MedicamentoForm';
import { logger } from '../../utils/logger';


// Função para determinar a classe de estilo com base no status do medicamento
const getStatusClass = (medicamento: Medicamento): string => {
    if (!medicamento.ativo) return 'bg-gray-600 text-gray-400';
    
    const validade = new Date(medicamento.dataValidade);
    const hoje = new Date();
    const diffDias = (validade.getTime() - hoje.getTime()) / (1000 * 3600 * 24);

    if (diffDias < 0) return 'bg-red-800 text-red-100'; // Vencido
    if (diffDias <= 30) return 'bg-orange-800 text-orange-100'; // Validade próxima
    if (medicamento.estoque <= 10 && medicamento.estoque > 0) return 'bg-yellow-800 text-yellow-100'; // Estoque baixo
    if (medicamento.estoque === 0) return 'bg-red-800 text-red-100'; // Sem estoque
    
    return 'bg-gray-800'; // Normal
};

// Página para gerenciar Medicamentos
const Medicamentos: React.FC = () => {
  const navigate = useNavigate();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicamento, setEditingMedicamento] = useState<Medicamento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega os medicamentos e categorias ao montar o componente
  useEffect(() => {
    loadMedicamentos();
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await categoriasService.getAll();
      setCategorias(data);
    } catch (err) {
      logger.error('Erro ao carregar categorias', err);
    }
  };

  const loadMedicamentos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Usa o endpoint de medicamentos ativos (GET /api/medicamentos/ativos)
      // Conforme README: GET /api/medicamentos retorna apenas ativos
      const data = await medicamentosService.getAtivos();
      setMedicamentos(data);
      logger.info(`Medicamentos carregados: ${data.length} medicamentos ativos`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar medicamentos');
      logger.error('Erro ao carregar medicamentos', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const novoStatus = !currentStatus;
      logger.info(`Iniciando alteração de status do medicamento ${id}`, { 
        statusAtual: currentStatus, 
        novoStatus: novoStatus 
      });
      
      await medicamentosService.toggleStatus(id, novoStatus);
      await loadMedicamentos(); // Recarrega a lista
      
      logger.audit('MEDICAMENTO_STATUS_ALTERADO', 'Medicamento', id, {
        statusAnterior: currentStatus,
        statusNovo: novoStatus,
      });
      logger.success(`Status do medicamento alterado para ${novoStatus ? 'ATIVO' : 'INATIVO'}`);
    } catch (err: any) {
      // Tratamento de erros específicos com mensagens mais detalhadas
      let errorMessage = 'Erro ao alterar status do medicamento';
      const errorResponse = err?.response?.data;
      const statusCode = err?.response?.status;
      
      if (statusCode === 400) {
        // Erro de validação
        if (Array.isArray(errorResponse?.errors)) {
          errorMessage = 'Erros de validação:\n• ' + errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.defaultMessage || e.message || e.field || JSON.stringify(e)))
            .join('\n• ');
        } else {
          errorMessage = err.message || errorResponse?.message || errorResponse?.error || 'Dados inválidos. Verifique se o medicamento pode ser alterado.';
        }
      } else if (statusCode === 404) {
        errorMessage = 'Medicamento não encontrado.';
      } else if (statusCode === 500) {
        // Erro interno do servidor - tenta extrair mensagem detalhada
        if (errorResponse?.message) {
          errorMessage = `Erro interno: ${errorResponse.message}`;
        } else if (errorResponse?.error) {
          errorMessage = `Erro interno: ${errorResponse.error}`;
        } else if (err.message) {
          errorMessage = err.message;
        } else {
          errorMessage = 'Erro interno do servidor. Verifique os logs do backend e tente novamente.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      logger.error('Falha ao alterar status do medicamento', err, { 
        medicamentoId: id,
        errorMessage: errorMessage,
        statusCode: statusCode,
        errorResponse: errorResponse,
      });
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    const medicamento = medicamentos.find(m => m.id === id);
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) {
      return;
    }
    try {
      logger.info(`Tentativa de exclusão do medicamento ${id}`);
      await medicamentosService.delete(id);
      await loadMedicamentos(); // Recarrega a lista
      logger.audit('MEDICAMENTO_EXCLUIDO', 'Medicamento', id, {
        nome: medicamento?.nome,
      });
      logger.success(`Medicamento ${medicamento?.nome} excluído com sucesso`);
    } catch (err) {
      logger.error('Erro ao excluir medicamento', err, { medicamentoId: id });
      alert(err instanceof Error ? err.message : 'Erro ao excluir medicamento');
    }
  };

  const handleOpenModal = (medicamento?: Medicamento) => {
    setEditingMedicamento(medicamento || null);
    setIsModalOpen(true);
    logger.info(medicamento ? `Abertura de formulário de edição: ${medicamento.nome}` : 'Abertura de formulário de novo medicamento');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMedicamento(null);
  };

  const handleSaveMedicamento = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Encontra a categoria selecionada
      const categoriaSelecionada = categorias.find(cat => cat.id === data.categoriaId);
      
      if (!categoriaSelecionada) {
        alert('Por favor, selecione uma categoria válida');
        return;
      }

      // Mapeia os dados do formulário para o formato esperado pelo backend
      // Garante que todos os campos obrigatórios estão presentes
      const medicamentoData: Omit<Medicamento, 'id'> = {
        nome: String(data.nome).trim(),
        dosagem: data.dosagem ? String(data.dosagem).trim() : '',
        descricao: data.descricao ? String(data.descricao).trim() : null,
        preco: parseFloat(String(data.preco)),
        estoque: parseInt(String(data.quantidadeEstoque), 10),
        dataValidade: String(data.dataValidade).split('T')[0], // Garante formato YYYY-MM-DD
        ativo: Boolean(data.ativo),
        categoria: categoriaSelecionada,
      };
      
      // Validações adicionais
      if (!medicamentoData.nome || medicamentoData.nome.length === 0) {
        throw new Error('Nome do medicamento é obrigatório');
      }
      
      if (isNaN(medicamentoData.preco) || medicamentoData.preco < 0) {
        throw new Error('Preço deve ser um número válido maior ou igual a zero');
      }
      
      if (isNaN(medicamentoData.estoque) || medicamentoData.estoque < 0) {
        throw new Error('Quantidade de estoque deve ser um número válido maior ou igual a zero');
      }
      
      if (!medicamentoData.dataValidade || !medicamentoData.dataValidade.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Data de validade inválida');
      }

      if (editingMedicamento) {
        await medicamentosService.update(editingMedicamento.id, medicamentoData);
      } else {
        await medicamentosService.create(medicamentoData);
      }

      await loadMedicamentos();
      handleCloseModal();
      
      // Log de auditoria
      logger.audit(
        editingMedicamento ? 'MEDICAMENTO_EDITADO' : 'MEDICAMENTO_CRIADO',
        'Medicamento',
        editingMedicamento?.id,
        { nome: medicamentoData.nome }
      );
    } catch (err: any) {
      let errorMessage = 'Erro ao salvar medicamento';
      const errorResponse = err?.response?.data;
      const statusCode = err?.response?.status;
      
      // Tratamento detalhado de erros
      if (statusCode === 400) {
        // Erro de validação - tenta capturar mensagens detalhadas
        if (Array.isArray(errorResponse?.errors)) {
          // Array de erros de validação (formato Spring Boot)
          errorMessage = errorResponse.errors
            .map((e: any) => {
              if (typeof e === 'string') return e;
              return e.defaultMessage || e.message || e.field || JSON.stringify(e);
            })
            .join('\n• ');
          errorMessage = 'Erros de validação:\n• ' + errorMessage;
        } else if (errorResponse?.validationErrors) {
          // Objeto com erros por campo
          const validationErrs = Object.entries(errorResponse.validationErrors)
            .map(([field, msgs]: [string, any]) => 
              `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
            )
            .join('\n• ');
          errorMessage = 'Erros de validação:\n• ' + validationErrs;
        } else {
          // Mensagem simples
          errorMessage = err.message || 
                        errorResponse?.message || 
                        errorResponse?.error ||
                        errorResponse?.detail ||
                        'Dados inválidos. Verifique os campos preenchidos.';
        }
      } else if (statusCode === 404) {
        errorMessage = err.message || errorResponse?.message || 'Medicamento não encontrado.';
      } else if (statusCode === 409) {
        errorMessage = err.message || errorResponse?.message || 'Já existe um medicamento com este nome.';
      } else if (statusCode === 500) {
        // Erro 500 - detalha melhor a mensagem
        if (Array.isArray(errorResponse?.errors)) {
          errorMessage = errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.message || e.defaultMessage || JSON.stringify(e)))
            .join('\n• ');
          errorMessage = 'Erro interno:\n• ' + errorMessage;
        } else {
          errorMessage = errorResponse?.message || 
                        errorResponse?.error ||
                        err?.message ||
                        'Erro interno do servidor. Verifique os logs do backend.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      // Log detalhado para debugging
      logger.error('Erro ao salvar medicamento', err, { 
        dados: data,
        medicamentoData: editingMedicamento ? {
          id: editingMedicamento.id,
          nome: editingMedicamento.nome,
        } : null,
        errorResponse: errorResponse,
        statusCode: statusCode,
        errorMessage: errorMessage,
      });
      
      // Exibe erro em formato mais amigável
      const tipoOperacao = editingMedicamento ? 'Editar' : 'Criar';
      const medicamentoInfo = editingMedicamento 
        ? `\n\nMedicamento ID: ${editingMedicamento.id}\nNome: ${editingMedicamento.nome}`
        : '\n\nNovo medicamento';
      
      alert(`❌ Erro ao ${tipoOperacao.toLowerCase()} medicamento\n\n${errorMessage}${medicamentoInfo}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciar Medicamentos</h1>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
                <PlusCircle size={20} className="mr-2" />
                Novo Medicamento
            </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Versão Desktop - Tabela */}
        <div className="hidden md:block bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 lg:px-6 py-3">Nome</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Estoque</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Preço</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Validade</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Status</th>
                            <th scope="col" className="px-4 lg:px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicamentos.map((med) => (
                            <tr key={med.id} className={`border-b border-gray-700 ${getStatusClass(med)}`}>
                                <td className="px-4 lg:px-6 py-4 font-medium text-white">
                                  <div>
                                    <div className="whitespace-nowrap">
                                      {med.nome}{med.dosagem ? ` (${med.dosagem})` : ''}
                                    </div>
                                    {med.descricao && (
                                      <div className="text-xs text-gray-400 mt-1 line-clamp-2">{med.descricao}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 lg:px-6 py-4">{med.estoque}</td>
                                <td className="px-4 lg:px-6 py-4">R$ {med.preco.toFixed(2)}</td>
                                <td className="px-4 lg:px-6 py-4">{new Date(med.dataValidade).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 lg:px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${med.ativo ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
                                        {med.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-4 lg:px-6 py-4 flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => navigate(`/medicamentos/${med.id}`)}
                                      className="p-2 text-blue-400 hover:text-blue-300"
                                      title="Ver Detalhes"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleOpenModal(med)}
                                      className="p-2 text-yellow-400 hover:text-yellow-300"
                                      title="Editar"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(med.id)} 
                                      className="p-2 text-red-500 hover:text-red-400" 
                                      title="Excluir"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleToggleStatus(med.id, med.ativo)} 
                                      className="p-2 text-gray-400 hover:text-white"
                                      title={med.ativo ? 'Desativar' : 'Ativar'}
                                    >
                                        {med.ativo ? <ToggleRight size={22} className="text-green-500"/> : <ToggleLeft size={22} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Versão Mobile - Cards */}
        <div className="md:hidden space-y-4">
          {medicamentos.map((med) => (
            <div key={med.id} className={`bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4 ${getStatusClass(med)}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base mb-1">
                    {med.nome}{med.dosagem ? ` (${med.dosagem})` : ''}
                  </h3>
                  {med.descricao && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{med.descricao}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${med.ativo ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
                  {med.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span className="text-gray-400">Estoque:</span>
                  <span className="text-white font-medium ml-2">{med.estoque}</span>
                </div>
                <div>
                  <span className="text-gray-400">Preço:</span>
                  <span className="text-white font-medium ml-2">R$ {med.preco.toFixed(2)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400">Validade:</span>
                  <span className="text-white font-medium ml-2">{new Date(med.dataValidade).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 pt-3 border-t border-gray-700">
                <button
                  onClick={() => navigate(`/medicamentos/${med.id}`)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Ver Detalhes"
                >
                  <Eye size={18} className="mr-1" />
                  <span className="text-xs">Ver</span>
                </button>
                <button
                  onClick={() => handleOpenModal(med)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} className="mr-1" />
                  <span className="text-xs">Editar</span>
                </button>
                <button 
                  onClick={() => handleDelete(med.id)} 
                  className="flex-1 flex items-center justify-center px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" 
                  title="Excluir"
                >
                  <Trash2 size={18} className="mr-1" />
                  <span className="text-xs">Excluir</span>
                </button>
                <button 
                  onClick={() => handleToggleStatus(med.id, med.ativo)} 
                  className="flex-1 flex items-center justify-center px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={med.ativo ? 'Desativar' : 'Ativar'}
                >
                  {med.ativo ? <ToggleRight size={18} className="mr-1" /> : <ToggleLeft size={18} className="mr-1" />}
                  <span className="text-xs">{med.ativo ? 'Desativar' : 'Ativar'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Cadastro/Edição */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingMedicamento ? 'Editar Medicamento' : 'Novo Medicamento'}
        >
          <MedicamentoForm
            onSubmit={handleSaveMedicamento}
            onCancel={handleCloseModal}
            categorias={categorias}
            initialData={editingMedicamento || undefined}
            isLoading={isSubmitting}
          />
        </Modal>
    </div>
  );
};

export default Medicamentos;
