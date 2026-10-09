import { EstadoSolicitud } from '../../../core/enums/estados.enum';

export const ALLOWED_TRANSITIONS: Record<EstadoSolicitud, EstadoSolicitud[]> = {
  [EstadoSolicitud.PENDIENTE]: [EstadoSolicitud.EN_GESTION],
  [EstadoSolicitud.EN_GESTION]: [EstadoSolicitud.RESUELTA],
  [EstadoSolicitud.RESUELTA]: [],
};

/**
 * Función pura para evaluar si una transición de estado es válida.
 * - No permite transiciones al mismo estado.
 * - No permite saltarse pasos (ej: PENDIENTE -> RESUELTA).
 * - No permite reabrir solicitudes RESUELTA.
 */
export function isValidTransition(
  currentState: EstadoSolicitud,
  nextState: EstadoSolicitud,
): boolean {
  if (currentState === nextState) {
    return false;
  }
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}
