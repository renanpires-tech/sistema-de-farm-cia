
import React, { useState, useEffect } from 'react';
import type { Categoria } from '../../types';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import { categoriasService } from '../../services/categorias';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import CategoriaForm from '../../components/forms/CategoriaForm';
import { logger } from '../../utils/logger';

// Página para gerenciar Categorias de Medicamentos
const Categorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCategorias();
    logger.info('Página de categorias acessada');
  }, []);

  const loadCategorias = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriasService.getAll();
      setCategorias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
      logger.error('Erro ao carregar categorias', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const categoria = categorias.find(c => c.id === id);
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }
    try {
      logger.info(`Tentativa de exclusão da categoria ${id}`);
      await categoriasService.delete(id);
      await loadCategorias();
      logger.audit('CATEGORIA_EXCLUIDA', 'Categoria', id, {
        nome: categoria?.nome,
      });
      logger.success(`Categoria ${categoria?.nome} excluída com sucesso`);
    } catch (err) {
      logger.error('Erro ao excluir categoria', err, { categoriaId: id });
      alert(err instanceof Error ? err.message : 'Erro ao excluir categoria');
    }
  };

  const handleOpenModal = (categoria?: Categoria) => {
    setEditingCategoria(categoria || null);
    setIsModalOpen(true);
    logger.info(categoria ? `Abertura de formulário de edição: ${categoria.nome}` : 'Abertura de formulário de nova categoria');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategoria(null);
  };

  const handleSaveCategoria = async (data: { nome: string; descricao?: string | null }) => {
    try {
      setIsSubmitting(true);
      
      // Normaliza descricao: string vazia ou apenas espaços vira null
      const categoriaData = {
        nome: data.nome.trim(),
        descricao: data.descricao && String(data.descricao).trim().length > 0 
          ? String(data.descricao).trim() 
          : null,
      };
      
      if (editingCategoria) {
        await categoriasService.update(editingCategoria.id, categoriaData);
      } else {
        await categoriasService.create(categoriaData);
      }

      await loadCategorias();
      handleCloseModal();
      logger.audit(editingCategoria ? 'CATEGORIA_EDITADA' : 'CATEGORIA_CRIADA', 'Categoria', editingCategoria?.id, {
        nome: categoriaData.nome,
        descricao: categoriaData.descricao || 'Sem descrição',
      });
      logger.success(`Categoria ${editingCategoria ? 'editada' : 'criada'} com sucesso`);
    } catch (err) {
      logger.error('Erro ao salvar categoria', err, { dados: data });
      alert(err instanceof Error ? err.message : 'Erro ao salvar categoria');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Gerenciar Categorias</h1>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
                <PlusCircle size={20} className="mr-2" />
                Nova Categoria
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
                            <th scope="col" className="px-4 lg:px-6 py-3">ID</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Nome da Categoria</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Descrição</th>
                            <th scope="col" className="px-4 lg:px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categorias.map((cat) => (
                            <tr key={cat.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-4 lg:px-6 py-4 font-medium text-white">{cat.id}</td>
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap">{cat.nome}</td>
                                <td className="px-4 lg:px-6 py-4">
                                  {cat.descricao ? (
                                    <span className="text-gray-300">{cat.descricao}</span>
                                  ) : (
                                    <span className="text-gray-500 italic">Sem descrição</span>
                                  )}
                                </td>
                                <td className="px-4 lg:px-6 py-4 flex items-center justify-center space-x-2">
                                    <button
                                      onClick={() => handleOpenModal(cat)}
                                      className="p-2 text-blue-400 hover:text-blue-300"
                                      title="Editar"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(cat.id)} 
                                      className="p-2 text-red-500 hover:text-red-400" 
                                      title="Excluir"
                                    >
                                      <Trash2 size={18} />
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
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400">#{cat.id}</span>
                    <h3 className="font-semibold text-white text-base">{cat.nome}</h3>
                  </div>
                  {cat.descricao ? (
                    <p className="text-sm text-gray-300 mt-1">{cat.descricao}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-1">Sem descrição</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 pt-3 border-t border-gray-700">
                <button
                  onClick={() => handleOpenModal(cat)}
                  className="flex-1 flex items-center justify-center px-3 py-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit size={18} className="mr-1" />
                  <span className="text-xs">Editar</span>
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)} 
                  className="flex-1 flex items-center justify-center px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" 
                  title="Excluir"
                >
                  <Trash2 size={18} className="mr-1" />
                  <span className="text-xs">Excluir</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Cadastro/Edição */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
        >
          <CategoriaForm
            onSubmit={handleSaveCategoria}
            onCancel={handleCloseModal}
            initialData={editingCategoria || undefined}
            isLoading={isSubmitting}
          />
        </Modal>
    </div>
  );
};

export default Categorias;
