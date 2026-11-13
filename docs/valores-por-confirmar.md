# Valores por confirmar con el cliente

Prompt C1 (cierre). Lista para llevar a la reunión con el cliente: todos los valores marcados en
el código como `VALOR DE PRUEBA — [Por confirmar con el cliente]` y los casos del Excel que dejó la
depuración del inventario (`docs/depuracion-inventario.md`). Junto a cada uno: el valor que usa hoy
la app, dónde se cambia y qué hay que preguntar.

## 1. Valores de cobro (tabla `parametros_negocio` de Supabase)

La app y el servidor calculan con estos mismos valores. Se cambian en Supabase (**Table Editor >
parametros_negocio**, fila 1) sin publicar una versión nueva de la app. Definidos en
`supabase/migrations/001_esquema.sql`.

| Valor | Hoy | RF | Pregunta para el cliente |
| --- | --- | --- | --- |
| IVA | 19 % sobre (subtotal − descuento) | RF-12, RF-17 | ¿Cobran IVA? ¿Qué porcentaje y sobre qué valor (con o sin el servicio)? |
| Tarifa de instalación | 150 000 COP | RF-12, RF-17 | ¿Cuánto cobran? ¿Es fija o depende del número de cámaras o del lugar? |
| Tarifa de mantenimiento | 80 000 COP | RF-12, RF-17 | ¿Cuánto cobran? ¿Fija o por equipo? |
| Vigencia de la cotización | 15 días | RF-18 | ¿Cuántos días mantienen el precio de una cotización? |

Reglas relacionadas (decisión del equipo, CLAUDE.md):

- Descuento: 0 en el carrito; en la cotización lo escribe el trabajador en pesos. ¿Hay otras
  reglas de descuento (por volumen, por tipo de cliente, tope)?
- No se reserva inventario mientras una cotización está vigente; se revisa al aceptarla. ¿Debería
  reservarse?
- Una cotización enviada no se edita (si cambia algo, se hace una nueva). ¿Están de acuerdo?

## 2. Valores de la app (`src/config/valoresPrueba.ts`)

Se cambian en ese archivo y requieren publicar la app de nuevo.

| Valor | Hoy | RF | Pregunta para el cliente |
| --- | --- | --- | --- |
| Días de atención | Lunes a sábado | RF-27 | ¿Qué días atienden visitas? ¿Festivos? |
| Franjas horarias | 08:00–10:00, 10:00–12:00, 14:00–16:00 y 16:00–18:00 | RF-27 | ¿En qué horarios hacen visitas? ¿Cuánto dura una instalación o un mantenimiento? |
| Cupos por franja | Sin límite | RF-27 | ¿Cuántas visitas pueden atender a la misma hora? |
| Coordenadas del negocio | 4.92261613391541, −75.06546509423036 | RF-23 | ¿Cuál es la dirección exacta del negocio para el marcador del mapa? |
| Umbral de stock bajo (Panel general) | 1 a 2 unidades | RF-35 | ¿Desde cuántas unidades consideran que un producto se está agotando? |

## 3. Reglas de negocio pendientes (decididas por el equipo para esta versión)

| Tema | Decisión de prueba | RF | Pregunta para el cliente |
| --- | --- | --- | --- |
| Precio que ve cada cliente | Cada cliente es instalador o final (por defecto final) y ve y paga el precio de su tipo; el trabajador lo marca en la ficha del cliente. | RF-05, RF-33 | ¿Cómo identifican hoy a un instalador? ¿Quién decide el tipo? |
| Costo para el trabajador | El trabajador y el administrador ven ambos precios y el costo; el cliente nunca. | RNF-06, RF-30 | ¿El trabajador debe ver y editar el costo? |
| Ganancias para el trabajador | Solo el administrador ve el Panel general. | RF-35 | ¿El trabajador puede ver ventas y ganancias? |
| Estados del pedido | Solo Pendiente. | RF-14 | ¿Qué estados manejan (pagado, entregado…) y quién los cambia? |
| Cancelar o reprogramar citas | Solo el trabajador cambia el estado (Programada → Realizada o Cancelada); no se reprograma. | RF-28 | ¿El cliente puede cancelar o mover una cita? ¿Con cuánta anticipación? |
| Eliminar producto | Se desactiva (no se borra) y sus cotizaciones y pedidos quedan intactos. | RF-31 | ¿Está bien así? ¿Debe bloquearse si está en una cotización vigente? |
| Producto sin código | Se permite guardar con una advertencia. | RF-29 | ¿Todo producto debe tener código? |
| Autorregistro de clientes | Permitido desde la app. | RF-02 | ¿Cualquiera puede crear su cuenta o solo el negocio crea clientes? |
| Conservación de ubicaciones | Sin límite de tiempo. | RNF-13 | ¿Cuánto tiempo guardan la dirección de un cliente? |
| Tiempos de carga objetivo | Sin definir. | RNF-03 | ¿Qué tiempo de espera consideran aceptable? |

## 4. Casos del Excel (RF-32)

Detalle fila por fila, con hoja y número de fila, en `docs/depuracion-inventario.md`. Se cargaron
las hojas **OCTUBRE 26** y **HILOOK AGOSTO 26**: 90 filas → **76 productos**.

| Caso | Cuántos | Regla de prueba aplicada | Qué preguntar | Sección del informe |
| --- | --- | --- | --- | --- |
| Productos sin código (discos duros, fuentes, UPS, video balun, cable UTP, cajas…; también palabras como "DISCO DURO" o "FUENTES" en la columna CODIGO) | 22 filas → 18 productos | Código `SIN-COD-001`, `SIN-COD-002`… en el orden del Excel; filas sin código con el mismo nombre = mismo producto. | ¿Qué código real tiene cada uno (referencia del fabricante o código interno)? | 1 |
| Códigos o productos repetidos | 13 (12 con costo distinto), por ejemplo `DS-7208HGHI-M1(C)` ($196.500 y $206.900) y `THC-T120-PC` | Se carga una vez, con la hoja más reciente; si hay varias filas (lotes), inventario = suma y costo y precios de la última fila. | ¿Son lotes del mismo producto? ¿Con qué costo se quedan (último, promedio)? | 2 |
| Sin precio para instalador | 37 filas | Precio instalador nulo: un cliente instalador no puede comprar ni cotizar ese producto hasta registrar el precio. | ¿Cuál es el precio para instalador de cada uno, o se vende al precio final? | 3 |
| Inventarios finales negativos | 2 (FEBRERO 26 fila 65 VIDEO BALUM 8MP: −2; AGOSTO 26 fila 76 CAJA PLASTICA: −2) | Ninguno está en las hojas cargadas; si lo estuviera, se carga en 0. | ¿Qué pasó (venta sin existencias, error de registro)? ¿Cuál es el inventario real? | 4 |
| Precio de venta menor que el costo | 1 (`DS-2CE70DF0T-LPFS(2.8mm)(O-STD)`: costo $85.400, instalador $83.390) | Se carga igual; el formulario de producto muestra la advertencia (RF-30). | ¿Es un error o lo venden a pérdida a los instaladores? | 5 |
| Productos de hojas anteriores que no se cargan | 6 (por ejemplo `DS-7108HGHI-M1`, `CS-H3`, discos duros de 1 y 2 TB) | No se cargan: no están en las hojas más recientes. | ¿Ya no los venden o faltaron en la hoja de octubre? | 5 |
| Marca o categoría deducida | 17 productos | Marca y categoría deducidas del nombre, el código y la hoja; Dahua y los accesorios sin marca quedaron como Hikvision. | Revisar la tabla con el cliente; ¿venden otras marcas (Dahua) que la app deba aceptar? | 6 |

Después de la reunión: ajustar las reglas en `scripts/depurar-inventario.mjs`, correr
`npm run depurar-inventario` y volver a ejecutar `supabase/seed/inventario_inicial.sql` (ver el
límite "Ejecutar dos veces la carga del inventario" en `docs/limites-conocidos.md`).
