MÓVIL II   •   LINEAMIENTOS DEL PROYECTO FINAL

Proyecto final de Móvil II

Aplicación funcional para un cliente específico

Tecnologías de trabajo: React Native, TypeScript y Expo. Valor total: 30 % de la nota de la asignatura, distribuido en 15 % por avances realizados en clase y 15 % por la entrega final completa.

1 Propósito del proyecto

Desarrollar una aplicación móvil que resuelva una necesidad concreta del cliente que cada equipo ya seleccionó. El cliente debe poder realizar un proceso útil de principio a fin. La solución debe integrar los contenidos trabajados en clase y demostrar que el equipo comprende, adapta y conecta esas herramientas.

El sector y el problema pertenecen al cliente elegido; los requisitos académicos de este documento son obligatorios. Una interfaz atractiva, un catálogo estático o una copia de los ejercicios de clase con otros nombres no constituyen por sí solos un proyecto completo.

2 Definición del alcance

Identificar al cliente, el usuario principal, el problema actual y el beneficio esperado. Describir cómo realiza hoy el proceso y cómo lo realizará con la aplicación.

Definir un proceso principal completo y al menos dos funciones complementarias relacionadas con él. Precisar qué datos entran, qué reglas se aplican y qué resultado obtiene el usuario.

Presentar un mapa de pantallas y una matriz que relacione cada requisito de este documento con la función, pantalla, archivo y evidencia correspondiente.

Acordar el alcance con el docente durante clase. Los cambios deben conservar la cobertura de los temas obligatorios y quedar registrados.

Ejemplos de orientación

En domicilios, el proceso puede abarcar seleccionar una entrega, consultar su ubicación, calcular un valor y actualizar su estado. En un restaurante, puede abarcar consultar productos, ajustar cantidades, calcular el total y registrar un pedido. Son ejemplos de aplicación de los temas; cada equipo debe resolver las necesidades de su propio cliente.

3 Requisitos técnicos y de navegación

Base tecnológica y organización

Construir la aplicación en React Native con TypeScript y Expo, usando la base y las versiones compatibles trabajadas en clase. Entregar package.json y el archivo de bloqueo de dependencias; los cambios de tecnología deben acordarse con el docente.

Utilizar Expo Router y separar rutas y pantallas, componentes reutilizables, hooks, acceso HTTP, tipos e interfaces, modelos internos y recursos. No concentrar toda la aplicación en un único archivo.

Definir tipos para entidades, propiedades, respuestas de API y resultados de funciones. Evitar any como solución general y corregir los errores que detecte TypeScript.

Navegación obligatoria

Integrar Stack para los flujos y el retroceso, Tabs para secciones frecuentes y Drawer para accesos complementarios. Los tres deben tener una función real y estar conectados dentro de la misma aplicación.

Implementar al menos una ruta dinámica por identificador, que permita abrir el detalle del elemento seleccionado. El detalle debe corresponder al registro pulsado y manejar identificadores inexistentes.

Garantizar un inicio definido, títulos e iconos comprensibles, regreso correcto y acceso a todas las funciones del alcance. No dejar botones sin acción, pantallas de muestra o rutas rotas.

Interfaz y reutilización

Aplicar NativeWind con la configuración trabajada, estilos y colores coherentes, iconos, imágenes y al menos una fuente personalizada. Manejar la carga de recursos y respetar las áreas seguras del dispositivo.

Crear al menos tres componentes reutilizables con props tipadas y usarlos donde corresponda, por ejemplo botón, tarjeta y estado de carga o error. No basta con declararlos sin utilizarlos.

Usar listas y tarjetas para presentar datos, selección o consulta de detalle, y una búsqueda o filtro funcional. Incluir indicadores de carga, resultados vacíos y alternativas cuando falten imágenes.

Mantener texto legible, controles identificables y formularios que no queden ocultos por el teclado. Revisar el funcionamiento en un teléfono Android.

Criterio de integración

No se solicita incluir una calculadora y un contador como ejercicios independientes dentro de un menú. Sus principios deben convertirse en funciones del negocio: cantidades, cupos, unidades, subtotales, cotizaciones u otras operaciones pertinentes. Cada función debe consumir o producir datos utilizados por el proceso principal.

4 Estado lógica y datos remotos

Estado y reglas del negocio

Aplicar useState y useEffect con una finalidad verificable. Separar lógica reutilizable en al menos un hook propio y explicar sus entradas, estado, efectos y resultados.

Usar Zustand para compartir el estado que requieran varias pantallas, siguiendo el enfoque trabajado en mapas. Distinguir ese estado del estado remoto gestionado con TanStack Query.

Incorporar un contador contextual con incremento, decremento o ajuste de cantidades y límites válidos. Su resultado debe modificar una operación real del cliente.

Incorporar un cálculo contextual con al menos dos valores de entrada, reglas explícitas y un resultado usado en la aplicación. Validar vacíos, valores no numéricos y límites; impedir negativos o división por cero cuando corresponda.

Incluir al menos un formulario útil con validaciones y mensajes específicos. Las acciones deben producir un cambio observable y coherente en el proceso principal.

Peticiones HTTP y tratamiento de respuestas

Consumir datos por HTTP con Axios desde un servicio pertinente al cliente. Se deben demostrar, como mínimo, una consulta de listado y otra de detalle por identificador o de información relacionada.

Centralizar baseURL y configuración HTTP en un servicio. Definir interfaces de respuesta y modelos internos; implementar un mapper que adapte la respuesta externa al modelo utilizado por la aplicación.

Gestionar las consultas con TanStack Query mediante hooks, queryKey que identifiquen los recursos y un criterio de caché. Mostrar carga, error, ausencia de resultados y una opción para reintentar.

Usar datos remotos dentro del flujo principal. Una API de películas u otra API sin relación con el cliente no cumple esta integración por el solo hecho de responder.

Conservación de la información

Si el proceso registra pedidos, reservas, solicitudes u otros cambios que el cliente necesita conservar, estos deben persistir y poder consultarse después de cerrar y volver a abrir la aplicación. El equipo debe documentar el mecanismo elegido y sus límites. Un arreglo en memoria, Zustand sin persistencia o la caché temporal de consultas no equivalen por sí solos a almacenamiento permanente.

No se exige desarrollar un backend propio completo como tema adicional. Puede utilizarse un servicio disponible o una solución sencilla apropiada al alcance. Si se promete intercambio entre dispositivos, debe existir almacenamiento compartido; guardarlo solo en un teléfono no cumple esa promesa. Un mock puede apoyar el desarrollo, pero no sustituye las peticiones reales en la entrega final.

5 Mapas ubicación y permisos

Todos los proyectos deben integrar el trabajo de mapas de las partes 1 y 2: OpenStreetMap y Leaflet dentro de una WebView, con expo-location. El mapa debe aportar al proceso del cliente, por ejemplo mostrar un establecimiento, un punto de atención, un destino o una ubicación de servicio.

Mostrar un punto relacionado con el cliente y su marcador. Las coordenadas fijas de Dosquebradas del ejercicio deben sustituirse por las que correspondan al caso.

Solicitar y comprobar el permiso de ubicación en primer plano; diferenciar la ubicación del cliente de la posición real del dispositivo.

Incluir una acción para obtener y centrar la ubicación actual, además de controles para activar, pausar y reanudar el seguimiento mientras se utiliza la función.

Gestionar permiso denegado, regreso desde ajustes, GPS no disponible y fallos de carga. Ofrecer mensajes comprensibles y permitir continuar usando las secciones que no necesitan GPS.

Liberar las suscripciones al dejar de utilizarlas. No mantener seguimiento innecesario al salir de la función.

No se exige seguimiento en segundo plano, optimización de rutas, navegación giro a giro ni cálculo de distancia vial. No se debe presentar una línea recta como si fuera una ruta real. Si el caso no requiere rastreo continuo, puede implementarse el seguimiento mientras el usuario consulta el mapa y finalizarlo al salir.

6 Condiciones de uso por el cliente

Completar el proceso principal con datos representativos del cliente, resultados correctos y confirmación de las acciones. No dejar operaciones importantes simuladas sin identificar.

Informar cuando no hay conexión y evitar confirmaciones falsas de envío o registro. Recuperar el uso normal cuando el servicio vuelva a estar disponible.

Proporcionar una forma reproducible de ejecutar la app en Android y probarla con el cliente. No se exige publicar en una tienda; entregar un instalador si se genera o instrucciones completas de ejecución con Expo y sus requisitos.

Realizar una prueba con el cliente o usuario representativo. Registrar la tarea solicitada, el resultado, las dificultades y al menos un ajuste derivado de su retroalimentación, sin divulgar datos personales innecesarios.

Configuración y límites

Entregar .env.template cuando haya configuración externa y explicar cómo obtener los valores. No incluir credenciales privadas en el repositorio. Las variables EXPO_PUBLIC se incorporan al cliente y no deben tratarse como secretos. Autenticación, pagos y funciones avanzadas solo serán exigibles si forman parte del alcance acordado; no reemplazan los temas de clase.

7 Avances realizados en clase

Este componente vale 15 puntos porcentuales de la nota de la asignatura. Se evalúa el desarrollo observado y demostrado durante las clases destinadas al proyecto, no únicamente los archivos presentados al final.

El trabajo realizado fuera de clase puede complementar el producto final, pero no reemplaza la evidencia de avance en el aula ni otorga retroactivamente la nota de una revisión no demostrada. Las situaciones justificadas se tramitan con el docente conforme a las reglas académicas aplicables.

| **Hito** | **Evidencia que se demuestra en clase** |
| --- | --- |
| 1 Definición y base | Cliente y problema, alcance, matriz inicial, mapa de pantallas, proyecto ejecutable y primeras rutas. |
| 2 Interfaz y lógica | Stack, Tabs y Drawer conectados; componentes, props, contador, cálculo, formulario y estado compartido. |
| 3 Datos y ubicación | Consultas HTTP, tipos, mapper, hooks y TanStack Query; mapa, GPS y tratamiento de permisos. |
| 4 Integración y ajustes | Proceso completo, conservación de datos necesaria, pruebas de fallos, retroalimentación y correcciones. |

Los hitos describen la secuencia de trabajo; no equivalen necesariamente a cuatro clases. El docente comunicará las fechas y distribuirá las revisiones según el tiempo disponible.

Registro de cada revisión

Cada equipo debe mantener una bitácora con fecha, objetivo de clase, tarea realizada, responsable, evidencia o commit, dificultad encontrada, observación del docente y siguiente paso. Cada integrante debe ejecutar y explicar la parte que desarrolló. La bitácora y el historial respaldan la revisión; no sustituyen la demostración en clase.

Rúbrica de avances

| **Criterio** | **Peso del componente** |
| --- | --- |
| Progreso funcional demostrado durante las clases | 40 % |
| Aplicación correcta de los temas y solución de dificultades | 30 % |
| Participación y explicación de los integrantes | 20 % |
| Bitácora y atención a observaciones del docente | 10 % |
| Total de avances equivalente al 15 % de la asignatura | 100 % |

La valoración se consolida sobre las revisiones programadas y su evidencia. La entrega final no borra las observaciones ni reemplaza el registro de avances.

8 Entrega final y sustentación

Este componente vale el otro 15 % de la asignatura. Se entrega una versión completa, coherente con el alcance acordado y utilizable por el cliente.

Código fuente completo en repositorio o ZIP, con assets, package.json, archivo de bloqueo y configuración necesaria. Excluir node_modules, cachés y credenciales privadas.

README con requisitos, instalación, comandos de ejecución, configuración, acceso al servicio HTTP y pasos para probar el proceso principal en Android.

Informe breve con cliente y problema, alcance, reglas de negocio, mapa de pantallas, organización del código, matriz de requisitos cumplida, evidencias de pruebas y límites conocidos.

Bitácora de avances y evidencia de la prueba de uso con el cliente o usuario representativo, incluyendo los ajustes realizados.

Demostración en vivo del proceso completo. Cada integrante debe explicar navegación, estado, hook propio, peticiones, mapper, cálculos y permisos; el docente podrá solicitar un cambio breve sobre el código presentado.

Rúbrica del producto final

| **Criterio** | **Peso** |
| --- | --- |
| Solución del problema y proceso principal completo | 25 % |
| Navegación Stack Tabs Drawer y ruta dinámica | 12 % |
| Componentes props estilos y usabilidad | 10 % |
| Estado hooks contador cálculo y validaciones | 13 % |
| HTTP Axios TanStack Query tipos y mapper | 15 % |
| Mapa GPS permisos y limpieza de suscripciones | 10 % |
| Pruebas conservación de datos entrega y documentación | 5 % |
| Sustentación y dominio del código | 10 % |
| Total del producto final equivalente al 15 % de la asignatura | 100 % |

Aplicación de la evaluación

En cada criterio se asigna entre 0 y 5 según evidencia: 5, cumplimiento completo y explicado; 4, cumplimiento con fallas menores; 3, cumplimiento parcial con limitaciones relevantes; 2, funcionamiento escaso o inestable; 1, evidencia mínima; 0, ausencia o imposibilidad de verificarlo. Se pondera cada criterio por su peso. No se otorga cumplimiento por capturas si la función no opera durante la revisión; una falla se atribuye al criterio afectado sin descontarla dos veces por el mismo motivo.

Si A es la nota de avances y F la del producto final, ambas entre 0 y 5, el aporte a la nota definitiva es 0,15 × A + 0,15 × F. Ejemplo: A = 4,0 y F = 4,5 aportan 1,275 puntos sobre la definitiva de 5,0. El proyecto ocupa 30 puntos porcentuales del curso, no dos componentes de 15 % dentro de ese 30 %.

Proyecto final de Móvil II   |   1