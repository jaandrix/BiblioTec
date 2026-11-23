# Revisión del informe de Gemini (2026-11-23)

He comprobado en GitHub cada repositorio que cita. **Todos existen.** Lo que vale, lo que corrijo y lo que falta.

## Repositorios comprobados

| Repositorio | Estrellas | Licencia | Último cambio | Uso que le daremos |
|---|---|---|---|---|
| MengTo/complete-shelf | 720 | **ninguna** | 2026-08 | Solo como referencia de la máquina de estados de apertura (estantería, detalle, inspección, cierre). Sin licencia no podemos copiar su código. |
| mawise/bookshelf | 432 | MIT | 2024-08 | Referencia y código reutilizable: altura por proporción de la portada, grosor por páginas, giro para ver la contraportada. |
| DevGurav/3d-book-reader | 3 | MIT | 2026-08 | Poco usado; idea de `CanvasTexture` para tapas. Secundario. |
| nadiamariduena/firstpersoncontrol-threejs | 7 | ninguna | 2021-02 | Viejo y sin licencia. No lo necesitamos: los controles en primera persona vienen con Three.js. |
| CloudAI-X/threejs-skills | 4.352 | MIT | 2026-10 | **La skill más útil.** Activa y muy usada. Propongo instalarla. |
| freshtechbro/claudedesignskills | 1.436 | MIT | 2025-11 | Opcional, la parte de React Three Fiber. |
| VoltAgent/awesome-agent-skills | 37.470 | MIT | 2026-11 | Directorio para buscar skills; no se instala entero. |
| PokemonTCG/pokemon-tcg-data | 887 | **ninguna** | 2026-11 | No lo usaremos (ver abajo). |
| simeydotme/pokemon-cards-css | 8.515 | **GPL-3.0** | 2025-12 | Inspiración para el efecto holográfico. Escribiré un efecto propio: copiar su código obligaría a publicar el nuestro con GPL. |

## Lo que confirma y adopto

- **Stack**: Vite + TypeScript + **React Three Fiber + Drei**. Gemini y yo coincidimos; R3F aporta piezas ya hechas (texto, paneles HTML en 3D, carga de modelos, instancias) y la skill de Three.js lo cubre.
- **Rendimiento**: `InstancedMesh` para lomos y cajas, portadas en alta solo al inspeccionar, color dominante calculado una vez y guardado.
- **Estanterías modulares** `pasillo > estantería > balda > hueco`, y ampliar añadiendo módulos.
- **Modelos CC0** de Kenney y Poly Pizza.
- **Supabase** (plan gratuito) y alojamiento estático gratuito.

## Lo que corrijo

1. **Spotify por `PositionalAudio`: no es posible.** Gemini dice que la salida del Web Playback SDK se puede conectar a un altavoz 3D. Por lo que sé, el SDK reproduce por dentro, con el audio protegido (DRM), y no da acceso a la señal. Mantengo el plan: altavoces que suben y bajan el volumen según dónde estés. Lo comprobaré en la práctica al llegar a esa fase.
2. **Cartas: TCGdex, no pokemontcg.io.** Bitácora ya eligió TCGdex a propósito: tiene nombres en español y precios de Cardmarket diarios, mientras que los precios de pokemontcg.io dejaron de actualizarse en noviembre de 2025. Además, cada carta de Bitácora ya guarda su id de TCGdex.
3. **Next.js no hace falta.** Es para webs con servidor; esto es una aplicación estática. Vite es más simple.
4. **Enlace con Bitácora.** No existe una exportación `bitácora.md`. El enlace será el que decidimos: código de conexión + Edge Function de solo lectura.
5. **Rapier (motor de física) de momento no.** Para no atravesar estanterías bastan colisiones con cajas simples. Lo añadiremos si alguna mecánica (empujar el carro, objetos que caen) lo pide.
6. **Licencias.** Gemini no indicó ninguna. Las he comprobado arriba.

## Lo que falta (no bloquea la fase 1)

| Falta | Cuándo hace falta | Plan |
|---|---|---|
| Dirección y descripción de la web de **Sev Sevillano** | Fase 1 (animación de apertura) | Si tienes el enlace, pásamelo y la estudio yo con el navegador. |
| Descripción visual de **TCG Card Shop Simulator** | Fase 1-2 | Me basta con capturas o un vídeo de YouTube que te guste. |
| Imágenes y datos de **producto sellado Pokémon** | Fase 4 | Encargo de DeepSeek + buscar fuentes de imágenes cuando lleguemos. |
| Columnas del **CSV de Libib** | Importador | Con un CSV exportado de tu cuenta (aunque esté vacío) es suficiente. |
| Condiciones vigentes del **modo desarrollo de Spotify** | Fase 6 | Lo compruebo al llegar. Para ti solo, no afecta. |
| Fuente de **lomos reales de DVD/Blu-ray** | Fase 2 | Si no hay, color de la carátula, como en los libros. |

## Conclusión

La investigación basta para empezar. Tengo tus respuestas y la investigación, así que puedo arrancar la fase 1: una sala, una estantería con tus libros reales de Bitácora, moverse y abrir un libro con animación.
