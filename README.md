# Biblioteca Conciencia Lingüística

Biblioteca bilingüe del Master Leraar Spaans. Publicación en https://profedanielvr-lgtm.github.io/biblioteca-conciencia-linguistica/.

## Contenido y procedencia

La estructura conserva el orden y los nombres neerlandeses de los 16 dominios del documento Conciencia linguistica Body of Knowledge A3 raster FINAL, disponible en los materiales del programa. Las equivalencias españolas, explicaciones, actividades y comentarios son elaboración didáctica identificada. Hay cuatro páginas adicionales dentro de referencia nominal: se, determinación, concordancia y clíticos. Los ejemplos construidos se distinguen de los fragmentos documentados. Los textos no constituyen nuevas instrucciones de evaluación.

## Arquitectura y edición

Se compararon un CMS desacoplado alojado, como WordPress con API, y un editor gráfico sobre GitHub. El primero ofrece usuarios y edición integrados, pero requiere alojamiento, actualizaciones y administración de la seguridad, con costes de servicio posibles. El segundo aprovecha el repositorio y alojamiento actuales, conserva historial y publicación automática, y no requiere servidor adicional; su dependencia técnica es GitHub y exige configurar una credencial limitada por editor. Se seleccionó la segunda alternativa para esta biblioteca existente. Para acceso institucional único sería necesaria una integración de autenticación adicional.

El contenido está separado en content/library-v2.json; index.html, library.css y library.js presentan la aplicación. La ruta #admin ofrece edición gráfica con campos españoles y neerlandeses, incluidos menús, títulos, instrucciones, glosario, referencias y cuaderno. Los borradores locales no son compartidos ni una copia de seguridad permanente. La vista previa no publica cambios. Los botones de exportación e importación permiten transferir borradores.

Para publicar, una persona con permisos de escritura debe usar una credencial personal de GitHub de alcance limitado a este repositorio, con Contents: Read and write. La credencial permanece en memoria durante esa sesión y no se guarda en el almacenamiento del navegador. GitHub comprueba los permisos de escritura. La biblioteca pública no contiene ninguna contraseña compartida. Las operaciones usan el SHA del archivo para rechazar cambios concurrentes. GitHub Pages publica automáticamente cada commit, con un posible tiempo de espera.

La guía completa de administración se encuentra en la propia biblioteca. Cada publicación crea una versión en el historial de GitHub. Para restaurar una versión anterior se utiliza el historial del archivo de contenido en GitHub.

## Conservación del cuaderno

Se mantienen la clave fontys-spaans-cuaderno-v1, los identificadores y el esquema de datos e intercambio anteriores. El cuaderno sigue siendo local a cada navegador. Los datos inválidos bloquean la escritura para evitar pérdidas.

## Fuentes y validación

El catálogo muestra únicamente referencias marcadas como verificadas. Cambiar la URL o la referencia bibliográfica devuelve el recurso a estado pendiente. La fecha de comprobación se mantiene por recurso. Las fuentes de investigación con acceso restringido están identificadas.

En esta actualización se comprobaron la sintaxis, las rutas bilingües, las 20 páginas, el índice, el cuaderno, la validación del contenido, el escape de texto, la protección frente a URL no segura y el rechazo de publicación no autorizada mediante pruebas automatizadas. No se realizó inspección visual en navegador ni una publicación desde la interfaz con una credencial docente. El diseño incluye reglas responsive y controles semánticos, pero estas comprobaciones no certifican conformidad WCAG completa.

## Herramientas de estudio y búsqueda

La búsqueda incorpora sugerencias nativas, equivalencias entre español y neerlandés, consultas formuladas como preguntas y filtros por tipo de contenido. Los temas sugeridos son una selección editorial, no estadísticas de visitas. Multilingüismo, pluricentrismo y pluralismo lingüístico remiten a los dominios pertinentes del Body of Knowledge; no se equiparan entre sí.

Mi estudio permite guardar temas, ejemplos y fuentes, asignarlos a listas y recuperar la sección consultada. Los datos se conservan en bcl-study-tools-v1, sin modificar la clave del cuaderno anterior. La exportación e importación trasladan favoritos, fichas, listas y notas del corpus. La copia importada reemplaza esos datos tras confirmación. No hay sincronización automática entre dispositivos.

Las fuentes incluyen orientación de lectura, ficha de análisis, copia APA y exportación RIS para Zotero. Los metadatos RIS son editables y deben revisarse antes de usar la referencia en un trabajo. La exportación conserva también la referencia APA en una nota. Las comparaciones explícitas usan ejemplos construidos identificados. La investigación con corpus se guía con una muestra manejable y registro de consulta, filtros y límites; la biblioteca enlaza los corpus oficiales y no extrae resultados automáticamente.

Las comprobaciones adicionales cubren consultas bilingües con y sin tildes, filtros de búsqueda, las fichas de las 17 fuentes, la ruta de corpus, las siete pestañas del editor, guardado y eliminación de favoritos, notas y punto de lectura, validación de copias, migración de borradores editoriales anteriores y salida APA/RIS/DOI. Se mantiene la limitación de no haber realizado una revisión visual interactiva en navegador.

## Estudio crítico y transferencia

Las 20 unidades incluyen teoría ampliada, un caso construido con datos, modelos separados de descripción, explicación y juicio profesional, cuatro preguntas críticas específicas, lectura orientada y una tarea de transferencia a un caso nuevo. Los modelos no son soluciones únicas ni criterios oficiales de evaluación. Las muestras simuladas están identificadas y no representan resultados empíricos.

En cada tema se pueden guardar análisis, postura crítica, decisión docente, pregunta de investigación, preparación de discusión y reflexión sobre comprensión. Estas respuestas forman parte de la copia de Mi estudio y se conservan con los datos anteriores. Añadir al cuaderno solicita elegir LUK y confirmar; añade texto sin borrar lo existente y evita repetir la misma aportación. La preparación de discusión se descarga para compartirla manualmente en el entorno docente. No se publica información de estudiantes.

Para editar estas secciones, abre Profesorado, selecciona el tema y utiliza los campos bilingües de teoría ampliada, caso, preguntas críticas, indagación, transferencia, comprensión y modelos de análisis. Las muestras se editan una por línea; las orientaciones de lectura se editan junto a su fuente. La vista previa permite revisar antes de publicar. Mantén la identificación de datos construidos, comprueba las afirmaciones y vuelve a verificar las fuentes al cambiarlas.

Se añadieron enlaces oficiales comprobados el 9 de octubre de 2026 a Sounds of Speech de University of Iowa, Corpus Val.Es.Co. 3.0 y Transferencia del Centro Virtual Cervantes. Las dos aplicaciones multimedia necesitan JavaScript; su contenido no se copia ni se garantiza disponibilidad de un fragmento determinado. No hay grabaciones de estudiantes sin autorización.

La verificación automatizada incluye presencia bilingüe de las capas críticas, integridad de los casos, guardado de respuestas, recuperación de versiones anteriores y transferencia sin sobrescribir ni duplicar aportaciones al cuaderno. No se realizó una revisión visual interactiva en navegador ni una prueba con estudiantes; queda pendiente contrastar usabilidad y accesibilidad en condiciones reales.

## Del dato al juicio profesional: revisión del 9 de octubre de 2026

La revisión detectó que las preguntas abiertas permitían responder sin mostrar la cadena de razonamiento y que el cuaderno podía incorporar bibliografía disponible como si se hubiese utilizado. Las 20 unidades cuentan ahora con un taller bilingüe de ocho pasos: datos contextualizados, afirmación delimitada, justificación y fuente, explicación alternativa, opciones docentes, decisión fundamentada, transferencia a otro caso y revisión ante nueva evidencia. Cada unidad añade orientación específica, un caso nuevo construido y un modelo comentado. El registro de pasos informa de campos vacíos; no califica automáticamente la calidad del argumento.

Una fuente solo pasa al apartado de fundamentación del cuaderno si se selecciona en el taller y su ficha registra afirmación, localizador, alcance de la consulta y límites. Haber leído solo el resumen debe declararse. La transferencia conserva las notas anteriores y ya no copia toda la bibliografía del tema. Las ocho respuestas y la selección de fuente se incluyen en la copia de Mi estudio.

Se incorporaron 17 referencias verificadas: 16 publicadas entre 2024 y 2026 y un manual general neerlandés de 2022. El catálogo reúne 37 recursos. Las fichas indican referencia APA, DOI cuando está comprobado, acceso, tipo de evidencia, población o ámbito, límites, enlace de verificación y fecha. Se distingue el año del fascículo del año de publicación anticipada. La selección no es una revisión sistemática ni acredita lectura íntegra de todos los libros y artículos. Los registros de comprobación se conservan en sources/research-verification.json.

El profesorado puede editar las cuatro orientaciones del taller por unidad y los textos de los ocho pasos en la pestaña de interfaz, siempre con campos español y neerlandés. En Referencias puede modificar tipo de evidencia, ámbito, alcance de verificación, observaciones editoriales y enlace de comprobación. Antes de marcar una fuente como verificada, hay que revisar estos campos y la referencia.

Las pruebas automatizadas verifican los 20 talleres en ambos idiomas, los ocho pasos, la detección de campos vacíos, la transferencia de la fuente seleccionada con sus límites y la conservación de copias anteriores. No se ha demostrado una mejora del razonamiento con estudiantes reales: sigue pendiente una prueba de uso docente y estudiantil y una revisión visual de accesibilidad.

## Ruta opcional de síntesis crítica

Dentro del taller de cada tema, abre Síntesis crítica de literatura. Formula una pregunta y una hipótesis provisional, documenta la búsqueda y selecciona hasta seis fuentes del catálogo. No se exige completar seis ni encontrar dos bandos. Cada ficha registra la relación con la hipótesis, afirmación, pasaje, parte consultada, tipo de apoyo, método y contexto, y límites. Hay cinco relaciones posibles: apoyo, cuestionamiento, delimitación, explicación alternativa y relación todavía no determinada. Una fuente puede cumplir otra función al revisar la hipótesis.

El recorrido requiere examinar comparabilidad, dialogar entre afirmaciones, identificar vacíos, reformular la hipótesis y justificar una decisión docente con una comprobación en el aula. Las preguntas estratégicas cierran la ruta. El botón de revisión solo informa de campos vacíos, registros incompletos y duplicados; no califica, no determina consenso ni evalúa las fuentes. La biblioteca no genera una síntesis con IA ni accede automáticamente al texto íntegro. El estudiante debe declarar el alcance de su lectura.

Las respuestas se guardan localmente con el resto de Mi estudio, se exportan en su copia y pueden descargarse como texto. Añadir al cuaderno pide confirmación y LUK, mantiene lo anterior y evita repetir aportaciones. Solo pasan a la fundamentación fuentes con todas las notas registradas y una relación seleccionada, deduplicadas por identificador. Cambiar una fuente con notas solicita confirmación antes de vaciar esa ficha. Cambiar la hipótesis no borra el trabajo.

Las instrucciones se editan en Profesorado, Interfaz, campos synthesis y syn, siempre en español y neerlandés. Se mantienen estructura y dominios del Body of Knowledge. La ruta es opcional para no añadir pasos obligatorios a una consulta breve.

Se corrigió una incoherencia de publicación: el sitio lee content/library-v2.json, mientras que la actualización anterior había colocado el contenido ampliado en la raíz. La entrega actual actualiza expresamente la ruta utilizada por la aplicación y la copia de raíz. La comprobación posterior debe verificar content/library-v2.json, no solo la copia de raíz.
