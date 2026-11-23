# Biblioteca 3D: preguntas para afinar la idea

Todas se contestan con **sí** o **no**. Cada una lleva entre corchetes lo que yo haría, para que puedas responder rápido:

> "Todo como recomiendas, salvo: 7 sí, 33 no, 101 sí."

Si alguna pide matiz, añade una frase. Las que marco con ★ son las que más cambian el proyecto: si solo tienes tiempo para unas pocas, contesta esas.

---

## A. Plataforma y controles

1. ★ ¿El ordenador (navegador de escritorio) es la plataforma principal y el móvil una versión secundaria? [sí]
2. ★ ¿Quieres que también funcione bien en el móvil desde la primera versión? [no: primero escritorio, el móvil en una fase posterior]
3. ¿Te sirve que en el iPad o tablet funcione como en el móvil? [sí]
4. ★ ¿Vista en primera persona, como en TCG Card Shop Simulator? [sí]
5. ¿Quieres poder cambiar a una vista en tercera persona viendo a tu personaje? [no]
6. ¿Moverse con WASD y mirar con el ratón en escritorio? [sí]
7. ¿Quieres también la opción de moverte haciendo clic en el suelo (sin teclado)? [sí]
8. En el móvil, ¿joystick virtual a la izquierda y arrastrar para mirar a la derecha? [sí]
9. ¿Mando de consola (Xbox/PlayStation) conectado al ordenador? [no, más adelante]
10. ¿Gafas de realidad virtual? [no]
11. ¿Quieres poder agacharte o subir escaleras (estanterías a varias alturas, entreplanta)? [no: una sola planta]
12. ¿Quieres un minimapa en una esquina de la pantalla? [no: el ordenador retro hace de mapa]
13. ¿Debe funcionar sin conexión una vez cargado (consultar, no sincronizar)? [no]

## B. Cuentas, Bitácora y alojamiento

14. ★ ¿Cuentas propias de la biblioteca (correo y contraseña nuevos), con la opción de enlazar Bitácora? [sí, como propones]
15. ¿Ofrecer además "entrar con Google"? [sí]
16. ★ ¿Te parece bien que la biblioteca use el mismo servidor Supabase que Bitácora, en tablas separadas? [no: un proyecto Supabase aparte; mantiene Bitácora intacta y separa los riesgos]
17. ¿Enlazar Bitácora con un código de conexión que generas dentro de Bitácora (como el del conector de IA)? [sí]
18. ★ ¿Puedo añadir cosas a Bitácora para que funcione el enlace (una pantalla para generar el código y una Edge Function de lectura)? [sí]
19. ¿El enlace debe ser solo de lectura (la biblioteca lee Bitácora pero nunca escribe en ella)? [sí, al menos al principio]
20. ¿Quieres que algunos datos que añadas en la biblioteca (páginas, ubicación en casa, formato) se guarden también en Bitácora? [no al principio]
21. ¿Debe poder usarse la biblioteca sin Bitácora, añadiendo cosas a mano o buscando por título? [sí]
22. ¿Quieres poder escanear el código de barras (ISBN) con la cámara del móvil para añadir libros? [sí, en una fase posterior]
23. ¿Importar desde Libib (exportación CSV)? [sí, es poco trabajo]
24. ¿Importar desde Goodreads, Letterboxd u otras? [no por ahora]
25. ¿Sincronización automática cada vez que abres la biblioteca (sin pulsar nada)? [sí]
26. ¿Te vale un dominio propio de pago (unos 10 € al año)? [sí, pero no hace falta al principio: empezamos con una dirección gratuita]
27. ¿Puede ser un subdominio de Bitácora (por ejemplo biblioteca.appbitacora.es)? [sí]
28. ¿Repositorio en GitHub nuevo y separado de `agenda`? [sí]
29. ¿Repositorio privado? [sí; se puede abrir más adelante]
30. ¿Los cambios se publican directamente en la rama principal, como en Bitácora? [sí]

## C. Qué entra en la biblioteca

31. ★ ¿La biblioteca representa lo que **tienes físicamente**, no todo lo que has visto o leído en Bitácora? [sí]
32. ★ ¿Lo que has visto o leído pero no tienes (Netflix, Kindle, préstamo) debe aparecer de alguna forma? [sí, en una zona aparte y con aspecto distinto, por ejemplo "archivo" o versión translúcida]
33. ¿Al llegar algo nuevo de Bitácora, la biblioteca te pregunta si lo tienes en físico antes de mandarlo a la entrada? [sí]
34. ¿Quieres poder marcar cosas como "deseadas" (las quieres comprar) y verlas en un sitio propio? [sí, más adelante; enlaza con los deseos de Bitácora]
35. ¿Quieres marcar cosas como "prestadas a alguien", con el hueco vacío en la estantería? [sí]
36. ¿Libros en formato digital como objeto distinto (por ejemplo, un lector electrónico con su lista)? [no]
37. ¿Cómics y manga en un pasillo propio separado de los libros? [sí]
38. ¿Revistas? [no]
39. ¿Juegos de mesa? [no por ahora]
40. ¿Figuras u otros coleccionables (no cartas) en vitrinas? [no por ahora]
41. ¿Discos de música (vinilo, CD) quedan para más adelante, como dijiste? [sí]
42. ¿Cartas de otros juegos además de Pokémon (Magic, One Piece, Yu-Gi-Oh)? [no]

## D. Libros

43. ★ ¿Todos los lomos con el mismo diseño, cambiando solo el color (el predominante de la portada)? [sí, como pides]
44. ¿El grosor del lomo según el número de páginas? [sí, queda mucho más realista]
45. ¿La altura del libro según su tamaño real (bolsillo, normal, gran formato)? [sí, con tres o cuatro tamaños]
46. ¿En el lomo, título y autor? [sí]
47. ¿También un pequeño logo o marca de la editorial? [no]
48. ¿Que el color del texto del lomo se elija solo (blanco o negro) para que se lea siempre? [sí]
49. ¿Poder corregir a mano el color de un lomo si el automático no te gusta? [sí]
50. ¿Los libros de una misma saga con un detalle común en el lomo (una franja o número de tomo)? [sí]
51. ¿Algunos libros colocados de frente mostrando la portada, como en las librerías (destacados)? [sí, que puedas elegir cuáles]
52. ¿Algunos libros apilados en horizontal como decoración cuando sobra espacio? [no]
53. En la ficha: portada real, autor, páginas, año, ubicación en casa. ¿Añadir también estado (leído/pendiente), valoración y sinopsis? [sí]
54. ¿Poder pasar las páginas del libro abierto o ver la contraportada? [no: solo portada y ficha]
55. ¿El número de páginas y el ISBN se rellenan solos desde Open Library o Google Books cuando falten? [sí]

## E. Películas y series

56. ★ ¿Películas y series como cajas de DVD/Blu-ray en estanterías, viéndose el lomo? [sí]
57. ¿El formato de la caja según lo que tengas (DVD, Blu-ray, 4K, steelbook)? [sí, con DVD por defecto]
58. ¿Las series agrupadas en un solo estuche por serie, o un estuche por temporada? [un estuche por temporada si tienes las temporadas sueltas; contesta "sí" para por temporada, "no" para uno por serie]
59. ¿Mismo criterio de lomo que los libros (diseño común y color de la portada)? [no: las cajas de película se reconocen mejor con su carátula real en el lomo cuando existe; si no, color]
60. ¿Ficha con director, año, duración, reparto principal y tráiler? [sí, sin tráiler al principio]

## F. Videojuegos y consolas

61. ★ ¿Videojuegos como cajas reales según plataforma (caja de Switch roja, PlayStation azul, etc.)? [sí]
62. ¿Juegos sin caja (solo cartucho) como cartuchos sueltos en expositor? [sí]
63. ★ ¿Consolas expuestas en vitrinas o baldas propias? [sí]
64. ¿Las consolas son modelos 3D reconocibles (forma de la consola real en estilo low-poly)? [sí, para las que tengas; las que no tengan modelo libre irán como caja con su imagen]
65. ¿Juegos ordenables por saga (Zelda, Pokémon, Mario...)? [sí, como pides]
66. ¿Juegos digitales que no tienes en físico aparecen? [mismo criterio que la pregunta 32]
67. ¿Ficha con plataforma, año, horas jugadas y si lo has completado? [sí]

## G. Pokémon

68. ★ ¿Las cartas sueltas solo pueden entrar si están en Bitácora con set y número (para tener el diseño exacto)? [sí, como pides; si faltan datos, la carta queda en la entrada con un aviso para completarla]
69. ¿Imagen de la carta en español cuando exista y si no en inglés? [sí]
70. ¿Expositores individuales de pie (uno por carta) sobre las baldas? [sí]
71. ¿Además, expositores de pared con varias cartas (tipo marco)? [sí, más adelante]
72. ★ Cajas negras de 25 cartas con etiqueta de nombre: ¿al abrirlas ves las cartas en abanico o en rejilla? [sí = rejilla, no = abanico]
73. ¿El límite de 25 cartas por caja es fijo para todas las cajas? [sí]
74. ¿Quieres otros contenedores además (carpeta/álbum de 9 bolsillos por página, top loaders, cajas grandes)? [sí, álbum en una fase posterior]
75. ¿Efecto holográfico en las cartas holo/reverse holo cuando las miras de cerca? [sí]
76. ¿Mostrar el valor de mercado de cada carta (el de TCGdex/Cardmarket que ya usa Bitácora)? [sí, en la ficha]
77. ¿Un contador del valor total de la colección en el ordenador retro? [sí]
78. ★ ¿Producto sellado (sobres, cajas de sobres, Elite Trainer Box, latas, colecciones especiales) como objetos 3D colocables? [sí, como pides]
79. ¿Te vale que el producto sellado sea una caja simple con la imagen real del producto (estilo videojuego), en vez de un modelo detallado? [sí]
80. ¿Quieres poder "abrir" un sobre sellado de forma simbólica (animación) cuando lo abras en la vida real, y que pase a la entrada como cartas sueltas? [no, muy bonito pero para el final]
81. ¿Las cartas graduadas (PSA, Beckett) en su funda rígida con la nota visible? [sí, si tienes alguna]
82. ¿La zona Pokémon con una estética propia más marcada (como una tienda de cartas dentro de la biblioteca)? [sí]

## H. Entrada, carro y colocación

83. ★ ¿Lo nuevo aparece en la entrada (una mesa o cajas de "por ordenar") al abrir la biblioteca? [sí]
84. ¿El carro es un objeto que empujas (lo ves delante) y no solo un inventario en pantalla? [sí]
85. ¿El carro tiene un límite de objetos? [sí, unos 20, para que tenga gracia sin ser pesado]
86. ¿Un botón "colocar todo automáticamente" para cuando no te apetezca pasear? [sí]
87. ★ ¿El hueco correcto se ilumina en la estantería cuando llevas un objeto en el carro? [sí]
88. ¿Una línea o flechas en el suelo que te guían hasta el hueco? [sí, se puede apagar]
89. ¿Puedes colocar un objeto en un sitio distinto del que marca el orden (orden manual)? [sí]
90. Si colocas algo a mano fuera de orden, ¿se respeta aunque luego reordenes la estantería? [no: reordenar manda; pero puedes "fijar" objetos concretos]
91. ¿Coger un objeto ya colocado y moverlo a otra estantería o pasillo? [sí]
92. ¿Una pequeña recompensa al colocar (sonido, animación, contador de "ordenados hoy")? [sí, discreta]
93. ¿Logros o retos (por ejemplo "has ordenado 100 libros")? [no]

## I. Ordenación

94. ★ ¿Cada estantería se ordena por separado, eligiendo su criterio? [sí]
95. ¿Además, ordenar un pasillo entero de una vez? [sí]
96. Criterios: autor, saga, color, alfabético, año, plataforma, valoración, fecha de alta, número de páginas. ¿Te parece bien esa lista? [sí]
97. ¿Al reordenar, los objetos se mueven a su nuevo sitio con animación (en vez de aparecer de golpe)? [sí]
98. ¿Orden por color en degradado tipo arcoíris? [sí]
99. ¿Ignorar "El", "La", "The" al ordenar alfabéticamente? [sí]
100. ¿Los apellidos del autor mandan al ordenar por autor? [sí]
101. ¿Dentro de una saga, por orden de publicación? [sí]

## J. Ordenador retro

102. ★ ¿Ordenador de pantalla de tubo con texto verde sobre negro y efecto CRT (líneas, curvatura, parpadeo leve)? [sí, como pides]
103. ¿Se maneja escribiendo comandos (como un terminal real)? [sí, con comandos sencillos en español]
104. ¿Además, menú navegable con flechas para quien no quiera escribir? [sí]
105. ¿Al buscar algo, te marca dónde está y te guía hasta allí? [sí]
106. ¿Te dice también dónde lo tienes en casa (ubicación real)? [sí]
107. ¿Desde el ordenador se crean y editan las ubicaciones de casa ("salón, estantería 2, balda 3")? [sí]
108. ¿Las ubicaciones de casa pueden tener varios niveles (habitación > mueble > balda)? [sí]
109. ¿Desde el ordenador se amplía espacio para una categoría? [sí, como pides]
110. ¿Estadísticas en el ordenador (cuántos libros, valor de cartas, páginas totales)? [sí]
111. ¿Un único ordenador en la entrada, o uno en cada pasillo? [sí = uno solo en la entrada]
112. ¿Pequeños "huevos de pascua" en el terminal (comandos ocultos, mini juego)? [sí, al final]

## K. Espacio y ampliación

113. ★ ¿La biblioteca empieza pequeña (una sala con unos pocos pasillos) y crece al pedir espacio? [sí]
114. ¿La ampliación es automática cuando una categoría se llena, o solo cuando la pides? [no automática: la pides tú, el ordenador te avisa cuando falta espacio]
115. ¿Quieres poder decidir la forma de la biblioteca (dónde va cada pasillo) moviendo módulos? [no al principio: distribución automática y ordenada]
116. ¿Un pasillo por tema (libros, cómics, películas, series, videojuegos, consolas, Pokémon)? [sí]
117. ¿Dentro de libros, pasillos o estanterías por género (novela, ensayo, fantasía...)? [sí]
118. ¿Puedes crear tus propios temas o pasillos (por ejemplo "firmados", "favoritos")? [sí]

## L. Estética y animaciones

119. ★ ¿Estilo low-poly, colores vivos e iluminación cálida, inspirado en TCG Card Shop Simulator? [sí]
120. ¿Ambiente de biblioteca/almacén (madera, metal, cartón) más que de tienda? [sí, con la zona Pokémon más "tienda"]
121. ¿Ventanas con luz que cambia según la hora real (día, atardecer, noche)? [sí]
122. ¿Ciclo de lluvia u otros efectos de ambiente? [no]
123. ★ ¿Al abrir un objeto, la cámara se acerca, el objeto sale de la estantería y gira hasta enseñar la portada, al estilo de Sev Sevillano? [sí]
124. ¿Ese detalle del objeto se muestra en 3D (lo puedes girar con el ratón)? [sí]
125. ¿La ficha de datos va en un panel 2D al lado del objeto? [sí]
126. ¿Un personaje o mascota que te acompañe? [no]
127. ¿Tipografía y detalles visuales relacionados con Bitácora (Poppins, minúsculas con punto) en los menús? [sí, en menús y fichas; el ordenador retro va con letra de terminal]
128. ¿Opción de modo de bajo consumo para ordenadores o móviles modestos? [sí]

## M. Sonido y Spotify

129. ★ ¿Tienes Spotify Premium? [contesta sí o no]
130. ★ ¿Seguimos con Spotify aunque solo funcione para unos pocos usuarios autorizados a mano y con Premium? [sí, para uso personal]
131. ¿Música de ambiente propia (libre de derechos) para quien no conecte Spotify? [sí]
132. ¿Altavoces visibles en la biblioteca que se oyen más fuerte al acercarte? [sí]
133. ¿Un tocadiscos o radio dentro de la biblioteca para elegir la música? [sí]
134. ¿Sonidos de pasos, de coger libros, del carro? [sí, suaves]
135. ¿Ruido de ambiente (lluvia en la ventana, murmullo)? [no]

## N. Otros usuarios, privacidad y créditos

136. ★ ¿La biblioteca es solo para ti al principio? [sí]
137. ¿Más adelante, que otras personas puedan crearse la suya? [sí, el sistema de cuentas ya lo permitirá]
138. ¿Poder visitar la biblioteca de un amigo (solo mirar)? [no por ahora]
139. ¿Compartir un enlace público de solo lectura a tu biblioteca? [no por ahora]
140. ¿Sección de créditos dentro del juego (un panel o placa en la entrada) con todos los proyectos y recursos usados? [sí]
141. ¿También un archivo de créditos en el repositorio? [sí]
142. ¿El proyecto será siempre sin ánimo de lucro? [sí; condiciona qué recursos podemos usar]
143. ¿Te importa que las portadas se enlacen desde sus servicios en vez de guardar copias propias? [no]

## O. Forma de trabajar

144. ★ ¿Empezamos por una fase 1 pequeña y jugable (una sala, tus libros reales, abrir ficha) antes de construir lo demás? [sí]
145. ¿Prefieres ver cada avance publicado en internet para probarlo desde cualquier sitio? [sí]
146. ¿Quieres un nombre para el proyecto ya? [sí, propón tú uno o te propongo varios]
147. ¿Puedo pedirte capturas o vídeos de TCG Card Shop Simulator y de la web de Sev Sevillano si Gemini no encuentra buen material? [sí]
148. ¿Puedo usar como datos de prueba tu Ocio y tus Coleccionables reales de Bitácora a través del conector? [sí]
149. ¿Prefieres que te consulte cada decisión visual antes de aplicarla? [no: te enseño resultados y corriges]
150. ¿Una lista de pruebas automáticas para lo delicado (ordenación, enlace con Bitácora) como en Finanzas? [sí]
