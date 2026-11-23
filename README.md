# BiblioTec

Biblioteca virtual en 3D para pasear entre tu colección (libros, películas, series, videojuegos, consolas y cartas Pokémon) y ordenarla como en un videojuego. Conecta con Bitácora. Proyecto personal, sin ánimo de lucro.

## Arrancar

```
npm install
npm run dev
```

Controles: clic para entrar, `w a s d` para moverse (`mayús` corre), ratón para mirar, clic sobre un libro para sacarlo, arrastrar para girarlo, `esc` o clic fuera para devolverlo. `o` mirando un libro ordena su estantería. El ordenador de la entrada (a la izquierda) busca, guía hasta un libro, ordena y amplía estanterías: escribe `ayuda`.

## Estado

Fase 1: sala, lomos del color de la portada, primera persona y abrir un libro con animación y ficha.
Fase 2: estanterías por género, ordenar por autor, saga, color, alfabético, año, páginas o fecha de alta con animación, ampliar estanterías y ordenador retro. La planificación y las decisiones están en `docs/planificacion/` (`06-decisiones.md` manda).

Los libros de ejemplo salen de Open Library con `node scripts/preparar-demo.mjs`.
