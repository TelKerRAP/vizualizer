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
