# Panel docente / Docentenpaneel

## Estado de la entrega

La interfaz y el servidor están implementados y probados. GitHub Pages aloja la biblioteca pública, pero no ejecuta este servidor. Hasta que se conecte un servidor HTTPS, `analytics-config.json` mantiene `enabled: false`: no se recogen estadísticas y el panel explica que el servicio está pendiente. No existen datos históricos compartidos. Nunca se incluye una contraseña en JavaScript ni en este repositorio.

De interface en de server zijn gebouwd en getest. GitHub Pages toont de openbare bibliotheek, maar voert deze server niet uit. Totdat een HTTPS-server is verbonden, staat `enabled` op `false`. Er worden dan geen statistieken verzameld. Het paneel toont dat de dienst nog niet actief is. Er zijn geen eerdere gedeelde statistieken.

## Qué mide / Wat wordt geteld

Solo después del consentimiento del visitante: consultas de páginas, búsquedas en el catálogo, clics en fuentes catalogadas y clics en el índice de una página temática. Se agrupa por fecha UTC e idioma. Las búsquedas se cuentan después de un segundo sin escribir y no cada pulsación. Una búsqueda idéntica seguida se cuenta una sola vez en esa pestaña. Los cambios de filtros pueden contar como nueva consulta si cambia la presencia de resultados. Las visitas a edición o al panel docente no cuentan. Las vistas repetidas por un cambio de idioma en la misma página tampoco añaden visitas.

Er wordt alleen geteld na toestemming: paginaweergaven, zoekopdrachten in de catalogus, klikken op bronnen en klikken in het themaoverzicht. De telling is per UTC-dag en taal. Een zoekopdracht telt na één seconde zonder typen. Dezelfde zoekopdracht achter elkaar telt één keer in dat tabblad. Bezoeken aan de editor en het docentenpaneel tellen niet mee.

Solo se transmiten términos presentes en el catálogo. Otras búsquedas se agrupan como «consulta no clasificada» y nunca se envía su texto. El servidor vuelve a comprobar los valores. No se envían URL completas, nombres, identificadores de visitante, IP, notas, respuestas, portafolios ni texto libre. El servicio sí recibe una dirección de red como cualquier servidor web; solo la usa en memoria para limitar abusos y no la guarda en las estadísticas. El proveedor de alojamiento puede conservar sus propios registros: antes de activar, configure su retención, región y acceso según los acuerdos de Fontys. Las estadísticas no son un sistema de evaluación ni una prueba de aprendizaje.

Alleen begrippen uit de catalogus worden verstuurd. Andere zoekopdrachten krijgen het label «niet ingedeeld»; de tekst wordt niet verstuurd. De server controleert de gegevens opnieuw. Er worden geen namen, bezoekersprofielen, aantekeningen of antwoorden verzameld. De netwerkverbinding wordt alleen tijdelijk gebruikt om misbruik te beperken. Controleer ook de loginstellingen, regio en toegang van de hostingprovider volgens de afspraken van Fontys.

## Activación por la persona responsable del servidor

1. Use un servidor o contenedor con Node.js 24, HTTPS y almacenamiento persistente. No hace falta instalar paquetes npm. El proceso no sirve archivos públicos: exponga únicamente esta API detrás de su proxy HTTPS. No aloje la base SQLite dentro de GitHub Pages.
2. Para cada docente autorizado, ejecute `node analytics-server/password.mjs` en un terminal interactivo de confianza. Introduzca dos veces una contraseña personal de al menos 14 caracteres. La herramienta oculta la escritura y genera un hash scrypt. No envíe contraseñas por correo o chat.
3. Configure `TEACHER_ACCOUNTS` como un objeto JSON con nombres de cuenta y hashes, por ejemplo una entrada por docente. Guárdelo en las variables privadas del servidor. El archivo `.env.example` solo documenta nombres y no se carga automáticamente. El servidor se niega a arrancar sin cuentas válidas.
4. Configure `ALLOWED_ORIGINS=https://profedanielvr-lgtm.github.io`, `ANALYTICS_DB` en un disco persistente y `PORT` si es necesario. Mantenga `TRUST_PROXY=false` salvo que un proxy de confianza reemplace la cabecera de IP. La dirección original solo se utiliza para limitar abuso, nunca para estadísticas.
5. Arranque con `node analytics-server/server.mjs`. Para un contenedor, construya desde la raíz de la biblioteca con `docker build -f analytics-server/Dockerfile -t biblioteca-analytics .` y monte un volumen persistente en `/data`, escribible por el usuario `node`. Pase las variables privadas mediante el gestor de secretos de su proveedor. No las copie al Dockerfile.
6. Compruebe `/api/status`. Debe devolver `ready: true`. Compruebe que `/api/dashboard` sin sesión devuelve 401. No desactive CORS ni añada `*`.
7. Edite `analytics-config.json` con la URL HTTPS de la API en `apiBase`, sin `/api` final, y `enabled: true`. Publique ese archivo en GitHub. Esta URL es pública; las contraseñas y los hashes permanecen solo en el servidor.
8. Abra la biblioteca, acepte estadísticas para una prueba, visite un tema y busque «subjuntivo». En «Panel docente» entre con su cuenta y compruebe las cifras. La recogida empieza aquí, no antes. Retire después el consentimiento si esa es su preferencia.

## Gebruik door docenten

Open «Docentenpaneel» onderaan de bibliotheek. Log in met je eigen gebruikersnaam en wachtwoord. Kies 7, 30 of 90 dagen en filter op Spaans of Nederlands. Je ziet bezoeken, zoekopdrachten zonder resultaat, bronnen en gekozen onderdelen. De CSV bevat alle samengevoegde gegevens van de gekozen periode. Er zijn geen individuele studentenoverzichten. Log na gebruik uit. De sessie verloopt na 30 minuten; bij vernieuwen van de pagina moet je opnieuw inloggen.

## Seguridad y mantenimiento

Las contraseñas se verifican con scrypt, sal aleatoria y comparación de tiempo constante. Los tokens son aleatorios, caducan a los 30 minutos y solo permanecen en memoria. La base guarda únicamente contadores agregados. Las consultas SQLite usan parámetros. Los campos libres, las páginas privadas y los identificadores ajenos al catálogo se rechazan. El navegador pide permiso antes de recoger datos y permite retirarlo desde el pie de página. No se utilizan cookies ni identificadores para seguimiento. Las peticiones llevan `no-store` y omiten credenciales ambientales. El login limita intentos por conexión y de forma global. El origen permitido evita llamadas desde otras webs en navegadores; no impide que un bot imite eventos públicos. Por eso las cifras son orientativas y no una auditoría de asistencia.

Para revocar una cuenta o cambiar su contraseña, cambie su entrada de `TEACHER_ACCOUNTS` y reinicie el proceso. Esto revoca todas las sesiones en memoria. Para desactivar la recogida, publique `enabled: false` y detenga la API, porque pestañas antiguas pueden seguir abiertas. La retención es de 90 días y se aplica al recibir peticiones. Haga copias cifradas del volumen, limite el acceso al servidor y aplique la misma retención a esas copias. Mantenga Node.js 24 actualizado. El servicio funciona en un solo proceso con SQLite; para varias réplicas se necesita una base compartida y límites de acceso compartidos.

Después de cambiar los temas, términos o fuentes del catálogo, vuelva a desplegar la copia `library-v2.json` que usa el servidor. Los valores nuevos se rechazan hasta actualizarlo. Cambiar textos de la interfaz no requiere cambiar cuentas o la base de datos. El editor de contenidos y el panel de estadísticas son permisos distintos: la contraseña del panel no concede acceso para publicar cambios en GitHub.

## Comprobación

Ejecute `node --test analytics-server/test.mjs` y `node test.mjs`. Las pruebas cubren login, bloqueo de acceso anónimo, caducidad, cierre de sesión, límites de intentos, CORS, consentimiento, rechazo de datos personales e inyección, persistencia y retención de SQLite, además de las funciones previas de la biblioteca. Ninguna prueba genera datos de ejemplo en producción.
