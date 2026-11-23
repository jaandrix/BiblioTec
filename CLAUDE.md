# BiblioTec: contexto para Claude

Biblioteca 3D jugable en el navegador, conectada (solo lectura) con Bitácora (`C:\Users\jandr\Documents\GitHub\agenda`). Lee `docs/planificacion/06-decisiones.md` antes de decidir nada: ahí está lo que el usuario ya eligió (solo escritorio, primera persona, cuentas propias, Supabase aparte, TCGdex para cartas...).

## Arquitectura

- Vite + TypeScript + React Three Fiber. `npm run dev`, `npm run build` (estático, `base: './'`).
- `src/estado.ts`: almacén mínimo (`dentro`, `apuntado`, `abierto`) con `useSyncExternalStore`. Lo que se lee en cada fotograma va por `leerEstado()`, no por React.
- `src/escena/registro.ts`: mallas de libros, cámara, mando de PointerLock y giro de inspección compartidos entre escena e interfaz.
- `src/escena/distribucion.ts`: medidas de sala y muebles (metros), colocación de libros en huecos y cajas de choque.
- `src/escena/Libro.tsx`: cada libro es una caja; caras +x portada, -x contraportada, +z lomo. Animación abrir/cerrar con línea de tiempo propia (sale de la balda y luego vuela a la cámara). La portada en alta solo se carga al abrir.
- `src/libros/color.ts`: color dominante de la portada (caché en localStorage) y color de texto legible. `lomo.ts`: textura del lomo, mismo diseño para todos.
- En desarrollo, `window.__bibliotec` expone estado y cámara para probar sin pointer lock.

## Convenciones

- Textos de interfaz en minúscula y con punto final, como Bitácora. Poppins.
- Sin comentarios que describan qué hace el código; solo los porqués.
- Todo recurso externo usado va a `CREDITOS.md`.
- Commits en español; se publica directo en `main`.
