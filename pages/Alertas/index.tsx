
import React, { useState, useEffect } from 'react';
import type { Alerta } from '../../types';
import { AlertTriangle, Archive, CalendarClock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { alertasService } from '../../services/alertas';
import Loading from '../../components/Loading';
import { logger } from '../../utils/logger';

const AlertaCard: React.FC<{ alerta: Alerta; onViewDetails: (medicamentoId: number) => void }> = ({ alerta, onViewDetails }) => {
    const isEstoqueBaixo = alerta.tipo === 'ESTOQUE_BAIXO';
    const iconColor = isEstoqueBaixo ? 'text-yellow-400' : 'text-orange-400';
    const borderColor = isEstoqueBaixo ? 'border-yellow-500' : 'border-orange-500';
    
    return (
        <div className={`bg-gray-800 p-4 rounded-lg border-l-4 ${borderColor} flex items-start gap-4 shadow-md`}>
            <AlertTriangle size={24} className={iconColor} />
            <div className="flex-1">
                <p className="font-semibold text-white">
                  {alerta.medicamento.nome} {alerta.medicamento.dosagem ? `(${alerta.medicamento.dosagem})` : ''}
                </p>
                <p className={`text-sm ${iconColor} mt-1`}>{alerta.mensagem}</p>
                {alerta.medicamento.descricao && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alerta.medicamento.descricao}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                   <span className="flex items-center gap-1">
                     <Archive size={14}/> Estoque: {alerta.medicamento.estoque}
                   </span>
                   <span className="flex items-center gap-1">
                     <CalendarClock size={14}/> Validade: {new Date(alerta.medicamento.dataValidade).toLocaleDateString('pt-BR')}
                   </span>
                </div>
            </div>
            <button
              onClick={() => onViewDetails(alerta.medicamento.id)}
              className="self-center text-sm text-blue-400 hover:text-blue-300 hover:underline px-3 py-1 rounded transition-colors"
            >
                Detalhes
            </button>
        </div>
    );
};

// Página para exibir Alertas
const Alertas: React.FC = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlertas();
    logger.info('Página de alertas acessada');
  }, []);

  const loadAlertas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await alertasService.getAll();
      setAlertas(data);
      logger.info(`Alertas carregados: ${data.length} alertas ativos`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar alertas';
      setError(errorMessage);
      logger.error('Erro ao carregar alertas', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (medicamentoId: number) => {
    logger.info(`Navegação para detalhes do medicamento ${medicamentoId} a partir de alerta`);
    navigate(`/medicamentos/${medicamentoId}`);
  };


  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Central de Alertas</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {alertas.length > 0 ? (
          alertas.map((alerta) => (
            <AlertaCard key={alerta.id} alerta={alerta} onViewDetails={handleViewDetails} />
          ))
        ) : (
          <div className="text-center py-10 bg-gray-800 rounded-lg">
            <p className="text-gray-400">Nenhum alerta ativo no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
