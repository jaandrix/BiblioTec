# Biblioteca 3D: decisiones tomadas (2026-11-23)

Respuesta a `02-preguntas.md`: **todo como recomendaba Claude**, salvo estos cambios.

| Pregunta | Decisión | Consecuencia |
|---|---|---|
| 2 (móvil) | **No quiero móvil.** | Solo escritorio (navegador de ordenador). Se cae también: 3 (tablet), 8 (joystick móvil) y la parte móvil de 22 (escanear ISBN con el móvil; se puede hacer con la webcam o escribiendo el ISBN). 1 queda como "solo escritorio", no "principal". |
| 129 (Spotify Premium) | **Sí, tiene Premium.** | Spotify Web Playback SDK viable para uso personal (130: sí). |

## Resumen de lo decidido

- **Plataforma**: solo navegador de escritorio. Primera persona, WASD + ratón, clic en el suelo para moverse. Una sola planta. Sin minimapa (lo hace el ordenador retro). Modo de bajo consumo.
- **Cuentas y datos**: cuentas propias + Google, proyecto Supabase aparte del de Bitácora. Enlace con Bitácora por código de conexión, solo lectura; Claude puede añadir a Bitácora la pantalla del código y una Edge Function de lectura. Funciona también sin Bitácora. Importar CSV de Libib. Sincroniza al abrir.
- **Alojamiento**: dirección gratuita al principio, luego subdominio de appbitacora.es. Repo nuevo, privado, push directo a la rama principal.
- **Contenido**: lo que tienes en físico; lo visto/leído sin tenerlo, en una zona "archivo" con aspecto distinto. Al llegar algo de Bitácora pregunta si lo tienes en físico. Prestados con hueco vacío. Deseados más adelante. Cómics y manga en pasillo propio. Sin revistas, juegos de mesa, figuras ni otros TCG por ahora. Música más adelante.
- **Libros**: lomo común con color de portada, grosor por páginas, 3-4 alturas, título y autor, color de texto automático, color corregible, marca de saga, destacados de frente elegibles. Ficha con portada, autor, páginas, año, ubicación en casa, estado, valoración y sinopsis. Páginas e ISBN automáticos.
- **Películas/series**: cajas DVD por defecto (Blu-ray, 4K, steelbook según formato), estuche por temporada, lomo con carátula real si existe, ficha sin tráiler.
- **Videojuegos/consolas**: cajas por plataforma, cartuchos sueltos en expositor, consolas en vitrinas con modelo low-poly cuando haya, ordenables por saga.
- **Pokémon**: cartas solo con set y número (si no, avisan en la entrada), imagen en español o inglés, expositores individuales (de pared más adelante), cajas negras de 25 con rejilla, álbum más adelante, efecto holo, valor de mercado y total, producto sellado como caja simple con imagen real, graduadas en su funda, zona con estética de tienda. Abrir sobres: al final.
- **Entrada y carro**: mesa de "por ordenar", carro visible de ~20 objetos, colocar todo automático, hueco iluminado, guía en el suelo apagable, orden manual con objetos fijables, mover objetos, recompensa discreta, sin logros.
- **Ordenación**: por estantería y por pasillo, con animación; criterios autor (apellido), saga (por publicación), color (arcoíris), alfabético sin artículos, año, plataforma, valoración, fecha de alta, páginas.
- **Ordenador retro**: CRT verde, comandos en español + menú con flechas, guía hasta el objeto, ubicación en casa con niveles, ampliar zonas, estadísticas, uno solo en la entrada, huevos de pascua al final.
- **Espacio**: empieza pequeño, amplías tú (el ordenador avisa), distribución automática, pasillo por tema, géneros en libros, pasillos propios.
- **Estética**: low-poly cálido tipo TCG Card Shop Simulator, ambiente almacén/biblioteca, luz por hora real, animación de apertura tipo Sev Sevillano con objeto girable en 3D y ficha 2D, tipografía de Bitácora en menús.
- **Sonido**: Spotify (Premium) con altavoces por distancia y tocadiscos/radio, música libre para quien no conecte, sonidos suaves, sin ruido de ambiente.
- **Otros**: solo para ti al principio, cuentas para otros más adelante, créditos en el juego y en el repo, sin ánimo de lucro, portadas enlazadas.
- **Trabajo**: fase 1 pequeña y jugable primero, avances publicados, nombre por decidir (Claude propone), datos reales de Bitácora como prueba, Claude enseña resultados y tú corriges, pruebas automáticas para ordenación y enlace.

## Pendiente para empezar

- Resultado de la investigación de Gemini (`03-encargo-gemini.md`).
- Opcional: resultados de DeepSeek (`04`) y de la prueba de OpenCode (`05`, parte A).
