
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Cliente } from '../../types';
import { Edit, PlusCircle, Trash2, ShoppingCart } from 'lucide-react';
import { clientesService } from '../../services/clientes';
import { vendasService } from '../../services/vendas';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import ClienteForm from '../../components/forms/ClienteForm';
import { logger } from '../../utils/logger';

// Página para gerenciar Clientes
const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadClientes();
    logger.info('Página de clientes acessada');
  }, []);

  const loadClientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await clientesService.getAll();
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
      logger.error('Erro ao carregar clientes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const cliente = clientes.find(c => c.id === id);
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }
    try {
      logger.info(`Tentativa de exclusão do cliente ${id}`);
      await clientesService.delete(id);
      await loadClientes();
      logger.audit('CLIENTE_EXCLUIDO', 'Cliente', id, {
        nome: cliente?.nome,
      });
      logger.success(`Cliente ${cliente?.nome} excluído com sucesso`);
    } catch (err) {
      logger.error('Erro ao excluir cliente', err, { clienteId: id });
      alert(err instanceof Error ? err.message : 'Erro ao excluir cliente');
    }
  };

  const handleOpenModal = (cliente?: Cliente) => {
    setEditingCliente(cliente || null);
    setIsModalOpen(true);
    logger.info(cliente ? `Abertura de formulário de edição: ${cliente.nome}` : 'Abertura de formulário de novo cliente');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCliente(null);
  };

  const handleSaveCliente = async (data: { nome: string; cpf: string; email: string; telefone?: string; dataNascimento: string }) => {
    try {
      setIsSubmitting(true);
      
      if (editingCliente) {
        await clientesService.update(editingCliente.id, data);
      } else {
        await clientesService.create(data);
      }

      await loadClientes();
      handleCloseModal();
      logger.audit(editingCliente ? 'CLIENTE_EDITADO' : 'CLIENTE_CRIADO', 'Cliente', editingCliente?.id, {
        nome: data.nome,
        cpf: data.cpf,
      });
      logger.success(`Cliente ${editingCliente ? 'editado' : 'criado'} com sucesso`);
    } catch (err) {
      logger.error('Erro ao salvar cliente', err, { dados: data });
      alert(err instanceof Error ? err.message : 'Erro ao salvar cliente');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciar Clientes</h1>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
                <PlusCircle size={20} className="mr-2" />
                Novo Cliente
            </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Versão Desktop - Tabela */}
        <div className="hidden lg:block bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 xl:px-6 py-3">Nome</th>
                            <th scope="col" className="px-4 xl:px-6 py-3">CPF</th>
                            <th scope="col" className="px-4 xl:px-6 py-3">Email</th>
                            <th scope="col" className="px-4 xl:px-6 py-3">Telefone</th>
                            <th scope="col" className="px-4 xl:px-6 py-3">Data de Nascimento</th>
                            <th scope="col" className="px-4 xl:px-6 py-3">Idade</th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map((cliente) => {
                          const dataNasc = new Date(cliente.dataNascimento);
                          const hoje = new Date();
                          const idade = hoje.getFullYear() - dataNasc.getFullYear() - 
                            (hoje.getMonth() < dataNasc.getMonth() || 
                             (hoje.getMonth() === dataNasc.getMonth() && hoje.getDate() < dataNasc.getDate()) ? 1 : 0);
                          const podeComprar = idade >= 18;
                          
                          return (
                            <tr key={cliente.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-4 xl:px-6 py-4 font-medium text-white whitespace-nowrap">{cliente.nome}</td>
                                <td className="px-4 xl:px-6 py-4">{cliente.cpf}</td>
                                <td className="px-4 xl:px-6 py-4">{cliente.email}</td>
                                <td className="px-4 xl:px-6 py-4">{cliente.telefone || '-'}</td>
                                <td className="px-4 xl:px-6 py-4">{dataNasc.toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 xl:px-6 py-4">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    podeComprar ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                                  }`}>
                                    {idade} anos {!podeComprar && '(Menor)'}
                                  </span>
                                </td>
                                <td className="px-4 xl:px-6 py-4 flex items-center justify-center space-x-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          const vendas = await vendasService.getByCliente(cliente.id);
                                          logger.info(`Visualizando vendas do cliente ${cliente.nome}`, { vendas: vendas.length });
                                          if (vendas.length > 0) {
                                            // Poderia abrir um modal ou navegar para uma página de vendas filtradas
                                            alert(`${cliente.nome} possui ${vendas.length} venda(s) registrada(s)`);
                                          } else {
                                            alert(`${cliente.nome} ainda não possui vendas registradas`);
                                          }
                                        } catch (err) {
                                          logger.error('Erro ao buscar vendas do cliente', err);
                                        }
                                      }}
                                      className="p-2 text-green-400 hover:text-green-300"
                                      title="Ver Vendas"
                                    >
                                      <ShoppingCart size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleOpenModal(cliente)}
                                      className="p-2 text-blue-400 hover:text-blue-300"
                                      title="Editar"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(cliente.id)} 
                                      className="p-2 text-red-500 hover:text-red-400" 
                                      title="Excluir"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                          );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* Versão Mobile/Tablet - Cards */}
        <div className="lg:hidden space-y-4">
          {clientes.map((cliente) => {
            const dataNasc = new Date(cliente.dataNascimento);
            const hoje = new Date();
            const idade = hoje.getFullYear() - dataNasc.getFullYear() - 
              (hoje.getMonth() < dataNasc.getMonth() || 
               (hoje.getMonth() === dataNasc.getMonth() && hoje.getDate() < dataNasc.getDate()) ? 1 : 0);
            const podeComprar = idade >= 18;
            
            return (
              <div key={cliente.id} className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base mb-1">{cliente.nome}</h3>
                    <p className="text-sm text-gray-400">{cliente.cpf}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                    podeComprar ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                  }`}>
                    {idade} anos {!podeComprar && '(Menor)'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{cliente.email}</span>
                  </div>
                  {cliente.telefone && (
                    <div>
                      <span className="text-gray-400">Telefone:</span>
                      <span className="text-white ml-2">{cliente.telefone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Nascimento:</span>
                    <span className="text-white ml-2">{dataNasc.toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={async () => {
                      try {
                        const vendas = await vendasService.getByCliente(cliente.id);
                        if (vendas.length > 0) {
                          alert(`${cliente.nome} possui ${vendas.length} venda(s) registrada(s)`);
                        } else {
                          alert(`${cliente.nome} ainda não possui vendas registradas`);
                        }
                      } catch (err) {
                        logger.error('Erro ao buscar vendas do cliente', err);
                      }
                    }}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Ver Vendas"
                  >
                    <ShoppingCart size={18} className="mr-1" />
                    <span className="text-xs">Vendas</span>
                  </button>
                  <button
                    onClick={() => handleOpenModal(cliente)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={18} className="mr-1" />
                    <span className="text-xs">Editar</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(cliente.id)} 
                    className="flex-1 flex items-center justify-center px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" 
                    title="Excluir"
                  >
                    <Trash2 size={18} className="mr-1" />
                    <span className="text-xs">Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de Cadastro/Edição */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        >
          <ClienteForm
            onSubmit={handleSaveCliente}
            onCancel={handleCloseModal}
            initialData={editingCliente || undefined}
            isLoading={isSubmitting}
          />
        </Modal>
    </div>
  );
};

export default Clientes;
