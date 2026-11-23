# Encargo para OpenCode

Dos partes:

- **Parte A** se puede hacer ya: una prueba técnica de rendimiento, independiente del proyecto. Sirve para comprobar en tu ordenador (y, si puedes, en uno más modesto) que la idea aguanta muchos objetos. Ábrele una carpeta vacía nueva (por ejemplo `Documents/GitHub/prueba-biblioteca`) y pégale el encargo.
- **Parte B** es para más adelante: módulos que le pasaré cuando exista el repositorio. Está aquí para que sepas qué le tocará; no se la pases todavía.

---

## Parte A. Prueba de rendimiento (pegar a OpenCode)

### Objetivo

Crea un prototipo web mínimo que mida si una biblioteca 3D en primera persona con **muchos lomos de libro con texto legible** va fluida en un ordenador de sobremesa y en un portátil normal con gráfica integrada. Solo escritorio: no hace falta soporte móvil. No es el proyecto final: es una prueba que se tira después. Prioriza que el código sea claro y que las medidas sean fiables.

### Tecnología (obligatoria)

- Vite + TypeScript + **Three.js** (última versión estable). Sin React.
- Sin otros paquetes salvo: `troika-three-text` (si lo usas para texto, ver punto 4) y `stats.js` o `stats-gl` (contador de FPS).
- `npm run dev` arranca, `npm run build` genera `dist/` estático que se pueda subir a GitHub Pages sin tocar nada (`base: './'` en Vite).

### Qué debe hacer

1. **Sala**: suelo, cuatro paredes, luz ambiental + una luz direccional con sombras suaves (que se puedan apagar con un parámetro).
2. **Estanterías**: filas de estanterías de madera (cajas simples, sin modelos externos) formando pasillos. Cada estantería tiene 5 baldas.
3. **Libros**: N libros repartidos por las baldas, de pie, enseñando el lomo hacia el pasillo. Cada libro con:
   - Alto y grosor variables (alto entre 180 y 260 mm, grosor entre 15 y 60 mm, escala 1 unidad = 1 metro).
   - Color aleatorio.
   - **Título y autor inventados escritos en vertical en el lomo, legibles a 1 metro.**
   - Dibujados con **`InstancedMesh`** (una sola malla para todos los lomos).
4. **Texto de los lomos**: implementa **dos modos** seleccionables con `?texto=atlas` o `?texto=troika`:
   - `atlas`: genera con un `<canvas>` una textura grande (atlas) con todos los lomos dibujados (color de fondo + texto), y cada instancia usa su recorte del atlas mediante un atributo por instancia con el desplazamiento UV. Si N no cabe en una textura de 4096x4096, usa varias.
   - `troika`: un objeto de texto de troika por libro, solo para los libros a menos de X metros de la cámara (los lejanos sin texto).
5. **Controles**: `PointerLockControls`, WASD para andar, ratón para mirar, colisión simple para no atravesar estanterías ni paredes (cajas AABB, sin motor de física).
6. **Clic en un libro**: con raycasting sobre el `InstancedMesh`, el libro señalado se resalta al apuntarlo (en el centro de la pantalla, con una mirilla) y al hacer clic sale de la balda hacia la cámara con una animación de 400 ms y vuelve a su sitio con otro clic. Sin librerías de animación: interpolación propia con una curva ease-out.
7. **Parámetros por URL**: `?n=500` (número de libros, por defecto 1000), `?texto=atlas|troika`, `?sombras=0|1`, `?pixel=1|2` (límite de devicePixelRatio).
8. **Panel de medidas** en una esquina: FPS, milisegundos por fotograma, número de llamadas de dibujo (`renderer.info.render.calls`), triángulos, memoria de texturas aproximada y tiempo que tardó en generarse la escena (incluido el atlas).
9. **Botón "medir"**: recorre automáticamente un camino fijo por los pasillos durante 20 segundos y al terminar muestra FPS medio, FPS mínimo (percentil 1 %) y el peor fotograma, para poder comparar dispositivos.

### Entrega

- Código en la carpeta, con un `README.md` corto en español: cómo arrancarlo, parámetros, y una tabla vacía para rellenar resultados.
- Rellena la tabla con lo que midas tú en tu entorno para `n=500`, `1000`, `3000` en los dos modos de texto.
- Al final del README, una sección "Conclusiones" con tu recomendación: qué modo de texto y qué límite de libros por sala.
- No subas nada a ningún sitio ni crees repositorios remotos.

---

## Parte B. Módulos para más adelante (no pasar todavía)

Cuando tenga el repositorio montado, prepararé un encargo cerrado para cada uno, con los tipos de datos y pruebas automáticas que debe superar:

1. **Ordenación**: funciones puras que ordenan una estantería por autor (apellido), saga y tomo, alfabético ignorando artículos, color (degradado por tono), año, plataforma, páginas y fecha de alta, con objetos fijados que no se mueven.
2. **Color dominante de una portada**: dada una URL de imagen, devolver el color del lomo y el color de texto legible encima (blanco o negro según contraste).
3. **Generador de lomos y cajas**: geometrías de libro, caja de DVD/Blu-ray, caja de videojuego por plataforma, caja de 25 cartas y caja de producto sellado, a partir de las medidas del `soportes.json` de DeepSeek.
4. **Importador de Libib** (CSV) al formato de la biblioteca.
5. **Terminal retro**: intérprete de comandos con los textos de DeepSeek, sin parte 3D.
6. **Distribución de pasillos**: dado el número de objetos por categoría, calcular cuántas estanterías y pasillos hacen falta y dónde van.

Estos módulos son aislados y comprobables con pruebas, por eso se pueden derivar. La integración en la escena, los controles finales y las animaciones las hago yo.
