import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getMisBeneficiarios } from '../../api/tutor';
import { createSesion } from '../../api/sesiones';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function NuevaSesion() {
  const navigate = useNavigate();
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [selectedBenef, setSelectedBenef] = useState([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { estado: 'programada' },
  });

  useEffect(() => {
    getMisBeneficiarios()
      .then((r) => setBeneficiarios(r.data))
      .catch(() => toast.error('Error al cargar beneficiarios'));
  }, []);

  function toggleBenef(id) {
    setSelectedBenef((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(data) {
    if (selectedBenef.length === 0) {
      toast.error('Selecciona al menos un beneficiario');
      return;
    }
    setSaving(true);
    try {
      await createSesion({ ...data, ids_beneficiarios: selectedBenef });
      const msg = selectedBenef.length > 1
        ? `${selectedBenef.length} sesiones creadas exitosamente`
        : 'Sesión creada exitosamente';
      toast.success(msg);
      navigate('/tutor/sesiones');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Error al crear sesión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nueva Sesión"
        subtitle="Registra una nueva sesión de tutoría"
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Beneficiarios{' '}
              <span className="text-gray-400 font-normal">(puedes seleccionar varios)</span>
            </label>
            <div className="border-2 border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
              {beneficiarios.length === 0 ? (
                <p className="text-sm text-gray-400">No tienes beneficiarios asignados</p>
              ) : (
                beneficiarios.map((b) => (
                  <label key={b.id_benef} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                      checked={selectedBenef.includes(b.id_benef)}
                      onChange={() => toggleBenef(b.id_benef)}
                    />
                    <span className="text-sm text-gray-700">{b.nombre_completo}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              error={errors.fecha?.message}
              {...register('fecha', { required: 'Obligatorio' })}
            />
            <Input
              label="Hora inicio"
              type="time"
              error={errors.hora_inicio?.message}
              {...register('hora_inicio', { required: 'Obligatorio' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Duración (horas)"
              type="number"
              min="0.5"
              step="0.5"
              error={errors.duracion_hrs?.message}
              {...register('duracion_hrs', { required: 'Obligatorio', min: 0.5 })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                {...register('estado', { required: 'Obligatorio' })}
              >
                <option value="programada">Programada</option>
                <option value="realizada">Realizada</option>
              </select>
            </div>
          </div>

          <Input
            label="Tema"
            placeholder="Ej. Álgebra - Ecuaciones de segundo grado"
            error={errors.tema?.message}
            {...register('tema', { required: 'Obligatorio' })}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/tutor/sesiones')}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {selectedBenef.length > 1
                ? `Crear ${selectedBenef.length} sesiones`
                : 'Crear sesión'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
