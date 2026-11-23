# Créditos

BiblioTec se apoya en el trabajo de otras personas. Gracias.

## Código y tipografías

| Recurso | Enlace | Licencia | Dónde se usa |
|---|---|---|---|
| Three.js | https://threejs.org | MIT | Motor 3D de toda la escena |
| React Three Fiber y Drei | https://github.com/pmndrs/react-three-fiber, https://github.com/pmndrs/drei | MIT | Escena 3D con React (`src/App.tsx`, `src/escena/`) |
| postprocessing y N8AO | https://github.com/pmndrs/postprocessing, https://github.com/N8python/n8ao | Zlib / CC0 | Oclusión, brillo y viñeta en calidad alta (`src/App.tsx`) |
| Supabase JS | https://github.com/supabase/supabase-js | MIT | Cuentas y nube (`src/sincronizar.ts`) |
| Poppins | https://fonts.google.com/specimen/Poppins | OFL | Toda la interfaz |
| VT323 | https://fonts.google.com/specimen/VT323 | OFL | Letra del ordenador retro |

## Modelos y sonidos

| Recurso | Enlace | Licencia | Dónde se usa |
|---|---|---|---|
| Furniture Kit, de Kenney (sillón, lámpara de pie, mesita, plantas, cajas de cartón) | https://kenney.nl/assets/furniture-kit (copia en https://opengameart.org/content/furniture-kit) | CC0 | `public/recursos/modelos/`, convertidos de OBJ a GLB con `scripts/obj-a-glb.mjs`; rincón de lectura, plantas y cajas de la entrada (`src/escena/Atrezo.tsx`) |
| RPG Audio, de Kenney (pasos y sonidos de libro) | https://kenney.nl/assets/rpg-audio (copia en https://opengameart.org/content/50-rpg-sound-effects) | CC0 | `public/recursos/sonidos/`: abrir, cerrar, pasar y dejar un libro, y pasos (`src/sonido.ts`) |

Las texturas de madera, suelo, pared y alfombra no son descargadas: se dibujan por código (`src/escena/texturas.ts`).

## Datos e imágenes de terceros (enlazados, no redistribuidos)

Las portadas y las imágenes de cartas son de sus autores y editoriales. BiblioTec no las guarda en el repositorio ni las vuelve a publicar: las pide al servicio original cada vez que hacen falta.

| Servicio | Enlace | Qué aporta | Condiciones |
|---|---|---|---|
| Open Library | https://openlibrary.org | Datos y portadas de libros | Datos abiertos de Internet Archive; las portadas, de sus titulares |
| Wikipedia y Wikimedia Commons | https://www.wikipedia.org | Carátulas de películas, series y videojuegos | Según cada archivo |
| TCGdex | https://tcgdex.dev | Cartas Pokémon, logos de set y precios de Cardmarket | API libre; las imágenes son de The Pokémon Company |

## Referencias

Estudiadas sin copiar su código: [MengTo/complete-shelf](https://github.com/MengTo/complete-shelf), [mawise/bookshelf](https://github.com/mawise/bookshelf).

Inspiración: Libib, TCG Card Shop Simulator y la web de Sev Sevillano.

Pokémon y sus cartas son marcas de Nintendo, Creatures, GAME FREAK y The Pokémon Company. BiblioTec es un proyecto personal sin ánimo de lucro y no tiene relación con ellas.
