# XZ Audio Visualizer 2.0

Aplicación local HTML/CSS/JavaScript con estética anime/cyberpunk de Xiaraki Zusu.

## Mejoras de la versión 2.0
- Detección reactiva de transitorios de graves para pulsos visuales.
- Presets: XZ Gothic, Cyberpunk Neon, Anime Opening y Dark Fantasy.
- Transiciones automáticas entre cuatro estados visuales.
- Letras sincronizadas con marcas temporales introducidas manualmente.
- Exportación MP4 con FFmpeg.wasm, selector de 30/60 FPS y opción compacta.
- Formatos de canvas 16:9 y 9:16.

## Ejecutar
1. Descomprime el ZIP.
2. Abre la carpeta en Visual Studio Code.
3. Instala la extensión Live Server.
4. Clic derecho en `index.html` → **Open with Live Server**.
5. Carga audio e imagen, elige preset/formato y reproduce.
6. Para letras, escribe una línea por fila con formato `segundos | texto`, por ejemplo `12.5 | Bajo la lluvia de neón`, y pulsa **Aplicar letras**.
7. Pulsa **Grabar y exportar MP4**. Al terminar la canción se convierte y aparece el enlace de descarga.

## Limitaciones conocidas
- La detección de beats es heurística basada en cambios de energía de graves; no es separación de batería ni análisis musical semántico.
- Las transiciones automáticas cambian el estado/etiqueta y el tratamiento visual, no generan escenas de video nuevas ni reemplazan automáticamente el fondo.
- Las letras requieren marcas temporales manuales; no incluye transcripción automática.
- La grabación ocurre en tiempo real; la conversión requiere recursos de memoria y conexión para cargar FFmpeg.wasm. Para canciones largas, la memoria del navegador puede limitar la exportación.
- El selector compacto convierte el archivo a 720p horizontal; el canvas vertical se mantiene con su proporción original y puede requerir ajuste manual en una futura mejora.
- La exportación MP4 depende del soporte de MediaRecorder/WebAssembly del navegador. Usa Chrome o Edge actualizado.
- Usa únicamente música e imágenes sobre las que tengas derechos o permiso.


## Corrección de letras — v2.0.1
Formatos admitidos:
- `12.5 | Texto de la línea` (segundos)
- `01:12.5 | Texto de la línea` (minutos:segundos)

Pulsa **Aplicar letras** después de editar. Las letras aparecen desde su marca temporal hasta la siguiente y se dibujan sobre la viñeta para mejorar el contraste. La sincronización sigue siendo manual; no incluye transcripción automática.


## Corrección de sincronización de letras (v2.0.2)
- El módulo acepta ahora el formato LRC estándar: `[00:12.50] Texto`.
- También acepta `00:12.50 | Texto` y `12.5 | Texto`.
- Incluye un control de desfase de -10 a +10 segundos para corregir letras que entran antes o después.
- Para sincronización precisa, los tiempos de cada línea deben corresponder al momento real en que se canta. El control de desfase corrige un desplazamiento global, no errores distintos entre líneas.


## v2.0.3 — Calibración de desfase global
- Se amplió el rango del desfase a -60…+60 segundos.
- Se añadieron controles de ajuste fino ±0.1 s y un campo numérico editable.
- Los cambios se aplican en tiempo real mientras se reproduce el audio, sin volver a aplicar las letras.
- Convención: valor positivo retrasa la letra; valor negativo la adelanta.
- Esta herramienta corrige un desfase constante. Si el error cambia a lo largo de la canción, las marcas de tiempo individuales deben revisarse.


## v3.0.0 — XZ Clip Generator
- Añade clips manuales mediante inicio/final en `mm:ss` o segundos.
- Incluye detección heurística de secciones/frases basada en las letras (marcadores como coro/estribillo y líneas repetidas o destacadas). Las sugerencias requieren revisión manual; no se presenta como detección acústica real de coros.
- Permite editar nombre, tiempos, selección y previsualizar cada fragmento.
- Exporta clips seleccionados a MP4 en vertical 9:16, horizontal 16:9 o ambos; integra audio capturado, visualizador reactivo y letra según reloj del audio.
- Ofrece descarga individual y ZIP de los MP4.
- La exportación usa MediaRecorder en tiempo real y FFmpeg.wasm + JSZip desde CDN, por lo que requiere navegador moderno, conexión al cargar bibliotecas y mantener la pestaña abierta.
- La sincronización del texto usa el tiempo actual del audio más el desfase global configurado.
- No se afirma que la exportación esté probada en un navegador real: debe validarse localmente con un clip corto antes de una exportación larga.


## v3.0.1 — Clip Fix
- Las sugerencias automáticas ahora quedan seleccionadas por defecto para evitar que el usuario pulse exportar con cero clips seleccionados.
- Mensajes de error más claros si no hay clips seleccionados o el audio no avanza.
- Se incluye `Iniciar-XZ-Clip-Generator.bat` para Windows, que sirve la app por HTTP local en `http://localhost:8000`. Es preferible a abrir `index.html` directamente con doble clic cuando el navegador bloquea módulos o recursos CDN.
- Flujo recomendado para validar: añade manualmente un clip de 0 a 10 segundos, marca un solo formato y exporta. Esta versión aún requiere validación en el navegador del usuario; no se declara probada la conversión real.


## v3.0.2 — Export diagnostics
- Corrige la secuencia de búsqueda del audio: el listener `seeked` se instala antes de cambiar `currentTime`, evitando perder el evento y quedarse sin generar video.
- Añade límites de espera para la búsqueda y el cierre de MediaRecorder, para mostrar un error concreto en lugar de quedarse bloqueado.
- La conversión FFmpeg especifica el formato de salida MP4 y presenta mensajes de progreso por etapa.
- Prueba sugerida: un clip de 5–10 segundos, un solo formato. Esta entrega no se declara probada en navegador real; los mensajes ahora ayudarán a identificar el siguiente punto de fallo.


## v3.0.3 — Grabación primero, conversión después
- Diagnóstico de los archivos compartidos por el usuario: el exportador cargaba FFmpeg antes de iniciar la grabación de cualquier clip. Si la importación/CDN/WASM fallaba, no se generaba ningún video.
- Ahora graba primero el fragmento en WebM con MediaRecorder; solo después intenta convertirlo a MP4.
- Si FFmpeg no carga o falla la conversión, conserva el WebM ya grabado y muestra un enlace de descarga en vez de descartar el video.
- El ZIP incluye cada archivo generado con su extensión real (.mp4 o .webm). Si falla la librería ZIP, mantiene disponibles los enlaces individuales.
- Se validó la sintaxis con Node.js. No se pudo validar la reproducción/exportación en navegador en este entorno; prueba un clip de 5 segundos primero.
