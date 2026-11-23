# Encargo para Gemini PRO (complemento a la investigación)

> Pega este documento a Gemini **junto con** tus instrucciones originales ("Para GEMINI"). Esto no las sustituye: concreta qué necesita Claude, que será quien programe, y en qué formato, para que no haga falta repetir la búsqueda.

---

Hola, Gemini. Soy Claude y voy a programar este proyecto. Para que tu investigación me ahorre trabajo de verdad, te concreto qué necesito. Prioriza **precisión y enlaces comprobados** sobre cantidad: un enlace que no existe o una licencia mal indicada me hace perder más tiempo que no tener el dato.

## Contexto técnico ya decidido (orienta la búsqueda)

- Será una **web** (no un ejecutable): **Three.js** con TypeScript y Vite, posiblemente React Three Fiber. Busca recursos para ese ecosistema; Unity, Unreal o Godot solo si aportan modelos o ideas reutilizables.
- Backend: **Supabase**.
- Vista en primera persona, estilo **low-poly** con colores vivos, inspirado en *TCG Card Shop Simulator*.
- Las portadas ya las obtenemos de Open Library, Google Books, TMDB, TVmaze y Steam. Las cartas Pokémon, de **TCGdex** (api.tcgdex.net).
- Proyecto personal y sin ánimo de lucro, pero se publicará en internet: **las licencias importan**.

## Reglas para cada recurso que cites

Para cada proyecto, librería, modelo o API, da siempre:

1. Nombre y **enlace directo** (repositorio de GitHub si existe).
2. **Licencia exacta** (MIT, CC0, CC-BY 4.0, GPL, "solo uso personal", desconocida...). Si no la encuentras, escribe "licencia no encontrada"; no la supongas.
3. **Última actividad** (fecha del último commit o versión) y estrellas si es GitHub.
4. **Qué pieza concreta nos sirve** y por qué, en una o dos frases.
5. Si exige atribución, el **texto de atribución** que piden.

## Bloque 1. Proyectos parecidos al nuestro

Busca en GitHub y en la web proyectos de:

- Bibliotecas, estanterías o colecciones en 3D en el navegador (busca términos como "3D bookshelf three.js", "virtual library webgl", "book spine generator", "3D media collection", "game collection 3D", "bookshelf react-three-fiber").
- Visores 3D de colecciones de cartas, vinilos o videojuegos ("3D card collection viewer", "vinyl shelf three.js", "game library 3D").
- Paseos virtuales en primera persona hechos con Three.js ("first person controls three.js example", "virtual museum three.js", "3D portfolio walk").
- Simuladores de tienda o almacén con mecánica de coger y colocar objetos, aunque sean de Unity o Godot (para estudiar la mecánica).
- Alternativas abiertas a Libib (gestores de colección autoalojados: por ejemplo Koillection, Calibre-web, BookLore, Jellyfin, etc.), por su modelo de datos y sus integraciones.

Para los **5 mejores** de este bloque, explica cómo están hechos: qué librerías usan, cómo cargan y colocan los objetos, cómo resuelven la cámara y los controles, y qué partes del código serían reutilizables.

## Bloque 2. Piezas técnicas sueltas

Busca la mejor opción (y una alternativa) para cada pieza:

1. Controles en primera persona para Three.js en escritorio (PointerLockControls y alternativas) y en móvil (joystick virtual: nipplejs u otros).
2. Física ligera y colisiones para no atravesar estanterías (Rapier, cannon-es, three-mesh-bvh...). Indica cuál es más ligera para una escena sencilla.
3. Texto nítido en 3D para los lomos (troika-three-text, three-mesh-ui, SDF...).
4. Dibujar miles de objetos iguales con buen rendimiento (InstancedMesh, BatchedMesh, ejemplos).
5. Efecto de pantalla CRT de fósforo verde para un terminal dentro de la escena o en 2D (shaders de CRT, proyectos tipo "cool-retro-term" en web, xterm.js con estilo retro).
6. Efecto holográfico de cartas Pokémon en web (por ejemplo el proyecto "pokemon-cards-css" de simeydotme y similares en 3D/shader).
7. Extraer el color predominante de una imagen en el navegador (color-thief, fast-average-color, node-vibrant...).
8. Animaciones de cámara y de objetos (GSAP, theatre.js, maath, react-spring...).
9. Detección de clic o toque sobre objetos 3D y resaltado (raycasting, outline/postprocesado).
10. Lectura de códigos de barras ISBN con la cámara del móvil desde la web.
11. Sonido 3D posicional en Three.js (PositionalAudio).

## Bloque 3. Imágenes y datos de cada tipo de objeto

Para cada tipo, la mejor fuente de **imagen** y de **datos**, si necesita clave, límites de uso y si permite enlazar la imagen directamente:

- Libros: portada, número de páginas, ISBN, saga, dimensiones físicas si existen (Open Library, Google Books, ISBNdb, Hardcover.app...).
- Películas y series: carátula, **imagen del lomo o carátula completa de DVD/Blu-ray** si existe alguna fuente (por ejemplo bases de datos de carátulas de Blu-ray), duración, reparto.
- Videojuegos: carátula, **portada de caja por plataforma**, saga/franquicia (IGDB, RAWG, TheGamesDB, SteamGridDB, ScreenScraper...).
- Consolas: imágenes o **modelos 3D libres** de consolas (Sketchfab con licencia CC, Poly Pizza...).
- Cartas Pokémon: confirma qué ofrece TCGdex (imágenes por idioma, resolución, si indica holo/reverse) y compara con pokemontcg.io.
- **Producto sellado Pokémon** (sobres, cajas de sobres, Elite Trainer Box, latas, colecciones especiales): cualquier fuente de imágenes o datos (bases de datos de precios, PriceCharting, Cardmarket, TCGplayer, wikis como Bulbapedia). Es la pieza más difícil; investiga a fondo.
- Discos de música (para más adelante): MusicBrainz y Cover Art Archive, Discogs.

## Bloque 4. Recursos gráficos 3D gratuitos

Bibliotecas de modelos, texturas y sonidos **con licencia libre** útiles para una biblioteca/almacén low-poly: estanterías, carros, mesas, cajas de cartón, ordenador antiguo de tubo, altavoces, tocadiscos, lámparas, plantas, suelos, paredes, ventanas. Empieza por Kenney, Quaternius, Poly Pizza, Poly Haven, ambientCG, OpenGameArt, Sketchfab (filtrando CC0 y CC-BY), freesound.org. Para cada uno, indica **qué packs concretos** sirven, con enlace.

## Bloque 5. Referencias visuales

1. **TCG Card Shop Simulator**: describe con detalle su estilo (paleta, iluminación, materiales, cómo se ven las estanterías, los expositores de cartas, las cajas, la interfaz, la cámara y cómo se cogen y colocan objetos). Enlaza vídeos de YouTube o galerías donde se vea bien. Indica qué motor usa.
2. **La web de Sev Sevillano** con la biblioteca de temas musicales: encuentra la **dirección exacta**, y describe paso a paso la animación (qué se ve en reposo, qué pasa al pasar el ratón, al hacer clic, cuánto dura, cómo se cierra). Si puedes, identifica con qué tecnología está hecha (inspeccionando el código o por créditos de la web).
3. **Libib**: resume su modelo de datos (qué campos guarda por libro, película, juego), cómo organiza bibliotecas y etiquetas y su formato de exportación CSV con las columnas exactas.

## Bloque 6. Spotify (confirmar condiciones vigentes)

1. Condiciones actuales del **Web Playback SDK**: ¿exige Premium? ¿funciona en móvil (iOS Safari, Android Chrome)?
2. Límites del **modo desarrollo** de una app de Spotify (número máximo de usuarios) y requisitos actuales para salir de él.
3. ¿Se puede pasar el audio del SDK por la Web Audio API (para sonido 3D) o lo impide el DRM?
4. Proyectos de GitHub que integren Spotify en una escena 3D o en un juego web.

## Bloque 7. Skills y herramientas para Claude

Busca skills gratuitas para Claude (Claude Code, formato `SKILL.md`) y servidores MCP útiles para este proyecto: Three.js, React Three Fiber, WebGL/shaders, desarrollo de juegos web, Blender (por ejemplo servidores MCP que permiten a Claude manejar Blender), optimización de modelos glTF, Supabase, diseño de interfaces de juego. Para cada una: enlace, qué hace, licencia y si parece mantenida. Indica también listas recopilatorias ("awesome-claude-skills" y similares).

## Formato de entrega

Un **único documento Markdown** con esta estructura, en español:

```
# Investigación biblioteca 3D
## 0. Resumen ejecutivo (10-15 líneas: lo más importante y tus recomendaciones)
## 1. Proyectos parecidos
## 2. Piezas técnicas
## 3. Imágenes y datos por tipo de objeto
## 4. Recursos gráficos 3D y sonido
## 5. Referencias visuales
## 6. Spotify
## 7. Skills y herramientas para Claude
## 8. Tabla de créditos (nombre, enlace, licencia, texto de atribución)
## 9. Dudas y cosas que no has podido confirmar
```

Usa tablas donde haya listas de recursos. No incluyas código largo; con enlazar el ejemplo basta. Si un apartado no da resultados útiles, dilo en una línea y sigue.
