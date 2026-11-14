# Entrega final: lista de comprobación

Prompt C2 (cierre). Comprobación contra la sección 8 de `docs/lineamientos-profesora.md` (entrega
final y sustentación) y la sección 6 (condiciones de uso por el cliente): qué se entrega, dónde
está y qué falta hacer a mano.

Marca: ✅ listo · ⏳ falta hacer a mano · ⚠️ listo con pendientes.

## 1. Qué se entrega y dónde está

| Lo que piden los lineamientos | Dónde está | Estado |
| --- | --- | --- |
| Código fuente completo en repositorio o ZIP | Repositorio de GitHub (`main`), PR #1 a #21 más el de C2 | ⏳ Unir el PR de C2 a `main` |
| Assets | `assets/` (fuentes Poppins e Inter, imágenes, `mapa/leafletHtml.ts`) | ✅ |
| `package.json` y archivo de bloqueo | `package.json`, `package-lock.json` | ✅ |
| Configuración necesaria | `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `supabase/` | ✅ |
| Excluir `node_modules`, cachés y credenciales privadas | `.gitignore`; revisión del historial en C1; paso de secretos del CI | ✅ (si se entrega ZIP, ver sección 3) |
| `.env.template` y cómo obtener los valores | `.env.template`; README, "Configuración del `.env`" | ✅ |
| README: requisitos, instalación, comandos, configuración, acceso al servicio HTTP y pasos para probar en Android | `README.md` (Requisitos, Instalación desde cero, Montaje de Supabase, Configuración del `.env`, Acceso al servicio HTTP, Comandos, Probar el proceso principal con dos teléfonos, APK con EAS) | ✅ |
| Forma reproducible de ejecutar en Android | README (Expo Go) y "Opcional: generar un APK con EAS Build" | ✅ |
| **Informe breve**: cliente y problema, alcance, reglas de negocio, mapa de pantallas, organización del código, matriz cumplida, evidencias de pruebas y límites conocidos | Word `Documentación del proyecto final.docx` (está en la carpeta del proyecto pero lo ignora `.gitignore`: **no va en el repositorio ni en `git archive`**, se entrega aparte) + cambios en `docs/actualizar-informe.md` | ⏳ Pasar los cambios al Word y adjuntarlo a la entrega |
| Matriz de requisitos cumplida | `docs/matriz-requisitos.md` (y sección 8 de `actualizar-informe.md`) | ⚠️ Lista; solo falta probar en el teléfono "Producto no encontrado" (RF-08) |
| Evidencias de pruebas | `docs/pruebas.md` (CP-01 a CP-12), `docs/evidencias/`, revisiones de los PR | ⚠️ Solo queda "Producto no encontrado" de CP-09 (sección 2) |
| Límites conocidos | `docs/limites-conocidos.md`; valores de prueba en `docs/valores-por-confirmar.md` | ✅ |
| Bitácora de avances | `docs/bitacora.md` (F1 a C2) | ⏳ Llenar "Observación del docente" y el PR de C2 |
| Evidencia de la prueba con el cliente y ajuste realizado | `docs/prueba-cliente.md` (guion y plantilla) | ⏳ Hacer la prueba y aplicar al menos un ajuste |
| Demostración en vivo y explicación de cada integrante | `docs/sustentacion.md` | ⏳ Ensayar |

## 2. Qué falta hacer a mano (en orden)

### Antes de la prueba con el cliente

1. ⏳ **Probar "Producto no encontrado" de CP-09** en el teléfono con Expo Go: abrir
   `/producto/abc` y un uuid inexistente (pasos en `docs/pruebas.md`). Es el único caso pendiente.
2. ⏳ Anotar el resultado en `docs/pruebas.md` y en la matriz (RF-08).

### Prueba con el cliente

3. ⏳ Hacer la prueba con `docs/prueba-cliente.md` (dos teléfonos, sin explicar antes) y llenar el
   registro **solo con roles**, sin datos personales.
4. ⏳ Elegir **al menos un ajuste** que salga de la prueba, hacerlo en una rama nueva, registrarlo
   en la sección 6 de `docs/prueba-cliente.md` y agregar su fila en `docs/bitacora.md`.
5. ⏳ Si el cliente confirma valores (IVA, tarifas, franjas, coordenadas…), actualizarlos donde
   dice `docs/valores-por-confirmar.md` y anotarlo.

### Documentos

6. ⏳ **Pasar `docs/actualizar-informe.md` al Word** `Documentación del proyecto final.docx`:
   portada, RF-03, "[Por confirmar con el cliente]", RNF-01/RNF-04 y sección 10 ("teléfono real con
   Expo Go"), RNF-10 y sección 9 (Supabase), sección 7 (árbol real), sección 6 (tres pantallas
   nuevas), sección 8 (usar `docs/matriz-requisitos.md`), sección 10 (usar `docs/pruebas.md`),
   sección 11 (resultado de la prueba con el cliente), sección 12 (límites), decisiones 007 a 009 y
   sección 13 (bitácora, quitando las tres filas "[Pendiente]").
7. ⏳ **Bitácora**: llenar la
   columna **Observación del docente** de cada revisión con lo que dijo la profesora. Decidir si se
   borran las tres filas "[Pendiente]" de los hitos 2, 3 y 4 al final de `docs/bitacora.md` (ya
   quedaron cubiertas por las filas con fecha).

### Antes de entregar

8. ⏳ En `main`: `npm run typecheck` sin errores, `npx expo-doctor` y `npx expo start` sin errores;
   CI en verde.
9. ⏳ Supabase activo el día de la revisión (`docs/sustentacion.md`, "Preparación del día
   anterior").
10. ⏳ Ensayar la demostración y los cambios en vivo de `docs/sustentacion.md`.

## 3. Si se entrega en ZIP

No incluir: `node_modules/`, `.expo/`, `dist/`, **`.env`** (tiene la URL y la llave pública, pero
no debe ir en la entrega), `.git/` si piden solo el código. Sí incluir `.env.template` y
`package-lock.json`. Comprobar con:

```bash
git archive --format=zip --output=../CSE-entrega.zip main
```

`git archive` solo empaqueta lo que está en el repositorio, así que deja fuera lo ignorado.

## 4. Revisión rápida contra la rúbrica del producto final

| Criterio (peso) | Dónde se demuestra | Riesgo |
| --- | --- | --- |
| Proceso principal completo (25 %) | CP-01, `docs/sustentacion.md` 2.2 | Bajo; la parte de la cita no tiene captura (PR #16) |
| Navegación Stack, Tabs, Drawer y ruta dinámica (12 %) | J2, CP-09, CP-12 | CP-09 producto sin probar en el teléfono |
| Componentes, props, estilos y usabilidad (10 %) | J1, J3, fix-filtros | RNF-01 depende de la prueba con el cliente |
| Estado, hooks, contador, cálculo y validaciones (13 %) | CP-07, CP-08, `useCalculoTotal`, `useUbicacion` | Bajo |
| HTTP, Axios, TanStack Query, tipos y mapper (15 %) | F3, F4, `api.ts`, mappers | Bajo |
| Mapa, GPS, permisos y limpieza (10 %) | CP-02 a CP-05 (PR #12) | Bajo; sin captura: ensayarlos para la demostración |
| Pruebas, conservación, entrega y documentación (5 %) | `docs/pruebas.md`, CP-10, este documento | Prueba con el cliente pendiente |
| Sustentación y dominio del código (10 %) | `docs/sustentacion.md` | Ensayo |
