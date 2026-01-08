import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ItemVenda, Cliente, Medicamento } from '../../types';
import { ShoppingCart, Trash2, UserSearch } from 'lucide-react';
import { vendasService } from '../../services/vendas';
import { clientesService } from '../../services/clientes';
import { medicamentosService } from '../../services/medicamentos';
import { logger } from '../../utils/logger';

// Página para registrar uma nova Venda
const NovaVenda: React.FC = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [total, setTotal] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchMedicamento, setSearchMedicamento] = useState('');
  const [showClientes, setShowClientes] = useState(false);
  const [showMedicamentos, setShowMedicamentos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMedicamentos();
    logger.info('Página de nova venda acessada');
  }, []);

  const loadMedicamentos = async () => {
    try {
      // Usa getAtivos para buscar apenas medicamentos ativos
      const data = await medicamentosService.getAtivos();
      
      // Filtra medicamentos que:
      // 1. Estão ativos (já vem do endpoint)
      // 2. Têm estoque > 0
      // 3. Não estão vencidos
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const medicamentosValidos = data.filter(m => {
        if (m.estoque <= 0) return false;
        
        // Verifica validade
        const validade = new Date(m.dataValidade);
        validade.setHours(0, 0, 0, 0);
        if (validade < hoje) return false;
        
        return true;
      });
      
      setMedicamentos(medicamentosValidos);
      logger.info(`Medicamentos carregados para venda: ${medicamentosValidos.length} disponíveis`);
      
      if (medicamentosValidos.length === 0 && data.length > 0) {
        setError('Nenhum medicamento disponível para venda. Verifique estoque e validade.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar medicamentos';
      setError(errorMessage);
      logger.error('Erro ao carregar medicamentos para venda', err);
    }
  };

  const buscarClientes = async (query: string) => {
    if (query.length < 2) {
      setClientes([]);
      return;
    }
    try {
      logger.info(`Busca de cliente: "${query}"`);
      const data = await clientesService.search(query);
      setClientes(data);
      setShowClientes(true);
    } catch (err) {
      logger.error('Erro ao buscar clientes', err);
    }
  };

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setSearchCliente(cliente.nome);
    setShowClientes(false);
    logger.info(`Cliente selecionado: ${cliente.nome} (ID: ${cliente.id})`);
  };

  const selecionarMedicamento = (medicamento: Medicamento) => {
    // Verifica se já está no carrinho
    if (itens.some(item => item.medicamentoId === medicamento.id)) {
      logger.warn(`Medicamento ${medicamento.nome} já está no carrinho`);
      alert('Este medicamento já está no carrinho');
      return;
    }

    const novoItem: ItemVenda = {
      medicamentoId: medicamento.id,
      nomeMedicamento: `${medicamento.nome} ${medicamento.dosagem ? `(${medicamento.dosagem})` : ''}`,
      quantidade: 1,
      precoUnitario: medicamento.preco,
    };
    const novosItens = [...itens, novoItem];
    setItens(novosItens);
    calcularTotal(novosItens);
    setSearchMedicamento('');
    setShowMedicamentos(false);
    
    logger.info(`Medicamento adicionado ao carrinho: ${medicamento.nome}`, {
      medicamentoId: medicamento.id,
      quantidade: 1,
      preco: medicamento.preco,
    });
  };

  // Função para remover um item da venda
  const removerItem = (index: number) => {
    const itemRemovido = itens[index];
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
    calcularTotal(novosItens);
    
    logger.info(`Item removido do carrinho: ${itemRemovido.nomeMedicamento}`);
  }

  // Função para calcular o total da venda
  const calcularTotal = (itensVenda: ItemVenda[]) => {
    const valorTotal = itensVenda.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);
    setTotal(valorTotal);
  };

  const atualizarQuantidade = (index: number, quantidade: number) => {
    if (quantidade < 1) return;
    const novosItens = [...itens];
    const itemAnterior = novosItens[index];
    novosItens[index].quantidade = quantidade;
    setItens(novosItens);
    calcularTotal(novosItens);
    
    logger.info(`Quantidade atualizada: ${itemAnterior.nomeMedicamento}`, {
      quantidadeAnterior: itemAnterior.quantidade,
      quantidadeNova: quantidade,
    });
  };

  const finalizarVenda = async () => {
    if (itens.length === 0) {
      setError('Adicione pelo menos um item à venda');
      logger.warn('Tentativa de finalizar venda sem itens');
      return;
    }
    
    // Validação de idade do cliente (se selecionado)
    if (clienteSelecionado) {
      const dataNasc = new Date(clienteSelecionado.dataNascimento);
      const hoje = new Date();
      const idade = hoje.getFullYear() - dataNasc.getFullYear() - 
        (hoje.getMonth() < dataNasc.getMonth() || 
         (hoje.getMonth() === dataNasc.getMonth() && hoje.getDate() < dataNasc.getDate()) ? 1 : 0);
      
      if (idade < 18) {
        setError('Cliente deve ter mais de 18 anos para realizar compras');
        logger.warn(`Tentativa de venda para cliente menor de idade: ${clienteSelecionado.nome} (${idade} anos)`);
        alert('❌ Cliente deve ter mais de 18 anos para realizar compras');
        return;
      }
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // O backend recebe itens com medicamentoId e quantidade, e opcionalmente clienteId
      const vendaRequest: {
        itens: Array<{ medicamentoId: number; quantidade: number }>;
        clienteId?: number | null;
      } = {
        itens: itens.map(item => ({
          medicamentoId: item.medicamentoId,
          quantidade: item.quantidade,
        })),
      };
      
      // Inclui clienteId apenas se um cliente foi selecionado
      if (clienteSelecionado) {
        vendaRequest.clienteId = clienteSelecionado.id;
        logger.info('Venda será criada com cliente', {
          clienteId: clienteSelecionado.id,
          clienteNome: clienteSelecionado.nome,
        });
      } else {
        logger.warn('Venda será criada sem cliente');
      }
      
      // Log detalhado dos itens da venda
      logger.audit('VENDA_CRIADA', 'Venda', undefined, {
        itens: vendaRequest.itens.map((item, idx) => ({
          medicamentoId: item.medicamentoId,
          quantidade: item.quantidade,
          nomeMedicamento: itens[idx]?.nomeMedicamento || 'Desconhecido',
        })),
        valorTotal: total,
        cliente: clienteSelecionado?.nome || 'Não informado',
        clienteId: clienteSelecionado?.id || null,
      });
      
      const vendaCriada = await vendasService.create(vendaRequest);
      
      // Log de sucesso com informações completas
      logger.success('Venda finalizada com sucesso', { 
        vendaId: vendaCriada.id,
        valorTotal: total,
        cliente: vendaCriada.cliente?.nome || clienteSelecionado?.nome || 'Não informado',
        clienteId: vendaCriada.cliente?.id || clienteSelecionado?.id || null,
        itensCount: vendaCriada.itens.length,
      });
      
      // Limpa o formulário após sucesso
      setItens([]);
      setTotal(0);
      setClienteSelecionado(null);
      setSearchCliente('');
      setError(null);
      
      // Recarrega medicamentos para atualizar estoque
      await loadMedicamentos();
      
      // Prepara mensagem de sucesso com informações completas
      const clienteInfo = vendaCriada.cliente?.nome || clienteSelecionado?.nome || 'Não informado';
      const itensInfo = vendaCriada.itens.map(item => `  • ${item.nomeMedicamento} (${item.quantidade}x)`).join('\n');
      
      alert(`✅ Venda realizada com sucesso!\n\n` +
            `ID da Venda: #${vendaCriada.id}\n` +
            `Total: R$ ${total.toFixed(2)}\n` +
            `Cliente: ${clienteInfo}\n` +
            `${vendaCriada.cliente?.id ? `Cliente ID: ${vendaCriada.cliente.id}` : ''}\n\n` +
            `Itens:\n${itensInfo}`);
      
      navigate('/vendas');
    } catch (err: any) {
      let errorMessage = 'Erro ao finalizar venda';
      
      // Tratamento específico de erros do backend
      if (err?.response?.status === 400) {
        const backendMessage = err?.response?.data?.message || err?.response?.data?.error || err.message;
        errorMessage = backendMessage || 'Dados inválidos. Verifique os itens da venda.';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Algum medicamento não foi encontrado.';
      } else if (err?.response?.status === 422) {
        const backendMessage = err?.response?.data?.message || err?.response?.data?.error;
        errorMessage = backendMessage || 'Não é possível realizar a venda. Verifique:\n- Estoque disponível\n- Validade dos medicamentos\n- Status dos medicamentos (devem estar ativos)\n- Idade do cliente (deve ter 18+ anos)';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      logger.error('Erro ao finalizar venda', err, { 
        itens: itens.length,
        cliente: clienteSelecionado?.nome,
        errorResponse: err?.response?.data,
      });
      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Nova Venda</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna do Formulário */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            
            {/* Seleção de Cliente */}
            <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cliente {clienteSelecionado && `- ${clienteSelecionado.nome}`}
                </label>
                <div className="flex items-center">
                    <input 
                      type="text" 
                      placeholder="Pesquisar cliente por nome ou CPF" 
                      value={searchCliente}
                      onChange={(e) => {
                        setSearchCliente(e.target.value);
                        buscarClientes(e.target.value);
                      }}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <button 
                      onClick={() => buscarClientes(searchCliente)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                    >
                        <UserSearch size={20} />
                    </button>
                </div>
                {showClientes && clientes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                    {clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        onClick={() => selecionarCliente(cliente)}
                        className="p-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-0"
                      >
                        <p className="text-white font-medium">{cliente.nome}</p>
                        <p className="text-sm text-gray-400">{cliente.cpf}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Adicionar Itens */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Itens da Venda</h2>
                
                {/* Busca de Medicamento */}
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder="Buscar medicamento..." 
                    value={searchMedicamento}
                    onChange={(e) => {
                      setSearchMedicamento(e.target.value);
                      setShowMedicamentos(e.target.value.length > 0);
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showMedicamentos && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg max-h-60 overflow-y-auto">
                      {medicamentos.length === 0 ? (
                        <div className="p-3 text-gray-400 text-center">
                          {error ? 'Erro ao carregar medicamentos' : 'Nenhum medicamento disponível'}
                        </div>
                      ) : (
                        medicamentos
                          .filter(m => 
                            m.nome.toLowerCase().includes(searchMedicamento.toLowerCase()) ||
                            (m.dosagem && m.dosagem.toLowerCase().includes(searchMedicamento.toLowerCase()))
                          )
                          .map((med) => {
                            // Verifica se já está no carrinho
                            const jaNoCarrinho = itens.some(item => item.medicamentoId === med.id);
                            
                            return (
                              <div
                                key={med.id}
                                onClick={() => !jaNoCarrinho && selecionarMedicamento(med)}
                                className={`p-3 cursor-pointer border-b border-gray-600 last:border-0 ${
                                  jaNoCarrinho 
                                    ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-600'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-white font-medium">
                                      {med.nome} {med.dosagem ? `(${med.dosagem})` : ''}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      Estoque: {med.estoque} | R$ {med.preco.toFixed(2)}
                                    </p>
                                    {med.descricao && (
                                      <p className="text-xs text-gray-500 mt-1 truncate">{med.descricao}</p>
                                    )}
                                  </div>
                                  {jaNoCarrinho && (
                                    <span className="text-xs text-blue-400 ml-2">Já adicionado</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}
                </div>

                {/* Lista de Itens */}
                <div className="space-y-2">
                    {itens.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-700 rounded-lg">
                        <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhum item adicionado</p>
                        <p className="text-sm">Use o campo acima para buscar e adicionar medicamentos</p>
                      </div>
                    ) : (
                      itens.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex-1">
                               <p className="font-semibold text-white">{item.nomeMedicamento}</p>
                               <div className="flex items-center gap-2 mt-2">
                                 <span className="text-sm text-gray-400">Qtd:</span>
                                 <input
                                   type="number"
                                   min="1"
                                   value={item.quantidade}
                                   onChange={(e) => atualizarQuantidade(index, parseInt(e.target.value) || 1)}
                                   className="w-16 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                                 />
                                 <span className="text-sm text-gray-400">x R$ {item.precoUnitario.toFixed(2)}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <p className="font-bold text-white">R$ {(item.quantidade * item.precoUnitario).toFixed(2)}</p>
                               <button onClick={() => removerItem(index)} className="text-red-500 hover:text-red-400" title="Remover">
                                   <Trash2 size={18} />
                               </button>
                            </div>
                        </div>
                      ))
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Coluna do Resumo */}
        <div>
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Resumo da Venda</h2>
                <div className="space-y-3">
                    <div className="flex justify-between text-gray-300">
                        <span>Subtotal</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                        <span>Descontos</span>
                        <span>R$ 0.00</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-2xl pt-3 border-t border-gray-600">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>
                </div>
                <button 
                  onClick={finalizarVenda}
                  disabled={isLoading || itens.length === 0}
                  className="w-full mt-6 flex items-center justify-center py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                  title={itens.length === 0 ? 'Adicione itens à venda' : ''}
                >
                    <ShoppingCart size={20} className="mr-2" />
                    {isLoading ? 'Processando...' : 'Finalizar Venda'}
                </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default NovaVenda;

