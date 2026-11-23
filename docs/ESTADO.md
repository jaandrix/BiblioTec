# BiblioTec: dónde estamos

*Actualizado: 23 de noviembre de 2026.*

## En una frase

Ya puedes entrar en una biblioteca 3D desde el navegador: pasear, abrir libros, ordenar estanterías, usar el ordenador retro y colocar libros nuevos con el carro. Todo funciona con **libros de ejemplo**: tus datos reales de Bitácora llegarán en la fase 5.

- **Probar:** https://jaandrix.github.io/BiblioTec/ (navegador de ordenador).
- **Código:** https://github.com/jaandrix/BiblioTec

## Fases

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Sala, lomos del color de la portada, moverse, abrir un libro con animación | hecha |
| 2 | Estanterías por género, ordenar, ampliar, ordenador retro | hecha |
| 3 | Mesa de entrada, carro, huecos que brillan, añadir libros por título | hecha |
| 3.5 | Pulido: inspección nueva, pausa y ajustes, zoom, dejar el carro, brazos, cambiar portadas, mejor aspecto | hecha |
| 4 | Cartas Pokémon: expositores, cajas negras de 25, producto sellado | siguiente |
| 5 | Cuentas, enlace con Bitácora, guardar en la nube | pendiente |
| 6 | Spotify, películas, series, juegos, consolas, créditos en el juego, pulido | pendiente |

## Cómo se juega

1. **Entrar:** clic en la pantalla. `w a s d` para andar, `mayús` para correr, ratón para mirar, rueda para acercar la vista. `esc` abre la pausa (controles y ajustes: sensibilidad, calidad gráfica, sonido, flechas).
2. **Mirar un libro:** apunta con el punto del centro y haz clic. El libro vuela hacia ti enseñando la portada, con la ficha al lado. Mueve el ratón para girarlo, `f` le da la vuelta, la rueda lo acerca, `p` cambia la portada (otras ediciones, una foto tuya o un enlace) y clic lo devuelve.
3. **Ordenar una estantería:** mirando uno de sus libros, pulsa `o` y elige: autor, saga, color, alfabético, año, páginas o fecha de alta. Los libros se recolocan en cascada.
4. **El carro:** `c` lo deja aparcado para pasear sin él; acércate y pulsa `c` (o haz clic en él) para cogerlo.
5. **Ordenar lo nuevo:**
   1. En la mesa "por ordenar." de la entrada, haz clic en un libro para cogerlo al carro (`t` los coge todos).
   2. Sigue las flechas del suelo (`g` las apaga) hasta el hueco que brilla, con una flecha flotando encima.
   3. Apunta al hueco y haz clic: el libro vuela a su sitio. Arriba a la izquierda se cuenta lo que llevas hoy y qué toca hacer.
6. **Ordenador retro** (a la izquierda de la entrada): clic para usarlo y escribe `ayuda`. Los más útiles:
   - `buscar tolkien` y luego `ir 1`: te marca el libro con una columna de luz.
   - `donde dune`: en qué estantería, mueble y balda está, y dónde lo tienes en casa.
   - `ordenar fantasia por color` o `ordenar todas por saga`.
   - `ampliar fantasia`: añade un mueble a esa estantería.
   - `añadir el hobbit` y luego `elegir 1`: busca el libro en Open Library y lo deja en la mesa.
   - `colocar todo`: coloca de golpe lo que hay en la mesa y en el carro.
   - `estadisticas`, `pendientes`, `salir`.

## Cómo está hecho (para curiosos)

- **Una web**, sin instalar nada. Three.js dibuja el 3D y React organiza las piezas.
- **Cada libro** es una caja. Su lomo se pinta con el color dominante de la portada real, que sale de Open Library.
- **La biblioteca se calcula sola:** agrupa por género, ordena y reparte en muebles. Si cambias el orden o añades un libro, se vuelve a calcular y todo se anima hasta su nuevo sitio.
- **Se guarda en tu navegador** (el orden, los muebles añadidos y lo colocado). Si pruebas en otro ordenador, empieza de cero. Pasará a la nube con las cuentas (fase 5).
- **Se publica sola:** cada cambio que subo a GitHub se comprueba y se publica en la web en un par de minutos.

## Lo que falta de lo que decidiste

- **Tus libros reales de Bitácora:** fase 5, con cuentas y código de conexión. Ahora mismo en Bitácora tienes un solo libro.
- **Mover libros a mano, fijarlos y colocarlos fuera de orden** (preguntas 89 a 91): más adelante.
- **Ubicaciones de casa** editables desde el ordenador: más adelante. Ahora la ficha dice "sin ubicación".
- **Menú con flechas en el ordenador:** de momento hay botones con los comandos.
- **Películas, series, videojuegos, consolas, Spotify y modelos 3D más bonitos** (Kenney, Poly Pizza): fases 4 a 6.
- **Encargos externos:** los resultados de DeepSeek (medidas reales, productos Pokémon, textos del terminal) y la prueba de OpenCode aún no han llegado. La fase 4 aprovechará los datos de DeepSeek si los tienes.

## Auditoría

Si quieres que otra IA lo revise todo, pásale `docs/encargos/auditoria.md`: tiene un bloque de experiencia de uso (Gemini), otro de código y otro de medición (OpenCode o DeepSeek).

## Avisos

- El repositorio es **público** para poder publicar la web gratis. No contiene datos tuyos. Cuando entren tus datos reales, los guardaremos en Supabase, no en el código.
- Algunos libros añadidos desde Open Library salen con el título en su idioma original.
- Una portada pegada como enlace solo funciona si esa web deja usar sus imágenes desde otras páginas; si no, sube la foto.
