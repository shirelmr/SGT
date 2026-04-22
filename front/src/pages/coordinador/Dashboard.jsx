import { UsersIcon, AcademicCapIcon, CalendarDaysIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/shared/PageHeader';
import { useCoordinadorDashboard } from '../../hooks/useCoordinadorDashboard';

const statCards = [
  {
    key: 'tutoresActivos',
    label: 'Tutores Activos',
    icon: UsersIcon,
    color: '#f97316',
    borderColor: '#f97316',
  },
  {
    key: 'beneficiariosInscritos',
    label: 'Beneficiarios Inscritos',
    icon: AcademicCapIcon,
    color: '#22c55e',
    borderColor: '#22c55e',
  },
  {
    key: 'sesionesMes',
    label: 'Sesiones del Mes',
    icon: CalendarDaysIcon,
    color: '#3b82f6',
    borderColor: '#3b82f6',
  },
  {
    key: 'bitacorasPendientes',
    label: 'Bitácoras Pendientes',
    icon: DocumentTextIcon,
    color: '#f59e0b',
    borderColor: '#f59e0b',
  },
];

export default function CoordinadorDashboard() {
  const { loading, stats } = useCoordinadorDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del sistema"
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key} borderColor={card.borderColor}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className="font-sora text-3xl font-bold text-gray-900 mt-1">
                      {stats?.[card.key] ?? 0}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${card.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
