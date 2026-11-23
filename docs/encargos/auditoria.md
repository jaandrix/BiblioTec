# Encargo de auditoría de BiblioTec

> Para pasárselo a otra IA (Gemini PRO para la parte de experiencia y referencias; OpenCode o DeepSeek para el código). Pega el bloque que corresponda y dale estos enlaces:
>
> - Web: https://jaandrix.github.io/BiblioTec/
> - Código: https://github.com/jaandrix/BiblioTec
> - Contexto: `docs/ESTADO.md` y `docs/planificacion/06-decisiones.md` del repositorio.

---

## Bloque A: experiencia de uso (Gemini, o cualquier IA que pueda ver la web o capturas)

BiblioTec es una biblioteca 3D en el navegador (primera persona, solo escritorio) para pasear entre tu colección y ordenarla, inspirada en TCG Card Shop Simulator. La prioridad del proyecto es la **mejor experiencia de usuario**, no los mejores gráficos.

Analiza y responde con una lista priorizada (crítico, importante, mejora), y para cada punto: qué pasa, por qué molesta y qué propones.

1. **Primeros 60 segundos**: ¿se entiende qué hacer al entrar? ¿Las instrucciones sobran o faltan?
2. **Controles**: andar, mirar, zoom con la rueda, coger y girar un libro (ratón, f, rueda), pausa con esc. Compáralos con juegos de simulación en primera persona (TCG Card Shop Simulator, Supermarket Simulator, PowerWash Simulator...). ¿Qué convenciones rompemos?
3. **Flujo de ordenar**: mesa de entrada, carro, flechas en el suelo, hueco que brilla, colocar. ¿Hay pasos confusos o de más?
4. **Ordenador retro**: ¿los comandos son descubribles? ¿Qué añadirías?
5. **Legibilidad**: lomos, carteles, ficha, textos en pantalla.
6. **Estética**: qué separa lo que hay de la sensación de TCG Card Shop Simulator (luz, materiales, color, objetos de decoración, sonido). Propón cambios concretos y baratos.
7. **Accesibilidad**: tamaño de texto, contraste, sensibilidad, opciones que faltan.
8. **Referencias**: 3 a 5 juegos o webs con soluciones que deberíamos copiar, con enlace o vídeo.

## Bloque B: código (OpenCode o DeepSeek, con el repositorio)

Proyecto Vite + TypeScript + React Three Fiber. Lee primero `CLAUDE.md` (arquitectura y convenciones). No cambies nada: solo informa.

Entrega un informe con hallazgos ordenados por gravedad. Cada uno con archivo, línea, qué falla, cómo reproducirlo y qué cambiarías.

1. **Errores**: estados que se quedan colgados (`src/estado.ts`: `abierto`, `terminal`, `menuOrden`, `pausa`, `llevoCarro`), carreras entre el bloqueo del ratón y los menús, libros que no vuelven a su sitio, datos de `localStorage` viejos o corruptos.
2. **Rendimiento**: cuántas llamadas de dibujo y materiales hay con 50, 500 y 3.000 libros (`src/escena/Libro.tsx` crea una malla y seis materiales por libro). Propón el paso a `InstancedMesh` o atlas de lomos y estima la ganancia. Revisa el coste del posprocesado (`App.tsx`).
3. **Memoria**: texturas que no se liberan (lomos, portadas, carteles en canvas).
4. **Lógica**: `src/escena/distribucion.ts` (reparto en muebles) y `src/libros/orden.ts` (ordenación): casos límite (sin páginas, títulos raros, géneros nuevos, sala llena). Propón pruebas que falten en `pruebas/`.
5. **Seguridad**: lo que llega de Open Library o de un enlace de portada pegado por el usuario.
6. **Mantenimiento**: duplicación, funciones demasiado largas, nombres confusos. Respeta las convenciones del proyecto (español, sin comentarios que describan el código).

## Bloque C: medición (OpenCode, en tu ordenador)

1. `npm install`, `npm run dev` y abre la web.
2. Con las herramientas del navegador, mide FPS y tiempo por fotograma en calidad alta y baja (menú de pausa, ajustes) en tu ordenador. Si puedes, también en un portátil modesto.
3. Usa el ordenador del juego para ampliar estanterías y añadir libros (`añadir <título>`, `elegir 1`, `colocar todo`) hasta unos 150, y repite la medición.
4. Entrega una tabla con los resultados y lo que notes que va a tirones.
