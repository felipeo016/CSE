// =====================================================================================
// verificar-seguridad.mjs — Comprobación de seguridad contra Supabase (Prompt C1)
// Responsable: Felipe.
//
// Uso (PowerShell, en la carpeta del proyecto):
//   $env:CSE_CLAVE_CLIENTE = "contraseña de cliente@cse.test"
//   npm run verificar-seguridad
//
// Inicia sesión con la cuenta de cliente de prueba y hace, por HTTP y con Axios, las mismas
// peticiones que haría alguien por fuera de la app con ese token:
//   1. Catálogo (productos_catalogo): ningún producto trae costo ni ganancia (CP-11, RNF-06).
//   2. Tabla productos: el cliente no la puede leer (lista vacía).
//   3. Cotizaciones (vista del cliente y tabla, con sus líneas): sin costo ni ganancia (RNF-06).
//   4. Pedidos con sus líneas y costos guardados (009): sin costo; pedido_lineas_costo vacía.
//   5. Ganancias (ventas_y_ganancias): "Acceso no autorizado".
//   6. Modificar un producto (PATCH): no cambia ninguna fila (RNF-05).
//   7. Crear un producto (POST): rechazado por RLS (RNF-05).
// Si además se define CSE_CLAVE_TRABAJADOR, compara: el trabajador SÍ recibe el costo (así se
// sabe que la prueba 1 no pasa solo porque la columna no existe para nadie).
//
// Variables:
//   EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY → se leen del .env (como la app).
//   CSE_CLAVE_CLIENTE (obligatoria) y CSE_CLAVE_TRABAJADOR (opcional) → SOLO en la terminal.
//     Nunca las escribas en el .env, en este archivo ni en Git.
//   CSE_CORREO_CLIENTE y CSE_CORREO_TRABAJADOR (opcionales) → por defecto cliente@cse.test y
//     trabajador@cse.test.
//
// No modifica datos: el PATCH reescribe el nombre que el producto ya tiene y, si la seguridad
// fallara y el POST creara un producto, queda desactivado y se avisa para borrarlo.
// Termina con código 1 si alguna comprobación falla (sirve para scripts y CI).
// =====================================================================================

import axios from 'axios';

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const LLAVE_PUBLICA = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const CORREO_CLIENTE = process.env.CSE_CORREO_CLIENTE ?? 'cliente@cse.test';
const CLAVE_CLIENTE = process.env.CSE_CLAVE_CLIENTE ?? '';
const CORREO_TRABAJADOR = process.env.CSE_CORREO_TRABAJADOR ?? 'trabajador@cse.test';
const CLAVE_TRABAJADOR = process.env.CSE_CLAVE_TRABAJADOR ?? '';

// Nombres de campo que el cliente nunca debe recibir (RNF-06).
const CAMPOS_PROHIBIDOS = ['costo', 'costo_unitario', 'ganancia'];

if (!URL_SUPABASE || !LLAVE_PUBLICA) {
  console.error('Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en el .env.');
  process.exit(1);
}
if (!CLAVE_CLIENTE) {
  console.error('Falta la contraseña del cliente de prueba. En PowerShell:');
  console.error('  $env:CSE_CLAVE_CLIENTE = "la contraseña"; npm run verificar-seguridad');
  process.exit(1);
}

// Misma configuración que src/services/api.ts: apikey siempre; Bearer solo con el token.
const api = axios.create({
  baseURL: URL_SUPABASE,
  timeout: 15000,
  headers: { apikey: LLAVE_PUBLICA, 'Content-Type': 'application/json' },
  // Se revisan todas las respuestas a mano: un 403 es justamente lo que se espera en algunas.
  validateStatus: () => true,
});

let fallos = 0;
let avisos = 0;

function ok(texto) {
  console.log(`  [OK]    ${texto}`);
}
function falla(texto) {
  fallos += 1;
  console.log(`  [FALLA] ${texto}`);
}
function aviso(texto) {
  avisos += 1;
  console.log(`  [AVISO] ${texto}`);
}

/** Busca en cualquier nivel de la respuesta (filas y listas embebidas) un campo prohibido. */
function camposProhibidos(valor, ruta = '') {
  if (Array.isArray(valor)) {
    return valor.flatMap((elemento, i) => camposProhibidos(elemento, `${ruta}[${i}]`));
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clave, hijo]) => [
      ...(CAMPOS_PROHIBIDOS.includes(clave) ? [`${ruta}.${clave}`] : []),
      ...camposProhibidos(hijo, `${ruta}.${clave}`),
    ]);
  }
  return [];
}

/** Inicia sesión y devuelve los encabezados con el token del usuario. */
async function iniciarSesion(correo, clave) {
  const respuesta = await api.post('/auth/v1/token?grant_type=password', {
    email: correo,
    password: clave,
  });
  if (respuesta.status !== 200 || !respuesta.data?.access_token) {
    throw new Error(`No se pudo iniciar sesión con ${correo} (HTTP ${respuesta.status}).`);
  }
  return { Authorization: `Bearer ${respuesta.data.access_token}` };
}

/** GET que debe responder 200 con una lista; devuelve la lista o null si falló. */
async function leerLista(ruta, encabezados, descripcion) {
  const respuesta = await api.get(ruta, { headers: encabezados });
  if (respuesta.status !== 200 || !Array.isArray(respuesta.data)) {
    falla(`${descripcion}: respuesta inesperada (HTTP ${respuesta.status}).`);
    return null;
  }
  return respuesta.data;
}

/** Comprueba que una lista no trae costo ni ganancia en ningún nivel. */
function revisarSinCosto(lista, descripcion) {
  if (lista === null) return;
  const encontrados = camposProhibidos(lista);
  if (encontrados.length > 0) {
    falla(`${descripcion}: trae ${encontrados.slice(0, 3).join(', ')}.`);
  } else if (lista.length === 0) {
    aviso(`${descripcion}: no hay filas para revisar (sin datos no se puede comprobar).`);
  } else {
    ok(`${descripcion}: ${lista.length} fila(s) sin costo ni ganancia.`);
  }
}

async function main() {
  console.log(`Supabase: ${URL_SUPABASE}`);
  console.log(`\nCliente de prueba: ${CORREO_CLIENTE}`);
  const cliente = await iniciarSesion(CORREO_CLIENTE, CLAVE_CLIENTE);
  ok('Inicio de sesión del cliente.');

  // 1. Catálogo (CP-11, RNF-06).
  const catalogo = await leerLista('/rest/v1/productos_catalogo?select=*', cliente, 'Catálogo');
  revisarSinCosto(catalogo, 'Catálogo (productos_catalogo)');

  // 2. La tabla productos (que sí tiene costo) no se le entrega al cliente.
  const tabla = await leerLista('/rest/v1/productos?select=*', cliente, 'Tabla productos');
  if (tabla !== null) {
    if (tabla.length === 0) ok('Tabla productos: el cliente recibe una lista vacía.');
    else falla(`Tabla productos: el cliente recibe ${tabla.length} fila(s).`);
  }

  // 3. Cotizaciones: la vista de la bandeja y la tabla con sus líneas.
  revisarSinCosto(
    await leerLista('/rest/v1/cotizaciones_cliente?select=*', cliente, 'Bandeja'),
    'Cotizaciones (cotizaciones_cliente)',
  );
  revisarSinCosto(
    await leerLista('/rest/v1/cotizaciones?select=*,cotizacion_lineas(*)', cliente, 'Cotizaciones'),
    'Cotizaciones con líneas (tabla)',
  );

  // 4. Pedidos con líneas, y los costos guardados de cada venta (009).
  revisarSinCosto(
    await leerLista('/rest/v1/pedidos?select=*,pedido_lineas(*)', cliente, 'Pedidos'),
    'Pedidos con líneas',
  );
  const costos = await api.get('/rest/v1/pedido_lineas_costo?select=*', { headers: cliente });
  if (costos.status === 200 && Array.isArray(costos.data) && costos.data.length === 0) {
    ok('Costos de las ventas (pedido_lineas_costo): el cliente recibe una lista vacía.');
  } else if (costos.status === 404) {
    aviso('pedido_lineas_costo no existe: falta ejecutar la migración 009.');
  } else {
    falla(`Costos de las ventas: el cliente recibe datos (HTTP ${costos.status}).`);
  }

  // 5. Ganancias: solo el administrador.
  const ganancias = await api.post(
    '/rest/v1/rpc/ventas_y_ganancias',
    { desde: null, hasta: null },
    { headers: cliente },
  );
  if (ganancias.status >= 400 && ganancias.data?.hint === 'ACCESO_NO_AUTORIZADO') {
    ok('Ganancias (ventas_y_ganancias): "Acceso no autorizado".');
  } else {
    falla(`Ganancias: el cliente no fue rechazado (HTTP ${ganancias.status}).`);
  }

  // 6. Modificar un producto (RNF-05). RLS no deja al cliente ver ni editar filas de productos:
  //    el PATCH responde sin filas cambiadas. Se reescribe el mismo nombre, así no cambia nada.
  const producto = catalogo?.[0];
  if (!producto) {
    aviso('Modificar producto: el catálogo está vacío, no hay un producto para probar.');
  } else {
    const cambio = await api.patch(
      `/rest/v1/productos?id=eq.${producto.id}`,
      { nombre: producto.nombre },
      { headers: { ...cliente, Prefer: 'return=representation' } },
    );
    const filas = Array.isArray(cambio.data) ? cambio.data.length : 0;
    if (cambio.status >= 400 || filas === 0) {
      ok(`Modificar producto "${producto.nombre}": rechazado (0 filas cambiadas, HTTP ${cambio.status}).`);
    } else {
      falla(`Modificar producto: el cliente cambió ${filas} fila(s).`);
    }
  }

  // 7. Crear un producto (RNF-05). Esperado: HTTP 403, código 42501 (row-level security).
  const codigoPrueba = `VERIF-SEG-${Date.now()}`;
  const alta = await api.post(
    '/rest/v1/productos',
    {
      codigo: codigoPrueba,
      nombre: 'Verificación de seguridad (borrar)',
      marca: 'EZVIZ',
      categoria: 'kits',
      costo: 1,
      precio_cliente_final: 1,
      inventario: 0,
      activo: false,
    },
    { headers: { ...cliente, Prefer: 'return=minimal' } },
  );
  if (alta.status >= 400) {
    ok(`Crear producto: rechazado (HTTP ${alta.status}${alta.data?.code ? `, ${alta.data.code}` : ''}).`);
  } else {
    falla(`Crear producto: el cliente lo creó. Borra en Supabase el producto ${codigoPrueba}.`);
  }

  // Comparación opcional: el personal sí recibe el costo.
  if (CLAVE_TRABAJADOR) {
    console.log(`\nComparación con el trabajador: ${CORREO_TRABAJADOR}`);
    const trabajador = await iniciarSesion(CORREO_TRABAJADOR, CLAVE_TRABAJADOR);
    const productos = await leerLista('/rest/v1/productos?select=id,costo&limit=1', trabajador, 'Productos');
    if (productos && productos.length > 0 && 'costo' in productos[0]) {
      ok('El trabajador sí recibe el costo: la comprobación del cliente es significativa.');
    } else if (productos) {
      aviso('El trabajador no recibió productos con costo; revisa los datos de prueba.');
    }
  } else {
    console.log('\n(Opcional) Define CSE_CLAVE_TRABAJADOR para comparar con el trabajador.');
  }

  console.log(`\nResultado: ${fallos} falla(s), ${avisos} aviso(s).`);
  process.exit(fallos > 0 ? 1 : 0);
}

main().catch((error) => {
  const sinRespuesta = axios.isAxiosError(error) && !error.response;
  console.error(sinRespuesta ? 'No hay conexión con Supabase.' : `Error: ${error.message}`);
  process.exit(1);
});
