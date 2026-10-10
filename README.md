# XZ Audio Visualizer 3.1 — Inicio corregido

## Inicio correcto en Windows
1. Extrae TODO el ZIP en una carpeta.
2. Abre `Iniciar-XZ-Visualizer.bat` con doble clic.
3. Se abrirá `http://localhost:8000`. Mantén abierta la ventana negra del servidor.
4. Carga un MP3/WAV y pulsa **Reproducir** antes de intentar exportar.
5. Añade clips de video y pulsa **Generar video de la canción completa**.

No abras `index.html` directamente con doble clic: usa el archivo BAT para que los módulos JavaScript y las librerías externas puedan cargarse desde HTTP.

## Comprobación
- El JavaScript pasa `node --check`.
- Esta comprobación valida sintaxis, no sustituye una prueba real en el navegador.
- Exportar ocurre en tiempo real y puede tardar tanto como la canción o más.
- Si la app muestra un error, revisa el texto del panel y la consola del navegador (F12 → Console).
