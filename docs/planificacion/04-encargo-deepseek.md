# Encargo para DeepSeek: datos de referencia

> Pega este documento entero a DeepSeek. Puedes hacerlo en tres conversaciones separadas (una por tarea) si se le hace largo. Tráeme los tres archivos JSON y el de textos.

---

Hola. Estoy preparando una biblioteca virtual en 3D (web, Three.js) donde aparecerán libros, películas, series, videojuegos, consolas y productos Pokémon como objetos 3D a escala real. Necesito datos de referencia **exactos y en formato JSON válido**. Reglas:

- Medidas en **milímetros**, siempre en el orden `ancho`, `alto`, `fondo` tal como se ve el objeto **de frente** (la portada o carátula mirando hacia ti).
- Si un dato no lo sabes con seguridad, pon `null` y añade el campo `"nota"` explicando la duda. **No inventes cifras.** Prefiero un `null` a un número aproximado sin avisar.
- Si una medida es aproximada pero razonable, añade `"aproximado": true`.
- Indica la fuente principal en `"fuente"` cuando la tengas (norma, web del fabricante, wiki).
- Devuelve **solo el JSON** dentro de un bloque de código, sin comentarios dentro del JSON.

## Tarea 1. Medidas de soportes físicos (`soportes.json`)

```json
{
  "libros": [
    { "id": "bolsillo", "nombre": "Libro de bolsillo", "ancho": 0, "alto": 0, "grosorPorCada100Paginas": 0, "notas": "" }
  ],
  "video": [],
  "videojuegos": [],
  "musica": []
}
```

Incluye como mínimo:

- **libros**: bolsillo español, rústica estándar española (15x23 aprox.), tapa dura estándar, gran formato/ilustrado, cómic europeo (álbum tipo Astérix/Tintín), cómic americano grapa, tomo recopilatorio americano (TPB), manga tankōbon japonés estándar, manga formato kanzenban. Añade `grosorPorCada100Paginas` en mm según papel típico, y el grosor extra de la tapa dura.
- **video**: caja DVD estándar (Amaray), DVD slim, caja Blu-ray estándar, Blu-ray 4K UHD, steelbook Blu-ray, estuche múltiple de temporada (2-4 discos) y caja de colección de serie típica.
- **videojuegos**: caja de cada plataforma: NES (caja de cartón), SNES (PAL), Nintendo 64 (PAL), Game Boy / Game Boy Color, Game Boy Advance, GameCube, Wii, Wii U, Nintendo DS, Nintendo 3DS, Nintendo Switch, Nintendo Switch 2, PlayStation 1, PlayStation 2, PlayStation 3, PlayStation 4, PlayStation 5, PSP, PS Vita, Xbox, Xbox 360, Xbox One, Xbox Series X|S. Añade también el **color típico del plástico o banda superior** de la caja (`colorCaja` en hexadecimal, por ejemplo Switch `#E60012`) y las medidas del **cartucho o disco suelto** de cada plataforma en un campo `soporte`.
- **musica** (para más adelante): CD jewel case, CD digipak, vinilo LP 12", vinilo single 7", casete.

## Tarea 2. Consolas (`consolas.json`)

Lista de consolas de sobremesa y portátiles de Nintendo, Sony, Sega, Microsoft y Atari desde 1977 hasta hoy, incluyendo las revisiones principales (por ejemplo PS2 y PS2 Slim, Switch, Switch OLED, Switch Lite, Switch 2). Para cada una:

```json
{ "id": "switch-oled", "nombre": "Nintendo Switch (modelo OLED)", "fabricante": "Nintendo", "anio": 2021, "tipo": "híbrida", "ancho": 0, "alto": 0, "fondo": 0, "coloresPrincipales": ["#FFFFFF", "#E60012", "#00C3E3"], "descripcionForma": "frase corta de cómo es la forma para modelarla en low-poly", "fuente": "" }
```

`tipo`: `sobremesa`, `portátil` o `híbrida`. Medidas de la consola sin mandos (salvo en las portátiles e híbridas, que van completas).

## Tarea 3. Producto sellado Pokémon TCG (`pokemon-sellado.json`)

Primero, los **formatos genéricos** de producto sellado del juego de cartas Pokémon, con medidas y número de sobres:

```json
{
  "formatos": [
    { "id": "sobre", "nombre": "Sobre de mejora", "nombreIngles": "Booster pack", "ancho": 0, "alto": 0, "fondo": 0, "sobres": 1, "cartasPorSobre": 10, "descripcionVisual": "", "notas": "" }
  ],
  "productos": []
}
```

Formatos mínimos: sobre, sobre en blíster (1 y 3 sobres), caja de sobres / display de 36, media caja de 18 si existe, Elite Trainer Box (estándar y Pokémon Center), Booster Bundle (6 sobres), lata (tin) y mini lata, colección especial / premium collection, Ultra Premium Collection, baraja temática / baraja de combate, caja de construcción y combate (Build & Battle), estuche de 3 sobres "checklane", colección con figura. En `descripcionVisual`, describe cómo se reconoce (forma, material, ventanas de plástico, dónde va el arte del set).

Después, en `productos`, la lista de **expansiones de la era Escarlata y Púrpura y Megaevolución** (la actual) con este formato:

```json
{ "set": "Escarlata y Púrpura", "setIngles": "Scarlet & Violet", "codigoSet": "SV01", "fechaEspana": "2023-03-31", "formatosDisponibles": ["sobre", "caja-sobres", "etb", "booster-bundle"], "pokemonPortadaETB": "Koraidon y Miraidon", "colorDominante": "#hex", "fuente": "" }
```

Si no estás seguro de una fecha o de qué Pokémon sale en la caja, `null` y una nota.

## Tarea 4. Textos del ordenador retro (`textos-terminal.md`)

Dentro de la biblioteca hay un ordenador antiguo de pantalla de tubo, texto verde sobre negro, al estilo de los terminales de los años 80. Sirve para buscar dónde está cada objeto, ver estadísticas y ampliar zonas. Escribe en **español** y en tono simpático pero sobrio (como una máquina vieja y fiable, sin chistes forzados):

1. Pantalla de arranque (8-12 líneas: comprobación de memoria, versión del sistema, nombre inventado del sistema operativo; propón 5 nombres posibles).
2. Mensaje de bienvenida y ayuda corta.
3. Lista de comandos con su sintaxis y descripción de una línea. Mínimo: `ayuda`, `buscar <texto>`, `ir <objeto>`, `donde <objeto>` (ubicación en casa), `pendientes`, `estadisticas`, `ampliar <zona>`, `ubicaciones`, `nueva-ubicacion`, `cajas`, `valor` (valor de la colección de cartas), `ordenar <estantería> por <criterio>`, `creditos`, `salir`. Añade alias cortos.
4. Mensajes de error para comando desconocido (5 variantes), búsqueda sin resultados (3), objeto encontrado (3), zona ampliada (2), falta de espacio (2).
5. Cinco comandos ocultos ("huevos de pascua") con su respuesta.

Formato: Markdown con encabezados por apartado y los textos del terminal en bloques de código.
