# Segundo parcial · Explora

GUÍA DEL ESTUDIANTE | SESIÓN 2 DE 2 | 120 MINUTOS | 50 PUNTOS

> Texto convertido de `Explora/doc/Explora_GUIA_SESION_2.docx` (sin la imagen `guia.jpeg`).

## El aplicativo que van a completar

Explora — Directorio de lugares de interés. En la primera sesión ustedes construyeron un catálogo navegable; ahora deben convertir esa base en un explorador de lugares con consulta de ficha y mapa individual. El aplicativo está pensado para visitante que desea conocer lugares de la ciudad.

No comiencen desde cero: reutilicen los cuatro registros reales del archivo local de este ejercicio: Parque Central, Mirador, Museo Local y Sendero Verde. Conserven sus imágenes, tarjetas, navegación Stack / Drawer / Tabs y detalle por id.

## ¿Qué verá y podrá hacer el usuario al terminar esta sesión?

1. Abrir el catálogo desarrollado en la sesión 1 y seguir viendo los cuatro elementos y sus imágenes.
2. Escribir una búsqueda o seleccionar una categoría y observar cómo cambia el listado: por ejemplo, buscar «Mirador» o filtrar por «Naturaleza». La consulta debe funcionar con todos los registros, no con una respuesta escrita a mano.
3. Elegir cualquier tarjeta y ver la ficha del elemento correcto con nombre, descripción y categoría; una ruta con id inexistente debe producir una respuesta comprensible y no una pantalla rota.
4. Pulsar una acción de ubicación desde esa ficha y ubicar en el mapa el sitio turístico seleccionado. El mapa utiliza Leaflet y OpenStreetMap dentro de WebView; debe incluir marcador y ventana informativa con el nombre correcto.
5. Regresar del mapa a la ficha y al catálogo; seguir pudiendo abrir Drawer y Tabs sin perder lo realizado en la sesión 1. Incorporar una respuesta háptica en una acción real.

## Ejemplo de demostración ante el docente

Abrir Explora → mostrar cuatro tarjetas → realizar una búsqueda o filtro → tocar un elemento → verificar sus datos → abrir su mapa → mostrar marcador y nombre → regresar → navegar por Tabs y Drawer. Repetir con otro registro para demostrar que los datos y coordenadas son dinámicos.

Alcance: el objetivo es una ampliación funcional del proyecto existente, no añadir servicios remotos, autenticación, persistencia nueva ni funcionalidades no solicitadas. El mapa necesita acceso a Internet para cargar Leaflet/teselas; los datos e imágenes de los registros siguen siendo locales.

## Continuidad obligatoria

Se trabaja sobre el código exacto de Explora entregado al terminar la sesión 1. NO se parte de un proyecto nuevo. La app debe seguir mostrando el catálogo, las Tabs, el Drawer y los detalles de la primera sesión.

Al inicio, mostrar al docente el proyecto anterior ejecutándose y verificar los archivos que ya se desarrollaron.

## Ampliaciones solicitadas — 50 puntos

- **B1 (10 pt, 25 min):** ampliar la pantalla de detalles: recuperar id desde Expo Router, buscar el registro correcto en los datos manejados por el hook y mostrar descripción y categoría; gestionar un id inexistente.
- **B2 (10 pt, 20 min):** crear búsqueda por nombre o filtro por categoría. El listado debe reaccionar a una entrada o selección del usuario; no se aceptan listados duplicados ni condiciones codificadas para un solo caso.
- **B3 (15 pt, 35 min):** agregar ruta de mapa desde el detalle elegido; transmitir sus coordenadas y nombre como parámetros, comprobar números válidos y renderizar mapa Leaflet 1.9.4 con teselas OpenStreetMap en WebView, marcador y popup. Las coordenadas provienen del registro seleccionado.
- **B4 (5 pt, 10 min):** añadir respuesta háptica a una interacción real de la aplicación y un estado visual claro.
- **B5 (10 pt, 30 min):** prueba integral y sustentación: inicio → catálogo → detalle → mapa → atrás, navegación Tabs/Drawer y filtro; ambos integrantes explicarán por separado un archivo o flujo funcional.

## Requisitos técnicos

Conservar Expo SDK 57, NativeWind 4.2.7 y Tailwind CSS 3.4.17. Mantener separación por responsabilidad: datos en data, lógica en hooks, interfaz reutilizable en components y rutas en app.

Usar Leaflet/OpenStreetMap dentro de WebView. Internet se permite solamente para descargar dependencias autorizadas si el docente lo indica y para cargar los recursos del mapa; no se autoriza consulta de soluciones externas durante el parcial.

## Entregables

Entregar un ZIP nuevo del mismo proyecto, sin node_modules ni .expo. El docente comparará con el ZIP de sesión 1. La aplicación anterior no debe perder funcionalidades.
