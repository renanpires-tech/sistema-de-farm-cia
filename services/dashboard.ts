import { api } from './api';
import { medicamentosService } from './medicamentos';
import { clientesService } from './clientes';
import { vendasService } from './vendas';
import { alertasService } from './alertas';
import { logger } from '../utils/logger';

export interface DashboardStats {
  medicamentosAtivos: number;
  clientesCadastrados: number;
  vendasHoje: number;
  alertasAtivos: number;
}

export const dashboardService = {
  // Calcula as estatísticas do dashboard (backend não tem endpoint)
  getStats: async (): Promise<DashboardStats> => {
    try {
      const [medicamentos, clientes, vendas, alertas] = await Promise.all([
        medicamentosService.getAtivos(),
        clientesService.getAll(),
        vendasService.getAll(),
        alertasService.getAll(),
      ]);

      // Calcula vendas de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vendasHoje = vendas.filter(venda => {
        const dataVenda = new Date(venda.dataVenda);
        dataVenda.setHours(0, 0, 0, 0);
        return dataVenda.getTime() === hoje.getTime();
      }).length;

      const stats = {
        medicamentosAtivos: medicamentos.length,
        clientesCadastrados: clientes.length,
        vendasHoje,
        alertasAtivos: alertas.length,
      };
      
      logger.info('Estatísticas do dashboard calculadas', stats);
      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas do dashboard', error);
      throw error;
    }
  },
};

