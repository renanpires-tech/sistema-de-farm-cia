import { api } from './api';
import type { MovimentacaoEstoque, Medicamento } from '../types';
import { logger } from '../utils/logger';
import { medicamentosService } from './medicamentos';

interface EntradaEstoqueRequest {
  medicamentoId?: number;
  medicamento_id?: number; // Suporte para snake_case do backend
  quantidade: number;
  observacao?: string;
}

interface SaidaEstoqueRequest {
  medicamentoId?: number;
  medicamento_id?: number; // Suporte para snake_case do backend
  quantidade: number;
  observacao?: string;
}

// Resposta do backend após movimentação de estoque
export interface MovimentacaoEstoqueResponse {
  medicamentoId: number;
  temEstoque: boolean;
  nome: string;
  quantidadeAtual: number;
  status: string;
}

interface EstoqueInfo {
  medicamentoId: number;
  quantidade: number;
  medicamento?: Medicamento;
}

// Interface para o formato retornado pelo backend (snake_case)
interface MovimentacaoEstoqueBackend {
  id: number;
  medicamento_id?: number;
  medicamentoId?: number;
  medicamento?: {
    id: number;
    nome: string;
    dosagem?: string;
    [key: string]: any; // Permite outros campos do objeto medicamento completo
  };
  tipo: string;
  quantidade: number;
  // Aceita ambos os formatos (snake_case e camelCase)
  quantidade_anterior?: number;
  quantidadeAnterior?: number;
  quantidade_atual?: number;
  quantidadeAtual?: number;
  data_movimentacao?: string;
  dataMovimentacao?: string;
  observacao?: string;
}

// Função para mapear movimentação do backend para o formato do frontend
// Versão síncrona que não busca medicamento individualmente (mais eficiente)
// Aceita tanto snake_case quanto camelCase do backend
const mapMovimentacaoFromBackendSync = (data: any): MovimentacaoEstoque => {
  // Obtém o ID do medicamento (pode vir de diferentes fontes)
  const medicamentoId = data.medicamento_id || data.medicamentoId || data.medicamento?.id || 0;
  
  // Obtém o nome do medicamento (pode vir do objeto medicamento completo)
  let medicamentoNome = '';
  if (data.medicamento) {
    if (typeof data.medicamento === 'object' && data.medicamento.nome) {
      // Se o medicamento tem dosagem, inclui na exibição
      const nomeBase = data.medicamento.nome || '';
      const dosagem = data.medicamento.dosagem ? ` ${data.medicamento.dosagem}` : '';
      medicamentoNome = `${nomeBase}${dosagem}`.trim();
    } else if (typeof data.medicamento === 'string') {
      medicamentoNome = data.medicamento;
    }
  }
  
  // Fallback se não encontrou o nome
  if (!medicamentoNome) {
    medicamentoNome = `Medicamento ID ${medicamentoId}`;
  }
  
  // Obtém quantidade anterior (aceita ambos os formatos)
  const quantidadeAnterior = data.quantidadeAnterior ?? data.quantidade_anterior ?? null;
  
  // Obtém quantidade atual (aceita ambos os formatos)
  const quantidadeAtual = data.quantidadeAtual ?? data.quantidade_atual ?? null;
  
  // Obtém data de movimentação (aceita ambos os formatos)
  const dataMovimentacao = data.dataMovimentacao || data.data_movimentacao || data.data || '';
  
  return {
    id: data.id,
    medicamentoId: medicamentoId,
    medicamentoNome: medicamentoNome,
    tipo: (data.tipo === 'ENTRADA' || data.tipo === 'SAIDA') ? data.tipo : 'ENTRADA',
    quantidade: data.quantidade || 0,
    quantidadeAnterior: quantidadeAnterior !== null && quantidadeAnterior !== undefined ? quantidadeAnterior : undefined,
    quantidadeAtual: quantidadeAtual !== null && quantidadeAtual !== undefined ? quantidadeAtual : undefined,
    data: dataMovimentacao,
    dataMovimentacao: dataMovimentacao, // Também salva em camelCase
    observacao: data.observacao || '',
  };
};

export const estoqueService = {
  // Registra entrada de estoque
  registrarEntrada: async (request: EntradaEstoqueRequest): Promise<MovimentacaoEstoqueResponse> => {
    const medicamentoId = request.medicamento_id ?? request.medicamentoId;
    
    if (!medicamentoId) {
      throw new Error('medicamentoId é obrigatório');
    }
    
    if (!request.quantidade || request.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
    
    // Garante que são números inteiros
    const medicamentoIdNum = parseInt(String(medicamentoId), 10);
    const quantidadeNum = parseInt(String(request.quantidade), 10);
    
    if (isNaN(medicamentoIdNum) || medicamentoIdNum <= 0) {
      throw new Error('ID do medicamento inválido');
    }
    
    if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
      throw new Error('Quantidade inválida');
    }
    
    // Prepara a observação se fornecida
    const observacao = request.observacao ? String(request.observacao).trim() : undefined;
    
    // Tenta diferentes formatos de payload que o backend pode esperar
    const payloadsParaTentar = [
      // Formato 1: camelCase simples
      {
        nome: 'camelCase simples',
        payload: {
          medicamentoId: medicamentoIdNum,
          quantidade: quantidadeNum,
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 2: snake_case simples
      {
        nome: 'snake_case simples',
        payload: {
          medicamento_id: medicamentoIdNum,
          quantidade: quantidadeNum,
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 3: camelCase com tipo explícito
      {
        nome: 'camelCase com tipo',
        payload: {
          medicamentoId: medicamentoIdNum,
          quantidade: quantidadeNum,
          tipo: 'ENTRADA',
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 4: snake_case com tipo explícito
      {
        nome: 'snake_case com tipo',
        payload: {
          medicamento_id: medicamentoIdNum,
          quantidade: quantidadeNum,
          tipo: 'ENTRADA',
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
    ];
    
    let ultimoErro: any = null;
    
    for (const { nome, payload } of payloadsParaTentar) {
      try {
        logger.info(`Tentando entrada de estoque com formato: ${nome}`, { payload });
        
        const response = await api.post<MovimentacaoEstoqueResponse>('/estoque/entrada', payload);
        
        logger.success(`Entrada de estoque registrada com sucesso (formato: ${nome})`, { response });
        return response;
      } catch (error: any) {
        ultimoErro = error;
        
        // Se não for 400, para de tentar e propaga o erro
        if (error?.response?.status !== 400) {
          logger.error('Erro não relacionado a validação ao registrar entrada', error, { payload });
          throw error;
        }
        
        // Se for 400, tenta próximo formato
        const errorDetails = error?.response?.data;
        logger.warn(`Formato ${nome} falhou (400)`, { 
          payload, 
          errorDetails,
          errorMessage: error?.message 
        });
        
        // Continua para próximo formato
        continue;
      }
    }
    
    // Se chegou aqui, todos os formatos falharam
    const errorMsg = ultimoErro?.response?.data?.message || 
                    (Array.isArray(ultimoErro?.response?.data?.errors) 
                      ? ultimoErro.response.data.errors.join(', ') 
                      : null) ||
                    ultimoErro?.message || 
                    'Erro de validação ao registrar entrada de estoque';
    
    logger.error('Todos os formatos de payload falharam ao registrar entrada', ultimoErro, {
      payloadsTentados: payloadsParaTentar.map(p => ({ nome: p.nome, payload: p.payload })),
      errorResponse: ultimoErro?.response?.data,
    });
    
    throw new Error(errorMsg);
  },

  // Registra saída de estoque
  registrarSaida: async (request: SaidaEstoqueRequest): Promise<MovimentacaoEstoqueResponse> => {
    const medicamentoId = request.medicamento_id ?? request.medicamentoId;
    
    if (!medicamentoId) {
      throw new Error('medicamentoId é obrigatório');
    }
    
    if (!request.quantidade || request.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
    
    // Garante que são números inteiros
    const medicamentoIdNum = parseInt(String(medicamentoId), 10);
    const quantidadeNum = parseInt(String(request.quantidade), 10);
    
    if (isNaN(medicamentoIdNum) || medicamentoIdNum <= 0) {
      throw new Error('ID do medicamento inválido');
    }
    
    if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
      throw new Error('Quantidade inválida');
    }
    
    // Prepara a observação se fornecida
    const observacao = request.observacao ? String(request.observacao).trim() : undefined;
    
    // Tenta diferentes formatos de payload que o backend pode esperar
    const payloadsParaTentar = [
      // Formato 1: camelCase simples
      {
        nome: 'camelCase simples',
        payload: {
          medicamentoId: medicamentoIdNum,
          quantidade: quantidadeNum,
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 2: snake_case simples
      {
        nome: 'snake_case simples',
        payload: {
          medicamento_id: medicamentoIdNum,
          quantidade: quantidadeNum,
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 3: camelCase com tipo explícito
      {
        nome: 'camelCase com tipo',
        payload: {
          medicamentoId: medicamentoIdNum,
          quantidade: quantidadeNum,
          tipo: 'SAIDA',
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
      // Formato 4: snake_case com tipo explícito
      {
        nome: 'snake_case com tipo',
        payload: {
          medicamento_id: medicamentoIdNum,
          quantidade: quantidadeNum,
          tipo: 'SAIDA',
          ...(observacao && observacao.length > 0 && { observacao }),
        }
      },
    ];
    
    let ultimoErro: any = null;
    
    for (const { nome, payload } of payloadsParaTentar) {
      try {
        logger.info(`Tentando saída de estoque com formato: ${nome}`, { payload });
        
        const response = await api.post<MovimentacaoEstoqueResponse>('/estoque/saida', payload);
        
        logger.success(`Saída de estoque registrada com sucesso (formato: ${nome})`, { response });
        return response;
      } catch (error: any) {
        ultimoErro = error;
        
        // Se não for 400, para de tentar e propaga o erro
        if (error?.response?.status !== 400) {
          logger.error('Erro não relacionado a validação ao registrar saída', error, { payload });
          throw error;
        }
        
        // Se for 400, tenta próximo formato
        const errorDetails = error?.response?.data;
        logger.warn(`Formato ${nome} falhou (400)`, { 
          payload, 
          errorDetails,
          errorMessage: error?.message 
        });
        
        // Continua para próximo formato
        continue;
      }
    }
    
    // Se chegou aqui, todos os formatos falharam
    const errorMsg = ultimoErro?.response?.data?.message || 
                    (Array.isArray(ultimoErro?.response?.data?.errors) 
                      ? ultimoErro.response.data.errors.join(', ') 
                      : null) ||
                    ultimoErro?.message || 
                    'Erro de validação ao registrar saída de estoque';
    
    logger.error('Todos os formatos de payload falharam ao registrar saída', ultimoErro, {
      payloadsTentados: payloadsParaTentar.map(p => ({ nome: p.nome, payload: p.payload })),
      errorResponse: ultimoErro?.response?.data,
    });
    
    throw new Error(errorMsg);
  },

  // Consulta estoque atual de um medicamento
  getByMedicamento: async (medicamentoId: number): Promise<EstoqueInfo> => {
    return api.get<EstoqueInfo>(`/estoque/${medicamentoId}`);
  },

  // Lista todas as movimentações de estoque
  // Tenta vários endpoints possíveis do backend
  getAll: async (): Promise<MovimentacaoEstoque[]> => {
    const endpointsParaTentar = [
      '/estoque/movimentacoes',
      '/estoque/historico',
      '/movimentacoes-estoque',
    ];

    for (const endpoint of endpointsParaTentar) {
      try {
        const data = await api.get<any[]>(endpoint);
        if (Array.isArray(data) && data.length > 0) {
          logger.info(`Histórico de movimentações carregado do endpoint: ${endpoint}`, { total: data.length });
          
          // Log da primeira movimentação para debug
          if (data.length > 0) {
            logger.info('Exemplo de movimentação do backend', { 
              primeiraMovimentacao: data[0],
              campos: Object.keys(data[0]),
              quantidadeAnterior: data[0].quantidadeAnterior ?? data[0].quantidade_anterior,
              quantidadeAtual: data[0].quantidadeAtual ?? data[0].quantidade_atual,
              dataMovimentacao: data[0].dataMovimentacao ?? data[0].data_movimentacao,
            });
          }
          
          // Mapeia todos os dados de forma síncrona (mais eficiente)
          const movimentacoesMapeadas = data.map(mapMovimentacaoFromBackendSync);
          
          // Log após mapeamento para verificar
          if (movimentacoesMapeadas.length > 0) {
            logger.info('Movimentação após mapeamento', {
              primeiraMovimentacao: movimentacoesMapeadas[0],
              quantidadeAnterior: movimentacoesMapeadas[0].quantidadeAnterior,
              quantidadeAtual: movimentacoesMapeadas[0].quantidadeAtual,
              data: movimentacoesMapeadas[0].data,
            });
          }
          
          return movimentacoesMapeadas;
        }
        if (Array.isArray(data)) {
          // Array vazio - endpoint existe mas não há dados
          return [];
        }
      } catch (error: any) {
        // Se for 404, tenta próximo endpoint
        if (error?.response?.status === 404) {
          continue;
        }
        // Se for outro erro, loga e continua tentando
        logger.warn(`Erro ao buscar movimentações do endpoint ${endpoint}`, error);
      }
    }

    // Se nenhum endpoint funcionou, retorna array vazio
    logger.info('Nenhum endpoint de histórico de movimentações encontrado');
    return [];
  },

  // Lista movimentações por medicamento
  getByMedicamentoId: async (medicamentoId: number): Promise<MovimentacaoEstoque[]> => {
    try {
      const data = await api.get<MovimentacaoEstoqueBackend[]>(`/estoque/${medicamentoId}/movimentacoes`);
      if (Array.isArray(data)) {
        return data.map(mapMovimentacaoFromBackendSync);
      }
    } catch (error) {
      logger.warn(`Erro ao buscar movimentações do medicamento ${medicamentoId}`, error);
      return [];
    }
    return [];
  },
};

