// Genera src/datos/medios-demo.json: películas, series y videojuegos de
// ejemplo con la carátula de su artículo de Wikipedia (en inglés, que es la
// que la tiene). Solo para la demo: los reales llegan de Bitácora.
import { writeFile } from 'node:fs/promises'

const MEDIOS = [
  ['pelicula', 'Dune (2021 film)', 'Dune', 2021, 'bluray'],
  ['pelicula', 'Spirited Away', 'El viaje de Chihiro', 2001, 'dvd'],
  ['pelicula', 'Parasite (2019 film)', 'Parásitos', 2019, 'bluray'],
  ['pelicula', 'Interstellar (film)', 'Interstellar', 2014, 'bluray'],
  ['pelicula', 'Oppenheimer (film)', 'Oppenheimer', 2023, '4k'],
  ['pelicula', 'La La Land', 'La La Land', 2016, 'dvd'],
  ['pelicula', 'Coco (2017 film)', 'Coco', 2017, 'dvd'],
  ['pelicula', 'The Lord of the Rings: The Fellowship of the Ring', 'El Señor de los Anillos: La Comunidad del Anillo', 2001, 'dvd'],
  ['serie', 'Breaking Bad', 'Breaking Bad', 2008, 'dvd'],
  ['serie', 'Stranger Things', 'Stranger Things', 2016, 'bluray'],
  ['serie', 'Dark (TV series)', 'Dark', 2017, 'dvd'],
  ['serie', 'The Office (American TV series)', 'The Office', 2005, 'dvd'],
  ['videojuego', 'Pokémon HeartGold and SoulSilver', 'Pokémon Edición Oro HeartGold', 2009, 'caja', 'ds', 'Pokémon'],
  ['videojuego', 'Pokémon Platinum', 'Pokémon Platino', 2008, 'caja', 'ds', 'Pokémon'],
  ['videojuego', 'Pokémon Sun and Moon', 'Pokémon Sol', 2016, 'caja', '3ds', 'Pokémon'],
  ['videojuego', 'Animal Crossing: New Leaf', 'Animal Crossing: New Leaf', 2012, 'caja', '3ds', 'Animal Crossing'],
  ['videojuego', 'The Legend of Zelda: Breath of the Wild', 'The Legend of Zelda: Breath of the Wild', 2017, 'caja', 'switch', 'The Legend of Zelda'],
  ['videojuego', 'Super Mario Odyssey', 'Super Mario Odyssey', 2017, 'caja', 'switch', 'Super Mario'],
  ['videojuego', 'Mario Kart 8 Deluxe', 'Mario Kart 8 Deluxe', 2017, 'caja', 'switch', 'Mario Kart'],
  ['videojuego', 'Octopath Traveler', 'Octopath Traveler', 2018, 'caja', 'switch', null],
]

const salida = []
for (const [tipo, articulo, titulo, anio, formato, plataforma, saga] of MEDIOS) {
  const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articulo.replace(/ /g, '_'))}`, { headers: { 'User-Agent': 'BiblioTec/0.1 (proyecto personal)' } })
  const d = r.ok ? await r.json() : {}
  const img = (d.originalimage ?? d.thumbnail)?.source?.split('?')[0] ?? null
  if (!img) console.warn('sin imagen:', articulo)
  salida.push({
    id: `demo_${tipo}_${titulo.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    tipo, titulo, autor: '', anio, paginas: null, portada: img, formato,
    ...(plataforma ? { plataforma } : {}),
    ...(saga ? { saga } : {}),
    alta: '2025-06-01',
  })
  console.log('ok', titulo)
  await new Promise(res => setTimeout(res, 250))
}
await writeFile(new URL('../src/datos/medios-demo.json', import.meta.url), JSON.stringify(salida, null, 2) + '\n')
console.log(salida.length, 'medios')
