import { api } from './api';
import type { Venda, Cliente, ItemVenda } from '../types';
import { logger } from '../utils/logger';
import { clientesService } from './clientes';
import { medicamentosService } from './medicamentos';

interface ItemVendaRequest {
  medicamentoId: number;
  quantidade: number;
}

interface CreateVendaRequest {
  itens: ItemVendaRequest[];
  clienteId?: number | null;
}

// Interface para o formato retornado pelo backend
interface VendaBackend {
  id: number;
  cliente?: Cliente | null;
  cliente_id?: number | null;
  itens?: ItemVenda[] | any[];
  valorTotal?: number;
  valor_total?: number;
  dataVenda?: string;
  data_venda?: string;
}

// Função para mapear dados do backend para o formato do frontend
// Busca dados do cliente se necessário
const mapVendaFromBackend = async (data: any): Promise<Venda> => {
  // Mapeia cliente - verifica se cliente_id existe e não é null
  let cliente = null;
  const clienteId = data.cliente_id || data.clienteId;
  
  if (clienteId !== null && clienteId !== undefined) {
    // Se o backend retornou o objeto cliente completo, usa ele
    if (data.cliente && typeof data.cliente === 'object' && data.cliente.nome) {
      cliente = {
        id: data.cliente.id || clienteId,
        nome: data.cliente.nome || '',
        cpf: data.cliente.cpf || '',
        email: data.cliente.email || '',
        telefone: data.cliente.telefone || undefined,
        dataNascimento: data.cliente.dataNascimento || data.cliente.data_nascimento || '',
      };
    } else {
      // Se só tem o ID sem objeto completo, busca os dados do cliente
      try {
        logger.info(`Buscando dados do cliente ${clienteId} para a venda ${data.id}`);
        const clienteCompleto = await clientesService.getById(clienteId);
        cliente = clienteCompleto;
        logger.success(`Dados do cliente ${clienteId} obtidos com sucesso`, { nome: clienteCompleto.nome });
      } catch (error) {
        logger.warn(`Não foi possível buscar dados do cliente ${clienteId}`, error);
        // Fallback: cria um objeto básico
        cliente = {
          id: clienteId,
          nome: data.cliente_nome || `Cliente ID: ${clienteId}`,
          cpf: data.cliente_cpf || '',
          email: data.cliente_email || '',
          telefone: data.cliente_telefone || undefined,
          dataNascimento: data.cliente_data_nascimento || '',
        };
      }
    }
  }
  
  // Mapeia itens da venda - busca dados dos medicamentos se necessário
  const itensPromises: Promise<ItemVenda>[] = Array.isArray(data.itens) 
    ? data.itens.map(async (item: any): Promise<ItemVenda> => {
        const medicamentoId = item.medicamentoId || item.medicamento_id || 0;
        
        // Tenta vários formatos para o nome do medicamento
        let nomeMedicamento = 
          item.nomeMedicamento || 
          item.nome_medicamento || 
          item.medicamento?.nome || 
          item.medicamento_nome ||
          item.nome;
        
        // Se não encontrou o nome, busca os dados do medicamento
        if (!nomeMedicamento && medicamentoId) {
          try {
            logger.info(`Buscando dados do medicamento ${medicamentoId} para a venda ${data.id}`);
            const medicamentoCompleto = await medicamentosService.getById(medicamentoId);
            // Formata o nome com dosagem se disponível
            nomeMedicamento = medicamentoCompleto.dosagem 
              ? `${medicamentoCompleto.nome} (${medicamentoCompleto.dosagem})`
              : medicamentoCompleto.nome;
            logger.success(`Dados do medicamento ${medicamentoId} obtidos com sucesso`, { nome: medicamentoCompleto.nome });
          } catch (error) {
            logger.warn(`Não foi possível buscar dados do medicamento ${medicamentoId}`, error);
            nomeMedicamento = `Medicamento ID: ${medicamentoId}`;
          }
        }
        
        // Fallback se ainda não tiver nome
        if (!nomeMedicamento) {
          nomeMedicamento = medicamentoId ? `Medicamento ID: ${medicamentoId}` : 'Medicamento não encontrado';
        }
        
        return {
          medicamentoId,
          nomeMedicamento,
          quantidade: item.quantidade || 0,
          precoUnitario: parseFloat(item.precoUnitario || item.preco_unitario || item.preco || '0'),
        };
      })
    : [];
  
  // Aguarda todas as buscas de medicamentos em paralelo
  const itens: ItemVenda[] = await Promise.all(itensPromises);
  
  return {
    id: data.id,
    cliente,
    itens,
    valorTotal: parseFloat(data.valorTotal || data.valor_total || '0'),
    dataVenda: data.dataVenda || data.data_venda || new Date().toISOString(),
  };
};

export const vendasService = {
  // Lista todas as vendas
  getAll: async (): Promise<Venda[]> => {
    const data = await api.get<VendaBackend[]>('/vendas');
    // Mapeia todas as vendas em paralelo
    const vendasMapeadas = await Promise.all(data.map(mapVendaFromBackend));
    return vendasMapeadas;
  },

  // Busca uma venda por ID
  getById: async (id: number): Promise<Venda> => {
    const data = await api.get<VendaBackend>(`/vendas/${id}`);
    return await mapVendaFromBackend(data);
  },

  // Cria uma nova venda
  // O backend recebe apenas os itens (medicamentoId e quantidade)
  // O preço é obtido do banco de dados automaticamente
  create: async (venda: CreateVendaRequest): Promise<Venda> => {
    // Prepara os itens no formato que o backend espera
    const payloadItens = venda.itens.map(item => ({
      medicamentoId: item.medicamentoId,
      quantidade: item.quantidade,
    }));
    
    const payload: any = {
      itens: payloadItens,
    };
    
    // Inclui clienteId apenas se fornecido (opcional)
    // Backend Spring Boot geralmente aceita camelCase, mas vamos enviar ambos para garantir
    if (venda.clienteId !== undefined && venda.clienteId !== null) {
      payload.clienteId = venda.clienteId;
      payload.cliente_id = venda.clienteId; // Fallback para snake_case (mais comum em Spring Boot)
    }
    
    logger.info('Criando venda no backend', { 
      itensCount: payloadItens.length,
      itens: payloadItens.map(item => ({
        medicamentoId: item.medicamentoId,
        quantidade: item.quantidade,
      })),
      clienteId: payload.clienteId || payload.cliente_id || null,
      payload: payload,
    });
    
    try {
      const data = await api.post<VendaBackend>('/vendas', payload);
      
      logger.info('Resposta do backend recebida', {
        vendaId: data.id,
        cliente_id: data.cliente_id,
        temClienteCompleto: !!(data.cliente && data.cliente.nome),
        itensCount: data.itens?.length || 0,
      });
      
      const vendaMapeada = await mapVendaFromBackend(data);
      
      logger.success('Venda criada e mapeada com sucesso', { 
        vendaId: vendaMapeada.id,
        clienteId: vendaMapeada.cliente?.id || null,
        clienteNome: vendaMapeada.cliente?.nome || 'Não informado',
        itensCount: vendaMapeada.itens.length,
        itens: vendaMapeada.itens.map(item => ({
          medicamentoId: item.medicamentoId,
          nome: item.nomeMedicamento,
          quantidade: item.quantidade,
        })),
      });
      
      return vendaMapeada;
    } catch (error: any) {
      logger.error('Erro ao criar venda', error, {
        payload,
        errorResponse: error?.response?.data,
        statusCode: error?.response?.status,
      });
      throw error;
    }
  },

  // Busca vendas por cliente
  getByCliente: async (clienteId: number): Promise<Venda[]> => {
    const data = await api.get<VendaBackend[]>(`/vendas/cliente/${clienteId}`);
    // Mapeia todas as vendas em paralelo
    const vendasMapeadas = await Promise.all(data.map(mapVendaFromBackend));
    return vendasMapeadas;
  },
};

