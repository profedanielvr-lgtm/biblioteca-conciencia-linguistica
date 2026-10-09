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
