import { api } from './api';
import type { Cliente } from '../types';

export const clientesService = {
  // Lista todos os clientes
  getAll: async (): Promise<Cliente[]> => {
    return api.get<Cliente[]>('/clientes');
  },

  // Busca um cliente por ID
  getById: async (id: number): Promise<Cliente> => {
    return api.get<Cliente>(`/clientes/${id}`);
  },

  // Busca clientes por nome ou CPF (busca local no front-end)
  // O backend não tem endpoint de busca, então fazemos busca local
  // Esta função deve ser chamada após getAll() ter sido executado
  searchLocal: (clientes: Cliente[], query: string): Cliente[] => {
    if (!query || query.length < 2) {
      return clientes;
    }
    const lowerQuery = query.toLowerCase();
    return clientes.filter(
      cliente =>
        cliente.nome.toLowerCase().includes(lowerQuery) ||
        cliente.cpf.includes(query)
    );
  },

  // Busca clientes (carrega todos e filtra)
  search: async (query: string): Promise<Cliente[]> => {
    if (!query || query.length < 2) {
      return [];
    }
    const allClientes = await api.get<Cliente[]>('/clientes');
    const lowerQuery = query.toLowerCase();
    return allClientes.filter(
      cliente =>
        cliente.nome.toLowerCase().includes(lowerQuery) ||
        cliente.cpf.includes(query)
    );
  },

  // Cria um novo cliente
  create: async (cliente: Omit<Cliente, 'id'>): Promise<Cliente> => {
    return api.post<Cliente>('/clientes', cliente);
  },

  // Atualiza um cliente
  update: async (id: number, cliente: Partial<Cliente>): Promise<Cliente> => {
    return api.put<Cliente>(`/clientes/${id}`, cliente);
  },

  // Deleta um cliente
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/clientes/${id}`);
  },
};

