import { api } from './api';
import type { Alerta, Medicamento } from '../types';
import { mapMedicamentoFromBackend } from './medicamentos';
import { logger } from '../utils/logger';

interface AlertaEstoqueBaixo {
  medicamento: Medicamento;
  tipo: 'ESTOQUE_BAIXO';
  mensagem: string;
}

interface AlertaValidadeProxima {
  medicamento: Medicamento;
  tipo: 'VALIDADE_PROXIMA';
  mensagem: string;
}

export const alertasService = {
  // Lista todos os alertas (combina estoque baixo e validade próxima)
  getAll: async (): Promise<Alerta[]> => {
    try {
      const [estoqueBaixo, validadeProxima] = await Promise.all([
        api.get<Medicamento[]>('/alertas/estoque-baixo'),
        api.get<Medicamento[]>('/alertas/validade-proxima'),
      ]);

      // Converte os medicamentos para o formato Alerta
      const alertas: Alerta[] = [];

      estoqueBaixo.forEach((med: any) => {
        const medicamentoMapeado = mapMedicamentoFromBackend(med);
        alertas.push({
          id: medicamentoMapeado.id * 1000 + 1, // ID temporário para estoque baixo
          medicamento: medicamentoMapeado,
          tipo: 'ESTOQUE_BAIXO',
          mensagem: `Estoque baixo: apenas ${medicamentoMapeado.estoque} unidades restantes.`,
        });
      });

      validadeProxima.forEach((med: any) => {
        const medicamentoMapeado = mapMedicamentoFromBackend(med);
        const diasRestantes = Math.ceil(
          (new Date(medicamentoMapeado.dataValidade).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );
        alertas.push({
          id: medicamentoMapeado.id * 1000 + 2, // ID temporário para validade próxima
          medicamento: medicamentoMapeado,
          tipo: 'VALIDADE_PROXIMA',
          mensagem: `Validade próxima: vence em ${diasRestantes} dias.`,
        });
      });

      return alertas;
    } catch (error) {
      logger.error('Erro ao buscar alertas', error);
      throw error;
    }
  },

  // Lista apenas alertas de estoque baixo
  getEstoqueBaixo: async (): Promise<Medicamento[]> => {
    const data = await api.get<any[]>('/alertas/estoque-baixo');
    return Array.isArray(data) ? data.map(mapMedicamentoFromBackend) : [];
  },

  // Lista apenas alertas de validade próxima
  getValidadeProxima: async (): Promise<Medicamento[]> => {
    const data = await api.get<any[]>('/alertas/validade-proxima');
    return Array.isArray(data) ? data.map(mapMedicamentoFromBackend) : [];
  },
};

