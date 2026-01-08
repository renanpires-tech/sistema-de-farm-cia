
import React, { useState, useEffect } from 'react';
import { Pill, AlertTriangle, Users, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard';
import { alertasService } from '../../services/alertas';
import type { Alerta } from '../../types';
import Loading from '../../components/Loading';
import { logger } from '../../utils/logger';

// Componente de Card para o Dashboard
const DashboardCard = ({ icon: Icon, title, value, to, colorClass }: { icon: React.ElementType, title: string, value: string | number, to: string, colorClass: string }) => (
  <Link to={to} className={`bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1 shadow-lg ${colorClass}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Link>
);

// Página de Dashboard
const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        medicamentosAtivos: 0,
        clientesCadastrados: 0,
        vendasHoje: 0,
        alertasAtivos: 0,
    });
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
        logger.info('Dashboard acessado');
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [statsData, alertasData] = await Promise.all([
                dashboardService.getStats(),
                alertasService.getAll(),
            ]);
            setStats(statsData);
            setAlertas(alertasData.slice(0, 3)); // Mostra apenas os 3 primeiros
            logger.info('Dados do dashboard carregados com sucesso', {
                medicamentosAtivos: statsData.medicamentosAtivos,
                vendasHoje: statsData.vendasHoje,
                alertas: alertasData.length,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard';
            setError(errorMessage);
            logger.error('Erro ao carregar dashboard', err);
        } finally {
            setIsLoading(false);
        }
    };

    const statsCards = [
        {
            icon: Pill,
            title: 'Medicamentos Ativos',
            value: stats.medicamentosAtivos,
            to: '/medicamentos',
            colorClass: 'border-l-4 border-l-blue-500'
        },
        {
            icon: Users,
            title: 'Clientes Cadastrados',
            value: stats.clientesCadastrados,
            to: '/clientes',
            colorClass: 'border-l-4 border-l-green-500'
        },
        {
            icon: ShoppingCart,
            title: 'Vendas Hoje',
            value: stats.vendasHoje,
            to: '/vendas',
            colorClass: 'border-l-4 border-l-purple-500'
        },
        {
            icon: AlertTriangle,
            title: 'Alertas Ativos',
            value: stats.alertasAtivos,
            to: '/alertas',
            colorClass: 'border-l-4 border-l-red-500'
        },
    ];

    if (isLoading) {
        return <Loading />;
    }

  return (
    <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Dashboard</h1>
        
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm sm:text-base">
            {error}
          </div>
        )}
        
        {/* Grid de cards com estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
           {statsCards.map(stat => <DashboardCard key={stat.title} {...stat} />)}
        </div>

        {/* Seção de Alertas Recentes */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <AlertTriangle className="text-yellow-400 mr-3" />
                Alertas Recentes
            </h2>
            <div className="space-y-4">
                {alertas.length > 0 ? (
                  alertas.map((alerta) => {
                    const isEstoqueBaixo = alerta.tipo === 'ESTOQUE_BAIXO';
                    const colorClass = isEstoqueBaixo ? 'text-yellow-400' : 'text-orange-400';
                    return (
                      <div key={alerta.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <p className={colorClass}>
                          {isEstoqueBaixo ? 'Estoque baixo' : 'Validade próxima'}: {alerta.medicamento.nome} ({alerta.medicamento.dosagem}) - {alerta.mensagem}
                        </p>
                     <Link to="/medicamentos" className="text-blue-400 hover:underline text-sm">Ver Medicamento</Link>
                </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400 text-center py-4">Nenhum alerta ativo no momento.</p>
                )}
            </div>
             <div className="mt-6 text-right">
                <Link to="/alertas" className="text-blue-400 hover:text-blue-300 font-semibold">Ver todos os alertas &rarr;</Link>
             </div>
        </div>
    </div>
  );
};

export default Dashboard;
