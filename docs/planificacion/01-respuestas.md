# Biblioteca 3D: respuestas de Claude (pasos 1 a 3)

Documentos de esta carpeta, en el orden en que se usan:

| Archivo | Para quién | Qué es |
|---|---|---|
| `01-respuestas.md` | tú | Viabilidad, cuánto se puede derivar, cuánto nos acercaremos y la dirección técnica que propongo. |
| `02-preguntas.md` | tú | Las preguntas de sí/no. Cada una lleva mi recomendación, así que puedes contestar "todo como recomiendas salvo la 14, 37 y 80". |
| `03-encargo-gemini.md` | Gemini PRO | Complemento a tus instrucciones de investigación: qué necesito exactamente y en qué formato. |
| `04-encargo-deepseek.md` | DeepSeek | Trabajo repetitivo de datos: medidas reales de objetos, catálogo de productos Pokémon, textos del ordenador retro. |
| `05-encargo-opencode.md` | OpenCode | Una prueba técnica de rendimiento que podemos hacer ya, y la lista de módulos que le pasaré cuando exista el repositorio. |

---

## Lo que he visto de Bitácora (para que sepas en qué me baso)

He leído el repositorio `agenda` (CLAUDE.md, el contrato de datos, Ocio, Coleccionables y la función de portadas). Lo relevante para este proyecto:

- **Todo vive en Supabase**, en una tabla `bitacora` con una fila por usuario y los datos en una columna `jsonb`.
- **Ocio** (`entries` con `type` = `book`, `series`, `movie`, `game`): título, autor, año, estado, valoración, fecha, `portada` (URL) y `place`.
- **Portadas**: ya existe la Edge Function `portadas` que busca en Open Library, Google Books, TMDB, TVmaze y Steam. La reutilizaremos o copiaremos la lógica.
- **Coleccionables** (`collectibles`): nombre, categoría, valor y, en las cartas, `carta: { set, numero, anio, estado }` más `mercadoId`, que es el id exacto de la carta en **TCGdex**. Con ese id tenemos la imagen oficial de la carta en alta resolución, en español cuando existe. Es justo lo que pides para que "los diseños sean los correctos".
- **Faltan datos** que la biblioteca necesita y Bitácora no guarda: número de páginas, ISBN, saga, plataforma del videojuego, formato físico (DVD, Blu-ray, cartucho...), tipo de producto sellado Pokémon (sobre, caja de sobres, Elite Trainer Box...) y la ubicación real en casa. Algunos se pueden rellenar solos desde las APIs; otros tendrás que indicarlos tú (ver preguntas).
- **Un matiz importante**: Bitácora registra lo que has *visto o leído*, no lo que *tienes físicamente*. Una peli vista en Netflix no es un Blu-ray en tu estantería. Hay que decidir cómo se trata eso (preguntas 31 a 35).

---

## 1. ¿Es viable con los recursos que tenemos?

**Sí, es viable.** Con matices de alcance, no de posibilidad.

Por qué:

- **Una biblioteca 3D en el navegador es un problema resuelto.** Three.js (la librería 3D estándar de la web) mueve sin problema escenas con miles de objetos si se dibujan "por instancias" (una sola orden de dibujo para todos los lomos iguales). Unos cientos de libros, cartas y cajas son poca carga.
- **No necesitamos un motor como Unity o Unreal.** Todo en web significa: se abre desde cualquier sitio con un enlace, sin instalar nada, y se aloja gratis o casi (GitHub Pages o Cloudflare Pages + Supabase, que ya usas).
- **Los datos y las imágenes ya están resueltos en Bitácora**: el enlace con tu cuenta y las portadas son la parte que en otros proyectos más cuesta, y aquí ya existe.
- **Los modelos 3D no hay que hacerlos desde cero.** Hay bibliotecas gratuitas con licencia CC0 (uso libre, sin obligación de atribuir, aunque lo haremos igual) en estilo low-poly parecido al de TCG Card Shop Simulator: Kenney, Quaternius, Poly Pizza, Poly Haven. Lo demás (lomos, cajas de cartas, expositores, cajas Pokémon) son formas simples que genero yo por código con la portada como textura.

Lo que lo hace exigente (no imposible):

1. **La experiencia de usuario en 3D** es lo difícil, y es justo tu prioridad: moverse cómodo, coger y soltar objetos sin frustración, leer lomos, que funcione con ratón y en el móvil. Requiere muchas rondas de probar y ajustar contigo.
2. **El carro y colocar objetos** ("paseas y los colocas donde se marca") es una mecánica de juego de verdad: inventario, huecos marcados, animaciones de recolocar toda una estantería al reordenar.
3. **Spotify** tiene límites ajenos a nosotros (ver más abajo).
4. **Volumen de trabajo**: es un proyecto grande. Calculo varias semanas de sesiones para una primera versión jugable completa, y meses para pulirlo todo. Se hace por fases, con algo usable desde la primera.

### Spotify, en concreto

- **Se puede**: iniciar sesión con Spotify, ver tus listas y reproducir música dentro del juego con el *Web Playback SDK*.
- **Limitaciones reales**:
  - Exige **Spotify Premium** en la cuenta que escucha.
  - Una app de Spotify en "modo desarrollo" solo admite una lista corta de usuarios autorizados a mano. Para uso personal sobra; para abrirlo a otra gente habría que pedir ampliación a Spotify, y hoy se la conceden casi solo a empresas grandes. **Le pido a Gemini que confirme las condiciones vigentes.**
  - El audio de Spotify está protegido (DRM), así que **no se puede convertir en sonido 3D real** que salga de un altavoz concreto. Sí se puede simular: bajar y subir el volumen según lo cerca que estés de los altavoces y según la sala. Se percibe casi igual.
- Alternativa sin Premium ni límites: música propia (archivos o una radio libre), que sí admite sonido 3D real por altavoz.

---

## 2. ¿Cuánto trabajo podemos derivar a Gemini, OpenCode y DeepSeek?

**Del orden de un 30-35 % del trabajo total**, repartido muy desigual:

| Tipo de trabajo | Derivable | A quién |
|---|---|---|
| Investigación (proyectos parecidos, APIs, licencias, skills, referencias visuales) | 90-100 % | Gemini |
| Datos repetitivos (medidas reales de libros, cajas de DVD, cartuchos, consolas, productos Pokémon; catálogos; textos) | 80-90 % | DeepSeek |
| Buscar y listar recursos gráficos gratuitos con su licencia | 80 % | Gemini |
| Módulos de código aislados con especificación cerrada (algoritmo de ordenación, color dominante de una portada, generador de lomos, prueba de rendimiento) | 50-60 % | OpenCode, revisado por mí |
| Arquitectura, integración con Bitácora, controles, sensación de juego, animaciones y pulido de UX | 5-10 % | yo |

Por qué no más: lo que decide si esto se siente bien (cómo te mueves, cómo coges un libro, cómo se abre la ficha) necesita una sola mano y muchas iteraciones contigo. Repartirlo entre modelos sin contexto común suele costar más en revisar y unir que hacerlo directamente. Donde sí ahorran mucho es en lo que me obligaría a buscar, comprobar y teclear datos uno a uno.

Cómo trabajaremos: yo preparo un encargo cerrado (como los de esta carpeta), tú se lo pasas, y me traes el resultado. Yo reviso, corrijo e integro.

---

## 3. ¿Cuánto nos podemos acercar a lo que tienes en mente?

Mi estimación honesta, por partes:

| Parte | Cercanía | Comentario |
|---|---|---|
| Pasear por la biblioteca con pasillos temáticos | 95 % | Base técnica sencilla. |
| Libros por el lomo, mismo diseño y color de la portada; al pulsar se abre con animación y ficha | 90 % | El color dominante se calcula solo. La animación tipo Sev Sevillano depende de verla bien (se la pido a Gemini y la miraré yo). |
| Entrada con lo pendiente de ordenar, carro, colocar donde se marca | 85 % | Mecánica nueva que hay que afinar jugando. |
| Ordenar una estantería entera (autor, saga, color, alfabético...) con animación | 90 % | |
| Cartas Pokémon con su diseño exacto en expositores y cajas negras de 25 con etiqueta | 90 % | Gracias a TCGdex y al `mercadoId` que ya guarda Bitácora. |
| Cajas de producto sellado Pokémon reconocibles | 70 % | No hay una API de imágenes de producto sellado tan buena como la de cartas; habrá que reunir imágenes y medidas (encargo a DeepSeek y Gemini). |
| Estética tipo TCG Card Shop Simulator | 70-75 % | Mismo espíritu: low-poly, colores vivos, iluminación cálida de tienda. No podemos usar sus modelos ni texturas (son de su autor); nos inspiramos. |
| Ordenador retro de fósforo verde que busca y localiza objetos | 95 % | Muy agradecido de hacer: pantalla con filtro CRT, comandos, y una flecha o luz que te guía al pasillo. |
| Ampliar zonas desde el ordenador | 85 % | La biblioteca se genera por código, así que crecer es añadir módulos de estantería. |
| Todo en internet, accesible desde cualquier sitio | 100 % | |
| Cuentas propias con opción de enlazar Bitácora | 95 % | |
| Música de Spotify por altavoces dentro de la biblioteca | 60-70 % | Funciona, pero con Premium, pocos usuarios y sonido "simulado" (ver punto 1). |
| Discos de música como objeto más adelante | 90 % | Mismo sistema que libros y películas. |

**Resumen**: la experiencia central (pasear, ver, ordenar, consultar tu colección) se puede acercar mucho a lo que imaginas. Lo que más se aleja es lo que depende de terceros: Spotify y las imágenes de producto sellado.

---

## Dirección técnica que propongo (a confirmar con tus respuestas)

- **Web**, no ejecutable. Three.js con TypeScript y Vite (a diferencia de Bitácora, aquí sí conviene un sistema de compilación: el proyecto 3D lo necesita para cargar modelos, texturas y librerías de forma ordenada).
- **Vista en primera persona** como en TCG Card Shop Simulator. Solo escritorio (decidido el 2026-11-23).
- **Supabase** para cuentas y datos de la biblioteca (posición de cada objeto, ubicaciones de casa, cajas, etiquetas).
- **Enlace con Bitácora mediante un código de conexión** generado en Bitácora (como el del conector de IA): la biblioteca lee tu Ocio y tus Coleccionables a través de una Edge Function, sin compartir contraseña. Lo nuevo que añadas en Bitácora aparece en la entrada como "pendiente de ordenar".
- **Imágenes**: portadas desde la función `portadas` de Bitácora; cartas desde TCGdex; sin volver a alojar imágenes con derechos, solo enlazarlas o guardarlas en caché para tu uso.
- **Fases** (detalle cuando tenga tus respuestas):
  1. Sala con una estantería de libros reales tuyos, moverse, pulsar y ver la ficha con animación.
  2. Pasillos por tema, ordenación automática, ordenador retro.
  3. Entrada, carro y colocar objetos.
  4. Cartas Pokémon, expositores, cajas de 25 y producto sellado.
  5. Cuentas, enlace con Bitácora y alojamiento.
  6. Spotify, ampliación de zonas, créditos, pulido.

## Paso 5

Como pides, empezaré a construir cuando tenga la investigación de Gemini y tus respuestas a `02-preguntas.md`. Si DeepSeek y OpenCode terminan antes, mejor, pero no son imprescindibles para arrancar la fase 1.
