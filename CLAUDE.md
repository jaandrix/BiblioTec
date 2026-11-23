# BiblioTec: contexto para Claude

Biblioteca 3D jugable en el navegador, conectada (solo lectura) con Bitácora (`C:\Users\jandr\Documents\GitHub\agenda`). Lee `docs/planificacion/06-decisiones.md` antes de decidir nada: ahí está lo que el usuario ya eligió (solo escritorio, primera persona, cuentas propias, Supabase aparte, TCGdex para cartas...).

## Arquitectura

- Vite + TypeScript + React Three Fiber. `npm run dev`, `npm run build` (estático, `base: './'`).
- `src/estado.ts`: almacén mínimo (`dentro`, `apuntado`, `abierto`, `guia`, `terminal`, `menuOrden`, `config`) con `useSyncExternalStore`. Lo que se lee en cada fotograma va por `leerEstado()`, no por React. `config` (criterio y muebles extra por estantería) se guarda en localStorage hasta que haya cuentas.
- `src/escena/registro.ts`: mallas de libros, cámara, mando de PointerLock y giro de inspección compartidos entre escena e interfaz.
- `src/escena/distribucion.ts`: `construir()` agrupa los libros por género en estanterías (secciones), les da muebles en orden de sitios (isla que mira a la entrada, su otra cara, pared del fondo), ordena con `src/libros/orden.ts` y coloca cada libro en su hueco empezando por la balda a la altura de los ojos. Solo se dibujan los muebles en uso: ampliar añade uno.
- `src/terminal/comandos.ts`: intérprete del ordenador retro (buscar, ir, donde, estanterias, ordenar, ampliar, estadisticas...). `src/ui/Terminal.tsx` es su pantalla; `src/escena/Terminal3D.tsx`, el mueble y el viaje de la cámara.
- Pruebas: `npm test` (ordenación).
- `src/escena/Libro.tsx`: cada libro es una caja; caras +x portada, -x contraportada, +z lomo. Animación abrir/cerrar con línea de tiempo propia (sale de la balda y luego vuela a la cámara) y recolocación en cascada al reordenar. La portada en alta solo se carga al abrir.
- `src/libros/color.ts`: color dominante de la portada (caché en localStorage) y color de texto legible. `lomo.ts`: textura del lomo, mismo diseño para todos.
- En desarrollo, `window.__bibliotec` expone estado y cámara para probar sin pointer lock.

## Convenciones

- Textos de interfaz en minúscula y con punto final, como Bitácora. Poppins.
- Sin comentarios que describan qué hace el código; solo los porqués.
- Todo recurso externo usado va a `CREDITOS.md`.
- Commits en español; se publica directo en `main`.
