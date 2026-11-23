# BiblioTec

Biblioteca virtual en 3D para pasear entre tu colección (libros, películas, series, videojuegos, consolas y cartas Pokémon) y ordenarla como en un videojuego. Conecta con Bitácora. Proyecto personal, sin ánimo de lucro.

## Arrancar

```
npm install
npm run dev
```

Controles: clic para entrar, `w a s d` para moverse (`mayús` corre), ratón para mirar, clic sobre un libro para sacarlo, arrastrar para girarlo, `esc` o clic fuera para devolverlo. `o` mirando un libro ordena su estantería. En la mesa de la entrada esperan los libros por ordenar: clic para cogerlos al carro (`t` coge todos), sigue las flechas (`g` las apaga) y haz clic en el hueco que brilla. El ordenador de la entrada (a la izquierda) busca, guía hasta un libro, ordena, amplía estanterías, añade libros por título y coloca todo: escribe `ayuda`.

## Estado

Fase 1: sala, lomos del color de la portada, primera persona y abrir un libro con animación y ficha.
Fase 3: mesa de entrada con lo pendiente, carro, huecos que se iluminan con flechas en el suelo, colocar libro a libro o todo de golpe, añadir libros por título desde el ordenador y contador de lo ordenado hoy.
Fase 2: estanterías por género, ordenar por autor, saga, color, alfabético, año, páginas o fecha de alta con animación, ampliar estanterías y ordenador retro.

Resumen del estado en `docs/ESTADO.md`. La planificación y las decisiones están en `docs/planificacion/` (`06-decisiones.md` manda).

Web de prueba: https://jaandrix.github.io/BiblioTec/

Los libros de ejemplo salen de Open Library con `node scripts/preparar-demo.mjs`.
