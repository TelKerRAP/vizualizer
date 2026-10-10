# XZ Audio Visualizer 3.1 — Montaje automático de videoclip

## Funcionalidad añadida
- Carga una canción (MP3/WAV/OGG) como audio principal.
- Añade varios clips de video (formatos que admita el navegador, como MP4 o WebM).
- Alterna los clips automáticamente con detección básica de golpes musicales y un corte de respaldo periódico.
- Al cargar clips, el canvas muestra únicamente el video, sin espectro, partículas, títulos ni letras superpuestas.
- Exporta la duración completa de la canción a 1080p/30 FPS por defecto, usando la grabación del navegador.
- Intenta convertir el WebM grabado a MP4 mediante FFmpeg.wasm; si la conversión no está disponible, conserva un WebM descargable.

## Uso
1. Abre `index.html` en un servidor local o publica la carpeta en tu hosting. Para módulos ES y FFmpeg, se recomienda un servidor local/HTTPS.
2. Carga la canción.
3. Selecciona varios clips de video.
4. Elige `Estándar · 1080p` y `30 FPS`.
5. Pulsa `Generar video de la canción completa` y espera a que aparezca el enlace de descarga. Mantén la pestaña abierta y evita bloquear el equipo.

## Límites conocidos
- La selección de cortes es heurística y usa los picos de graves detectados durante la reproducción, con un corte de respaldo; no es una edición semántica basada en escenas o letra.
- El renderizado ocurre en tiempo real en el navegador: una canción de 4 minutos tarda aproximadamente 4 minutos o más en grabarse, además del tiempo de conversión.
- La conversión MP4 depende de que el navegador pueda descargar y cargar FFmpeg.wasm. Si falla, el sistema intenta conservar un archivo WebM.
- No se ha validado aún en todas las versiones de navegador ni con todos los códecs de video.
