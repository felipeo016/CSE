// =====================================================================================
// depurar-inventario.mjs — Depuración del Excel y carga inicial de productos (Prompt F7, RF-32)
// Responsable: Felipe.
//
// Uso:  npm run depurar-inventario
//
// Lee datos/inventario.xlsx y genera dos archivos:
//   * docs/depuracion-inventario.md       → informe para revisar con el cliente.
//   * supabase/seed/inventario_inicial.sql → SQL que se pega en el SQL Editor de Supabase.
//
// No se conecta a Supabase: solo lee el Excel y escribe archivos. Si el Excel cambia, se vuelve
// a ejecutar y los dos archivos se regeneran (el resultado es siempre el mismo para el mismo Excel).
//
// Reglas de prueba (CLAUDE.md, "Excel (RF-32)") y decisiones del equipo en F7:
//   VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32)
//   * Se cargan las hojas más recientes: la mensual más reciente (OCTUBRE 26) y la HiLook más
//     reciente (HILOOK AGOSTO 26). Los productos que solo están en hojas anteriores no se cargan.
//   * Un código repetido se carga una sola vez, con la hoja más reciente en que aparece. Si en
//     esa hoja hay varias filas (lotes con distinto costo), el inventario es la SUMA de sus
//     inventarios finales y el costo y los precios son los de la última fila.
//   * Sin código → SIN-COD-001, SIN-COD-002… (en el orden de las filas del Excel).
//   * Inventario negativo → 0, y queda en el informe.
//   * Precio instalador vacío (o 0) → nulo.
// =====================================================================================

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RUTA_EXCEL = resolve(RAIZ, 'datos/inventario.xlsx');
const RUTA_INFORME = resolve(RAIZ, 'docs/depuracion-inventario.md');
const RUTA_SQL = resolve(RAIZ, 'supabase/seed/inventario_inicial.sql');

// Columnas del Excel (sección 1 de la documentación). La fila 2 de cada hoja es el encabezado.
const COL = {
  codigo: 1,            // CODIGO
  nombre: 2,            // PRODUCTO
  costo: 3,             // VALOR
  precioInstalador: 4,  // PRECIO INSTALADOR
  precioFinal: 5,       // PRECIO CLIENTE FINAL
  inventarioInicial: 6, // INVENTARIO
  ventaInstalador: 7,   // VENTA INS
  ventaFinal: 8,        // VENTA Cliente final
  inventarioFinal: 9,   // INV/ FINAL (fórmula = INVENTARIO − VENTA INS − VENTA Cliente final)
};
const PRIMERA_FILA_DATOS = 3;

// Meses que aparecen en los nombres de las hojas ("ENERO 26", "HILOOK FEBR 26"...).
const MESES = [
  ['ENE', 1], ['FEB', 2], ['MAR', 3], ['ABR', 4], ['MAY', 5], ['JUN', 6],
  ['JUL', 7], ['AGO', 8], ['SEP', 9], ['OCT', 10], ['NOV', 11], ['DIC', 12],
];

// -------------------------------------------------------------------------------------
// Utilidades de texto y números
// -------------------------------------------------------------------------------------

/** Quita saltos de línea y espacios repetidos. */
function limpiarTexto(texto) {
  return texto.replace(/\s+/g, ' ').trim();
}

/** Para comparar: sin tildes, en mayúsculas y con espacios simples. */
function normalizar(texto) {
  return limpiarTexto(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

/** Valor que muestra la celda: resultado de la fórmula, texto enriquecido o valor simple. */
function valorCelda(celda) {
  const v = celda.value;
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return v;
  if (v instanceof Date) return v;
  if ('result' in v) return v.result ?? null;
  if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('');
  if ('formula' in v || 'sharedFormula' in v) return undefined; // fórmula sin valor guardado
  if ('text' in v) return v.text;
  return null;
}

function texto(celda) {
  const v = valorCelda(celda);
  return v === null || v === undefined ? '' : limpiarTexto(String(v));
}

/** Número de la celda, o null si está vacía. Lanza error si no es numérica. */
function numero(celda, hoja, fila, columna) {
  const v = valorCelda(celda);
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const t = String(v).trim();
  if (t === '') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  throw new Error(`Valor no numérico en ${hoja}, fila ${fila}, columna ${columna}: "${t}"`);
}

/** Fecha de la hoja como número AAAAMM para ordenar (OCTUBRE 26 → 202610). */
function fechaHoja(nombre) {
  const n = normalizar(nombre);
  const anio = n.match(/(\d{2})\s*$/);
  const mes = MESES.find(([prefijo]) => n.split(' ').some((palabra) => palabra.startsWith(prefijo)));
  if (!anio || !mes) return null;
  return (2000 + Number(anio[1])) * 100 + mes[1];
}

const esHojaHiLook = (nombre) => normalizar(nombre).startsWith('HILOOK');

/**
 * Decide si el texto de la columna CODIGO es un código real.
 * En el Excel hay filas con palabras genéricas en lugar de código ("DISCO DURO", "FUENTES",
 * "VIDEO") o con el mismo nombre del producto ("UPS 100VA"): se tratan como sin código.
 */
function revisarCodigo(codigoExcel, nombre) {
  if (codigoExcel === '') return { codigo: null, motivo: 'Vacío' };
  if (!/\d/.test(codigoExcel)) return { codigo: null, motivo: `Palabra genérica ("${codigoExcel}")` };
  if (normalizar(codigoExcel) === normalizar(nombre)) {
    return { codigo: null, motivo: `Igual al nombre ("${codigoExcel}")` };
  }
  return { codigo: codigoExcel, motivo: null };
}

// -------------------------------------------------------------------------------------
// Marca y categoría (deben ser las que acepta supabase/migrations/001_esquema.sql)
// -------------------------------------------------------------------------------------

/** Marca deducida del nombre, del código y de la hoja. `revisar` = no hubo una pista clara. */
function deducirMarca(fila) {
  const nombre = normalizar(fila.nombre);
  const codigo = normalizar(fila.codigo ?? '');
  if (esHojaHiLook(fila.hoja) || nombre.includes('HILOOK')) return { marca: 'HiLook', revisar: null };
  if (nombre.includes('EZVIZ') || codigo.startsWith('CS-') || /^H\d+C\b/.test(codigo)) {
    return { marca: 'EZVIZ', revisar: null };
  }
  if (nombre.includes('HIKVISION') || nombre.includes('HIKVISIN') || /^I?DS-/.test(codigo)) {
    return { marca: 'Hikvision', revisar: null };
  }
  if (nombre.includes('DAHUA')) {
    return { marca: 'Hikvision', revisar: 'El nombre dice Dahua, que no es una marca aceptada' };
  }
  return { marca: 'Hikvision', revisar: 'Sin marca en el Excel: se asignó Hikvision' };
}

// El orden importa: un DVR "con entrada de alarma" es DVR, un kit de alarma es kit y una cámara
// "con sirena" es cámara (las cámaras se revisan antes que las alarmas).
const REGLAS_CATEGORIA = [
  ['dvr', /\b(DVR|NVR)\b/],
  ['kits', /\bKIT\b/],
  ['discos_duros', /DISCO DURO/],
  ['fuentes_ups', /\b(FUENTES?|UPS)\b/],
  ['accesorios_cableado', /\b(BALUM|BALUN|CONECTOR|CAJA|CABLE)\b/],
  ['camaras_wifi_ip', /\b(WIFI|WI-FI|IP|EZVIZ)\b/],
  ['camaras_turbo_hd', /\b(CAMARA|TURBO|TURRET|TORRETA|BALA|MINIBALA|MINIBULLET|DOMO|MINIDOMO)\b/],
  ['alarmas_sensores', /\b(SENSOR|SIRENA|LLAVERO|PANEL|ALARMA)\b/],
];

function deducirCategoria(fila, marca) {
  const codigo = normalizar(fila.codigo ?? '');
  // Se busca en el nombre y en el código (el kit DS-PWA64-KIT-WB solo lo dice en el código).
  const nombre = `${normalizar(fila.nombre)} ${codigo}`;
  if (/\b(DVR|NVR|KIT)\b/.test(nombre)) {
    // DVR y kits se resuelven con las reglas de abajo.
  } else if (codigo.startsWith('DS-2CE') || codigo.startsWith('THC-')) {
    // Familias de cámaras Turbo HD de Hikvision (DS-2CE…) y HiLook (THC-…).
    return { categoria: 'camaras_turbo_hd', revisar: null };
  } else if (marca === 'EZVIZ' || codigo.startsWith('IPC-')) {
    // Cámaras EZVIZ (CS-…) y cámaras IP HiLook (IPC-…) son WiFi o IP aunque el nombre no lo diga.
    return { categoria: 'camaras_wifi_ip', revisar: null };
  }
  for (const [categoria, regla] of REGLAS_CATEGORIA) {
    if (regla.test(nombre)) return { categoria, revisar: null };
  }
  return { categoria: 'accesorios_cableado', revisar: 'Ninguna palabra clave: se asignó Accesorios de cableado' };
}

// -------------------------------------------------------------------------------------
// 1. Leer todas las hojas
// -------------------------------------------------------------------------------------

async function leerExcel() {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(RUTA_EXCEL);

  const hojas = [];
  for (const hoja of libro.worksheets) {
    const fecha = fechaHoja(hoja.name);
    if (fecha === null) throw new Error(`No se reconoce el mes de la hoja "${hoja.name}"`);

    const filas = [];
    for (let r = PRIMERA_FILA_DATOS; r <= hoja.rowCount; r++) {
      const fila = hoja.getRow(r);
      const codigoExcel = texto(fila.getCell(COL.codigo));
      if (normalizar(codigoExcel).startsWith('TOTAL')) continue; // fila de totales
      // Hay filas con el nombre escrito en la columna CODIGO ("UPS 100VA" en ENERO 26): se usa ese texto.
      const nombre = texto(fila.getCell(COL.nombre)) || codigoExcel;
      if (nombre === '') continue; // fila vacía

      const n = (col, nombreCol) => numero(fila.getCell(col), hoja.name, r, nombreCol);
      const inventarioInicial = n(COL.inventarioInicial, 'INVENTARIO') ?? 0;
      const ventaInstalador = n(COL.ventaInstalador, 'VENTA INS') ?? 0;
      const ventaFinal = n(COL.ventaFinal, 'VENTA Cliente final') ?? 0;
      // INV/ FINAL es una fórmula; si el archivo no guardó su resultado, se calcula igual que ella.
      const finalExcel = valorCelda(fila.getCell(COL.inventarioFinal));
      const inventarioFinal = typeof finalExcel === 'number'
        ? finalExcel
        : inventarioInicial - ventaInstalador - ventaFinal;

      const { codigo, motivo } = revisarCodigo(codigoExcel, nombre);
      filas.push({
        hoja: hoja.name,
        fecha,
        fila: r,
        codigoExcel,
        codigo,
        motivoSinCodigo: motivo,
        nombre,
        costo: n(COL.costo, 'VALOR'),
        precioInstaladorExcel: n(COL.precioInstalador, 'PRECIO INSTALADOR'),
        precioFinal: n(COL.precioFinal, 'PRECIO CLIENTE FINAL'),
        inventarioInicial,
        ventaInstalador,
        ventaFinal,
        inventarioFinal,
      });
    }
    hojas.push({ nombre: hoja.name, fecha, hilook: esHojaHiLook(hoja.name), filas });
  }
  return hojas;
}

// -------------------------------------------------------------------------------------
// 2. Depurar: agrupar, unificar y asignar códigos
// -------------------------------------------------------------------------------------

/** Clave del producto: el código si es válido; si no, el nombre normalizado. */
const claveDe = (fila) => (fila.codigo ? `C:${normalizar(fila.codigo)}` : `N:${normalizar(fila.nombre)}`);

const masReciente = (lista) => lista.reduce((a, b) => (b.fecha > a.fecha ? b : a));

function depurar(hojas) {
  // Hojas que se cargan: la mensual más reciente y la HiLook más reciente.
  const hojasCarga = [
    masReciente(hojas.filter((h) => !h.hilook)),
    masReciente(hojas.filter((h) => h.hilook)),
  ];
  const filasCarga = hojasCarga
    .sort((a, b) => b.fecha - a.fecha) // la más reciente primero
    .flatMap((h) => h.filas);

  // Agrupar por producto, en el orden en que aparecen.
  const grupos = new Map();
  for (const fila of filasCarga) {
    const clave = claveDe(fila);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(fila);
  }

  const productos = [];
  const repetidos = [];
  const noCargables = [];
  let consecutivoSinCodigo = 0;

  for (const [clave, filas] of grupos) {
    // Solo cuentan las filas de la hoja más reciente en que aparece el producto.
    const fechaMax = Math.max(...filas.map((f) => f.fecha));
    const usadas = filas.filter((f) => f.fecha === fechaMax);
    const descartadas = filas.filter((f) => f.fecha !== fechaMax);
    const ultima = usadas[usadas.length - 1];

    if (filas.length > 1) repetidos.push({ clave, filas, usadas, descartadas });

    if (ultima.costo === null || ultima.precioFinal === null) {
      noCargables.push({ fila: ultima, motivo: 'Falta el costo o el precio de cliente final' });
      continue;
    }

    const sumaFinal = usadas.reduce((total, f) => total + f.inventarioFinal, 0);
    if (!Number.isInteger(sumaFinal)) {
      throw new Error(`Inventario con decimales en ${ultima.hoja}, fila ${ultima.fila}`);
    }

    let codigo = ultima.codigo;
    if (codigo === null) {
      consecutivoSinCodigo += 1;
      codigo = `SIN-COD-${String(consecutivoSinCodigo).padStart(3, '0')}`;
    }

    const { marca, revisar: revisarMarca } = deducirMarca(ultima);
    const { categoria, revisar: revisarCategoria } = deducirCategoria(ultima, marca);

    productos.push({
      clave,
      codigo,
      codigoAsignado: ultima.codigo === null,
      nombre: ultima.nombre,
      marca,
      categoria,
      revisar: [revisarMarca, revisarCategoria].filter(Boolean).join('. '),
      costo: ultima.costo,
      // 0 en precio instalador se toma como vacío: un precio 0 dejaría el producto gratis.
      precioInstalador: ultima.precioInstaladorExcel ? ultima.precioInstaladorExcel : null,
      precioFinal: ultima.precioFinal,
      inventarioExcel: sumaFinal,
      inventario: Math.max(0, sumaFinal),
      filas: usadas,
    });
  }

  // Productos que están en hojas anteriores pero no en las que se cargan.
  const clavesCargadas = new Set(grupos.keys());
  const antiguos = new Map();
  for (const hoja of [...hojas].sort((a, b) => a.fecha - b.fecha)) {
    if (hojasCarga.includes(hoja)) continue;
    for (const fila of hoja.filas) {
      const clave = claveDe(fila);
      if (!clavesCargadas.has(clave)) antiguos.set(clave, fila); // queda la última aparición
    }
  }

  return { hojasCarga, productos, repetidos, noCargables, antiguos: [...antiguos.values()] };
}

// -------------------------------------------------------------------------------------
// 3. Informe en Markdown
// -------------------------------------------------------------------------------------

const NOMBRES_CATEGORIA = {
  dvr: 'DVR',
  camaras_turbo_hd: 'Cámaras Turbo HD',
  camaras_wifi_ip: 'Cámaras WiFi e IP',
  kits: 'Kits',
  alarmas_sensores: 'Alarmas y sensores',
  discos_duros: 'Discos duros',
  fuentes_ups: 'Fuentes y UPS',
  accesorios_cableado: 'Accesorios de cableado',
};

const pesos = (v) => (v === null ? '—' : `$${v.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`);
const celdaMd = (t) => String(t).replace(/\|/g, '\\|');
const corto = (t, max = 70) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);

function tabla(encabezados, filas) {
  if (filas.length === 0) return '_Ninguno._\n';
  const lineas = [
    `| ${encabezados.join(' | ')} |`,
    `| ${encabezados.map(() => '---').join(' | ')} |`,
    ...filas.map((f) => `| ${f.map(celdaMd).join(' | ')} |`),
  ];
  return `${lineas.join('\n')}\n`;
}

function generarInforme(hojas, resultado) {
  const { hojasCarga, productos, repetidos, noCargables, antiguos } = resultado;
  const nombresCarga = hojasCarga.map((h) => h.nombre);
  const filasCarga = hojasCarga.flatMap((h) => h.filas);
  const porClave = new Map(productos.map((p) => [p.clave, p]));
  const codigoFinal = (fila) => porClave.get(claveDe(fila))?.codigo ?? '—';

  const sinCodigo = filasCarga.filter((f) => f.codigo === null);
  const sinPrecioInstalador = filasCarga.filter((f) => !f.precioInstaladorExcel);
  const negativos = hojas.flatMap((h) => h.filas).filter((f) => f.inventarioFinal < 0);
  const precioBajo = productos.filter(
    (p) => p.precioFinal < p.costo || (p.precioInstalador !== null && p.precioInstalador < p.costo),
  );
  const lotes = repetidos.filter((r) => r.usadas.length > 1);
  const porRevisar = productos.filter((p) => p.revisar !== '');

  const md = [];
  md.push('# Depuración del inventario (RF-32)');
  md.push('');
  md.push('> Archivo generado por `npm run depurar-inventario` (prompt F7). No lo edites a mano: cambia');
  md.push('> el Excel o el script y vuelve a generarlo. Cada caso trae la hoja y la fila del Excel para que');
  md.push('> lo confirmes con el cliente.');
  md.push('');
  md.push('## Resumen');
  md.push('');
  md.push(`- Hojas leídas: ${hojas.length} (${hojas.map((h) => h.nombre).join(', ')}).`);
  md.push(`- Hojas que se cargan: **${nombresCarga.join('** y **')}** (las más recientes, RF-32).`);
  md.push(`- Filas de producto en esas hojas: ${filasCarga.length}.`);
  md.push(`- Productos que se cargan: **${productos.length}** (sin códigos repetidos ni inventarios negativos).`);
  md.push(`- Productos sin código: ${sinCodigo.length} filas → ${productos.filter((p) => p.codigoAsignado).length} productos con código SIN-COD.`);
  md.push(`- Productos o códigos repetidos: ${repetidos.length} (${repetidos.filter((r) => new Set(r.filas.map((f) => f.costo)).size > 1).length} con distinto costo).`);
  md.push(`- Filas sin precio instalador: ${sinPrecioInstalador.length}.`);
  md.push(`- Inventarios finales negativos en todas las hojas: ${negativos.length}.`);
  md.push(`- Marca o categoría por revisar: ${porRevisar.length} productos.`);
  md.push('');
  md.push('### Reglas aplicadas (VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32))');
  md.push('');
  md.push('- Se cargan solo las hojas más recientes. El inventario es el inventario final de la hoja más');
  md.push('  reciente en que aparece cada producto.');
  md.push('- Un código repetido se carga una sola vez, con la hoja más reciente. Si en esa hoja tiene varias');
  md.push('  filas (lotes comprados a distinto costo), el inventario es la **suma** de sus inventarios finales y');
  md.push('  el costo, los precios y el nombre son los de la **última fila** (decisión del equipo en F7).');
  md.push('- Los productos sin código reciben SIN-COD-001, SIN-COD-002… en el orden del Excel. Los productos');
  md.push('  sin código con el mismo nombre se tratan como el mismo producto.');
  md.push('- En la columna CODIGO, una palabra sin números ("DISCO DURO", "FUENTES", "VIDEO") o el mismo nombre');
  md.push('  del producto ("UPS 100VA") no es un código: esas filas se tratan como sin código.');
  md.push('- Un inventario negativo se carga en 0.');
  md.push('- Precio instalador vacío o en 0 queda nulo: el instalador no puede comprar ese producto hasta que');
  md.push('  se registre su precio (la app muestra "no tiene precio registrado para este tipo de cliente").');
  md.push('- Marca y categoría se deducen del nombre, del código y de la hoja (tabla del final).');
  md.push('');

  md.push('## 1. Productos sin código');
  md.push('');
  md.push(`Hojas ${nombresCarga.join(' y ')}. RF-32 dice que se confirme con el cliente qué código asignarles.`);
  md.push('');
  md.push(tabla(
    ['Hoja', 'Fila', 'CODIGO en el Excel', 'Producto', 'Código asignado'],
    sinCodigo.map((f) => [f.hoja, f.fila, f.motivoSinCodigo, corto(f.nombre), codigoFinal(f)]),
  ));

  md.push('## 2. Códigos o productos repetidos');
  md.push('');
  md.push('Cada producto queda una sola vez. "Se usa" indica qué filas forman el producto cargado.');
  md.push('');
  md.push(tabla(
    ['Código cargado', 'Producto', '¿Costo distinto?', 'Hoja', 'Fila', 'Costo', 'Inv. final', 'Se usa'],
    repetidos.flatMap((r) => {
      const distinto = new Set(r.filas.map((f) => f.costo)).size > 1 ? 'Sí' : 'No';
      return r.filas.map((f) => [
        codigoFinal(f), corto(f.nombre, 50), distinto, f.hoja, f.fila, pesos(f.costo), f.inventarioFinal,
        r.usadas.includes(f) ? (f === r.usadas[r.usadas.length - 1] ? 'Sí (precios)' : 'Sí (suma)') : 'No (hoja anterior)',
      ]);
    }),
  ));
  if (lotes.length > 0) {
    md.push('Productos cargados con la suma de varias filas (lotes):');
    md.push('');
    md.push(tabla(
      ['Código', 'Filas', 'Inventario cargado'],
      lotes.map((r) => {
        const p = porClave.get(r.clave);
        return [p?.codigo ?? '—', r.usadas.map((f) => `${f.hoja} f.${f.fila} (${f.inventarioFinal})`).join(' + '), p?.inventario ?? '—'];
      }),
    ));
  }

  md.push('## 3. Productos sin precio instalador');
  md.push('');
  md.push(`Hojas ${nombresCarga.join(' y ')}. Se cargan con precio instalador nulo.`);
  md.push('');
  md.push(tabla(
    ['Hoja', 'Fila', 'Código cargado', 'Producto', 'Valor en el Excel', 'Precio cliente final'],
    sinPrecioInstalador.map((f) => [
      f.hoja, f.fila, codigoFinal(f), corto(f.nombre, 60),
      f.precioInstaladorExcel === 0 ? '0' : 'Vacío', pesos(f.precioFinal),
    ]),
  ));

  md.push('## 4. Inventarios finales negativos (todas las hojas)');
  md.push('');
  md.push('Se registraron más ventas que unidades disponibles. Si la fila es de una hoja que se carga, el');
  md.push('producto queda en 0; si es de una hoja anterior, no afecta la carga, pero hay que confirmarlo.');
  md.push('');
  md.push(tabla(
    ['Hoja', 'Fila', 'Código', 'Producto', 'Inventario', 'Venta inst.', 'Venta final', 'Inv. final', 'En la carga'],
    negativos.map((f) => [
      f.hoja, f.fila, f.codigoExcel || '(vacío)', corto(f.nombre, 50), f.inventarioInicial, f.ventaInstalador,
      f.ventaFinal, f.inventarioFinal, nombresCarga.includes(f.hoja) ? 'Se carga en 0' : 'Hoja anterior: no se carga',
    ]),
  ));

  md.push('## 5. Otros hallazgos para confirmar');
  md.push('');
  md.push('### Precio de venta menor que el costo');
  md.push('');
  md.push('RF-30 pide advertirlo. Se cargan igual, pero conviene revisarlos.');
  md.push('');
  md.push(tabla(
    ['Código', 'Producto', 'Costo', 'Precio instalador', 'Precio cliente final'],
    precioBajo.map((p) => [p.codigo, corto(p.nombre, 50), pesos(p.costo), pesos(p.precioInstalador), pesos(p.precioFinal)]),
  ));
  md.push('### Productos de hojas anteriores que no se cargan');
  md.push('');
  md.push('No aparecen en las hojas más recientes. Se muestra la última hoja en que aparecen.');
  md.push('');
  md.push(tabla(
    ['Hoja', 'Fila', 'Código', 'Producto', 'Inv. final'],
    antiguos.map((f) => [f.hoja, f.fila, f.codigoExcel || '(vacío)', corto(f.nombre, 60), f.inventarioFinal]),
  ));
  md.push('### Filas que no se pueden cargar');
  md.push('');
  md.push(tabla(
    ['Hoja', 'Fila', 'Producto', 'Motivo'],
    noCargables.map(({ fila, motivo }) => [fila.hoja, fila.fila, corto(fila.nombre, 60), motivo]),
  ));

  md.push('## 6. Marca y categoría para revisar a mano');
  md.push('');
  md.push('Deducidas del nombre, del código y de la hoja. Solo se aceptan las marcas Hikvision, EZVIZ y');
  md.push('HiLook y las ocho categorías de RF-07 (`001_esquema.sql`). La columna "Revisar" marca los casos');
  md.push('sin una pista clara. Para corregir uno, cambia la regla en `scripts/depurar-inventario.mjs` o el');
  md.push('producto en la app (Productos del trabajador) después de la carga.');
  md.push('');
  md.push(tabla(
    ['Código', 'Producto', 'Marca', 'Categoría', 'Inventario', 'Revisar'],
    productos.map((p) => [
      p.codigo, corto(p.nombre, 60), p.marca, NOMBRES_CATEGORIA[p.categoria], p.inventario, p.revisar || '',
    ]),
  ));
  md.push('### Productos por categoría');
  md.push('');
  md.push(tabla(
    ['Categoría', 'Productos'],
    Object.entries(NOMBRES_CATEGORIA).map(([c, n]) => [n, productos.filter((p) => p.categoria === c).length]),
  ));

  return md.join('\n');
}

// -------------------------------------------------------------------------------------
// 4. SQL de carga
// -------------------------------------------------------------------------------------

const sqlTexto = (t) => (t === null ? 'null' : `'${t.replace(/'/g, "''")}'`);
const sqlNumero = (n) => (n === null ? 'null' : String(n));

function generarSql(resultado) {
  const { hojasCarga, productos } = resultado;
  const valores = productos
    .map((p) => `  (${[
      sqlTexto(p.codigo), sqlTexto(p.nombre), sqlTexto(p.marca), sqlTexto(p.categoria),
      sqlNumero(p.costo), sqlNumero(p.precioInstalador), sqlNumero(p.precioFinal), sqlNumero(p.inventario),
    ].join(', ')})`)
    .join(',\n');

  return `-- =====================================================================================
-- inventario_inicial.sql — Carga inicial de productos desde el Excel (Prompt F7, RF-32, RNF-15)
--
-- ARCHIVO GENERADO por "npm run depurar-inventario" a partir de datos/inventario.xlsx.
-- No lo edites a mano: cambia el Excel o scripts/depurar-inventario.mjs y vuelve a generarlo.
-- El informe con cada caso para el cliente está en docs/depuracion-inventario.md.
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo el archivo > Run.
-- Requiere 001 a 007 aplicadas. Se ejecuta una vez, después de los datos de prueba.
-- Todo va en una sola transacción: si algo falla, no cambia nada.
--
-- Hojas cargadas: ${hojasCarga.map((h) => h.nombre).join(' y ')}. Productos: ${productos.length}.
-- VALOR DE PRUEBA — [Por confirmar con el cliente] (RF-32): duplicados → hoja más reciente (lotes
-- de la misma hoja: suma del inventario, precios de la última fila); sin código → SIN-COD-001…;
-- negativo → 0; precio instalador vacío → nulo.
--
-- Qué hace con los productos que ya existen (las cotizaciones y pedidos de prueba no se tocan:
-- sus líneas guardan copia del código, nombre y precio):
--   1. Si el código ya existe (por ejemplo, el producto de prueba DS-7204HGHI-M1(C)), actualiza esa
--      fila con los datos del Excel y la marca es_prueba = false. Así conserva su id y las líneas
--      de cotización o pedido que apuntan a ella. La descripción y la imagen se conservan.
--   2. Inserta los productos nuevos.
--   3. Los productos de prueba que no están en el Excel: si una cotización, un pedido o un producto
--      de interés los usa, se desactivan (activo = false); si nadie los usa, se borran.
--   4. Comprueba que no quedan códigos repetidos, inventarios negativos ni productos de prueba
--      activos. Si algo falla, la transacción se deshace.
-- =====================================================================================

begin;

-- Datos depurados del Excel (tabla temporal: desaparece al terminar la transacción).
create temp table carga_excel (
  codigo               text primary key,
  nombre               text not null,
  marca                text not null,
  categoria            text not null,
  costo                numeric(12, 2) not null,
  precio_instalador    numeric(12, 2),
  precio_cliente_final numeric(12, 2) not null,
  inventario           integer not null
) on commit drop;

insert into carga_excel
  (codigo, nombre, marca, categoria, costo, precio_instalador, precio_cliente_final, inventario)
values
${valores};


-- 1. Productos que ya existen con el mismo código (de prueba o creados antes): se actualizan.
update public.productos p
set nombre               = c.nombre,
    marca                = c.marca,
    categoria            = c.categoria,
    costo                = c.costo,
    precio_instalador    = c.precio_instalador,
    precio_cliente_final = c.precio_cliente_final,
    inventario           = c.inventario,
    activo               = true,
    es_prueba            = false
from carga_excel c
where upper(trim(p.codigo)) = upper(trim(c.codigo));


-- 2. Productos nuevos.
insert into public.productos
  (codigo, nombre, marca, categoria, costo, precio_instalador, precio_cliente_final, inventario,
   es_prueba)
select c.codigo, c.nombre, c.marca, c.categoria, c.costo, c.precio_instalador,
       c.precio_cliente_final, c.inventario, false
from carga_excel c
where not exists (
  select 1 from public.productos p where upper(trim(p.codigo)) = upper(trim(c.codigo))
);


-- 3. Productos de prueba que no están en el Excel.
--    3a. Usados en cotizaciones, pedidos o productos de interés: se desactivan.
update public.productos p
set activo = false
where p.es_prueba
  and (   exists (select 1 from public.cotizacion_lineas l            where l.producto_id = p.id)
       or exists (select 1 from public.pedido_lineas l                where l.producto_id = p.id)
       or exists (select 1 from public.cotizacion_productos_interes l where l.producto_id = p.id));

--    3b. Sin ninguna referencia: se borran.
delete from public.productos p
where p.es_prueba
  and not exists (select 1 from public.cotizacion_lineas l            where l.producto_id = p.id)
  and not exists (select 1 from public.pedido_lineas l                where l.producto_id = p.id)
  and not exists (select 1 from public.cotizacion_productos_interes l where l.producto_id = p.id);


-- 4. Comprobaciones (RNF-15). Si una falla, se lanza un error y no se guarda nada.
do $$
declare
  v_repetidos  integer;
  v_negativos  integer;
  v_faltantes  integer;
  v_prueba     integer;
begin
  select count(*) into v_repetidos
  from (select upper(trim(codigo)) from public.productos
        where codigo is not null group by 1 having count(*) > 1) r;

  select count(*) into v_negativos from public.productos where inventario < 0;

  select count(*) into v_faltantes
  from carga_excel c
  where not exists (select 1 from public.productos p
                    where upper(trim(p.codigo)) = upper(trim(c.codigo))
                      and p.activo and not p.es_prueba
                      and p.inventario = c.inventario);

  select count(*) into v_prueba from public.productos where es_prueba and activo;

  if v_repetidos > 0 or v_negativos > 0 or v_faltantes > 0 or v_prueba > 0 then
    raise exception 'Carga cancelada: % códigos repetidos, % inventarios negativos, % productos del Excel sin cargar, % productos de prueba activos',
      v_repetidos, v_negativos, v_faltantes, v_prueba;
  end if;

  raise notice 'Carga correcta: % productos del Excel', (select count(*) from carga_excel);
end;
$$;

commit;


-- Resultado: cuántos productos quedan activos y cuántos de prueba se desactivaron.
-- Esperado: ${productos.length} activos del Excel, 0 de prueba activos.
select count(*) filter (where activo and not es_prueba) as activos_excel,
       count(*) filter (where activo and es_prueba)     as activos_prueba,
       count(*) filter (where not activo and es_prueba) as prueba_desactivados,
       count(*) filter (where not activo and not es_prueba) as otros_inactivos
from public.productos;
`;
}

// -------------------------------------------------------------------------------------
// Programa principal
// -------------------------------------------------------------------------------------

async function main() {
  const hojas = await leerExcel();
  const resultado = depurar(hojas);

  await mkdir(dirname(RUTA_INFORME), { recursive: true });
  await writeFile(RUTA_INFORME, generarInforme(hojas, resultado), 'utf8');
  await writeFile(RUTA_SQL, generarSql(resultado), 'utf8');

  console.log(`Hojas cargadas: ${resultado.hojasCarga.map((h) => h.nombre).join(' y ')}`);
  console.log(`Productos: ${resultado.productos.length}`);
  console.log(`Informe: ${RUTA_INFORME}`);
  console.log(`SQL:     ${RUTA_SQL}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
