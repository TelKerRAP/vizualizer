# XZ Audio Visualizer — video completo usando solo audio

## Uso
1. Descomprime la carpeta.
2. Abre el proyecto en VS Code y ejecútalo con Live Server, o usa `Iniciar-XZ-Clip-Generator.bat` en Windows.
3. Selecciona únicamente tu canción en **01 / MEDIA**. La imagen de fondo es opcional.
4. Baja hasta **06 / VIDEO COMPLETO AUTOMÁTICO**.
5. Pulsa **Generar video de la canción completa** y deja la pestaña abierta hasta que termine.
6. Descarga el archivo desde el enlace que aparecerá al final.

No necesitas añadir clips ni seleccionar una imagen. Si no eliges una imagen, se usa el fondo animado generado por el propio visualizador. El audio se graba en tiempo real junto con el canvas; el programa intenta convertir el resultado a MP4 y conserva WebM si la conversión no está disponible.

La exportación requiere Chrome o Edge actualizado. La conversión MP4 requiere conexión a internet para cargar FFmpeg.wasm. La grabación y la conversión pueden consumir bastante memoria en canciones largas. Esta versión no se ha validado en un navegador real dentro de este entorno; realiza la primera prueba con una canción corta.
