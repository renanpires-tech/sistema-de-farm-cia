import { api } from './api';
import type { Medicamento } from '../types';
import { logger } from '../utils/logger';

// Interface para o formato retornado pelo backend (snake_case)
interface MedicamentoBackend {
  id: number;
  nome: string;
  dosagem?: string;
  descricao?: string | null;
  preco: number;
  quantidade_estoque?: number;
  estoque?: number;
  data_validade?: string;
  dataValidade?: string;
  status?: string;
  ativo?: boolean;
  categoria_id?: number;
  categoria?: {
    id: number;
    nome: string;
  };
}

// Função para mapear dados do backend para o formato do frontend
// Exportada para uso em outros serviços que também precisam mapear medicamentos
export const mapMedicamentoFromBackend = (data: any): Medicamento => {
  // Mapeia status: "ATIVO", "INATIVO", "EXCLUIDO" para boolean ativo
  const statusStr = data.status || data.statusAtivo || '';
  const ativo = data.ativo !== undefined 
    ? data.ativo 
    : (statusStr === 'ATIVO' || statusStr === true || statusStr === 'true');

  return {
    id: data.id,
    nome: data.nome || '',
    // Campos opcionais: se não existirem no backend, retornam string vazia
    dosagem: data.dosagem || '',
    descricao: data.descricao || null,
    preco: parseFloat(data.preco) || 0,
    estoque: data.quantidade_estoque ?? data.estoque ?? data.quantidadeEstoque ?? 0,
    dataValidade: data.data_validade || data.dataValidade || '',
    ativo: ativo,
    categoria: data.categoria || {
      id: data.categoria_id || data.categoriaId || 0,
      nome: data.categoria_nome || data.categoria?.nome || 'Sem categoria',
    },
  };
};

// Função auxiliar para buscar medicamento por ID (evita problema com 'this')
const getMedicamentoById = async (id: number): Promise<Medicamento> => {
  const data = await api.get<MedicamentoBackend>(`/medicamentos/${id}`);
  return mapMedicamentoFromBackend(data);
};

export const medicamentosService = {
  // Lista todos os medicamentos (inclui inativos)
  getAll: async (): Promise<Medicamento[]> => {
    const data = await api.get<MedicamentoBackend[]>('/medicamentos');
    return Array.isArray(data) ? data.map(mapMedicamentoFromBackend) : [];
  },

  // Lista apenas medicamentos ativos
  getAtivos: async (): Promise<Medicamento[]> => {
    const data = await api.get<MedicamentoBackend[]>('/medicamentos/ativos');
    return Array.isArray(data) ? data.map(mapMedicamentoFromBackend) : [];
  },

  // Busca um medicamento por ID
  getById: async (id: number): Promise<Medicamento> => {
    const data = await api.get<MedicamentoBackend>(`/medicamentos/${id}`);
    return mapMedicamentoFromBackend(data);
  },

  // Cria um novo medicamento
  create: async (medicamento: Omit<Medicamento, 'id'>): Promise<Medicamento> => {
    // Validações antes de criar
    if (!medicamento.nome || String(medicamento.nome).trim().length === 0) {
      throw new Error('Nome do medicamento é obrigatório');
    }
    
    if (!medicamento.categoria || !medicamento.categoria.id) {
      throw new Error('Categoria é obrigatória');
    }
    
    if (isNaN(medicamento.preco) || medicamento.preco < 0) {
      throw new Error('Preço deve ser um número válido maior ou igual a zero');
    }
    
    if (isNaN(medicamento.estoque) || medicamento.estoque < 0) {
      throw new Error('Quantidade de estoque deve ser um número válido maior ou igual a zero');
    }
    
    // O backend espera categoriaId e quantidadeEstoque (camelCase no JSON)
    // Conforme README do backend: aceita camelCase no JSON
    const payload: any = {
      nome: String(medicamento.nome).trim(),
      categoriaId: parseInt(String(medicamento.categoria.id), 10),
      preco: parseFloat(String(medicamento.preco)),
      quantidadeEstoque: parseInt(String(medicamento.estoque), 10),
      dataValidade: String(medicamento.dataValidade).split('T')[0], // Garante formato YYYY-MM-DD
      status: medicamento.ativo, // Backend espera boolean (true/false)
    };
    
    // Campos opcionais: inclui mesmo se vazio para garantir que sejam salvos corretamente
    payload.dosagem = medicamento.dosagem ? String(medicamento.dosagem).trim() : '';
    payload.descricao = medicamento.descricao ? String(medicamento.descricao).trim() : null;
    
    logger.info('Criando novo medicamento', { 
      nome: payload.nome, 
      categoriaId: payload.categoriaId,
      payload: payload,
    });
    
    try {
      const response = await api.post<MedicamentoBackend>('/medicamentos', payload);
      logger.success('Medicamento criado com sucesso', { response });
      return mapMedicamentoFromBackend(response);
    } catch (error: any) {
      const errorResponse = error?.response?.data;
      const statusCode = error?.response?.status;
      
      logger.error('Erro ao criar medicamento', error, {
        payload,
        errorResponse: errorResponse,
        statusCode: statusCode,
      });
      
      // Melhora a mensagem de erro com tratamento detalhado
      if (statusCode === 400) {
        // Erro de validação
        if (Array.isArray(errorResponse?.errors)) {
          const validationErrors = errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.defaultMessage || e.message || e.field || JSON.stringify(e)))
            .join(', ');
          throw new Error(`Erro de validação: ${validationErrors}`);
        } else {
          const msg = errorResponse?.message || errorResponse?.error || error?.message || 'Erro de validação';
          throw new Error(msg);
        }
      } else if (statusCode === 500) {
        // Erro interno do servidor
        if (Array.isArray(errorResponse?.errors)) {
          const serverErrors = errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.message || e.defaultMessage || JSON.stringify(e)))
            .join(', ');
          throw new Error(`Erro interno: ${serverErrors}`);
        } else {
          const backendMessage = errorResponse?.message || 
                                errorResponse?.error ||
                                error?.message;
          throw new Error(backendMessage || 'Erro interno do servidor ao criar medicamento. Verifique os logs do backend.');
        }
      }
      
      throw error;
    }
  },

  // Atualiza um medicamento
  update: async (id: number, medicamento: Partial<Medicamento>): Promise<Medicamento> => {
    // IMPORTANTE: O backend Spring Boot geralmente espera TODOS os campos obrigatórios no PUT
    // Vamos buscar o medicamento atual primeiro para garantir que temos todos os dados
    let medicamentoAtual: Medicamento | null = null;
    
    try {
      medicamentoAtual = await getMedicamentoById(id);
    } catch (error) {
      logger.warn(`Não foi possível buscar medicamento ${id} antes de atualizar, usando apenas dados fornecidos`);
      // Se não conseguir buscar, vai usar apenas os dados fornecidos
    }
    
    // Se não conseguiu buscar e não tem dados suficientes, lança erro
    if (!medicamentoAtual) {
      if (!medicamento.nome || !medicamento.categoria || medicamento.preco === undefined || medicamento.estoque === undefined) {
        throw new Error('Não foi possível obter dados completos do medicamento. Tente novamente.');
      }
    }
    
    // O backend espera categoriaId e quantidadeEstoque (camelCase no JSON)
    // Constrói payload completo mesclando dados atuais com atualizações
    const payload: any = {};
    
    // Campos obrigatórios - sempre devem ser enviados (mescla atual com novo)
    payload.nome = medicamento.nome !== undefined && medicamento.nome !== null
      ? String(medicamento.nome).trim()
      : String(medicamentoAtual?.nome || '').trim();
    
    if (!payload.nome || payload.nome.length === 0) {
      throw new Error('Nome do medicamento é obrigatório');
    }
    
    payload.preco = medicamento.preco !== undefined && medicamento.preco !== null
      ? parseFloat(String(medicamento.preco))
      : parseFloat(String(medicamentoAtual?.preco || 0));
    
    if (isNaN(payload.preco) || payload.preco < 0) {
      throw new Error('Preço deve ser um número válido maior ou igual a zero');
    }
    
    payload.quantidadeEstoque = medicamento.estoque !== undefined && medicamento.estoque !== null
      ? parseInt(String(medicamento.estoque), 10)
      : parseInt(String(medicamentoAtual?.estoque || 0), 10);
    
    if (isNaN(payload.quantidadeEstoque) || payload.quantidadeEstoque < 0) {
      throw new Error('Quantidade de estoque deve ser um número válido maior ou igual a zero');
    }
    
    payload.dataValidade = medicamento.dataValidade !== undefined && medicamento.dataValidade !== null
      ? String(medicamento.dataValidade).split('T')[0]
      : String(medicamentoAtual?.dataValidade || '').split('T')[0];
    
    if (!payload.dataValidade || !payload.dataValidade.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error('Data de validade inválida. Use o formato YYYY-MM-DD');
    }
    
    // Status: usa novo ou atual (backend espera boolean)
    const ativoNovo = medicamento.ativo !== undefined 
      ? Boolean(medicamento.ativo) 
      : (medicamentoAtual?.ativo !== undefined ? Boolean(medicamentoAtual.ativo) : true);
    payload.status = ativoNovo; // Backend espera boolean (true/false)
    
    // Campos opcionais - mescla atual com novo
    payload.dosagem = medicamento.dosagem !== undefined
      ? (medicamento.dosagem ? String(medicamento.dosagem).trim() : '')
      : (medicamentoAtual?.dosagem ? String(medicamentoAtual.dosagem).trim() : '');
    
    payload.descricao = medicamento.descricao !== undefined
      ? (medicamento.descricao ? String(medicamento.descricao).trim() : null)
      : (medicamentoAtual?.descricao ? String(medicamentoAtual.descricao).trim() : null);
    
    // Categoria é obrigatória - sempre deve ser enviada
    if (medicamento.categoria) {
      if (typeof medicamento.categoria === 'object' && medicamento.categoria.id) {
        payload.categoriaId = parseInt(String(medicamento.categoria.id), 10);
      } else if (typeof medicamento.categoria === 'number') {
        payload.categoriaId = parseInt(String(medicamento.categoria), 10);
      }
    } else if (medicamentoAtual?.categoria) {
      payload.categoriaId = parseInt(String(medicamentoAtual.categoria.id), 10);
    }
    
    if (!payload.categoriaId || isNaN(payload.categoriaId)) {
      throw new Error('ID da categoria é obrigatório');
    }
    
    logger.info(`Atualizando medicamento ${id}`, { 
      campos: Object.keys(payload),
      payload: payload,
      dadosAtuais: medicamentoAtual ? {
        nome: medicamentoAtual.nome,
        estoque: medicamentoAtual.estoque,
      } : null,
      dadosNovos: {
        nome: medicamento.nome,
        estoque: medicamento.estoque,
      },
    });
    
    try {
      const response = await api.put<MedicamentoBackend>(`/medicamentos/${id}`, payload);
      logger.success(`Medicamento ${id} atualizado com sucesso`, { response });
      return mapMedicamentoFromBackend(response);
    } catch (error: any) {
      const errorResponse = error?.response?.data;
      const statusCode = error?.response?.status;
      
      // Log detalhado do erro para debugging
      logger.error(`Erro ao atualizar medicamento ${id}`, error, {
        payload,
        errorResponse: errorResponse,
        statusCode: statusCode,
      });
      
      // Melhora a mensagem de erro com tratamento detalhado
      if (statusCode === 400) {
        // Erro de validação
        if (Array.isArray(errorResponse?.errors)) {
          const validationErrors = errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.defaultMessage || e.message || e.field || JSON.stringify(e)))
            .join(', ');
          throw new Error(`Erro de validação: ${validationErrors}`);
        } else {
          const msg = errorResponse?.message || errorResponse?.error || error?.message || 'Erro de validação';
          throw new Error(msg);
        }
      } else if (statusCode === 500) {
        // Erro interno do servidor
        if (Array.isArray(errorResponse?.errors)) {
          const serverErrors = errorResponse.errors
            .map((e: any) => typeof e === 'string' ? e : (e.message || e.defaultMessage || JSON.stringify(e)))
            .join(', ');
          throw new Error(`Erro interno: ${serverErrors}`);
        } else {
          const backendMessage = errorResponse?.message || 
                                errorResponse?.error ||
                                error?.message;
          throw new Error(backendMessage || 'Erro interno do servidor ao atualizar medicamento. Verifique os logs do backend.');
        }
      }
      
      throw error;
    }
  },

  // Deleta um medicamento (soft delete)
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/medicamentos/${id}`);
  },

  // Busca histórico de medicamentos (inclui excluídos para auditoria)
  getHistorico: async (): Promise<Medicamento[]> => {
    const data = await api.get<MedicamentoBackend[]>('/medicamentos/historico');
    return Array.isArray(data) ? data.map(mapMedicamentoFromBackend) : [];
  },

  // Ativa/desativa um medicamento
  toggleStatus: async (id: number, ativo: boolean): Promise<Medicamento> => {
    try {
      logger.info(`Alterando status do medicamento ${id} para ${ativo ? 'ATIVO' : 'INATIVO'}`);
      
      // Primeiro, busca o medicamento completo para ter todos os dados (usa getById diretamente)
      const medicamentoExistente = await api.get<MedicamentoBackend>(`/medicamentos/${id}`);
      const medicamentoMapeado = mapMedicamentoFromBackend(medicamentoExistente);
      logger.info(`Medicamento ${id} obtido`, { nome: medicamentoMapeado.nome, statusAtual: medicamentoMapeado.ativo });
      
      // Estratégia 1: Tenta PATCH no endpoint /status (se existir) com boolean
      try {
        logger.info(`Tentativa 1: PATCH /medicamentos/${id}/status com boolean`);
        const response = await api.patch<MedicamentoBackend>(
          `/medicamentos/${id}/status`, 
          { status: ativo }
        );
        logger.success(`Status do medicamento ${id} alterado via PATCH /status (boolean)`);
        return mapMedicamentoFromBackend(response);
      } catch (patchError: any) {
        logger.warn(`PATCH /status falhou (status: ${patchError?.response?.status})`, patchError);
        
        // Estratégia 2: Tenta PATCH no endpoint /status com string
        if (patchError?.response?.status === 400 || patchError?.response?.status === 404 || patchError?.response?.status === 500) {
          try {
            logger.info(`Tentativa 2: PATCH /medicamentos/${id}/status com string`);
            const response = await api.patch<MedicamentoBackend>(
              `/medicamentos/${id}/status`, 
              { status: ativo ? 'ATIVO' : 'INATIVO' }
            );
            logger.success(`Status do medicamento ${id} alterado via PATCH /status (string)`);
            return mapMedicamentoFromBackend(response);
          } catch (patchStringError: any) {
            logger.warn(`PATCH /status (string) também falhou (status: ${patchStringError?.response?.status})`, patchStringError);
            
            // Estratégia 3: Usa PUT completo (update) com todos os dados do medicamento
            try {
              logger.info(`Tentativa 3: PUT /medicamentos/${id} (update completo)`);
              
              // Prepara payload completo para PUT, mantendo todos os dados e apenas alterando o status
              const categoriaId = typeof medicamentoMapeado.categoria === 'object' 
                ? medicamentoMapeado.categoria.id 
                : (medicamentoMapeado.categoria as any);
              
              const payloadCompleto = {
                nome: medicamentoMapeado.nome,
                dosagem: medicamentoMapeado.dosagem || '',
                descricao: medicamentoMapeado.descricao || '',
                categoriaId: categoriaId,
                preco: medicamentoMapeado.preco,
                estoque: medicamentoMapeado.estoque,
                dataValidade: medicamentoMapeado.dataValidade,
                status: ativo, // Tenta boolean primeiro
              };
              
              logger.info(`Payload completo preparado`, { 
                nome: payloadCompleto.nome,
                status: payloadCompleto.status,
                categoriaId: payloadCompleto.categoriaId 
              });
              
              const response = await api.put<MedicamentoBackend>(`/medicamentos/${id}`, payloadCompleto);
              logger.success(`Status do medicamento ${id} alterado via PUT completo (boolean)`);
              return mapMedicamentoFromBackend(response);
            } catch (putError: any) {
              logger.error(`PUT completo (boolean) também falhou (status: ${putError?.response?.status})`, putError, {
                medicamentoId: id,
                novoStatus: ativo,
                errorResponse: putError?.response?.data,
              });
              
              // Estratégia 4: Tenta PUT com status como string
              try {
                logger.info(`Tentativa 4: PUT /medicamentos/${id} com status como string`);
                
                const categoriaId = typeof medicamentoMapeado.categoria === 'object' 
                  ? medicamentoMapeado.categoria.id 
                  : (medicamentoMapeado.categoria as any);
                  
                const payloadCompletoString = {
                  nome: medicamentoMapeado.nome,
                  dosagem: medicamentoMapeado.dosagem || '',
                  descricao: medicamentoMapeado.descricao || '',
                  categoriaId: categoriaId,
                  preco: medicamentoMapeado.preco,
                  estoque: medicamentoMapeado.estoque,
                  dataValidade: medicamentoMapeado.dataValidade,
                  status: ativo ? 'ATIVO' : 'INATIVO', // Tenta string
                };
                
                const response = await api.put<MedicamentoBackend>(`/medicamentos/${id}`, payloadCompletoString);
                logger.success(`Status do medicamento ${id} alterado via PUT completo (string)`);
                return mapMedicamentoFromBackend(response);
              } catch (putStringError: any) {
                // Se todas as tentativas falharam, lança erro detalhado
                const errorMessage = putStringError?.response?.data?.message || 
                                   putStringError?.message || 
                                   'Erro ao alterar status do medicamento. Verifique os logs do backend.';
                
                logger.error('Todas as tentativas de alterar status falharam', putStringError, {
                  medicamentoId: id,
                  novoStatus: ativo,
                  tentativas: ['PATCH /status (boolean)', 'PATCH /status (string)', 'PUT completo (boolean)', 'PUT completo (string)'],
                  erroFinal: errorMessage,
                  statusCode: putStringError?.response?.status,
                  errorData: putStringError?.response?.data,
                });
                
                throw new Error(errorMessage);
              }
            }
          }
        } else {
          // Se não for 400/404/500, propaga o erro original
          throw patchError;
        }
      }
    } catch (error: any) {
      // Log detalhado do erro final
      logger.error(`Erro final ao alterar status do medicamento ${id}`, error, {
        medicamentoId: id,
        novoStatus: ativo,
        statusCode: error?.response?.status,
        errorMessage: error?.message,
        errorData: error?.response?.data,
      });
      throw error;
    }
  },
};

