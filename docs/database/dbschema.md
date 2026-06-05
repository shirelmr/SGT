## Table `Usuario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_usuario` | `int4` | Primary |
| `nombre_completo` | `varchar` |  |
| `email` | `varchar` |  |
| `password_hash` | `varchar` |  |
| `rol` | `Rol` |  |

## Table `Periodo`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_periodo` | `int4` | Primary |
| `nombre` | `varchar` |  |
| `fecha_inicio` | `date` |  |
| `fecha_fin` | `date` |  |
| `activo` | `bool` |  |
| `horas_max` | `int4` |  |
| `horas_esperadas` | `int4` |  |

## Table `Postulacion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_postulacion` | `int4` | Primary |
| `id_periodo` | `int4` |  |
| `nombre_completo` | `varchar` |  |
| `email` | `varchar` |  |
| `matricula` | `varchar` |  |
| `carrera` | `varchar` |  |
| `semestre` | `int2` |  |
| `por_que_escogerte` | `text` |  |
| `por_que_interesa` | `text` |  |
| `captura_duolingo` | `varchar` |  Nullable |
| `link_video` | `varchar` |  Nullable |
| `estado` | `EstadoPostulacion` |  |
| `fecha_postulacion` | `timestamp` |  |

## Table `TutorTec`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_tutor` | `int4` | Primary |
| `id_usuario` | `int4` |  |
| `id_periodo` | `int4` |  Nullable |
| `matricula` | `varchar` |  Nullable |
| `carrera` | `varchar` |  Nullable |
| `semestre` | `int2` |  Nullable |
| `link_zoom` | `varchar` |  Nullable |
| `id_revisor` | `int4` |  Nullable |

## Table `Beneficiario`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_benef` | `int4` | Primary |
| `id_usuario` | `int4` |  |
| `id_periodo` | `int4` |  Nullable |
| `id_tutor` | `int4` |  Nullable |
| `grado_escolar` | `varchar` |  Nullable |
| `nombre_tutor_legal` | `varchar` |  Nullable |
| `tel_tutor` | `varchar` |  Nullable |
| `escuela` | `varchar` |  Nullable |

## Table `Revisor`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_revisor` | `int4` | Primary |
| `id_usuario` | `int4` |  |
| `id_periodo` | `int4` |  Nullable |
| `matricula` | `varchar` |  Nullable |
| `carrera` | `varchar` |  Nullable |
| `semestre` | `int2` |  Nullable |

## Table `Coordinador`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_coord` | `int4` | Primary |
| `id_usuario` | `int4` |  |
| `departamento` | `varchar` |  Nullable |

## Table `Sesion`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_sesion` | `int4` | Primary |
| `id_tutor` | `int4` |  |
| `id_beneficiario` | `int4` |  |
| `id_periodo` | `int4` |  |
| `fecha` | `date` |  |
| `hora_inicio` | `time` |  |
| `duracion_hrs` | `numeric` |  |
| `tema` | `varchar` |  |
| `link_sesion` | `varchar` |  Nullable |
| `estado` | `EstadoSesion` |  |
| `id_grupo_sesion` | `int4` |  Nullable |

## Table `Bitacora`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_bitacora` | `int4` | Primary |
| `id_sesion` | `int4` |  |
| `id_tutor` | `int4` |  |
| `actividades` | `text` |  Nullable |
| `logros` | `text` |  Nullable |
| `dificultades` | `text` |  Nullable |
| `plan_siguiente` | `text` |  Nullable |
| `evidencia` | `varchar` |  Nullable |
| `fecha_registro` | `timestamp` |  |
| `estado` | `EstadoComentario` |  |

## Table `ComentarioBitacora`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_comentario` | `int4` | Primary |
| `id_bitacora` | `int4` |  |
| `id_revisor` | `int4` |  |
| `comentario` | `text` |  |
| `fecha_comentario` | `timestamp` |  |
| `estado` | `EstadoComentario` |  |
| `leido` | `bool` |  |

## Table `Asistencia`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_asistencia` | `int4` | Primary |
| `id_sesion` | `int4` |  |
| `confirma_tutor` | `bool` |  |
| `fecha_conf_tutor` | `timestamp` |  Nullable |
| `confirma_benef` | `bool` |  |
| `fecha_conf_benef` | `timestamp` |  Nullable |

## Table `BeneficiarioPeriodo`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_benef_periodo` | `int4` | Primary |
| `id_benef` | `int4` |  |
| `id_periodo` | `int4` |  |
| `pct_examen_inicio` | `numeric` |  Nullable |
| `pct_examen_termino` | `numeric` |  Nullable |
| `fecha_examen_inicio` | `date` |  Nullable |
| `fecha_examen_termino` | `date` |  Nullable |

## Table `HorasAcreditadas`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_horas_acreditadas` | `int4` | Primary |
| `id_tutor` | `int4` |  |
| `id_periodo` | `int4` |  |
| `horas_impartidas` | `numeric` |  |
| `horas_extra` | `numeric` |  |
| `porcentaje_acred` | `numeric` |  |

## Table `Incidencia`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id_incidencia` | `int4` | Primary |
| `id_sesion` | `int4` |  |
| `id_tutor` | `int4` |  |
| `tipo` | `TipoIncidencia` |  |
| `descripcion` | `text` |  Nullable |
| `fecha_registro` | `timestamp` |  |

## Table `AuditoriaConsulta`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `timestamp` | `timestamp` |  |
| `pregunta` | `text` |  |
| `sqlGenerado` | `text` |  |
| `filasDevueltas` | `int4` |  |

