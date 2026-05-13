import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PrivateRoute from './PrivateRoute';
import AppLayout from '../components/layout/AppLayout';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Postulacion from '../pages/Postulacion';

// Coordinador
import CoordinadorDashboard from '../pages/coordinador/Dashboard';
import Postulaciones from '../pages/coordinador/Postulaciones';
import Usuarios from '../pages/coordinador/Usuarios';
import Periodos from '../pages/coordinador/Periodos';
import Asignaciones from '../pages/coordinador/Asignaciones';
import HorasAcreditadas from '../pages/coordinador/HorasAcreditadas';
import ProgresosBeneficiarios from '../pages/coordinador/ProgresosBeneficiarios';
import ConsultaIA from '../pages/coordinador/ConsultaIA';

// Tutor
import TutorDashboard from '../pages/tutor/Dashboard';
import MisSesionesTutor from '../pages/tutor/MisSesiones';
import NuevaSesion from '../pages/tutor/NuevaSesion';
import Bitacora from '../pages/tutor/Bitacora';
import MisHoras from '../pages/tutor/MisHoras';
import TutorPerfil from '../pages/tutor/Perfil';

// Revisor
import RevisorDashboard from '../pages/revisor/Dashboard';
import Bitacoras from '../pages/revisor/Bitacoras';
import DetalleBitacora from '../pages/revisor/DetalleBitacora';

// Beneficiario
import BeneficiarioDashboard from '../pages/beneficiario/Dashboard';
import MisSesionesBeneficiario from '../pages/beneficiario/MisSesiones';
import MiProgreso from '../pages/beneficiario/MiProgreso';

function RootRedirect() {
  const { isAuthenticated, rol, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={`/${rol}/dashboard`} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/postulacion" element={<Postulacion />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Coordinador routes */}
        <Route element={<PrivateRoute allowedRoles={['coordinador']} />}>
          <Route element={<AppLayout />}>
            <Route path="/coordinador/dashboard" element={<CoordinadorDashboard />} />
            <Route path="/coordinador/usuarios" element={<Usuarios />} />
            <Route path="/coordinador/periodos" element={<Periodos />} />
            <Route path="/coordinador/asignaciones" element={<Asignaciones />} />
            <Route path="/coordinador/horas" element={<HorasAcreditadas />} />
            <Route path="/coordinador/progreso" element={<ProgresosBeneficiarios />} />
            <Route path="/coordinador/postulaciones" element={<Postulaciones />} />
            <Route path="/coordinador/consulta-ia" element={<ConsultaIA />} />
          </Route>
        </Route>

        {/* Tutor routes */}
        <Route element={<PrivateRoute allowedRoles={['tutor']} />}>
          <Route element={<AppLayout />}>
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/tutor/sesiones" element={<MisSesionesTutor />} />
            <Route path="/tutor/sesiones/nueva" element={<NuevaSesion />} />
            <Route path="/tutor/sesiones/:id/bitacora" element={<Bitacora />} />
            <Route path="/tutor/horas" element={<MisHoras />} />
            <Route path="/tutor/perfil" element={<TutorPerfil />} />
          </Route>
        </Route>

        {/* Revisor routes */}
        <Route element={<PrivateRoute allowedRoles={['revisor']} />}>
          <Route element={<AppLayout />}>
            <Route path="/revisor/dashboard" element={<RevisorDashboard />} />
            <Route path="/revisor/bitacoras" element={<Bitacoras />} />
            <Route path="/revisor/bitacoras/:id" element={<DetalleBitacora />} />
          </Route>
        </Route>

        {/* Beneficiario routes */}
        <Route element={<PrivateRoute allowedRoles={['beneficiario']} />}>
          <Route element={<AppLayout />}>
            <Route path="/beneficiario/dashboard" element={<BeneficiarioDashboard />} />
            <Route path="/beneficiario/sesiones" element={<MisSesionesBeneficiario />} />
            <Route path="/beneficiario/progreso" element={<MiProgreso />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
