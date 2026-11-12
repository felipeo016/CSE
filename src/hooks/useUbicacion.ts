import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

import type { Coordenadas } from '../config/valoresPrueba';
import type { EstadoSeguimiento, EstadoUbicacion } from '../models/Mapa';
import { useMapaStore } from '../store/mapaStore';
import { aCoordenadas } from '../utils/coordenadas';

/** Tiempo máximo esperando al GPS antes de mostrar el error (la pantalla no queda cargando). */
const ESPERA_GPS_MS = 15000;

/** Una posición anterior sirve si tiene menos de 5 minutos (cuando el GPS tarda en responder). */
const EDAD_MAXIMA_POSICION_MS = 5 * 60 * 1000;

/** Opciones del seguimiento: cada 3 s o cada 5 m, con precisión equilibrada (ahorra batería). */
const OPCIONES_SEGUIMIENTO: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 3000,
  distanceInterval: 5,
};

/** Cita literal de la documentación (RF-24, CP-04). */
export const MENSAJE_GPS_APAGADO = 'Active la ubicación del dispositivo';

/** Mensaje de cada estado con problema; null si no hay nada que explicar. */
const MENSAJES: Record<EstadoUbicacion, string | null> = {
  inactivo: null,
  buscando: null,
  lista: null,
  sin_permiso:
    'Usamos tu ubicación solo mientras estás en el mapa, para mostrar dónde estás y ayudarte a ' +
    'marcar el lugar de la visita. Activa el permiso de ubicación en los ajustes.',
  gps_apagado: MENSAJE_GPS_APAGADO,
  error: 'No pudimos obtener tu ubicación. Intenta de nuevo.',
};

/** Entradas de useUbicacion. */
export interface OpcionesUbicacion {
  /**
   * Se llama con la posición cada vez que obtenerActual() la consigue (también al volver de
   * Ajustes con el permiso concedido). La pantalla del mapa la usa para centrar el mapa.
   */
  alCentrar?: (punto: Coordenadas) => void;
}

/** Lo que devuelve useUbicacion. */
export interface ResultadoUbicacion {
  estado: EstadoUbicacion;
  /** Texto para mostrar según el estado (permiso negado, GPS apagado, error); null si no hay. */
  mensaje: string | null;
  /** Última posición del teléfono (mapaStore); null si aún no hay. */
  posicion: Coordenadas | null;
  seguimiento: EstadoSeguimiento;
  /** true mientras se pide el permiso o se espera al GPS: los botones se bloquean. */
  ocupado: boolean;
  /** Pide el permiso si hace falta, lee la posición actual y llama a alCentrar. */
  obtenerActual: () => Promise<Coordenadas | null>;
  activarSeguimiento: () => Promise<void>;
  pausarSeguimiento: () => void;
  reanudarSeguimiento: () => Promise<void>;
  /** Abre los Ajustes de la app para conceder el permiso (CP-03). */
  abrirAjustes: () => void;
}

/** Error del GPS que lanza expo-location cuando la ubicación del teléfono está apagada. */
function esErrorGpsApagado(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }
  return (
    error.code === 'ERR_LOCATION_SETTINGS_UNSATISFIED' ||
    error.code === 'ERR_CURRENT_LOCATION_IS_UNAVAILABLE' ||
    error.code === 'ERR_LOCATION_UNAVAILABLE'
  );
}

/** Espera una promesa como máximo `ms` milisegundos; si no responde, devuelve null. */
async function conTiempoLimite<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const tiempoAgotado = new Promise<null>((resolver) => {
    temporizador = setTimeout(() => resolver(null), ms);
  });
  try {
    return await Promise.race([promesa, tiempoAgotado]);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Hook propio de la ubicación del dispositivo (RF-24, RF-25, RNF-13, RNF-14). Es el segundo hook
 * propio del proyecto (el primero es useCalculoTotal) y sigue el enfoque de
 * referencia-clase/mapas (location/ y useLocationStore) con expo-location en primer plano.
 *
 * Entradas: opciones.alCentrar, la función que mueve el mapa a la posición obtenida.
 *
 * Estado:
 * - useState: `estado` (inactivo, buscando, lista, sin_permiso, gps_apagado, error).
 * - mapaStore (Zustand): la posición del teléfono y el estado del seguimiento, compartidos con
 *   el formulario Registrar ubicación.
 * - useRef: la suscripción de watchPositionAsync (no se dibuja, solo hay que poder quitarla).
 *
 * Efectos (todos devuelven su limpieza):
 * - El permiso se pide solo cuando el usuario pulsa un botón, nunca al montar (RNF-13).
 * - AppState: al volver a la app (por ejemplo, desde Ajustes) vuelve a comprobar el permiso o el
 *   GPS y, si ya están, centra el mapa sin reiniciar la app (CP-03). Al irse a segundo plano
 *   pausa el seguimiento: no hay seguimiento en segundo plano (RF-25).
 * - useFocusEffect: al salir de la pantalla del mapa quita la suscripción (RNF-14, CP-05).
 * - Al desmontar también se quita la suscripción.
 *
 * Resultados: estado, mensaje, posición, seguimiento y las acciones obtenerActual,
 * activarSeguimiento, pausarSeguimiento, reanudarSeguimiento y abrirAjustes.
 */
export function useUbicacion(opciones: OpcionesUbicacion = {}): ResultadoUbicacion {
  const [estado, setEstado] = useState<EstadoUbicacion>('inactivo');
  const posicion = useMapaStore((s) => s.ubicacionActiva);
  const seguimiento = useMapaStore((s) => s.seguimiento);

  const suscripcion = useRef<Location.LocationSubscription | null>(null);
  // Cada arranque o parada del seguimiento cambia la versión. Si watchPositionAsync responde
  // después de pausar o de salir del mapa, la versión ya no coincide y se quita de inmediato.
  const version = useRef(0);
  // false cuando la pantalla del mapa no está visible.
  const enPantalla = useRef(false);
  // Copias en ref para leerlas dentro de los listeners sin volver a registrarlos.
  const estadoActual = useRef(estado);
  estadoActual.current = estado;
  const alCentrar = useRef(opciones.alCentrar);
  alCentrar.current = opciones.alCentrar;

  /** Quita la suscripción (si hay) y guarda el nuevo estado del seguimiento. */
  const detenerSeguimiento = useCallback((nuevo: EstadoSeguimiento) => {
    version.current += 1;
    suscripcion.current?.remove();
    suscripcion.current = null;
    useMapaStore.getState().cambiarSeguimiento(nuevo);
  }, []);

  /**
   * Comprueba que el GPS esté encendido y luego el permiso (lo pide si aún se puede).
   * Devuelve true si ya se puede leer la posición.
   */
  const prepararUbicacion = useCallback(async (): Promise<boolean> => {
    // Primero el GPS: en iOS, con la ubicación del sistema apagada, el permiso aparece como
    // "denied" y se mostraría la tarjeta de permiso en vez de "Active la ubicación..." (CP-04).
    if (!(await Location.hasServicesEnabledAsync())) {
      setEstado('gps_apagado');
      return false;
    }
    let permiso = await Location.getForegroundPermissionsAsync();
    if (!permiso.granted && permiso.canAskAgain) {
      permiso = await Location.requestForegroundPermissionsAsync();
    }
    if (!permiso.granted) {
      setEstado('sin_permiso');
      return false;
    }
    return true;
  }, []);

  const obtenerActual = useCallback(async (): Promise<Coordenadas | null> => {
    setEstado('buscando');
    try {
      if (!(await prepararUbicacion())) {
        return null;
      }
      // Si el GPS no responde a tiempo, se usa la última posición conocida (si es reciente).
      const lectura =
        (await conTiempoLimite(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          ESPERA_GPS_MS,
        )) ?? (await Location.getLastKnownPositionAsync({ maxAge: EDAD_MAXIMA_POSICION_MS }));

      const punto = lectura ? aCoordenadas(lectura.coords.latitude, lectura.coords.longitude) : null;
      if (!punto) {
        setEstado('error');
        return null;
      }
      useMapaStore.getState().actualizarUbicacionActiva(punto);
      setEstado('lista');
      alCentrar.current?.(punto);
      return punto;
    } catch (error) {
      setEstado(esErrorGpsApagado(error) ? 'gps_apagado' : 'error');
      return null;
    }
  }, [prepararUbicacion]);

  const activarSeguimiento = useCallback(async () => {
    version.current += 1;
    const miVersion = version.current;
    setEstado('buscando');
    try {
      if (!(await prepararUbicacion())) {
        return;
      }
      const nueva = await Location.watchPositionAsync(
        OPCIONES_SEGUIMIENTO,
        (lectura) => {
          // Cada nueva posición mueve el marcador del dispositivo.
          const punto = aCoordenadas(lectura.coords.latitude, lectura.coords.longitude);
          if (punto) {
            useMapaStore.getState().actualizarUbicacionActiva(punto);
            setEstado('lista');
          }
        },
        () => {
          // El GPS se apagó durante el seguimiento: se detiene y se avisa.
          detenerSeguimiento('pausado');
          setEstado('gps_apagado');
        },
      );
      // Se pausó o se salió del mapa mientras arrancaba: se libera de inmediato.
      if (miVersion !== version.current || !enPantalla.current) {
        nueva.remove();
        // No se queda en "buscando": vuelve a lista si ya había posición.
        setEstado(useMapaStore.getState().ubicacionActiva ? 'lista' : 'inactivo');
        return;
      }
      // Si quedó una suscripción anterior, se quita antes de guardar la nueva (no quedan dos).
      suscripcion.current?.remove();
      suscripcion.current = nueva;
      useMapaStore.getState().cambiarSeguimiento('activo');
      // Mientras llega la primera lectura se deja de mostrar "buscando" si ya había posición.
      if (useMapaStore.getState().ubicacionActiva) {
        setEstado('lista');
      }
    } catch (error) {
      setEstado(esErrorGpsApagado(error) ? 'gps_apagado' : 'error');
    }
  }, [prepararUbicacion, detenerSeguimiento]);

  const pausarSeguimiento = useCallback(() => {
    detenerSeguimiento('pausado');
  }, [detenerSeguimiento]);

  const abrirAjustes = useCallback(() => {
    void Linking.openSettings();
  }, []);

  // Al entrar a la pantalla se marca como visible; al salir se libera la suscripción y se
  // olvida la posición (RNF-14). Así desaparece el indicador de ubicación del sistema.
  useFocusEffect(
    useCallback(() => {
      enPantalla.current = true;
      return () => {
        enPantalla.current = false;
        detenerSeguimiento('inactivo');
        useMapaStore.getState().actualizarUbicacionActiva(null);
        setEstado('inactivo');
      };
    }, [detenerSeguimiento]),
  );

  // AppState: volver de Ajustes (CP-03) y no seguir en segundo plano (RF-25).
  useEffect(() => {
    const escucha = AppState.addEventListener('change', (nuevoEstado) => {
      if (nuevoEstado === 'background') {
        if (suscripcion.current) {
          detenerSeguimiento('pausado');
        } else {
          // Aún no hay suscripción, pero puede estar arrancando: cambiar la versión hace que
          // activarSeguimiento la quite apenas llegue (no queda abierta en segundo plano).
          version.current += 1;
        }
        return;
      }
      if (nuevoEstado !== 'active' || !enPantalla.current) {
        return;
      }
      // Solo se comprueba (sin volver a pedir el permiso): si ya se concedió o se encendió el
      // GPS, se obtiene la posición y se centra el mapa.
      if (estadoActual.current === 'sin_permiso') {
        void Location.getForegroundPermissionsAsync().then((permiso) => {
          if (permiso.granted) void obtenerActual();
        });
      } else if (estadoActual.current === 'gps_apagado') {
        void Location.hasServicesEnabledAsync().then((encendido) => {
          if (encendido) void obtenerActual();
        });
      }
    });
    return () => escucha.remove();
  }, [detenerSeguimiento, obtenerActual]);

  // Al desmontar (por ejemplo, al cerrar sesión con el mapa abierto) se quita la suscripción.
  useEffect(() => {
    return () => {
      version.current += 1;
      suscripcion.current?.remove();
      suscripcion.current = null;
    };
  }, []);

  return {
    estado,
    mensaje: MENSAJES[estado],
    posicion,
    seguimiento,
    ocupado: estado === 'buscando',
    obtenerActual,
    activarSeguimiento,
    pausarSeguimiento,
    reanudarSeguimiento: activarSeguimiento,
    abrirAjustes,
  };
}
