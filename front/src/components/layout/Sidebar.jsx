import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const navByRole = {
  coordinador: [
    { to: '/coordinador/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/coordinador/postulaciones', label: 'Postulaciones', icon: ClipboardDocumentCheckIcon },
    { to: '/coordinador/usuarios', label: 'Usuarios', icon: UsersIcon },
    { to: '/coordinador/periodos', label: 'Periodos', icon: CalendarDaysIcon },
    { to: '/coordinador/asignaciones', label: 'Asignaciones', icon: ClipboardDocumentListIcon },
    { to: '/coordinador/horas', label: 'Horas Acreditadas', icon: ClockIcon },
    { to: '/coordinador/progreso', label: 'Progreso Beneficiarios', icon: ChartBarIcon },
  ],
  tutor: [
    { to: '/tutor/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/tutor/sesiones', label: 'Mis Sesiones', icon: CalendarDaysIcon },
    { to: '/tutor/horas', label: 'Mis Horas', icon: ClockIcon },
    { to: '/tutor/perfil', label: 'Mi Perfil', icon: UserCircleIcon },
  ],
  revisor: [
    { to: '/revisor/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/revisor/bitacoras', label: 'Bitácoras', icon: DocumentTextIcon },
  ],
  beneficiario: [
    { to: '/beneficiario/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/beneficiario/sesiones', label: 'Mis Sesiones', icon: CalendarDaysIcon },
    { to: '/beneficiario/progreso', label: 'Mi Progreso', icon: AcademicCapIcon },
  ],
};

const roleLabels = {
  coordinador: 'Coordinador',
  tutor: 'Tutor',
  revisor: 'Revisor',
  beneficiario: 'Beneficiario',
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function Sidebar({ onClose }) {
  const { user, rol, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = navByRole[rol] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="flex flex-col h-full w-64 py-6"
      style={{ backgroundColor: '#ee7e4c' }}
    >
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f8f8ec' }}>
            <BookOpenIcon className="w-5 h-5" style={{ color: '#4a1f06' }} />
          </div>
          <div>
            <span className="font-sora font-bold text-lg" style={{ color: '#4a1f06' }}>SGT</span>
            <span className="font-sora font-bold text-lg" style={{ color: '#f8f8ec' }}> Talk!</span>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0" style={{ backgroundColor: '#f8f8ec', color: '#4a1f06' }}>
            {getInitials(user?.nombre_completo)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#4a1f06' }}>{user?.nombre_completo}</p>
            <p className="text-xs" style={{ color: '#7a3b0e' }}>{roleLabels[rol]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? ''
                    : 'hover:bg-black/10'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: '#f8f8ec', color: '#4a1f06', fontWeight: '600' }
                  : { color: '#7a3b0e' }
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full hover:bg-black/10"
          style={{ color: '#7a3b0e' }}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
