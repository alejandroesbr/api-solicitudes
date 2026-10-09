import { describe, expect, it } from 'vitest';
import { EstadoSolicitud } from '../../../core/enums/estados.enum';
import { isValidTransition } from './solicitud-transitions';

describe('solicitud-transitions (Unit)', () => {
  describe('Transiciones permitidas (flujo nominal)', () => {
    it('debe permitir la transición de PENDIENTE a EN_GESTION', () => {
      expect(
        isValidTransition(
          EstadoSolicitud.PENDIENTE,
          EstadoSolicitud.EN_GESTION,
        ),
      ).toBe(true);
    });

    it('debe permitir la transición de EN_GESTION a RESUELTA', () => {
      expect(
        isValidTransition(EstadoSolicitud.EN_GESTION, EstadoSolicitud.RESUELTA),
      ).toBe(true);
    });
  });

  describe('Transiciones inválidas y casos borde', () => {
    it('debe rechazar pasar directamente de PENDIENTE a RESUELTA (salto prohibido)', () => {
      expect(
        isValidTransition(EstadoSolicitud.PENDIENTE, EstadoSolicitud.RESUELTA),
      ).toBe(false);
    });

    it('debe rechazar reabrir una solicitud de RESUELTA a EN_GESTION', () => {
      expect(
        isValidTransition(EstadoSolicitud.RESUELTA, EstadoSolicitud.EN_GESTION),
      ).toBe(false);
    });

    it('debe rechazar reabrir una solicitud de RESUELTA a PENDIENTE', () => {
      expect(
        isValidTransition(EstadoSolicitud.RESUELTA, EstadoSolicitud.PENDIENTE),
      ).toBe(false);
    });

    it('debe rechazar retroceder de EN_GESTION a PENDIENTE', () => {
      expect(
        isValidTransition(
          EstadoSolicitud.EN_GESTION,
          EstadoSolicitud.PENDIENTE,
        ),
      ).toBe(false);
    });

    it('debe rechazar pasar al mismo estado: PENDIENTE -> PENDIENTE', () => {
      expect(
        isValidTransition(EstadoSolicitud.PENDIENTE, EstadoSolicitud.PENDIENTE),
      ).toBe(false);
    });

    it('debe rechazar pasar al mismo estado: EN_GESTION -> EN_GESTION', () => {
      expect(
        isValidTransition(
          EstadoSolicitud.EN_GESTION,
          EstadoSolicitud.EN_GESTION,
        ),
      ).toBe(false);
    });

    it('debe rechazar pasar al mismo estado: RESUELTA -> RESUELTA', () => {
      expect(
        isValidTransition(EstadoSolicitud.RESUELTA, EstadoSolicitud.RESUELTA),
      ).toBe(false);
    });
  });
});
