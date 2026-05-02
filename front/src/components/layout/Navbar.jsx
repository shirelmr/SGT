import { Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Badge from '../ui/Badge';

const pageTitles = {
  '/coordinador/dashboard': 'Dashboard',
  '/coordinador/usuarios': 'Usuarios',
  '/coordinador/periodos': 'Periodos',
  '/coordinador/asignaciones': 'Asignaciones',
  '/coordinador/horas': 'Horas Acreditadas',
  '/coordinador/progreso': 'Progreso de Beneficiarios',
  '/coordinador/postulaciones': 'Postulaciones',
  '/tutor/dashboard': 'Dashboard',
  '/tutor/sesiones': 'Mis Sesiones',
  '/tutor/sesiones/nueva': 'Nueva Sesión',
  '/tutor/horas': 'Mis Horas',
  '/revisor/dashboard': 'Dashboard',
  '/revisor/bitacoras': 'Bitácoras',
  '/beneficiario/dashboard': 'Tablero',
  '/beneficiario/sesiones': 'Mis Sesiones',
  '/beneficiario/progreso': 'Mi Progreso',
};

const roleLabels = {
  coordinador: 'Coordinador',
  tutor: 'Tutor',
  revisor: 'Revisor',
  beneficiario: 'Beneficiario',
};

export default function Navbar({ onMenuClick }) {
  const { user, rol, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'SGT';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 flex-shrink-0" style={{ backgroundColor: '#f8f8ec', borderColor: '#e0e0c8' }}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="font-sora font-semibold text-gray-800 text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm text-gray-700">{user?.nombre_completo}</span>
          <Badge variant="orange">{roleLabels[rol]}</Badge>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
