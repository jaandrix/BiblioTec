# BiblioTec: dónde estamos

*Actualizado: 23 de noviembre de 2026 (tarde).*

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
| 4 | Cartas Pokémon: expositores, cajas negras de 25, producto sellado, vitrina de graduadas | hecha (con cartas de ejemplo) |
| 5 | Cuentas, enlace con Bitácora, guardar en la nube | hecha |
| 6 | Películas, series y videojuegos, pasillos, consolas, editor de mapa, exposición, cajas que se abren, Libib (hecho); créditos en el juego y Spotify (pendiente) | casi |

## Novedades (23-11, auditoría externa)

- **Primera partida guiada:** la primera vez salen seis objetivos en el marcador de arriba a la izquierda (moverse, coger algo de la mesa, seguir las flechas, colocarlo en el hueco que brilla, mirar un libro de cerca y abrir el ordenador). Cada uno se completa al hacerlo, en el orden que sea. Se salta o se vuelve a ver en la pausa (`esc`, pestaña controles).
- **Pantalla de inicio más clara:** dice para qué es el juego y «probar sin cuenta.» es ahora el botón principal.
- **Ventanas pequeñas de ordenador** (desde 1024×640): la pausa pone los controles en dos columnas, y la portada, la ficha, el ordenador y el editor de mapa caben sin cortarse.
- **Rincón de lectura y atrezo** (modelos libres de Kenney): sillón, lámpara de pie, mesita con planta, plantas en las esquinas y cajas de cartón junto a la mesa de la entrada. Todo junto cuesta una sola llamada de dibujo y ninguna textura.
- **Sonidos de verdad** (Kenney, libres): pasos al andar, y abrir, cerrar, pasar y dejar libros. Si el navegador no los carga, suenan los tonos de antes.
- **Consola limpia:** sin avisos de Three.js.
- **Créditos:** `CREDITOS.md` tiene ahora una tabla por recurso con su licencia y dónde se usa.

## Rendimiento (24-11)

Iba lento porque cada fotograma pedía unas 3.000 llamadas de dibujo a la gráfica. Ahora son menos de 300: cada libro es una sola pieza con una sola textura, cada carta dos caras, sin cristal con transmisión, sombras calculadas solo cuando cambian los muebles, tres luces en vez de ocho y el posprocesado solo en calidad alta. Hay tres niveles de calidad (alta, media y baja; media por defecto) y, si va a menos de 28 imágenes por segundo, baja sola un nivel y avisa (se puede desactivar en la pausa).

## Novedades (24-11, tarde)

- **Pasillos:** un pasillo por tipo (libros, películas, series, videojuegos), con su rótulo; si un tipo no cabe en uno, ocupa varios y la sala se ensancha. Los videojuegos van por consola, con la consola de adorno encima de su estantería.
- **Editor de mapa (`m` o `mapa` en el ordenador):** vista desde arriba para arrastrar, girar, añadir, duplicar y borrar estanterías, cambiar su color, alto y número de baldas, y elegir qué sección guarda cada una. «volver a lo automático» deshace.
- **Exposición (`x` con algo en la mano):** se queda de frente en su estantería, enseñando la portada.
- **Cajas de juego y película realistas:** plástico del color de cada consola o formato, cabecera con su nombre, lomo con título y recuadro de edad. Al cogerlas se abren: manual con la portada en la tapa y, en la bandeja, disco plateado o cartucho (Switch, DS, 3DS).
- **Carro y brazos** con más detalle (puños de goma, manos, ruedas con buje). Se empieza sin carro: espera junto a la mesa y se coge solo al hacer clic en algo de la mesa; `c` lo deja cuando quieras.
- **Importar de Libib (`importar libib` en el ordenador):** lee el CSV que exporta Libib (libros, películas, series y juegos; deduce la consola, como Xbox 360, o te la pregunta).
- **Rendimiento con bibliotecas grandes:** lo lejano se dibuja todo junto en una sola llamada; solo lo que tienes a unos 2 m lleva textura detallada, y las texturas se pintan poco a poco. Con 667 objetos: unas 215 llamadas de dibujo y 23 texturas.
- **Zona Pokémon:** quitada por ahora (el código sigue en el repositorio).

## Cuenta y Bitácora

1. **Crear cuenta:** en la pantalla de inicio, «crear cuenta.» con tu correo y una contraseña (8 caracteres o más). Te llega un correo para confirmarla; después entras con «entrar.». Sin cuenta puedes jugar igual, pero solo se guarda en ese navegador.
2. **Conectar Bitácora:** en Bitácora, Ajustes, conexiones, «bibliotec.», pulsa «conectar.» y copia el código. En BiblioTec, pausa (`esc`), «cuenta y bitácora.», pega el código y «conectar.» (o en el ordenador: `bitacora <código>`).
3. **Revisar lo que llega:** pulsa `n`. Para cada libro o carta dices si lo tienes en físico: los libros van a la mesa de la entrada para ordenarlos con el carro; las cartas, al expositor (las graduadas, a la vitrina); el sellado, a su estantería. Lo que no tienes queda apuntado para el archivo. Las cartas sin set y número en Bitácora salen como «sin identificar»: elige la carta exacta en Bitácora y volverán a aparecer.
4. **Quitar los ejemplos:** en la misma pestaña, o en la revisión, «quitar los libros y cartas de ejemplo.».

Todo lo que hagas se guarda en la nube y aparece igual en cualquier ordenador donde entres con tu cuenta. Bitácora se consulta sola cada vez que entras.

## Cómo se juega

1. **Entrar:** clic en la pantalla. `w a s d` para andar, `mayús` para correr, ratón para mirar, rueda para acercar la vista. `esc` abre la pausa (controles y ajustes: sensibilidad, calidad gráfica, sonido, flechas).
2. **Mirar un libro:** al apuntarlo ves su título y autor; clic (o `e`) lo saca y vuela hacia ti enseñando la portada, con la ficha al lado. Mueve el ratón para girarlo, `f` o `r` le da la vuelta, la rueda lo acerca, `p` cambia la portada (otras ediciones, una foto tuya o un enlace) y clic derecho (o `q`) lo devuelve.
3. **Ordenar una estantería:** mirando uno de sus libros, pulsa `o` y elige: autor, saga, color, alfabético, año, páginas o fecha de alta. Los libros se recolocan en cascada.
4. **El carro:** `c` lo deja aparcado para pasear sin él; acércate y pulsa `c` (o haz clic en él) para cogerlo.
5. **Ordenar lo nuevo:**
   1. En la mesa "por ordenar." de la entrada, haz clic en un libro para cogerlo al carro (`t` los coge todos).
   2. Sigue las flechas del suelo (`g` las apaga) hasta el hueco que brilla, con una flecha flotando encima.
   3. Apunta al hueco y haz clic: el libro vuela a su sitio. O pulsa `v` junto a una estantería y se colocan de golpe todos los del carro que van ahí. Arriba a la izquierda se cuenta lo que llevas hoy y qué toca hacer.
6. **Zona Pokémon** (a la izquierda, con suelo de tienda): clic en una carta para mirarla (las brillantes cambian de color al girarlas) con su precio de Cardmarket; `b` la guarda en una caja negra; clic en una caja para abrirla y devolver cartas al expositor; `o` mirando una carta ordena el expositor por set, nombre o rareza. También hay estantería de producto sellado y una vitrina con las graduadas.
7. **Ordenador retro** (a la izquierda de la entrada): clic para usarlo y escribe `ayuda`. Los más útiles:
   - `buscar tolkien` y luego `ir 1`: te marca el libro con una columna de luz.
   - `donde dune`: en qué estantería, mueble y balda está, y dónde lo tienes en casa.
   - `ordenar fantasia por color` o `ordenar todas por saga`.
   - `ampliar fantasia`: añade un mueble a esa estantería.
   - `añadir el hobbit` y luego `elegir 1`: busca el libro en Open Library y lo deja en la mesa.
   - `colocar todo`: coloca de golpe lo que hay en la mesa y en el carro.
   - `cartas`, `cajas`, `caja nueva <nombre>`, `valor` (valor de mercado de tus cartas).
   - `estadisticas`, `pendientes`, `salir`.

## Cómo está hecho (para curiosos)

- **Una web**, sin instalar nada. Three.js dibuja el 3D y React organiza las piezas.
- **Cada libro** es una caja. Su lomo se pinta con el color dominante de la portada real, que sale de Open Library.
- **La biblioteca se calcula sola:** agrupa por género, ordena y reparte en muebles. Si cambias el orden o añades un libro, se vuelve a calcular y todo se anima hasta su nuevo sitio.
- **Se guarda en tu navegador** (el orden, los muebles añadidos y lo colocado). Si pruebas en otro ordenador, empieza de cero. Pasará a la nube con las cuentas (fase 5).
- **Se publica sola:** cada cambio que subo a GitHub se comprueba y se publica en la web en un par de minutos.

## Lo que falta de lo que decidiste

- **Mover libros a mano, fijarlos y colocarlos fuera de orden** (preguntas 89 a 91): más adelante.
- **Ubicaciones de casa** editables desde el ordenador: más adelante. Ahora la ficha dice "sin ubicación".
- **Menú con flechas en el ordenador:** de momento hay botones con los comandos.
- **Tus cartas reales:** en Bitácora casi ninguna tiene elegida la carta exacta (set y número). Hasta que lo hagas en Bitácora, en la revisión salen como «sin identificar». Los productos sellados sí entran ya.
- **Cartas por la entrada y el carro:** las cartas que llegan de Bitácora van directas al expositor, sin pasar por la mesa.
- **Entrar con Google:** necesita configurar Google Cloud; de momento solo correo y contraseña.
- **Películas, series y videojuegos de Bitácora:** se importarán cuando tengan estanterías (fase 6).
- **Medidas reales del producto sellado:** las de ahora son aproximadas; se afinarán con los datos de DeepSeek.
- **Películas, series, videojuegos, consolas, Spotify y modelos 3D más bonitos** (Kenney, Poly Pizza): fases 5 y 6.
- **Encargos externos:** los resultados de DeepSeek (medidas reales, productos Pokémon, textos del terminal) y la prueba de OpenCode aún no han llegado. La fase 4 aprovechará los datos de DeepSeek si los tienes.

## Auditoría

Si quieres que otra IA lo revise todo, pásale `docs/encargos/auditoria.md`: tiene un bloque de experiencia de uso (Gemini), otro de código y otro de medición (OpenCode o DeepSeek).

## Avisos

- El repositorio es **público** para poder publicar la web gratis. No contiene datos tuyos. Cuando entren tus datos reales, los guardaremos en Supabase, no en el código.
- Algunos libros añadidos desde Open Library salen con el título en su idioma original.
- Una portada pegada como enlace solo funciona si esa web deja usar sus imágenes desde otras páginas; si no, sube la foto.
