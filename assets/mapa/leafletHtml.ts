/**
 * Página HTML del mapa (RF-23 a RF-26): OpenStreetMap con Leaflet 1.9.4 (versión fija) dentro de
 * una WebView. Está en un módulo .ts y no en un .html porque Expo Go no puede leer un .html local
 * sin instalar otra librería (ver docs/cambios-estructura.md).
 *
 * La página no recibe datos al crearse: todo llega por mensajes desde MapaLeaflet.tsx, así el HTML
 * nunca cambia y no se mete texto del usuario dentro del código.
 *
 * Mensajes de la app a la página (window.recibirMensaje):
 *   { tipo: 'negocio', latitud, longitud }            marcador del negocio
 *   { tipo: 'dispositivo', latitud, longitud }        marcador de la posición del teléfono
 *   { tipo: 'dispositivo', quitar: true }             quita ese marcador
 *   { tipo: 'ubicaciones', puntos: [...] }            marcadores de las ubicaciones de servicio
 *   { tipo: 'seleccion', latitud, longitud } | { tipo: 'seleccion', quitar: true }
 *   { tipo: 'centrar', latitud, longitud, zoom? }     mueve la vista
 *   { tipo: 'modoSeleccion', activo }                 tocar el mapa devuelve el punto tocado
 *
 * Mensajes de la página a la app (window.ReactNativeWebView.postMessage):
 *   { tipo: 'listo' }    Leaflet cargó y ya acepta mensajes
 *   { tipo: 'error' }    no se pudo cargar Leaflet (sin conexión o fallo de carga)
 *   { tipo: 'punto', latitud, longitud }   punto tocado en modo selección
 *
 * No se dibujan líneas entre puntos: no hay rutas reales (documentación, sección 12).
 */
export const HTML_MAPA = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #mapa { height: 100%; width: 100%; margin: 0; padding: 0; }
  body { font-family: sans-serif; }
  .leaflet-control-attribution { font-size: 10px !important; }
  /* Marcadores en forma de gota con un ícono blanco (íconos de Feather, licencia MIT). */
  .pin { width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         display: flex; align-items: center; justify-content: center;
         box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid #FFFFFF; }
  .pin svg { transform: rotate(45deg); }
  .pin-negocio { background: #0F2A5C; }
  .pin-servicio { background: #16A34A; }
  .pin-seleccion { background: #F59E0B; }
  /* Punto azul del dispositivo, distinto de las gotas. */
  .punto-dispositivo { width: 18px; height: 18px; border-radius: 50%; background: #2563EB;
         border: 3px solid #FFFFFF; box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
  .etiqueta { font-weight: 600; color: #0B1F44; }
</style>
</head>
<body>
<div id="mapa"></div>
<script>
  // Si Leaflet no carga (sin conexión o fallo), se avisa a la app para mostrar Reintentar.
  function avisarApp(mensaje) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(mensaje));
    }
  }
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="avisarApp({ tipo: 'error' })"></script>
<script>
(function () {
  if (typeof L === 'undefined') {
    avisarApp({ tipo: 'error' });
    return;
  }

  // Íconos SVG de Feather: shield (negocio), map-pin (servicio) y crosshair (punto elegido).
  var SVG_ESCUDO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  var SVG_PIN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var SVG_MIRA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>';

  function iconoGota(clase, svg) {
    return L.divIcon({
      className: '',
      html: '<div class="pin ' + clase + '">' + svg + '</div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      tooltipAnchor: [0, -6],
    });
  }

  var ICONO_NEGOCIO = iconoGota('pin-negocio', SVG_ESCUDO);
  var ICONO_SERVICIO = iconoGota('pin-servicio', SVG_PIN);
  var ICONO_SELECCION = iconoGota('pin-seleccion', SVG_MIRA);
  var ICONO_DISPOSITIVO = L.divIcon({
    className: '',
    html: '<div class="punto-dispositivo"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  // Las coordenadas se validan como números antes de usarlas.
  function esCoordenada(latitud, longitud) {
    return typeof latitud === 'number' && typeof longitud === 'number' &&
      isFinite(latitud) && isFinite(longitud) &&
      Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
  }

  // Popup con texto seguro: textContent no interpreta HTML escrito por el usuario.
  function contenidoPopup(titulo, detalle) {
    var caja = document.createElement('div');
    var negrita = document.createElement('div');
    negrita.className = 'etiqueta';
    negrita.textContent = titulo || '';
    caja.appendChild(negrita);
    if (detalle) {
      var texto = document.createElement('div');
      texto.textContent = detalle;
      caja.appendChild(texto);
    }
    return caja;
  }

  var mapa = L.map('mapa', { zoomControl: true }).setView([4.6, -74.08], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  var marcadorNegocio = null;
  var marcadorDispositivo = null;
  var marcadorSeleccion = null;
  var capaServicios = L.layerGroup().addTo(mapa);
  var modoSeleccion = false;

  function ponerNegocio(m) {
    if (!esCoordenada(m.latitud, m.longitud)) return;
    if (marcadorNegocio) mapa.removeLayer(marcadorNegocio);
    marcadorNegocio = L.marker([m.latitud, m.longitud], { icon: ICONO_NEGOCIO, zIndexOffset: 300 })
      .addTo(mapa)
      .bindTooltip('Negocio', { permanent: true, direction: 'bottom', offset: [0, 4] })
      .bindPopup(contenidoPopup('Centro de Seguridad Electrónica', 'Ubicación del negocio'));
  }

  function ponerDispositivo(m) {
    if (m.quitar) {
      if (marcadorDispositivo) mapa.removeLayer(marcadorDispositivo);
      marcadorDispositivo = null;
      return;
    }
    if (!esCoordenada(m.latitud, m.longitud)) return;
    if (marcadorDispositivo) {
      marcadorDispositivo.setLatLng([m.latitud, m.longitud]);
    } else {
      marcadorDispositivo = L.marker([m.latitud, m.longitud], { icon: ICONO_DISPOSITIVO, zIndexOffset: 500 })
        .addTo(mapa)
        .bindPopup(contenidoPopup('Tu ubicación', 'Posición actual del teléfono'));
    }
  }

  function ponerUbicaciones(m) {
    capaServicios.clearLayers();
    var puntos = Array.isArray(m.puntos) ? m.puntos : [];
    puntos.forEach(function (p) {
      if (!esCoordenada(p.latitud, p.longitud)) return;
      L.marker([p.latitud, p.longitud], { icon: ICONO_SERVICIO })
        .bindPopup(contenidoPopup(p.titulo, p.detalle))
        .addTo(capaServicios);
    });
  }

  function ponerSeleccion(m) {
    if (m.quitar) {
      if (marcadorSeleccion) mapa.removeLayer(marcadorSeleccion);
      marcadorSeleccion = null;
      return;
    }
    if (!esCoordenada(m.latitud, m.longitud)) return;
    if (marcadorSeleccion) {
      marcadorSeleccion.setLatLng([m.latitud, m.longitud]);
    } else {
      marcadorSeleccion = L.marker([m.latitud, m.longitud], { icon: ICONO_SELECCION, zIndexOffset: 400 })
        .addTo(mapa)
        .bindTooltip('Punto elegido', { permanent: true, direction: 'bottom', offset: [0, 4] });
    }
  }

  function centrar(m) {
    if (!esCoordenada(m.latitud, m.longitud)) return;
    var zoom = typeof m.zoom === 'number' && isFinite(m.zoom) ? m.zoom : 16;
    mapa.setView([m.latitud, m.longitud], zoom, { animate: true });
  }

  // Si la WebView cambia de tamaño (teclado, giro), Leaflet recalcula el área visible.
  window.addEventListener('resize', function () { mapa.invalidateSize(); });

  // En modo selección, tocar el mapa devuelve las coordenadas del punto tocado.
  mapa.on('click', function (evento) {
    if (!modoSeleccion) return;
    avisarApp({ tipo: 'punto', latitud: evento.latlng.lat, longitud: evento.latlng.lng });
  });

  // Punto de entrada de los mensajes que envía la app.
  window.recibirMensaje = function (m) {
    if (!m || typeof m.tipo !== 'string') return;
    if (m.tipo === 'negocio') ponerNegocio(m);
    else if (m.tipo === 'dispositivo') ponerDispositivo(m);
    else if (m.tipo === 'ubicaciones') ponerUbicaciones(m);
    else if (m.tipo === 'seleccion') ponerSeleccion(m);
    else if (m.tipo === 'centrar') centrar(m);
    else if (m.tipo === 'modoSeleccion') modoSeleccion = m.activo === true;
  };

  avisarApp({ tipo: 'listo' });
})();
</script>
</body>
</html>`;
