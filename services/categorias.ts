import { api } from './api';
import type { Categoria } from '../types';

export const categoriasService = {
  // Lista todas as categorias
  getAll: async (): Promise<Categoria[]> => {
    return api.get<Categoria[]>('/categorias');
  },

  // Busca uma categoria por ID
  getById: async (id: number): Promise<Categoria> => {
    return api.get<Categoria>(`/categorias/${id}`);
  },

  // Cria uma nova categoria
  create: async (categoria: Omit<Categoria, 'id'>): Promise<Categoria> => {
    return api.post<Categoria>('/categorias', categoria);
  },

  // Atualiza uma categoria
  update: async (id: number, categoria: Partial<Categoria>): Promise<Categoria> => {
    return api.put<Categoria>(`/categorias/${id}`, categoria);
  },

  // Deleta uma categoria
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/categorias/${id}`);
  },
};


