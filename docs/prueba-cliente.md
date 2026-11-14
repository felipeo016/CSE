# Prueba con el cliente

Prompt C2 (cierre). Guion de la sección 11 de `docs/documentacion-proyecto.md` para la prueba de
uso con el cliente, las preguntas de `docs/valores-por-confirmar.md` que conviene hacer ese día y
la plantilla para registrar el resultado.

Los lineamientos (sección 6) piden: registrar la tarea solicitada, el resultado, las dificultades
y **al menos un ajuste derivado de la retroalimentación**, sin divulgar datos personales
innecesarios. Por eso en este documento los participantes se identifican **solo por su rol**: sin
nombres, teléfonos, correos ni direcciones. La ubicación que se use en la prueba no se publica ni
se copia aquí.

## 1. Preparación

- Dos teléfonos con Expo Go y el proyecto abierto (lista completa en `docs/sustentacion.md`,
  "Preparación del día anterior").
- Teléfono del **trabajador** con `trabajador@cse.test`; teléfono del **cliente** con
  `cliente@cse.test`. Las contraseñas las escribe el equipo; no se entregan por escrito.
- Inventario real cargado (hojas OCTUBRE 26 y HILOOK AGOSTO 26).
- Cronómetro y esta plantilla impresa o abierta para anotar.
- Si el participante prefiere no usar su ubicación real, que marque un punto cualquiera en el mapa.

## 2. Guion

### Lo que se dice al empezar

"Queremos ver si la app se entiende sin explicación. No estamos evaluándote a ti sino a la app.
Piensa en voz alta: di qué buscas y qué esperas que pase. Si te quedas atascado más de un minuto,
te ayudamos y lo anotamos."

**No se explica antes cómo usar la app.** Solo se lee la tarea.

### Tarea para el trabajador (teléfono B)

> "Un cliente pidió una cotización de instalación. Búscala, prepárala con productos del
> inventario y envíasela."

Se espera que: encuentre la solicitud en **Cotizaciones** (Solicitada), pulse **Crear
cotización**, ajuste productos y cantidades, revise el total y pulse **Enviar al cliente**.

Antes, el cliente (teléfono A) habrá hecho la solicitud. Si se quiere probar también ese paso:

> "Pide una cotización para instalar cámaras en tu local."

### Tarea para el cliente (teléfono A)

> "Te llegó una cotización. Revísala, acéptala, registra dónde quieres la instalación y agenda la
> visita."

Se espera que: recargue la bandeja, abra la cotización **Nueva**, revise el total, pulse
**Aceptar y comprar**, pulse **Agendar cita**, registre la ubicación en el mapa (el permiso se
pide en ese momento) y agende fecha y franja.

### Cierre del proceso (trabajador)

> "Revisa si el cliente agendó la visita."

Se espera que: encuentre la cita en **Citas** y vea la cotización **Aceptada**.

### Qué observar

| Qué | Cómo se anota |
| --- | --- |
| ¿Completa cada paso sin ayuda? | Sí / Con ayuda (en qué paso) / No |
| ¿Dónde duda o se equivoca? | Pantalla y lo que hizo |
| Tiempo por tarea | Minutos desde que se lee la tarea hasta terminarla |
| ¿Los totales coinciden? | Total que vio el trabajador al enviar = total que vio el cliente = total del pedido |
| ¿Los estados son los esperados? | Solicitada → Nueva → Vista → Aceptada; cita Programada |
| ¿Entiende los mensajes? | Por ejemplo el permiso de ubicación, "Pago simulado", "Por cotizar" |
| ¿Algo queda tapado por el teclado o fuera de pantalla? | Pantalla y campo (RNF-01) |

### Preguntas finales (a cada participante)

1. ¿Qué te costó más?
2. ¿Qué cambiarías?
3. ¿Hubo algún texto o botón que no entendiste?
4. ¿Usarías la app en lugar de lo que hacen hoy (Excel, WhatsApp, llamadas)? ¿Por qué?
5. ¿Te faltó algo para terminar la tarea?

## 3. Preguntas sobre valores por confirmar

Tomadas de `docs/valores-por-confirmar.md`. Se hacen **después** de la prueba de uso, para no
interrumpirla. Son las que más cambian el comportamiento de la app; el resto de la lista puede
quedar para otra reunión.

### Cobro (se cambian en Supabase sin publicar la app)

| Valor hoy | Pregunta | Respuesta |
| --- | --- | --- |
| IVA 19 % sobre (subtotal − descuento) | ¿Cobran IVA? ¿Qué porcentaje y sobre qué valor (con o sin el servicio)? | |
| Instalación 150 000 COP | ¿Cuánto cobran? ¿Es fija o depende del número de cámaras o del lugar? | |
| Mantenimiento 80 000 COP | ¿Cuánto cobran? ¿Fija o por equipo? | |
| Vigencia 15 días | ¿Cuántos días mantienen el precio de una cotización? | |

### Citas y mapa

| Valor hoy | Pregunta | Respuesta |
| --- | --- | --- |
| Lunes a sábado | ¿Qué días atienden visitas? ¿Festivos? | |
| 08–10, 10–12, 14–16, 16–18 | ¿En qué horarios hacen visitas? ¿Cuánto dura una instalación o un mantenimiento? | |
| Sin límite de cupos | ¿Cuántas visitas pueden atender a la misma hora? | |
| Solo el trabajador cambia el estado | ¿El cliente puede cancelar o mover una cita? ¿Con cuánta anticipación? | |
| Coordenadas de prueba | ¿Cuál es la dirección exacta del negocio para el marcador? (no se copia aquí) | |

### Precios, pedidos y productos

| Decisión hoy | Pregunta | Respuesta |
| --- | --- | --- |
| Cliente instalador o final (por defecto final) | ¿Cómo identifican hoy a un instalador? ¿Quién decide el tipo? | |
| El trabajador ve el costo | ¿El trabajador debe ver y editar el costo? | |
| Solo el administrador ve ganancias | ¿El trabajador puede ver ventas y ganancias? | |
| Pedido solo Pendiente | ¿Qué estados manejan (pagado, entregado…) y quién los cambia? | |
| No se reserva inventario en la cotización | ¿Debería reservarse mientras la cotización está vigente? | |
| Stock bajo = 1 a 2 unidades | ¿Desde cuántas unidades consideran que un producto se está agotando? | |
| Autorregistro permitido | ¿Cualquiera puede crear su cuenta o solo el negocio crea clientes? | |

### Excel del inventario (RF-32)

Llevar `docs/depuracion-inventario.md` (tiene hoja y fila de cada caso).

| Caso | Pregunta | Respuesta |
| --- | --- | --- |
| 18 productos con código `SIN-COD-…` | ¿Qué código real tiene cada uno? | |
| 13 códigos repetidos (lotes sumados) | ¿Son lotes del mismo producto? ¿Con qué costo se quedan? | |
| 37 filas sin precio instalador | ¿Cuál es el precio para instalador, o se vende al precio final? | |
| 1 precio instalador menor que el costo | ¿Es un error o lo venden a pérdida? | |
| Marcas deducidas (Dahua como Hikvision) | ¿Venden otras marcas que la app deba aceptar? | |

## 4. Plantilla de registro

Copiar este bloque una vez por prueba. Sin datos personales.

```text
Fecha de la prueba: AAAA-MM-DD
Lugar: (tipo de lugar, por ejemplo "local del negocio"; sin dirección)
Equipo presente: Felipe / Juan Pablo (quién observa y quién anota)

Participantes (solo rol):
  - Trabajador: persona de la empresa que cumple el papel de trabajador
  - Cliente: cliente final representativo
Teléfonos: (tipo de teléfono de cada rol)

Tarea del trabajador: elaborar y enviar una cotización con productos del inventario real.
  ¿Completó sin ayuda?  Sí / Con ayuda en: ____ / No
  Tiempo: ___ min
  Dudas o errores (pantalla y qué pasó):

Tarea del cliente: recibir la cotización, aceptarla, registrar la ubicación y agendar la instalación.
  ¿Completó sin ayuda?  Sí / Con ayuda en: ____ / No
  Tiempo: ___ min
  Dudas o errores (pantalla y qué pasó):

Totales: enviado ____ / visto por el cliente ____ / pedido ____  → ¿coinciden? Sí / No
Estados: Solicitada → Nueva → Vista → Aceptada; cita Programada  → ¿correctos? Sí / No

Resultado general: Completó el proceso / Completó con ayuda / No completó

Dificultades encontradas:
  1.
  2.

Respuestas a las preguntas finales:
  Trabajador:
  Cliente:

Valores confirmados por el cliente (copiar a docs/valores-por-confirmar.md):
```

## 5. Registro de la prueba

| Campo | Valor |
| --- | --- |
| Fecha de la prueba | [Pendiente] |
| Participantes (por rol) | [Pendiente] — trabajador de la empresa y cliente final representativo |
| Tarea solicitada | Trabajador: elaborar y enviar una cotización con el inventario real. Cliente: recibirla, aceptarla, registrar la ubicación y agendar la instalación. |
| Resultado | [Pendiente] |
| Dificultades encontradas | [Pendiente] |
| Ajuste que se hará | [Pendiente] |

## 6. Ajuste derivado de la prueba (obligatorio)

Los lineamientos piden aplicar **al menos un ajuste** que salga de esta prueba. Se elige uno
concreto, pequeño y verificable (por ejemplo un texto que confundió, un botón que no se encontró o
un valor que el cliente confirmó), se hace en un prompt nuevo y se registra aquí y en
`docs/bitacora.md`.

| Campo | Valor |
| --- | --- |
| Observación de la prueba que lo origina | [Pendiente] |
| Ajuste realizado | [Pendiente] |
| Archivos cambiados | [Pendiente] |
| Responsable | [Pendiente] |
| PR | [Pendiente] |
| Cómo se comprobó | [Pendiente] |

Si el cliente confirma valores de cobro, cambiarlos en **Table Editor > parametros_negocio** también
cuenta como ajuste (no requiere publicar la app), pero hay que anotarlo con su evidencia.

Al terminar: copiar el resumen a la sección 11 del Word (`docs/actualizar-informe.md`) y agregar la
fila en la bitácora.
